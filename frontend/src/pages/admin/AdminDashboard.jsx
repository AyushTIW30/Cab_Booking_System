import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const AdminDashboard = () => {
  const [stats, setStats]       = useState(null);
  const [trend, setTrend]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.stats);
        setTrend(res.data.rideTrend);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const maxCount = trend.length ? Math.max(...trend.map((d) => d.count), 1) : 1;

  const StatCard = ({ label, value, accent, icon }) => (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{loading ? '...' : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">

        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview</p>
        </div>

        {/* Users & drivers */}
        <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Users & Drivers
        </div>
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Total Riders"      value={stats?.totalUsers}    accent="var(--info)"    icon="👥" />
          <StatCard label="Total Drivers"     value={stats?.totalDrivers}  accent="var(--primary)" icon="🚗" />
          <StatCard label="Active Drivers"    value={stats?.activeDrivers} accent="var(--success)" icon="🟢" />
        </div>

        {/* Rides */}
        <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Rides
        </div>
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Total Rides"     value={stats?.totalRides}     accent="var(--primary)" icon="🚖" />
          <StatCard label="Completed"       value={stats?.completedRides} accent="var(--success)" icon="✅" />
          <StatCard label="Ongoing"         value={stats?.ongoingRides}   accent="var(--info)"    icon="🛣️" />
          <StatCard label="Cancelled"       value={stats?.cancelledRides} accent="var(--danger)"  icon="❌" />
          <StatCard label="Completion Rate" value={`${stats?.completionRate}%`} accent="var(--success)" icon="📊" />
        </div>

        {/* Revenue */}
        <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Revenue
        </div>
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Total Revenue"    value={`₹${stats?.totalRevenue?.toFixed(0) || 0}`}    accent="var(--primary)" icon="💰" />
          <StatCard label="Platform Revenue" value={`₹${stats?.platformRevenue?.toFixed(0) || 0}`} accent="var(--success)" icon="🏦" />
        </div>

        {/* 7-day trend */}
        <div className="card">
          <h3 style={{ marginBottom: 24 }}>7-Day Ride Trend</h3>
          {!trend.length ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No data yet.</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 180 }}>
              {trend.map((d) => (
                <div key={d._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700 }}>{d.count}</div>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max((d.count / maxCount) * 120, 4)}px`,
                      background: 'linear-gradient(to top, var(--primary), var(--primary-dark))',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                    {new Date(d._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
