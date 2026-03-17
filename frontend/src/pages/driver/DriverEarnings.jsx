import React, { useEffect, useState } from 'react';
import { getEarnings } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const DriverEarnings = () => {
  const [data, setData]       = useState(null);
  const [period, setPeriod]   = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getEarnings({ period });
        setData(res.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [period]);

  const maxEarnings = data?.daily?.length
    ? Math.max(...data.daily.map((d) => d.earnings), 1)
    : 1;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Earnings</h1>
            <p className="page-subtitle">Your 80% share after platform fee</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['week', 'month'].map((p) => (
              <button
                key={p}
                className={`btn ${period === p ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(p)}
              >
                {p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card" style={{ '--accent': 'var(--success)' }}>
            <div className="stat-icon">💰</div>
            <div className="stat-value">₹{loading ? '...' : (data?.totalEarnings || 0).toFixed(0)}</div>
            <div className="stat-label">Earnings ({period})</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--primary)' }}>
            <div className="stat-icon">🚖</div>
            <div className="stat-value">{loading ? '...' : data?.totalRides || 0}</div>
            <div className="stat-label">Rides ({period})</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--info)' }}>
            <div className="stat-icon">📈</div>
            <div className="stat-value">₹{loading ? '...' : (data?.allTimeEarnings || 0).toFixed(0)}</div>
            <div className="stat-label">All Time Earnings</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--warning)' }}>
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{loading ? '...' : data?.allTimeRides || 0}</div>
            <div className="stat-label">All Time Rides</div>
          </div>
        </div>

        {/* Daily bar chart (CSS-based) */}
        <div className="card">
          <h3 style={{ marginBottom: 24 }}>Daily Breakdown</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : !data?.daily?.length ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No earnings in this period.</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 200, padding: '0 8px' }}>
              {data.daily.map((d) => (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    ₹{d.earnings.toFixed(0)}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max((d.earnings / maxEarnings) * 140, 4)}px`,
                      background: 'var(--primary)',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.85,
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>{d.rides} rides</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverEarnings;
