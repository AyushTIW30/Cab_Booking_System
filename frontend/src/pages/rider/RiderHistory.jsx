import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRiderHistory } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const RiderHistory = () => {
  const navigate = useNavigate();
  const [rides, setRides]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState('');
  const LIMIT = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getRiderHistory({ page, limit: LIMIT });
        setRides(res.data.rides);
        setTotal(res.data.total);
      } catch {}
      setLoading(false);
    };
    load();
  }, [page]);

  const filtered = filter ? rides.filter((r) => r.status === filter) : rides;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">My Rides</h1>
            <p className="page-subtitle">{total} total rides</p>
          </div>
          <select
            className="form-input"
            style={{ width: 160 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="ongoing">Ongoing</option>
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No rides found.</div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pickup</th>
                      <th>Destination</th>
                      <th>Driver</th>
                      <th>Distance</th>
                      <th>Fare</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr
                        key={r._id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/rider/track/${r._id}`)}
                      >
                        <td style={{ fontSize: 13, color: 'var(--text2)' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ fontSize: 13, maxWidth: 160 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.pickup?.address}
                          </div>
                        </td>
                        <td style={{ fontSize: 13, maxWidth: 160 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.destination?.address}
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{r.driver?.name || '—'}</td>
                        <td style={{ fontSize: 13 }}>{r.distance} km</td>
                        <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{r.finalFare || r.estimatedFare}
                        </td>
                        <td><span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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

export default RiderHistory;
