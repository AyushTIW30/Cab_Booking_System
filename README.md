# 🚖 CabGo — Full-Stack MERN Cab Booking Application

A production-ready cab booking platform (Uber/Ola-like) built with the MERN stack.

---

## 🧩 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React.js 18, React Router 6, Leaflet|
| Backend     | Node.js, Express.js                 |
| Database    | MongoDB + Mongoose                  |
| Auth        | JWT (JSON Web Tokens) + bcryptjs    |
| Realtime    | Socket.io                           |
| Maps        | Leaflet + OpenStreetMap (FREE)      |
| Geocoding   | Nominatim (FREE, no API key needed) |

---

## 📁 Project Structure

```
cabgo/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register/login for rider+driver
│   │   ├── rideController.js      # Full ride lifecycle
│   │   ├── driverController.js    # Driver-specific actions
│   │   ├── riderController.js     # Rider-specific actions
│   │   └── adminController.js     # Admin actions
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + authorize + generateToken
│   │   └── errorHandler.js        # Central error handler
│   ├── models/
│   │   ├── User.js                # Rider model (bcrypt + matchPassword)
│   │   ├── Driver.js              # Driver model (geo index, vehicle)
│   │   ├── Ride.js                # Ride lifecycle model
│   │   └── Payment.js             # Payment simulation model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── rideRoutes.js
│   │   ├── riderRoutes.js
│   │   ├── driverRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   └── fareService.js         # Haversine distance + surge pricing
│   ├── socket/
│   │   └── socketManager.js       # Socket.io event handlers
│   ├── utils/
│   │   └── seed.js                # Test data seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── api/
        │   ├── axiosInstance.js   # Axios with auth interceptor
        │   └── services.js        # All API calls
        ├── context/
        │   ├── AuthContext.jsx    # Global auth state
        │   └── SocketContext.jsx  # Global socket connection
        ├── components/
        │   └── common/
        │       └── Sidebar.jsx    # Role-aware navigation
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   └── RegisterPage.jsx
        │   ├── rider/
        │   │   ├── RiderDashboard.jsx
        │   │   ├── BookRidePage.jsx   # Map + fare selection
        │   │   ├── RideTracking.jsx   # Live tracking + OTP + rating
        │   │   └── RiderHistory.jsx
        │   ├── driver/
        │   │   ├── DriverDashboard.jsx # Go online, accept/start/complete
        │   │   ├── DriverHistory.jsx
        │   │   └── DriverEarnings.jsx
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── AdminUsers.jsx
        │       ├── AdminDrivers.jsx
        │       └── AdminRides.jsx
        ├── App.jsx                # Routes + protected routes
        ├── index.css              # Full design system
        └── index.js
```

---

## 🚀 Setup & Run Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & Setup

```bash
git clone <your-repo>
cd cabgo
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy env file and fill in values
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cabgo
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

---

### 3. Seed Test Data

```bash
npm run seed
```

This creates:
| Role    | Email                  | Password  |
|---------|------------------------|-----------|
| Admin   | admin@cabgo.com        | admin123  |
| Rider 1 | rider1@cabgo.com       | rider123  |
| Rider 2 | rider2@cabgo.com       | rider123  |
| Driver 1| driver1@cabgo.com      | driver123 |
| Driver 2| driver2@cabgo.com      | driver123 |

---

### 4. Start Backend

```bash
npm run dev   # Development (nodemon)
# or
npm start     # Production
```

Backend runs on: `http://localhost:5000`

---

### 5. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🔌 API Reference

### Auth Endpoints
```
POST /api/auth/rider/register    Register a new rider
POST /api/auth/rider/login       Rider login
POST /api/auth/driver/register   Register a new driver
POST /api/auth/driver/login      Driver login
GET  /api/auth/me                Get current user (protected)
```

### Ride Endpoints
```
POST /api/rides/estimate         Get fare estimate (rider)
POST /api/rides/book             Book a ride (rider)
GET  /api/rides/history          Rider history (rider)
GET  /api/rides/driver/history   Driver history (driver)
GET  /api/rides/admin/all        All rides (admin)
GET  /api/rides/:id              Single ride details
PUT  /api/rides/:id/cancel       Cancel ride (rider/admin)
POST /api/rides/:id/rate         Rate a ride (rider)
PUT  /api/rides/:id/accept       Accept ride (driver)
PUT  /api/rides/:id/start        Start ride with OTP (driver)
PUT  /api/rides/:id/complete     Complete ride (driver)
```

### Driver Endpoints
```
GET /api/driver/profile         Driver profile
PUT /api/driver/profile         Update profile
GET /api/driver/earnings        Earnings with period filter
GET /api/driver/active-ride     Current active ride
```

### Admin Endpoints
```
GET /api/admin/dashboard              Dashboard stats
GET /api/admin/users                  All riders
GET /api/admin/drivers                All drivers
PUT /api/admin/drivers/:id/approve    Approve driver
PUT /api/admin/users/:id/toggle-status    Activate/deactivate user
PUT /api/admin/drivers/:id/toggle-status  Ban/unban driver
```

---

## 🔄 Socket.io Events

### Client → Server
```
driver_go_online   { location: {lat, lng} }
driver_go_offline  {}
update_location    { location: {lat, lng}, riderId }
driver_arrived     { rideId, riderId }
track_ride         { rideId }
```

### Server → Client
```
new_ride_request       { ride }         → all online drivers
ride_accepted          { ride, driver } → specific rider
driver_location_updated { location }   → specific rider
driver_arrived         { rideId }       → specific rider
ride_started           { rideId }       → specific rider
ride_completed         { rideId, finalFare, paymentId } → specific rider
ride_cancelled         { rideId, reason } → specific driver
status_updated         { isOnline }     → specific driver
```

---

## 🗺️ Fare Calculation Logic

```
Raw fare = baseFare + (distance_km × farePerKm)
Surge factor applied during peak hours (1.2x - 1.3x)
Final fare = max(raw_fare × surge_factor, minimum_fare)
Driver receives 80% | Platform keeps 20%
```

| Vehicle | Base | Per km | Min  | Capacity |
|---------|------|--------|------|----------|
| Auto    | ₹20  | ₹8     | ₹30  | 3        |
| Mini    | ₹40  | ₹12    | ₹60  | 4        |
| Sedan   | ₹60  | ₹16    | ₹80  | 4        |
| SUV     | ₹100 | ₹22    | ₹120 | 6        |

---

## 🔐 Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with expiry (default 7 days)
- Role-based access control on every route
- JWT verification on Socket.io connections
- Mongoose schema-level validation
- Central error handler with no stack traces in production

---

## 💡 Improvement Suggestions

### Short-term
- [ ] Add password reset via email (Nodemailer)
- [ ] Add real-time chat between rider and driver
- [ ] Add push notifications (Firebase FCM)
- [ ] Add profile photo upload (Cloudinary/Multer)

### Medium-term
- [ ] Integrate real payment gateway (Razorpay for India)
- [ ] Add promo codes and referral system
- [ ] Driver document verification with file uploads
- [ ] Mobile app with React Native (same backend)

### Architecture improvements
- [ ] Add Redis for caching driver locations
- [ ] Use Bull queues for background jobs (notifications)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add request logging (Winston + Morgan)
- [ ] Write tests with Jest + Supertest

---

## 🚀 Deployment

### Backend (Railway / Render / EC2)
```bash
# Set environment variables on your platform
# Then:
npm start
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy the /build folder
```

### MongoDB (Atlas)
- Create free cluster at mongodb.com/atlas
- Set `MONGO_URI` to your Atlas connection string

---

Built by Ayush Tiwari 🚖
