import React, { useEffect, useState } from 'react';
import { getAllDrivers, approveDriver, toggleDriverStatus } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState('');
  const [page, setPage]       = useState(1);
  const LIMIT = 15;

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllDrivers({ page, limit: LIMIT, status: filter });
      setDrivers(res.data.drivers);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, filter]); // eslint-disable-line

  const handleApprove = async (id) => {
    try {
      const res = await approveDriver(id);
      setDrivers((prev) => prev.map((d) => d._id === id ? { ...d, isApproved: true } : d));
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleDriverStatus(id);
      setDrivers((prev) => prev.map((d) => d._id === id ? { ...d, isActive: res.data.driver.isActive } : d));
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Manage Drivers</h1>
            <p className="page-subtitle">{total} registered drivers</p>
          </div>
          <select className="form-input" style={{ width: 180 }} value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="">All Drivers</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
            <option value="online">Online Now</option>
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
                      <th>Driver</th>
                      <th>Phone</th>
                      <th>Vehicle</th>
                      <th>Plate</th>
                      <th>Rating</th>
                      <th>Rides</th>
                      <th>Earnings</th>
                      <th>Approval</th>
                      <th>Online</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((d) => (
                      <tr key={d._id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{d.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{d.email}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>{d.phone}</td>
                        <td style={{ fontSize: 13 }}>
                          {d.vehicle?.model} <span style={{ color: 'var(--text2)' }}>({d.vehicle?.type})</span>
                        </td>
                        <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{d.vehicle?.plateNumber}</td>
                        <td style={{ fontSize: 13 }}>
                          {d.ratingCount > 0 ? `⭐ ${d.rating.toFixed(1)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>{d.totalRides}</td>
                        <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--success)' }}>
                          ₹{d.totalEarnings.toFixed(0)}
                        </td>
                        <td>
                          {d.isApproved
                            ? <span className="badge badge-approved">Approved</span>
                            : <span className="badge badge-pending-approval">Pending</span>
                          }
                        </td>
                        <td>
                          <span className={`badge badge-${d.isOnline ? 'online' : 'offline'}`}>
                            {d.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {!d.isApproved && (
                              <button
                                className="btn btn-success"
                                style={{ padding: '4px 10px', fontSize: 12 }}
                                onClick={() => handleApprove(d._id)}
                              >
                                ✓ Approve
                              </button>
                            )}
                            <button
                              className={`btn ${d.isActive ? 'btn-danger' : 'btn-secondary'}`}
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => handleToggle(d._id)}
                            >
                              {d.isActive ? 'Ban' : 'Unban'}
                            </button>
                          </div>
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

export default AdminDrivers;
