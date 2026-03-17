import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { getRideById, cancelRide, rateRide } from '../../api/services';
import { useSocket } from '../../context/SocketContext';
import Sidebar from '../../components/common/Sidebar';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const carIcon = new L.DivIcon({
  html: '<div style="font-size:28px;line-height:1">🚖</div>',
  className: '', iconSize: [32, 32], iconAnchor: [16, 16],
});

const STATUS_CONFIG = {
  pending:        { label: 'Looking for a driver...', color: 'var(--warning)',  icon: '⏳' },
  accepted:       { label: 'Driver is on the way',    color: 'var(--info)',     icon: '🚖' },
  driver_arrived: { label: 'Driver has arrived!',     color: 'var(--success)',  icon: '✅' },
  ongoing:        { label: 'Ride in progress',         color: 'var(--primary)', icon: '🛣️' },
  completed:      { label: 'Ride completed!',          color: 'var(--success)', icon: '🎉' },
  cancelled:      { label: 'Ride cancelled',           color: 'var(--danger)',  icon: '❌' },
};

// Smoothly pan map to driver location
const MapFlyTo = ({ position }) => {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 14, { animate: true }); }, [position, map]);
  return null;
};

const RideTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [ride, setRide]             = useState(null);
  const [driverLoc, setDriverLoc]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating]         = useState(5);
  const [review, setReview]         = useState('');
  const [rated, setRated]           = useState(false);
  const pollRef = useRef(null);

  const fetchRide = async () => {
    try {
      const res = await getRideById(id);
      setRide(res.data.ride);
      if (res.data.ride.driver?.currentLocation?.coordinates) {
        const [lng, lat] = res.data.ride.driver.currentLocation.coordinates;
        setDriverLoc([lat, lng]);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRide();
    // Poll every 10s as a fallback to sockets
    pollRef.current = setInterval(fetchRide, 10000);
    return () => clearInterval(pollRef.current);
  }, [id]); // eslint-disable-line

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.emit('track_ride', { rideId: id });

    socket.on('ride_accepted', ({ ride: updatedRide }) => {
      setRide((prev) => ({ ...prev, ...updatedRide, status: 'accepted' }));
    });
    socket.on('driver_location_updated', ({ location }) => {
      setDriverLoc([location.lat, location.lng]);
    });
    socket.on('driver_arrived', () => {
      setRide((prev) => ({ ...prev, status: 'driver_arrived' }));
    });
    socket.on('ride_started', () => {
      setRide((prev) => ({ ...prev, status: 'ongoing' }));
    });
    socket.on('ride_completed', ({ finalFare }) => {
      setRide((prev) => ({ ...prev, status: 'completed', finalFare }));
      setShowRating(true);
    });
    socket.on('ride_cancelled', () => {
      setRide((prev) => ({ ...prev, status: 'cancelled' }));
    });

    return () => {
      ['ride_accepted','driver_location_updated','driver_arrived','ride_started','ride_completed','ride_cancelled']
        .forEach((ev) => socket.off(ev));
    };
  }, [socket, id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await cancelRide(id, { reason: 'Changed my mind' });
      setRide((prev) => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel.');
    }
  };

  const handleRate = async () => {
    try {
      await rateRide(id, { rating, review });
      setRated(true);
      setShowRating(false);
    } catch {}
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  const status = ride?.status || 'pending';
  const cfg = STATUS_CONFIG[status];
  const center = ride?.pickup?.coordinates
    ? [ride.pickup.coordinates.lat, ride.pickup.coordinates.lng]
    : [23.1765, 79.9470];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0, display: 'flex', height: '100vh' }}>

        {/* Left info panel */}
        <div style={{ width: 360, background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status */}
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 20, borderLeft: `4px solid ${cfg.color}` }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{cfg.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{cfg.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, textTransform: 'capitalize' }}>
              Status: {status.replace('_', ' ')}
            </div>
          </div>

          {/* Pending: spinner */}
          {status === 'pending' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>Notifying nearby drivers...</p>
            </div>
          )}

          {/* Driver info */}
          {ride?.driver && (
            <div className="card card-sm">
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Your Driver</div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{ride.driver.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    ⭐ {ride.driver.rating?.toFixed(1) || 'New'} · 📞 {ride.driver.phone}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                    🚗 {ride.driver.vehicle?.model} · {ride.driver.vehicle?.color} · {ride.driver.vehicle?.plateNumber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTP display */}
          {['accepted', 'driver_arrived'].includes(status) && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Share this OTP with driver to start the ride:</div>
              <div className="otp-display">****</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                (OTP is securely sent to your registered phone)
              </div>
            </div>
          )}

          {/* Route summary */}
          <div className="card card-sm">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span>🟢</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>PICKUP</div>
                  <div style={{ fontSize: 13 }}>{ride?.pickup?.address}</div>
                </div>
              </div>
              <div style={{ borderLeft: '2px dashed var(--border)', height: 16, marginLeft: 9 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <span>🔴</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>DROP</div>
                  <div style={{ fontSize: 13 }}>{ride?.destination?.address}</div>
                </div>
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text2)' }}>Est. Fare</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>
                ₹{status === 'completed' ? ride?.finalFare : ride?.estimatedFare}
              </span>
            </div>
          </div>

          {/* Completed payment */}
          {status === 'completed' && !showRating && !rated && (
            <div className="alert alert-success">
              🎉 Ride complete! Payment of ₹{ride?.finalFare} processed.
            </div>
          )}

          {/* Rating modal */}
          {showRating && (
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Rate your ride</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}
                    style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating ? 1 : 0.3 }}>
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                className="form-input"
                placeholder="Leave a comment (optional)"
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <button className="btn btn-primary btn-block" onClick={handleRate}>Submit Rating</button>
            </div>
          )}

          {rated && <div className="alert alert-success">⭐ Thanks for your rating!</div>}

          {/* Cancel button */}
          {['pending', 'accepted'].includes(status) && (
            <button className="btn btn-danger" onClick={handleCancel}>
              ✕ Cancel Ride
            </button>
          )}

          {['completed', 'cancelled'].includes(status) && (
            <button className="btn btn-secondary btn-block" onClick={() => navigate('/rider')}>
              ← Back to Dashboard
            </button>
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1 }}>
          <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {ride?.pickup?.coordinates && (
              <Marker position={[ride.pickup.coordinates.lat, ride.pickup.coordinates.lng]}>
                <Popup>📍 Pickup</Popup>
              </Marker>
            )}
            {ride?.destination?.coordinates && (
              <Marker position={[ride.destination.coordinates.lat, ride.destination.coordinates.lng]}>
                <Popup>🏁 Destination</Popup>
              </Marker>
            )}
            {driverLoc && (
              <Marker position={driverLoc} icon={carIcon}>
                <Popup>🚖 {ride?.driver?.name}</Popup>
              </Marker>
            )}
            {driverLoc && <MapFlyTo position={driverLoc} />}
          </MapContainer>
        </div>

      </main>
    </div>
  );
};

export default RideTracking;
