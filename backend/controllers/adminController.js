const { Op, fn, col, literal } = require('sequelize');
const { User, Driver, Ride, Payment } = require('../models/index');

/**
 * GET /api/admin/dashboard
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDrivers,
      activeDrivers,
      totalRides,
      completedRides,
      pendingRides,
      ongoingRides,
      cancelledRides,
      revenueRows,
    ] = await Promise.all([
      User.count({ where: { role: 'rider' } }),
      Driver.count(),
      Driver.count({ where: { isOnline: true } }),
      Ride.count(),
      Ride.count({ where: { status: 'completed' } }),
      Ride.count({ where: { status: 'pending' } }),
      Ride.count({ where: { status: 'ongoing' } }),
      Ride.count({ where: { status: 'cancelled' } }),
      Payment.findAll({
        where: { status: 'completed' },
        attributes: [
          [fn('SUM', col('amount')),      'total'],
          [fn('SUM', col('platformFee')), 'platform'],
        ],
        raw: true,
      }),
    ]);

    const revenue = revenueRows[0] || { total: 0, platform: 0 };

    // Last 7 days trend — SQLite compatible using JS grouping
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRides  = await Ride.findAll({
      where: { createdAt: { [Op.gte]: sevenDaysAgo } },
      attributes: ['createdAt', 'finalFare', 'status'],
      raw: true,
    });

    const trendMap = {};
    recentRides.forEach((r) => {
      const day = new Date(r.createdAt).toISOString().split('T')[0];
      if (!trendMap[day]) trendMap[day] = { _id: day, count: 0, revenue: 0 };
      trendMap[day].count += 1;
      trendMap[day].revenue += r.finalFare || 0;
    });
    const rideTrend = Object.values(trendMap).sort((a, b) => a._id.localeCompare(b._id));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDrivers,
        activeDrivers,
        totalRides,
        completedRides,
        pendingRides,
        ongoingRides,
        cancelledRides,
        totalRevenue:    parseFloat(revenue.total   || 0),
        platformRevenue: parseFloat(revenue.platform || 0),
        completionRate:  totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(1) : 0,
      },
      rideTrend,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: 'rider' };
    if (search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      users: rows.map((u) => ({
        _id:        u.id,
        name:       u.name,
        email:      u.email,
        phone:      u.phone,
        totalRides: u.totalRides,
        totalSpent: u.totalSpent,
        isActive:   u.isActive,
        createdAt:  u.createdAt,
      })),
      total: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/drivers
 */
exports.getAllDrivers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status === 'approved') where.isApproved = true;
    if (status === 'pending')  where.isApproved = false;
    if (status === 'online')   where.isOnline   = true;

    const { count, rows } = await Driver.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      drivers: rows.map((d) => ({
        _id:           d.id,
        name:          d.name,
        email:         d.email,
        phone:         d.phone,
        vehicle:       d.getVehicle(),
        isApproved:    d.isApproved,
        isOnline:      d.isOnline,
        isActive:      d.isActive,
        rating:        d.rating,
        ratingCount:   d.ratingCount,
        totalRides:    d.totalRides,
        totalEarnings: d.totalEarnings,
        createdAt:     d.createdAt,
      })),
      total: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/drivers/:id/approve
 */
exports.approveDriver = async (req, res, next) => {
  try {
    const [updated] = await Driver.update({ isApproved: true }, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ success: false, message: 'Driver not found.' });
    const driver = await Driver.findByPk(req.params.id);
    res.json({ success: true, message: 'Driver approved.', driver });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/toggle-status
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await user.update({ isActive: !user.isActive });
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: { _id: user.id, isActive: user.isActive },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/drivers/:id/toggle-status
 */
exports.toggleDriverStatus = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    await driver.update({ isActive: !driver.isActive });
    res.json({
      success: true,
      message: `Driver ${driver.isActive ? 'activated' : 'deactivated'}.`,
      driver: { _id: driver.id, isActive: driver.isActive },
    });
  } catch (err) {
    next(err);
  }
};
