const { Driver, Ride, User } = require('../models/index');

/**
 * GET /api/driver/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.user.id);
    res.json({
      success: true,
      driver: {
        _id:           driver.id,
        name:          driver.name,
        email:         driver.email,
        phone:         driver.phone,
        isOnline:      driver.isOnline,
        isApproved:    driver.isApproved,
        isActive:      driver.isActive,
        vehicle:       driver.getVehicle(),
        rating:        driver.rating,
        ratingCount:   driver.ratingCount,
        totalRides:    driver.totalRides,
        totalEarnings: driver.totalEarnings,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/driver/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'avatar'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    await Driver.update(updates, { where: { id: req.user.id } });
    const driver = await Driver.findByPk(req.user.id);
    res.json({ success: true, driver });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/driver/earnings
 */
exports.getEarnings = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    const days  = period === 'month' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rides = await Ride.findAll({
      where: {
        driverId:    req.user.id,
        status:      'completed',
        completedAt: { [require('sequelize').Op.gte]: since },
      },
    });

    const totalEarnings = rides.reduce((sum, r) => sum + r.finalFare * 0.8, 0);
    const totalRides    = rides.length;

    // Group by date
    const dailyMap = {};
    rides.forEach((r) => {
      const day = r.completedAt.toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { rides: 0, earnings: 0 };
      dailyMap[day].rides    += 1;
      dailyMap[day].earnings += r.finalFare * 0.8;
    });

    const driver = await Driver.findByPk(req.user.id);

    res.json({
      success:          true,
      totalEarnings:    parseFloat(totalEarnings.toFixed(2)),
      totalRides,
      allTimeEarnings:  driver.totalEarnings,
      allTimeRides:     driver.totalRides,
      daily: Object.entries(dailyMap).map(([date, data]) => ({ date, ...data })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/driver/active-ride
 */
exports.getActiveRide = async (req, res, next) => {
  try {
    const ride = await Ride.findOne({
      where: {
        driverId: req.user.id,
        status:   { [require('sequelize').Op.in]: ['accepted', 'driver_arrived', 'ongoing'] },
      },
      include: [{ model: User, as: 'rider', attributes: ['id','name','phone'] }],
    });

    if (!ride) return res.json({ success: true, ride: null });

    res.json({
      success: true,
      ride: {
        _id:    ride.id,
        status: ride.status,
        pickup: {
          address:     ride.pickupAddress,
          coordinates: { lat: ride.pickupLat, lng: ride.pickupLng },
        },
        destination: {
          address:     ride.destinationAddress,
          coordinates: { lat: ride.destinationLat, lng: ride.destinationLng },
        },
        estimatedFare: ride.estimatedFare,
        rider: ride.rider
          ? { _id: ride.rider.id, name: ride.rider.name, phone: ride.rider.phone }
          : ride.riderId,
      },
    });
  } catch (err) {
    next(err);
  }
};
