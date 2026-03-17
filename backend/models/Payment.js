const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rideId:   { type: DataTypes.UUID, allowNull: false },
  riderId:  { type: DataTypes.UUID, allowNull: false },
  driverId: { type: DataTypes.UUID, allowNull: false },
  amount:   { type: DataTypes.FLOAT, allowNull: false },
  method:   { type: DataTypes.STRING, defaultValue: 'cash' },
  status:   { type: DataTypes.STRING, defaultValue: 'pending' },
  transactionId: {
    type: DataTypes.STRING,
    defaultValue: () =>
      'TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
  },
  driverEarnings: { type: DataTypes.FLOAT, defaultValue: 0 },
  platformFee:    { type: DataTypes.FLOAT, defaultValue: 0 },
});

module.exports = Payment;
