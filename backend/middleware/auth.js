const jwt = require('jsonwebtoken');
const { User, Driver } = require('../models/index');

/**
 * Protect routes — verify JWT and attach req.user
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised. No token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'driver') {
      req.user = await Driver.findByPk(decoded.id);
    } else {
      req.user = await User.findByPk(decoded.id);
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Role-based authorization
 * Usage: authorize('admin') or authorize('rider', 'admin')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed here.`,
      });
    }
    next();
  };
};

/**
 * Generate JWT token
 */
exports.generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};
