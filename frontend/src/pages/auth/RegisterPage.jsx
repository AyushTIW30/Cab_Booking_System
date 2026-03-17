import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerRider, registerDriver } from '../../api/services';

const RegisterPage = () => {
  const [role, setRole]   = useState('rider');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    // Driver extras
    vehicleType: 'sedan', vehicleModel: '', vehicleColor: '', plateNumber: '',
    licenseNumber: '', licenseExpiry: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'rider') {
        const res = await registerRider({ name: form.name, email: form.email, phone: form.phone, password: form.password });
        login(res.data.token, res.data.user);
        navigate('/rider');
      } else {
        const payload = {
          name: form.name, email: form.email, phone: form.phone, password: form.password,
          vehicle: { type: form.vehicleType, model: form.vehicleModel, color: form.vehicleColor, plateNumber: form.plateNumber },
          license: { number: form.licenseNumber, expiryDate: form.licenseExpiry },
        };
        const res = await registerDriver(payload);
        login(res.data.token, { ...res.data.driver, role: 'driver' });
        navigate('/driver');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: role === 'driver' ? 520 : 440 }}>
        <div className="auth-logo">🚖 CabGo</div>

        <div className="tab-switch">
          {['rider', 'driver'].map((r) => (
            <button key={r} className={`tab-btn ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>
              {r === 'rider' ? '👤 Rider' : '🚗 Driver'}
            </button>
          ))}
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Join CabGo as a {role}</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Common fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Ayush Tiwari" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="9876543210" value={form.phone} onChange={set('phone')} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
          </div>

          {/* Driver-only fields */}
          {role === 'driver' && (
            <>
              <div className="divider" />
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--primary)' }}>🚗 Vehicle Details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-input" value={form.vehicleType} onChange={set('vehicleType')}>
                    <option value="auto">Auto (3-wheeler)</option>
                    <option value="mini">Mini</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input className="form-input" placeholder="Honda City" value={form.vehicleModel} onChange={set('vehicleModel')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input className="form-input" placeholder="White" value={form.vehicleColor} onChange={set('vehicleColor')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Plate Number</label>
                  <input className="form-input" placeholder="MP09AB1234" value={form.plateNumber} onChange={set('plateNumber')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-input" placeholder="DL123456" value={form.licenseNumber} onChange={set('licenseNumber')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry</label>
                  <input className="form-input" type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} required />
                </div>
              </div>
            </>
          )}

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? '⏳ Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
