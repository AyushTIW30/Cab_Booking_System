import React, { useEffect, useState } from 'react';
import { getAllUsers, toggleUserStatus } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';

const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const LIMIT = 15;

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page, limit: LIMIT, search });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]); // eslint-disable-line

  const handleToggle = async (id) => {
    try {
      const res = await toggleUserStatus(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: res.data.user.isActive } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Manage Users</h1>
            <p className="page-subtitle">{total} registered riders</p>
          </div>
          <input
            className="form-input"
            style={{ width: 220 }}
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Total Rides</th>
                      <th>Total Spent</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td style={{ fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                        <td style={{ fontSize: 13 }}>{u.phone}</td>
                        <td style={{ textAlign: 'center' }}>{u.totalRides}</td>
                        <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>₹{u.totalSpent}</td>
                        <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <span className={`badge badge-${u.isActive ? 'online' : 'offline'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                            style={{ padding: '5px 12px', fontSize: 12 }}
                            onClick={() => handleToggle(u._id)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
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

export default AdminUsers;
