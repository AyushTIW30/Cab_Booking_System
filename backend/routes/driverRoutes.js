const express = require('express');
const driverRouter = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile, updateProfile, getEarnings, getActiveRide,
} = require('../controllers/driverController');

driverRouter.get('/profile', protect, authorize('driver'), getProfile);
driverRouter.put('/profile', protect, authorize('driver'), updateProfile);
driverRouter.get('/earnings', protect, authorize('driver'), getEarnings);
driverRouter.get('/active-ride', protect, authorize('driver'), getActiveRide);

module.exports = driverRouter;
