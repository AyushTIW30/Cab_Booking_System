// ── DriverHistory.jsx ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { getDriverHistory } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const DriverHistory = () => {
  const [rides, setRides]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({});
  const LIMIT = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getDriverHistory({ page, limit: LIMIT });
        setRides(res.data.rides);
        setMeta({ total: res.data.total, pages: res.data.pages, totalEarnings: res.data.totalEarnings });
      } catch {}
      setLoading(false);
    };
    load();
  }, [page]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Ride History</h1>
          <p className="page-subtitle">{meta.total || 0} completed rides</p>
        </div>

        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card" style={{ '--accent': 'var(--success)' }}>
            <div className="stat-icon">💰</div>
            <div className="stat-value">₹{(meta.totalEarnings || 0).toFixed(0)}</div>
            <div className="stat-label">Your Earnings (80%)</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'var(--primary)' }}>
            <div className="stat-icon">🚖</div>
            <div className="stat-value">{meta.total || 0}</div>
            <div className="stat-label">Total Rides</div>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : rides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No rides completed yet.</div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Rider</th>
                      <th>Route</th>
                      <th>Distance</th>
                      <th>Fare</th>
                      <th>Your Cut</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontSize: 13, color: 'var(--text2)' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ fontSize: 13 }}>{r.rider?.name}</td>
                        <td style={{ fontSize: 12, maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.pickup?.address?.slice(0, 25)} → {r.destination?.address?.slice(0, 25)}
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{r.distance} km</td>
                        <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                          ₹{r.finalFare || r.estimatedFare}
                        </td>
                        <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--success)' }}>
                          ₹{((r.finalFare || r.estimatedFare) * 0.8).toFixed(0)}
                        </td>
                        <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text2)', fontSize: 13 }}>
                  Page {page} of {meta.pages || 1}
                </span>
                <button className="btn btn-ghost" disabled={page >= (meta.pages || 1)} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverHistory;
