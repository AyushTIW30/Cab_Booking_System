const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('./config/db');
const { initSocket } = require('./socket/socketManager');
const errorHandler = require('./middleware/errorHandler');

// Load models so associations are registered before sync
require('./models/index');

const authRoutes   = require('./routes/authRoutes');
const riderRoutes  = require('./routes/riderRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes  = require('./routes/adminRoutes');
const rideRoutes   = require('./routes/rideRoutes');

// Connect SQLite and sync tables
connectDB();

const app    = express();
const server = http.createServer(app);
initSocket(server);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth',   authRoutes);
app.use('/api/rider',  riderRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/rides',  rideRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'CabGo API running 🚖 (SQLite)' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚖 CabGo server running on port ${PORT}`);
});
