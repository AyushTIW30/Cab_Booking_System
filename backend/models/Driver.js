const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'driver' },
  avatar: { type: DataTypes.STRING, defaultValue: '' },

  // Vehicle details (flat columns — easier than JSON in SQLite)
  vehicleType:  { type: DataTypes.STRING, defaultValue: 'sedan' },
  vehicleModel: { type: DataTypes.STRING, defaultValue: '' },
  vehicleColor: { type: DataTypes.STRING, defaultValue: '' },
  plateNumber:  { type: DataTypes.STRING, defaultValue: '' },

  // License
  licenseNumber: { type: DataTypes.STRING, defaultValue: '' },
  licenseExpiry: { type: DataTypes.DATE },

  // Status
  isOnline:    { type: DataTypes.BOOLEAN, defaultValue: false },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: false },
  isApproved:  { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },

  // Location (two float columns instead of MongoDB's geo type)
  currentLat: { type: DataTypes.FLOAT, defaultValue: 0 },
  currentLng: { type: DataTypes.FLOAT, defaultValue: 0 },

  // Stats
  totalRides:    { type: DataTypes.INTEGER, defaultValue: 0 },
  totalEarnings: { type: DataTypes.FLOAT, defaultValue: 0 },
  rating:        { type: DataTypes.FLOAT, defaultValue: 0 },
  ratingCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  hooks: {
    beforeCreate: async (driver) => {
      if (driver.password) {
        const salt = await bcrypt.genSalt(10);
        driver.password = await bcrypt.hash(driver.password, salt);
      }
    },
    beforeUpdate: async (driver) => {
      if (driver.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        driver.password = await bcrypt.hash(driver.password, salt);
      }
    },
  },
});

Driver.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Returns a vehicle object — keeps controllers compatible with frontend
Driver.prototype.getVehicle = function () {
  return {
    type:        this.vehicleType,
    model:       this.vehicleModel,
    color:       this.vehicleColor,
    plateNumber: this.plateNumber,
  };
};

module.exports = Driver;
