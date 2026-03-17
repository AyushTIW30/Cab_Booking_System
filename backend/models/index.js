const User    = require('./User');
const Driver  = require('./Driver');
const Ride    = require('./Ride');
const Payment = require('./Payment');

// ── Associations ─────────────────────────────────────────────────────────────
Ride.belongsTo(User,   { foreignKey: 'riderId',  as: 'rider' });
Ride.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Payment.belongsTo(Ride,   { foreignKey: 'rideId' });
Payment.belongsTo(User,   { foreignKey: 'riderId',  as: 'rider' });
Payment.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

module.exports = { User, Driver, Ride, Payment };
