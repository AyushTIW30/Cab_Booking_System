const { User, Ride, Driver } = require('../models/index');

/**
 * GET /api/rider/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({
      success: true,
      user: {
        _id:        user.id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        role:       user.role,
        isActive:   user.isActive,
        totalRides: user.totalRides,
        totalSpent: user.totalSpent,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/rider/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'avatar'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    await User.update(updates, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/rider/active-ride
 */
exports.getActiveRide = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');

    const ride = await Ride.findOne({
      where: {
        riderId: req.user.id,
        status:  { [Op.in]: ['pending', 'accepted', 'driver_arrived', 'ongoing'] },
      },
      include: [{
        model: Driver,
        as: 'driver',
        attributes: ['id','name','phone','vehicleType','vehicleModel','vehicleColor','plateNumber','rating','currentLat','currentLng'],
      }],
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
        driver: ride.driver
          ? {
              _id:     ride.driver.id,
              name:    ride.driver.name,
              phone:   ride.driver.phone,
              rating:  ride.driver.rating,
              vehicle: ride.driver.getVehicle(),
              currentLocation: {
                coordinates: [ride.driver.currentLng, ride.driver.currentLat],
              },
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
};
