// ── authRoutes.js ────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerRider, loginRider,
  registerDriver, loginDriver,
  getMe,
} = require('../controllers/authController');

router.post('/rider/register', registerRider);
router.post('/rider/login', loginRider);
router.post('/driver/register', registerDriver);
router.post('/driver/login', loginDriver);
router.get('/me', protect, getMe);

module.exports = router;
