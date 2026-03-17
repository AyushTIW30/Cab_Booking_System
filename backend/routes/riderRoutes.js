const express = require('express');
const riderRouter = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile, updateProfile, getActiveRide,
} = require('../controllers/riderController');

riderRouter.get('/profile',     protect, authorize('rider'), getProfile);
riderRouter.put('/profile',     protect, authorize('rider'), updateProfile);
riderRouter.get('/active-ride', protect, authorize('rider'), getActiveRide);

module.exports = riderRouter;
