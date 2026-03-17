const express = require('express');
const adminRouter = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats, getAllUsers, getAllDrivers,
  approveDriver, toggleUserStatus, toggleDriverStatus,
} = require('../controllers/adminController');

adminRouter.use(protect, authorize('admin'));

adminRouter.get('/dashboard', getDashboardStats);
adminRouter.get('/users', getAllUsers);
adminRouter.get('/drivers', getAllDrivers);
adminRouter.put('/drivers/:id/approve', approveDriver);
adminRouter.put('/users/:id/toggle-status', toggleUserStatus);
adminRouter.put('/drivers/:id/toggle-status', toggleDriverStatus);

module.exports = adminRouter;
