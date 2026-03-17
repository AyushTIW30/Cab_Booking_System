import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Auth pages
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Rider pages
import RiderDashboard from './pages/rider/RiderDashboard';
import BookRidePage   from './pages/rider/BookRidePage';
import RideTracking   from './pages/rider/RideTracking';
import RiderHistory   from './pages/rider/RiderHistory';

// Driver pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverHistory   from './pages/driver/DriverHistory';
import DriverEarnings  from './pages/driver/DriverEarnings';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminDrivers   from './pages/admin/AdminDrivers';
import AdminRides     from './pages/admin/AdminRides';

import './index.css';

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={user ? <Navigate to={`/${user.role}`} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <RegisterPage />} />

      {/* Rider */}
      <Route path="/rider" element={<ProtectedRoute allowedRoles={['rider']}><RiderDashboard /></ProtectedRoute>} />
      <Route path="/rider/book" element={<ProtectedRoute allowedRoles={['rider']}><BookRidePage /></ProtectedRoute>} />
      <Route path="/rider/track/:id" element={<ProtectedRoute allowedRoles={['rider']}><RideTracking /></ProtectedRoute>} />
      <Route path="/rider/history" element={<ProtectedRoute allowedRoles={['rider']}><RiderHistory /></ProtectedRoute>} />

      {/* Driver */}
      <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboard /></ProtectedRoute>} />
      <Route path="/driver/history" element={<ProtectedRoute allowedRoles={['driver']}><DriverHistory /></ProtectedRoute>} />
      <Route path="/driver/earnings" element={<ProtectedRoute allowedRoles={['driver']}><DriverEarnings /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/drivers" element={<ProtectedRoute allowedRoles={['admin']}><AdminDrivers /></ProtectedRoute>} />
      <Route path="/admin/rides" element={<ProtectedRoute allowedRoles={['admin']}><AdminRides /></ProtectedRoute>} />

      {/* Default */}
      <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
