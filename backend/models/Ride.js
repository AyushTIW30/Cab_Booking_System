const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Ride = sequelize.define('Ride', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  riderId:  { type: DataTypes.UUID, allowNull: false },
  driverId: { type: DataTypes.UUID, defaultValue: null },

  // Pickup
  pickupAddress: { type: DataTypes.STRING, allowNull: false },
  pickupLat:     { type: DataTypes.FLOAT,  allowNull: false },
  pickupLng:     { type: DataTypes.FLOAT,  allowNull: false },

  // Destination
  destinationAddress: { type: DataTypes.STRING, allowNull: false },
  destinationLat:     { type: DataTypes.FLOAT,  allowNull: false },
  destinationLng:     { type: DataTypes.FLOAT,  allowNull: false },

  distance:      { type: DataTypes.FLOAT,   defaultValue: 0 },
  duration:      { type: DataTypes.INTEGER, defaultValue: 0 },
  baseFare:      { type: DataTypes.FLOAT,   defaultValue: 0 },
  farePerKm:     { type: DataTypes.FLOAT,   defaultValue: 0 },
  surgeFactor:   { type: DataTypes.FLOAT,   defaultValue: 1 },
  estimatedFare: { type: DataTypes.FLOAT,   allowNull: false },
  finalFare:     { type: DataTypes.FLOAT,   defaultValue: 0 },

  vehicleType: { type: DataTypes.STRING, defaultValue: 'sedan' },

  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    // pending | accepted | driver_arrived | ongoing | completed | cancelled
  },

  cancelledBy:        { type: DataTypes.STRING, defaultValue: null },
  cancellationReason: { type: DataTypes.STRING, defaultValue: '' },

  paymentMethod: { type: DataTypes.STRING, defaultValue: 'cash' },
  paymentStatus: { type: DataTypes.STRING, defaultValue: 'pending' },

  riderRating:  { type: DataTypes.INTEGER, defaultValue: null },
  driverRating: { type: DataTypes.INTEGER, defaultValue: null },
  riderReview:  { type: DataTypes.STRING,  defaultValue: '' },
  driverReview: { type: DataTypes.STRING,  defaultValue: '' },

  otp: { type: DataTypes.STRING, defaultValue: null },

  acceptedAt:  { type: DataTypes.DATE, defaultValue: null },
  startedAt:   { type: DataTypes.DATE, defaultValue: null },
  completedAt: { type: DataTypes.DATE, defaultValue: null },
  cancelledAt: { type: DataTypes.DATE, defaultValue: null },
});

module.exports = Ride;
