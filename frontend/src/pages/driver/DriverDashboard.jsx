import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getDriverActiveRide, acceptRide, startRide, completeRide } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const DriverDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate   = useNavigate();

  const [isOnline, setIsOnline]       = useState(false);
  const [activeRide, setActiveRide]   = useState(null);
  const [pendingReq, setPendingReq]   = useState(null); // incoming ride request
  const [otp, setOtp]                 = useState('');
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationErr, setLocationErr] = useState('');

  // Fetch active ride on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getDriverActiveRide();
        setActiveRide(res.data.ride);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // Get geolocation
  const getLocation = useCallback(() => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location permission denied'))
    );
  }), []);

  // Go online/offline
  const toggleOnline = async () => {
    if (!socket) return;
    if (!isOnline) {
      try {
        const location = await getLocation();
        socket.emit('driver_go_online', { location });
        setIsOnline(true);
        setLocationErr('');

        // Start sending location updates every 10s
        const interval = setInterval(async () => {
          const loc = await getLocation().catch(() => null);
          if (loc && activeRide?.rider) {
            socket.emit('update_location', { location: loc, riderId: activeRide.rider });
          }
        }, 10000);
        return () => clearInterval(interval);
      } catch (err) {
        setLocationErr(err.message);
      }
    } else {
      socket.emit('driver_go_offline');
      setIsOnline(false);
    }
  };

  // Socket: incoming ride request
  useEffect(() => {
    if (!socket) return;

    socket.on('status_updated', ({ isOnline: online }) => setIsOnline(online));

    socket.on('new_ride_request', (data) => {
      setPendingReq(data.ride);
    });

    socket.on('ride_cancelled', () => {
      setPendingReq(null);
      setActiveRide(null);
    });

    return () => {
      socket.off('status_updated');
      socket.off('new_ride_request');
      socket.off('ride_cancelled');
    };
  }, [socket]);

  const handleAccept = async () => {
    if (!pendingReq) return;
    setActionLoading(true);
    try {
      const res = await acceptRide(pendingReq._id);
      setActiveRide(res.data.ride);
      setPendingReq(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not accept ride.');
    }
    setActionLoading(false);
  };

  const handleReject = () => setPendingReq(null);

  const handleStart = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      await startRide(activeRide._id, { otp });
      setActiveRide((prev) => ({ ...prev, status: 'ongoing' }));
      setOtp('');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP or error starting ride.');
    }
    setActionLoading(false);
  };

  const handleComplete = async () => {
    if (!activeRide) return;
    if (!window.confirm('Mark this ride as completed?')) return;
    setActionLoading(true);
    try {
      await completeRide(activeRide._id);
      setActiveRide(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error completing ride.');
    }
    setActionLoading(false);
  };

  const handleArrived = () => {
    if (socket && activeRide) {
      socket.emit('driver_arrived', { rideId: activeRide._id, riderId: activeRide.rider?._id || activeRide.rider });
      setActiveRide((prev) => ({ ...prev, status: 'driver_arrived' }));
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Driver Dashboard</h1>
            <p className="page-subtitle">Hello, {user?.name?.split(' ')[0]}</p>
          </div>
          <div className="toggle-wrap">
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>
            <label className="toggle">
              <input type="checkbox" checked={isOnline} onChange={toggleOnline} />
              <div className="toggle-track" />
              <div className="toggle-thumb" />
            </label>
          </div>
        </div>

        {locationErr && <div className="alert alert-error" style={{ marginBottom: 24 }}>{locationErr}</div>}

        {!user?.isApproved && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            ⏳ Your account is pending admin approval. You cannot go online yet.
          </div>
        )}

        {/* Incoming ride request popup */}
        {pendingReq && (
          <div className="card" style={{ marginBottom: 24, borderColor: 'var(--warning)', background: 'rgba(245,158,11,0.05)', animation: 'pulse 1s infinite' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              🔔 New Ride Request!
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>PICKUP</div>
                <div style={{ fontSize: 13 }}>{pendingReq.pickup?.address}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>DESTINATION</div>
                <div style={{ fontSize: 13 }}>{pendingReq.destination?.address}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>RIDER</div>
                <div style={{ fontSize: 13 }}>{pendingReq.rider?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>DISTANCE</div>
                <div style={{ fontSize: 13 }}>{pendingReq.distance} km</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
                ₹{pendingReq.estimatedFare}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                {pendingReq.vehicleType?.toUpperCase()} ride
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleReject} disabled={actionLoading}>
                ✕ Reject
              </button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleAccept} disabled={actionLoading}>
                ✓ Accept
              </button>
            </div>
          </div>
        )}

        {/* Active ride section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : activeRide ? (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Current Ride — <span style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>
                {activeRide.status?.replace('_', ' ')}
              </span>
            </div>

            {/* Rider info */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 32 }}>👤</div>
              <div>
                <div style={{ fontWeight: 600 }}>{activeRide.rider?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>📞 {activeRide.rider?.phone}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                ₹{activeRide.estimatedFare}
              </div>
            </div>

            {/* Addresses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span>🟢</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>PICKUP</div>
                  <div style={{ fontSize: 13 }}>{activeRide.pickup?.address}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span>🔴</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>DESTINATION</div>
                  <div style={{ fontSize: 13 }}>{activeRide.destination?.address}</div>
                </div>
              </div>
            </div>

            {/* Action buttons based on status */}
            {activeRide.status === 'accepted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-secondary btn-block" onClick={handleArrived} disabled={actionLoading}>
                  📍 I've Arrived at Pickup
                </button>
              </div>
            )}

            {activeRide.status === 'driver_arrived' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Enter Rider OTP to Start</label>
                  <input
                    className="form-input"
                    placeholder="4-digit OTP"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/, ''))}
                    style={{ fontSize: 22, letterSpacing: 8, textAlign: 'center' }}
                  />
                </div>
                <button className="btn btn-success btn-block" onClick={handleStart} disabled={actionLoading || otp.length < 4}>
                  🚦 Start Ride
                </button>
              </div>
            )}

            {activeRide.status === 'ongoing' && (
              <button className="btn btn-primary btn-block btn-lg" onClick={handleComplete} disabled={actionLoading}>
                🏁 Complete Ride
              </button>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {isOnline ? '🟢' : '🔴'}
            </div>
            <h3 style={{ marginBottom: 8 }}>
              {isOnline ? 'You are online' : 'You are offline'}
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              {isOnline
                ? 'Waiting for ride requests. Stay nearby your area.'
                : 'Toggle the switch above to go online and receive rides.'}
            </p>
          </div>
        )}

        {/* Quick stats */}
        <div className="stat-grid">
          <div className="stat-card" style={{ '--accent': 'var(--primary)' }}>
            <div className="stat-icon">🚖</div>
            <div className="stat-value">{user?.totalRides || 0}</div>
            <div className="stat-label">Total Rides</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--success)' }}>
            <div className="stat-icon">💰</div>
            <div className="stat-value">₹{(user?.totalEarnings || 0).toFixed(0)}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--warning)' }}>
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{user?.rating ? user.rating.toFixed(1) : 'New'}</div>
            <div className="stat-label">Your Rating</div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default DriverDashboard;
