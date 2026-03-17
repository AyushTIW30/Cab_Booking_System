import React, { useEffect, useState } from 'react';
import { getAllRidesAdmin } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const AdminRides = () => {
  const [rides, setRides]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAllRidesAdmin({ page, limit: LIMIT, status });
        setRides(res.data.rides);
        setTotal(res.data.total);
      } catch {}
      setLoading(false);
    };
    load();
  }, [page, status]);

  const STATUSES = ['', 'pending', 'accepted', 'ongoing', 'completed', 'cancelled'];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">All Rides</h1>
            <p className="page-subtitle">{total} rides on platform</p>
          </div>
          <select
            className="form-input"
            style={{ width: 180 }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') : 'All Statuses'}</option>
            ))}
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Rider</th>
                      <th>Driver</th>
                      <th>Pickup</th>
                      <th>Destination</th>
                      <th>Distance</th>
                      <th>Fare</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <div>{r.rider?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.rider?.phone}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {r.driver ? (
                            <>
                              <div>{r.driver.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.driver.vehicle?.plateNumber}</div>
                            </>
                          ) : <span style={{ color: 'var(--text3)' }}>Unassigned</span>}
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 140 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.pickup?.address}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 140 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.destination?.address}
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{r.distance} km</td>
                        <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{r.finalFare || r.estimatedFare}
                        </td>
                        <td>
                          <span style={{ fontSize: 12, textTransform: 'capitalize', color: r.paymentStatus === 'completed' ? 'var(--success)' : 'var(--warning)' }}>
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${r.status}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text2)', fontSize: 13 }}>
                  Page {page} of {Math.ceil(total / LIMIT)}
                </span>
                <button className="btn btn-ghost" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminRides;
