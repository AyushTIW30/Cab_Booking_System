const { User, Driver } = require('../models/index');
const { generateToken } = require('../middleware/auth');

// ── Rider Auth ────────────────────────────────────────────────────────────────

exports.registerRider = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, phone, password });
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.loginRider = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        totalRides: user.totalRides,
        totalSpent: user.totalSpent,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Driver Auth ───────────────────────────────────────────────────────────────

exports.registerDriver = async (req, res, next) => {
  try {
    const { name, email, phone, password, vehicle, license } = req.body;

    const existing = await Driver.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const driver = await Driver.create({
      name,
      email,
      phone,
      password,
      vehicleType:   vehicle.type,
      vehicleModel:  vehicle.model,
      vehicleColor:  vehicle.color,
      plateNumber:   vehicle.plateNumber,
      licenseNumber: license.number,
      licenseExpiry: license.expiryDate,
    });

    const token = generateToken(driver.id, 'driver');

    res.status(201).json({
      success: true,
      token,
      driver: {
        _id:        driver.id,
        name:       driver.name,
        email:      driver.email,
        isApproved: driver.isApproved,
        role:       'driver',
      },
      message: 'Registration successful. Awaiting admin approval.',
    });
  } catch (err) {
    next(err);
  }
};

exports.loginDriver = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ where: { email } });
    if (!driver || !(await driver.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!driver.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    const token = generateToken(driver.id, 'driver');

    res.json({
      success: true,
      token,
      driver: {
        _id:        driver.id,
        name:       driver.name,
        email:      driver.email,
        isApproved: driver.isApproved,
        isOnline:   driver.isOnline,
        vehicle:    driver.getVehicle(),
        rating:     driver.rating,
        role:       'driver',
        totalRides:    driver.totalRides,
        totalEarnings: driver.totalEarnings,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: {
      _id:           u.id,
      name:          u.name,
      email:         u.email,
      phone:         u.phone,
      role:          u.role,
      isApproved:    u.isApproved,
      isOnline:      u.isOnline,
      totalRides:    u.totalRides,
      totalSpent:    u.totalSpent,
      totalEarnings: u.totalEarnings,
      rating:        u.rating,
      vehicle:       u.getVehicle ? u.getVehicle() : undefined,
    },
  });
};
