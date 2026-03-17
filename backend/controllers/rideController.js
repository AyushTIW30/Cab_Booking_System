const { Op } = require('sequelize');
const { User, Driver, Ride, Payment } = require('../models/index');
const { getIO } = require('../socket/socketManager');
const fareService = require('../services/fareService');

// Helper: shape a Ride row into the object the frontend expects
function formatRide(ride) {
  return {
    _id:    ride.id,
    id:     ride.id,
    status: ride.status,
    pickup: {
      address:     ride.pickupAddress,
      coordinates: { lat: ride.pickupLat, lng: ride.pickupLng },
    },
    destination: {
      address:     ride.destinationAddress,
      coordinates: { lat: ride.destinationLat, lng: ride.destinationLng },
    },
    distance:      ride.distance,
    duration:      ride.duration,
    estimatedFare: ride.estimatedFare,
    finalFare:     ride.finalFare,
    vehicleType:   ride.vehicleType,
    paymentMethod: ride.paymentMethod,
    paymentStatus: ride.paymentStatus,
    surgeFactor:   ride.surgeFactor,
    riderRating:   ride.riderRating,
    cancelledBy:   ride.cancelledBy,
    cancellationReason: ride.cancellationReason,
    createdAt:     ride.createdAt,
    // populated associations (may be null)
    rider:  ride.rider  ? formatUser(ride.rider)   : ride.riderId,
    driver: ride.driver ? formatDriver(ride.driver) : ride.driverId,
  };
}

function formatUser(u) {
  return { _id: u.id, name: u.name, phone: u.phone, email: u.email };
}

function formatDriver(d) {
  return {
    _id:     d.id,
    name:    d.name,
    phone:   d.phone,
    rating:  d.rating,
    vehicle: d.getVehicle(),
    currentLocation: {
      coordinates: [d.currentLng, d.currentLat],
    },
  };
}

// ── Rider actions ─────────────────────────────────────────────────────────────

/**
 * POST /api/rides/estimate
 */
exports.getFareEstimate = async (req, res, next) => {
  try {
    const { pickup, destination } = req.body;
    const estimates = fareService.calculateAllFares(pickup, destination);
    res.json({ success: true, estimates });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/rides/book
 */
exports.bookRide = async (req, res, next) => {
  try {
    const { pickup, destination, vehicleType, paymentMethod } = req.body;
    const fareInfo = fareService.calculateFare(pickup, destination, vehicleType);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = await Ride.create({
      riderId:            req.user.id,
      pickupAddress:      pickup.address,
      pickupLat:          pickup.coordinates.lat,
      pickupLng:          pickup.coordinates.lng,
      destinationAddress: destination.address,
      destinationLat:     destination.coordinates.lat,
      destinationLng:     destination.coordinates.lng,
      vehicleType:        vehicleType || 'sedan',
      paymentMethod:      paymentMethod || 'cash',
      estimatedFare:      fareInfo.totalFare,
      distance:           fareInfo.distance,
      duration:           fareInfo.duration,
      baseFare:           fareInfo.baseFare,
      farePerKm:          fareInfo.farePerKm,
      surgeFactor:        fareInfo.surgeFactor,
      otp,
      status: 'pending',
    });

    const io = getIO();
    io.to('drivers_online').emit('new_ride_request', {
      ride: {
        _id:           ride.id,
        pickup:        { address: ride.pickupAddress, coordinates: { lat: ride.pickupLat, lng: ride.pickupLng } },
        destination:   { address: ride.destinationAddress },
        estimatedFare: ride.estimatedFare,
        distance:      ride.distance,
        vehicleType:   ride.vehicleType,
        rider:         { name: req.user.name, phone: req.user.phone },
      },
    });

    res.status(201).json({ success: true, ride: formatRide(ride) });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/rides/:id/cancel
 */
exports.cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    if (ride.riderId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your ride.' });
    }
    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${ride.status} ride.` });
    }

    await ride.update({
      status:             'cancelled',
      cancelledBy:        req.user.role === 'admin' ? 'admin' : 'rider',
      cancellationReason: req.body.reason || '',
      cancelledAt:        new Date(),
    });

    const io = getIO();
    if (ride.driverId) {
      io.to(`driver_${ride.driverId}`).emit('ride_cancelled', {
        rideId: ride.id,
        reason: ride.cancellationReason,
      });
      await Driver.update({ isAvailable: true }, { where: { id: ride.driverId } });
    }

    res.json({ success: true, message: 'Ride cancelled.', ride: formatRide(ride) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/rides/history  (rider)
 */
exports.getRiderHistory = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Ride.findAndCountAll({
      where: { riderId: req.user.id },
      include: [{ model: Driver, as: 'driver', attributes: ['id','name','vehicleType','vehicleModel','vehicleColor','plateNumber','rating'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      rides:   rows.map(formatRide),
      total:   count,
      page,
      pages:   Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/rides/:id
 */
exports.getRideById = async (req, res, next) => {
  try {
    const ride = await Ride.findByPk(req.params.id, {
      include: [
        { model: User,   as: 'rider',  attributes: ['id','name','phone','email'] },
        { model: Driver, as: 'driver', attributes: ['id','name','phone','vehicleType','vehicleModel','vehicleColor','plateNumber','rating','currentLat','currentLng'] },
      ],
    });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    res.json({ success: true, ride: formatRide(ride) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/rides/:id/rate
 */
exports.rateRide = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const ride = await Ride.findByPk(req.params.id);

    if (!ride)                      return res.status(404).json({ success: false, message: 'Ride not found.' });
    if (ride.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only rate completed rides.' });
    if (ride.riderRating)            return res.status(400).json({ success: false, message: 'Already rated.' });

    await ride.update({ riderRating: rating, riderReview: review || '' });

    // Update driver average rating
    if (ride.driverId) {
      const driver = await Driver.findByPk(ride.driverId);
      const newCount  = driver.ratingCount + 1;
      const newRating = ((driver.rating * driver.ratingCount) + rating) / newCount;
      await driver.update({ rating: newRating, ratingCount: newCount });
    }

    res.json({ success: true, message: 'Rating submitted!' });
  } catch (err) {
    next(err);
  }
};

// ── Driver actions ────────────────────────────────────────────────────────────

/**
 * PUT /api/rides/:id/accept
 */
exports.acceptRide = async (req, res, next) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    if (ride.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Ride no longer available.' });
    }

    await ride.update({
      status:     'accepted',
      driverId:   req.user.id,
      acceptedAt: new Date(),
    });

    await Driver.update({ isAvailable: false }, { where: { id: req.user.id } });

    // Reload with driver association
    const updated = await Ride.findByPk(ride.id, {
      include: [
        { model: User,   as: 'rider',  attributes: ['id','name','phone'] },
        { model: Driver, as: 'driver', attributes: ['id','name','phone','vehicleType','vehicleModel','vehicleColor','plateNumber','rating','currentLat','currentLng'] },
      ],
    });

    const io = getIO();
    io.to(`rider_${ride.riderId}`).emit('ride_accepted', {
      ride: formatRide(updated),
      driver: {
        name:    req.user.name,
        phone:   req.user.phone,
        vehicle: req.user.getVehicle(),
        rating:  req.user.rating,
      },
    });

    res.json({ success: true, ride: formatRide(updated) });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/rides/:id/start
 */
exports.startRide = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const ride = await Ride.findByPk(req.params.id);

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    if (!['accepted','driver_arrived'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Cannot start this ride.' });
    }
    if (ride.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await ride.update({ status: 'ongoing', startedAt: new Date() });

    const io = getIO();
    io.to(`rider_${ride.riderId}`).emit('ride_started', { rideId: ride.id });

    res.json({ success: true, message: 'Ride started!', ride: formatRide(ride) });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/rides/:id/complete
 */
exports.completeRide = async (req, res, next) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
    if (ride.status !== 'ongoing') {
      return res.status(400).json({ success: false, message: 'Ride is not ongoing.' });
    }

    const finalFare     = ride.estimatedFare;
    const driverEarnings = finalFare * 0.8;
    const platformFee    = finalFare * 0.2;

    await ride.update({
      status:        'completed',
      completedAt:   new Date(),
      finalFare,
      paymentStatus: 'completed',
    });

    // Update driver stats
    const driver = await Driver.findByPk(ride.driverId);
    await driver.update({
      isAvailable:   true,
      totalRides:    driver.totalRides + 1,
      totalEarnings: driver.totalEarnings + driverEarnings,
    });

    // Update rider stats
    const rider = await User.findByPk(ride.riderId);
    await rider.update({
      totalRides: rider.totalRides + 1,
      totalSpent: rider.totalSpent + finalFare,
    });

    // Create payment record
    const payment = await Payment.create({
      rideId:   ride.id,
      riderId:  ride.riderId,
      driverId: ride.driverId,
      amount:   finalFare,
      method:   ride.paymentMethod,
      status:   'completed',
      driverEarnings,
      platformFee,
    });

    const io = getIO();
    io.to(`rider_${ride.riderId}`).emit('ride_completed', {
      rideId:        ride.id,
      finalFare,
      paymentId:     payment.transactionId,
    });

    res.json({ success: true, message: 'Ride completed!', ride: formatRide(ride), payment });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/rides/driver/history
 */
exports.getDriverHistory = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Ride.findAndCountAll({
      where: { driverId: req.user.id },
      include: [{ model: User, as: 'rider', attributes: ['id','name','phone'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const completedRides = rows.filter(r => r.status === 'completed');
    const totalEarnings  = completedRides.reduce((sum, r) => sum + (r.finalFare * 0.8), 0);

    res.json({
      success: true,
      rides:   rows.map(formatRide),
      total:   count,
      page,
      pages:   Math.ceil(count / limit),
      totalEarnings,
    });
  } catch (err) {
    next(err);
  }
};

// ── Admin actions ─────────────────────────────────────────────────────────────

/**
 * GET /api/rides/admin/all
 */
exports.getAllRides = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where  = status ? { status } : {};

    const { count, rows } = await Ride.findAndCountAll({
      where,
      include: [
        { model: User,   as: 'rider',  attributes: ['id','name','email','phone'] },
        { model: Driver, as: 'driver', attributes: ['id','name','phone','vehicleType','vehicleModel','plateNumber'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, rides: rows.map(formatRide), total: count });
  } catch (err) {
    next(err);
  }
};
