# 🚖 CabGo — Full-Stack Cab Booking Application

A production-ready cab booking platform (Uber/Ola-like) built with Node.js, React, and SQLite.

> **Repo:** [github.com/AyushTIW30/Cab_Booking_System](https://github.com/AyushTIW30/Cab_Booking_System)

---

## 🧩 Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | React.js 18, React Router 6, Leaflet  |
| Backend     | Node.js, Express.js                   |
| Database    | SQLite (via Sequelize ORM)            |
| Auth        | JWT (JSON Web Tokens) + bcryptjs      |
| Realtime    | Socket.io                             |
| Maps        | Leaflet + OpenStreetMap (FREE)        |
| Geocoding   | Nominatim (FREE, no API key needed)   |

---

## 👥 User Roles

| Role      | Features |
|-----------|----------|
| 🧍 Rider  | Book ride, live tracking, ride history, cancel, rate driver |
| 🚗 Driver | Go online/offline, accept/reject rides, OTP verification, earnings |
| 👑 Admin  | Dashboard stats, manage users & drivers, view all rides |

---

## 📁 Project Structure

```
cabgo/
├── backend/
│   ├── config/db.js               # SQLite + Sequelize connection
│   ├── controllers/
│   │   ├── authController.js      # Register/login for rider + driver
│   │   ├── rideController.js      # Full ride lifecycle
│   │   ├── driverController.js    # Driver-specific actions
│   │   ├── riderController.js     # Rider-specific actions
│   │   └── adminController.js     # Admin actions
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + authorize
│   │   └── errorHandler.js        # Central error handler
│   ├── models/
│   │   ├── User.js                # Rider model
│   │   ├── Driver.js              # Driver model
│   │   ├── Ride.js                # Ride lifecycle model
│   │   ├── Payment.js             # Payment simulation
│   │   └── index.js               # Sequelize associations
│   ├── routes/                    # All API routes
│   ├── services/fareService.js    # Haversine distance + surge pricing
│   ├── socket/socketManager.js    # Socket.io event handlers
│   ├── utils/seed.js              # Test data seed script
│   ├── .env.example
│   └── server.js                  # Entry point
│
└── frontend/
    └── src/
        ├── api/                   # Axios instance + API services
        ├── context/               # Auth + Socket global state
        ├── components/common/     # Sidebar navigation
        ├── pages/
        │   ├── auth/              # Login, Register
        │   ├── rider/             # Dashboard, Book, Track, History
        │   ├── driver/            # Dashboard, History, Earnings
        │   └── admin/             # Dashboard, Users, Drivers, Rides
        ├── App.jsx                # Routes + protected routes
        └── index.css              # Full dark theme design system
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+
- npm

> No MongoDB or any external database needed. SQLite runs as a local `.db` file automatically.

---

### 1. Clone

```bash
git clone https://github.com/AyushTIW30/Cab_Booking_System.git
cd Cab_Booking_System
```

---

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

`.env` content:
```env
PORT=5000
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

| Role      | Email                 | Password  |
|-----------|-----------------------|-----------|
| 👑 Admin  | admin@cabgo.com       | admin123  |
| 🧍 Rider 1 | rider1@cabgo.com    | rider123  |
| 🧍 Rider 2 | rider2@cabgo.com    | rider123  |
| 🚗 Driver 1 | driver1@cabgo.com  | driver123 |
| 🚗 Driver 2 | driver2@cabgo.com  | driver123 |

---

### 4. Start Backend

```bash
npm run dev
```

Runs on: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

### 5. Start Frontend (new terminal)

```bash
cd frontend
npm install
npm start
```

Runs on: `http://localhost:3000`

---

## 🚗 Ride Booking Flow

```
1. Rider sets pickup & destination on map
2. System calculates distance & fare (4 vehicle types)
3. Rider selects vehicle → Books ride
4. Online drivers notified via Socket.io
5. Driver accepts → navigates to pickup
6. Driver marks arrived → Rider shares OTP
7. Driver enters OTP → Ride starts
8. Ride completes → Payment simulated (80% driver / 20% platform)
9. Rider rates the driver ⭐
```

---

## 🔌 API Reference

### Auth
```
POST /api/auth/rider/register
POST /api/auth/rider/login
POST /api/auth/driver/register
POST /api/auth/driver/login
GET  /api/auth/me
```

### Rides
```
POST /api/rides/estimate
POST /api/rides/book
GET  /api/rides/history
GET  /api/rides/driver/history
GET  /api/rides/admin/all
GET  /api/rides/:id
PUT  /api/rides/:id/cancel
POST /api/rides/:id/rate
PUT  /api/rides/:id/accept
PUT  /api/rides/:id/start
PUT  /api/rides/:id/complete
```

### Driver
```
GET /api/driver/profile
PUT /api/driver/profile
GET /api/driver/earnings
GET /api/driver/active-ride
```

### Admin
```
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/drivers
PUT /api/admin/drivers/:id/approve
PUT /api/admin/users/:id/toggle-status
PUT /api/admin/drivers/:id/toggle-status
```

---

## 🔄 Socket.io Events

| Client → Server | Description |
|-----------------|-------------|
| `driver_go_online` | Driver goes online with location |
| `driver_go_offline` | Driver goes offline |
| `update_location` | Driver sends live location |
| `driver_arrived` | Driver reached pickup point |
| `track_ride` | Rider starts tracking |

| Server → Client | Sent To |
|-----------------|---------|
| `new_ride_request` | All online drivers |
| `ride_accepted` | Specific rider |
| `driver_location_updated` | Specific rider |
| `driver_arrived` | Specific rider |
| `ride_started` | Specific rider |
| `ride_completed` | Specific rider |
| `ride_cancelled` | Specific driver |

---

## 🗺️ Fare Calculation

```
Final fare = max((baseFare + distance × farePerKm) × surgeFactor, minFare)
```

| Vehicle  | Base | Per km | Min  | Seats |
|----------|------|--------|------|-------|
| 🛺 Auto  | ₹20  | ₹8     | ₹30  | 3     |
| 🚗 Mini  | ₹40  | ₹12    | ₹60  | 4     |
| 🚙 Sedan | ₹60  | ₹16    | ₹80  | 4     |
| 🚐 SUV   | ₹100 | ₹22    | ₹120 | 6     |

**Surge:** Peak hours (8-10 AM, 5-8 PM) → 1.3x | Late night → 1.2x | Normal → 1x

---

## 🔐 Security

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with configurable expiry
- Role-based access control on every route
- JWT auth on Socket.io connections
- Central error handler — no stack traces in production

---

## 💡 Future Improvements

- [ ] Real payment gateway (Razorpay)
- [ ] Password reset via email (Nodemailer)
- [ ] Real-time chat between rider and driver
- [ ] Push notifications (Firebase FCM)
- [ ] Driver document verification
- [ ] Promo codes & referral system
- [ ] React Native mobile app
- [ ] Redis for caching driver locations
- [ ] Unit tests (Jest + Supertest)

---

## 🚀 Deployment

### Backend — Render / Railway
```bash
# Set env variables on platform, then:
npm start
```

### Frontend — Vercel / Netlify
```bash
npm run build
# Deploy /build folder
```

---

## 👨‍💻 Built By

**Ayush Tiwari**
- 🐙 GitHub: [@AyushTIW30](https://github.com/AyushTIW30)
- 💼 LinkedIn: [linkedin.com/in/ayush-tiwari-2301222ba](https://linkedin.com/in/ayush-tiwari-2301222ba)
- 🌐 Portfolio: [ayush-tiwari-portfolio.onrender.com](https://ayush-tiwari-portfolio.onrender.com)

---

> ⭐ If you found this helpful, please star the repo!
