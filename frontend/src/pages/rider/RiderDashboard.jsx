import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getActiveRide, getRiderHistory } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>
    {status.replace('_', ' ')}
  </span>
);

const RiderDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [activeRide, setActiveRide] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [activeRes, historyRes] = await Promise.all([
          getActiveRide(),
          getRiderHistory({ limit: 5 }),
        ]);
        setActiveRide(activeRes.data.ride);
        setRecentRides(historyRes.data.rides);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Ready to go somewhere?</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/rider/book')}>
            🚖 Book a Ride
          </button>
        </div>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card" style={{ '--accent': 'var(--primary)' }}>
            <div className="stat-icon">🚖</div>
            <div className="stat-value">{user?.totalRides || 0}</div>
            <div className="stat-label">Total Rides</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--success)' }}>
            <div className="stat-icon">💰</div>
            <div className="stat-value">₹{user?.totalSpent || 0}</div>
            <div className="stat-label">Total Spent</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--info)' }}>
            <div className="stat-icon">📍</div>
            <div className="stat-value">{recentRides.length}</div>
            <div className="stat-label">Rides This Period</div>
          </div>
        </div>

        {/* Active ride banner */}
        {activeRide && (
          <div
            className="card"
            style={{ marginBottom: 28, borderColor: 'var(--primary)', cursor: 'pointer', background: 'rgba(245,158,11,0.05)' }}
            onClick={() => navigate(`/rider/track/${activeRide._id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                  ⚡ You have an active ride
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {activeRide.pickup?.address} → {activeRide.destination?.address}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <StatusBadge status={activeRide.status} />
                <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>Track →</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent rides */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>Recent Rides</h3>
            <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => navigate('/rider/history')}>
              View All →
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : recentRides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
              <p>No rides yet. Book your first ride!</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/rider/book')}>
                Book Now
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>From → To</th>
                    <th>Date</th>
                    <th>Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRides.map((r) => (
                    <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/rider/track/${r._id}`)}>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: 'var(--text2)' }}>{r.pickup?.address?.slice(0, 30)}...</span>
                          <br />
                          <span>→ {r.destination?.address?.slice(0, 30)}...</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text2)' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{r.finalFare || r.estimatedFare}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default RiderDashboard;
