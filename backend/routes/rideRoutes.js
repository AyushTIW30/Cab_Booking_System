const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getFareEstimate, bookRide, cancelRide,
  getRiderHistory, getRideById, rateRide,
  acceptRide, startRide, completeRide,
  getDriverHistory, getAllRides,
} = require('../controllers/rideController');

// Fare estimate (rider)
router.post('/estimate', protect, authorize('rider'), getFareEstimate);

// Book a ride (rider)
router.post('/book', protect, authorize('rider'), bookRide);

// Rider history
router.get('/history', protect, authorize('rider'), getRiderHistory);

// Driver history
router.get('/driver/history', protect, authorize('driver'), getDriverHistory);

// Admin: all rides
router.get('/admin/all', protect, authorize('admin'), getAllRides);

// Single ride
router.get('/:id', protect, getRideById);

// Rider actions
router.put('/:id/cancel', protect, authorize('rider', 'admin'), cancelRide);
router.post('/:id/rate', protect, authorize('rider'), rateRide);

// Driver actions
router.put('/:id/accept', protect, authorize('driver'), acceptRide);
router.put('/:id/start', protect, authorize('driver'), startRide);
router.put('/:id/complete', protect, authorize('driver'), completeRide);

module.exports = router;
