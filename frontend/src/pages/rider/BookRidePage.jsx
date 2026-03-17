import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { getFareEstimate, bookRide } from '../../api/services';
import Sidebar from '../../components/common/Sidebar';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const dropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

// Default center: Jabalpur
const DEFAULT_CENTER = [23.1765, 79.9470];

const VEHICLE_ICONS = { auto: '🛺', mini: '🚗', sedan: '🚙', suv: '🚐' };

// Component to handle map clicks
const MapClickHandler = ({ step, onPickup, onDrop }) => {
  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (step === 'pickup') onPickup(coords);
      else if (step === 'drop') onDrop(coords);
    },
  });
  return null;
};

const STEPS = ['pickup', 'drop', 'estimate', 'confirm'];

const BookRidePage = () => {
  const navigate = useNavigate();
  const [step, setStep]           = useState('pickup');
  const [pickup, setPickup]       = useState(null);
  const [drop, setDrop]           = useState(null);
  const [pickupAddr, setPickupAddr] = useState('');
  const [dropAddr, setDropAddr]   = useState('');
  const [estimates, setEstimates] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Reverse geocode using Nominatim (free, no API key)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  const handlePickup = async (coords) => {
    setPickup(coords);
    const addr = await reverseGeocode(coords.lat, coords.lng);
    setPickupAddr(addr);
    setStep('drop');
  };

  const handleDrop = async (coords) => {
    setDrop(coords);
    const addr = await reverseGeocode(coords.lat, coords.lng);
    setDropAddr(addr);
  };

  // Get fare estimates once both points are set
  useEffect(() => {
    if (!pickup || !drop) return;
    (async () => {
      try {
        const res = await getFareEstimate({
          pickup:      { address: pickupAddr, coordinates: pickup },
          destination: { address: dropAddr,   coordinates: drop },
        });
        setEstimates(res.data.estimates);
        setStep('estimate');
      } catch {}
    })();
  }, [drop]); // eslint-disable-line

  const handleBook = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await bookRide({
        pickup:      { address: pickupAddr, coordinates: pickup },
        destination: { address: dropAddr,   coordinates: drop },
        vehicleType: selected.vehicleType,
        paymentMethod: payMethod,
      });
      navigate(`/rider/track/${res.data.ride._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('pickup'); setPickup(null); setDrop(null);
    setPickupAddr(''); setDropAddr(''); setEstimates([]); setSelected(null);
  };

  const stepLabel = {
    pickup:   '📍 Click on the map to set your pickup point',
    drop:     '🏁 Now click to set your destination',
    estimate: '✅ Choose a ride option',
    confirm:  '💳 Confirm your booking',
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0, display: 'flex', height: '100vh' }}>

        {/* Left panel */}
        <div style={{ width: 380, background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 6 }}>Book a Ride</h2>
            <div className="alert alert-info" style={{ marginBottom: 0 }}>{stepLabel[step]}</div>
          </div>

          {/* Location display */}
          <div className="card card-sm">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, marginTop: 2 }}>🟢</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pickup</div>
                  <div style={{ fontSize: 13, color: pickupAddr ? 'var(--text)' : 'var(--text3)' }}>
                    {pickupAddr || 'Not set — click map'}
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '2px dashed var(--border)', height: 20, marginLeft: 9 }} />
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, marginTop: 2 }}>🔴</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination</div>
                  <div style={{ fontSize: 13, color: dropAddr ? 'var(--text)' : 'var(--text3)' }}>
                    {dropAddr || 'Not set — click map'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fare options */}
          {estimates.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text2)' }}>
                Distance: {estimates[0]?.distance} km · ~{estimates[0]?.duration} min
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {estimates.map((est) => (
                  <div
                    key={est.vehicleType}
                    className={`ride-card ${selected?.vehicleType === est.vehicleType ? 'selected' : ''}`}
                    onClick={() => { setSelected(est); setStep('confirm'); }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 28 }}>{VEHICLE_ICONS[est.vehicleType]}</span>
                        <div>
                          <div className="vehicle-type">{est.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)' }}>👤 {est.capacity} seats</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="fare-amount">₹{est.totalFare}</div>
                        {est.isSurge && (
                          <div style={{ fontSize: 11, color: 'var(--warning)' }}>⚡ {est.surgeFactor}x surge</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm section */}
          {step === 'confirm' && selected && (
            <div className="card card-sm">
              <div style={{ marginBottom: 14, fontWeight: 600 }}>Payment Method</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['cash', 'wallet', 'card'].map((m) => (
                  <button
                    key={m}
                    className={`btn ${payMethod === m ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, padding: '8px 4px', fontSize: 13 }}
                    onClick={() => setPayMethod(m)}
                  >
                    {m === 'cash' ? '💵' : m === 'wallet' ? '👛' : '💳'} {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn btn-success btn-block btn-lg" onClick={handleBook} disabled={loading}>
                {loading ? '⏳ Finding driver...' : `🚖 Book ${selected.label} · ₹${selected.totalFare}`}
              </button>
            </div>
          )}

          {(pickup || drop) && (
            <button className="btn btn-ghost" onClick={reset}>↩ Start over</button>
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1 }}>
          <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler step={step} onPickup={handlePickup} onDrop={handleDrop} />
            {pickup && (
              <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                <Popup>📍 Pickup: {pickupAddr}</Popup>
              </Marker>
            )}
            {drop && (
              <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
                <Popup>🏁 Drop: {dropAddr}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

      </main>
    </div>
  );
};

export default BookRidePage;
