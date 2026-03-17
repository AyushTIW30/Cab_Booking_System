import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RIDER_NAV = [
  { icon: '🏠', label: 'Dashboard',   path: '/rider' },
  { icon: '🚖', label: 'Book a Ride', path: '/rider/book' },
  { icon: '📋', label: 'My Rides',    path: '/rider/history' },
];

const DRIVER_NAV = [
  { icon: '🏠', label: 'Dashboard',  path: '/driver' },
  { icon: '📋', label: 'My Rides',   path: '/driver/history' },
  { icon: '💰', label: 'Earnings',   path: '/driver/earnings' },
];

const ADMIN_NAV = [
  { icon: '📊', label: 'Dashboard', path: '/admin' },
  { icon: '👥', label: 'Users',     path: '/admin/users' },
  { icon: '🚗', label: 'Drivers',   path: '/admin/drivers' },
  { icon: '📋', label: 'All Rides', path: '/admin/rides' },
];

const NAV_MAP = { rider: RIDER_NAV, driver: DRIVER_NAV, admin: ADMIN_NAV };

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = NAV_MAP[user?.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        🚖 <span>Cab</span>Go
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: 12, fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div style={{ color: 'var(--text2)', fontSize: 12, textTransform: 'capitalize' }}>
            {user?.role}
          </div>
        </div>
        <button className="btn btn-ghost btn-block" onClick={logout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
