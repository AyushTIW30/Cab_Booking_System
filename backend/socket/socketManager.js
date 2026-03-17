const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Driver } = require('../models/index');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT auth middleware for every socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded   = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId   = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId, userRole } = socket;
    console.log(`🔌 Socket connected: ${userRole} [${userId}]`);

    // Every rider and admin joins their personal room
    if (userRole === 'rider' || userRole === 'admin') {
      socket.join(`rider_${userId}`);
    }

    if (userRole === 'driver') {
      socket.join(`driver_${userId}`);

      // ── Go online ────────────────────────────────────────────────────────
      socket.on('driver_go_online', async ({ location }) => {
        try {
          await Driver.update(
            { isOnline: true, isAvailable: true, currentLat: location.lat, currentLng: location.lng },
            { where: { id: userId } }
          );
          socket.join('drivers_online');
          socket.emit('status_updated', { isOnline: true });
          console.log(`🟢 Driver ${userId} online`);
        } catch (err) {
          console.error('go_online error:', err.message);
        }
      });

      // ── Go offline ───────────────────────────────────────────────────────
      socket.on('driver_go_offline', async () => {
        try {
          await Driver.update(
            { isOnline: false, isAvailable: false },
            { where: { id: userId } }
          );
          socket.leave('drivers_online');
          socket.emit('status_updated', { isOnline: false });
          console.log(`🔴 Driver ${userId} offline`);
        } catch (err) {
          console.error('go_offline error:', err.message);
        }
      });

      // ── Location update during ride ───────────────────────────────────
      socket.on('update_location', async ({ location, riderId }) => {
        try {
          await Driver.update(
            { currentLat: location.lat, currentLng: location.lng },
            { where: { id: userId } }
          );
          if (riderId) {
            io.to(`rider_${riderId}`).emit('driver_location_updated', { location });
          }
        } catch (err) {
          console.error('update_location error:', err.message);
        }
      });

      // ── Driver arrived at pickup ──────────────────────────────────────
      socket.on('driver_arrived', ({ rideId, riderId }) => {
        io.to(`rider_${riderId}`).emit('driver_arrived', { rideId });
      });
    }

    // Rider joins the ride-specific room to track it
    socket.on('track_ride', ({ rideId }) => {
      socket.join(`ride_${rideId}`);
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Disconnected: ${userRole} [${userId}]`);
      if (userRole === 'driver') {
        await Driver.update(
          { isOnline: false, isAvailable: false },
          { where: { id: userId } }
        ).catch(() => {});
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
