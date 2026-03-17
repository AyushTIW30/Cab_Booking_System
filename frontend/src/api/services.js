import api from './axiosInstance';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerRider  = (data) => api.post('/auth/rider/register', data);
export const loginRider     = (data) => api.post('/auth/rider/login', data);
export const registerDriver = (data) => api.post('/auth/driver/register', data);
export const loginDriver    = (data) => api.post('/auth/driver/login', data);
export const getMe          = ()     => api.get('/auth/me');

// ── Rides ─────────────────────────────────────────────────────────────────────
export const getFareEstimate = (data)   => api.post('/rides/estimate', data);
export const bookRide        = (data)   => api.post('/rides/book', data);
export const cancelRide      = (id, data) => api.put(`/rides/${id}/cancel`, data);
export const getRiderHistory = (params) => api.get('/rides/history', { params });
export const getDriverHistory= (params) => api.get('/rides/driver/history', { params });
export const getRideById     = (id)     => api.get(`/rides/${id}`);
export const rateRide        = (id, data) => api.post(`/rides/${id}/rate`, data);
export const acceptRide      = (id)     => api.put(`/rides/${id}/accept`);
export const startRide       = (id, data) => api.put(`/rides/${id}/start`, data);
export const completeRide    = (id)     => api.put(`/rides/${id}/complete`);

// ── Rider ─────────────────────────────────────────────────────────────────────
export const getRiderProfile  = ()     => api.get('/rider/profile');
export const updateRiderProfile = (d) => api.put('/rider/profile', d);
export const getActiveRide    = ()     => api.get('/rider/active-ride');
export const addSavedPlace    = (d)   => api.post('/rider/saved-places', d);

// ── Driver ────────────────────────────────────────────────────────────────────
export const getDriverProfile   = ()     => api.get('/driver/profile');
export const updateDriverProfile = (d)  => api.put('/driver/profile', d);
export const getDriverActiveRide = ()   => api.get('/driver/active-ride');
export const getEarnings         = (p)  => api.get('/driver/earnings', { params: p });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getDashboardStats  = ()     => api.get('/admin/dashboard');
export const getAllUsers         = (p)   => api.get('/admin/users', { params: p });
export const getAllDrivers       = (p)   => api.get('/admin/drivers', { params: p });
export const getAllRidesAdmin    = (p)   => api.get('/rides/admin/all', { params: p });
export const approveDriver      = (id)  => api.put(`/admin/drivers/${id}/approve`);
export const toggleUserStatus   = (id)  => api.put(`/admin/users/${id}/toggle-status`);
export const toggleDriverStatus = (id)  => api.put(`/admin/drivers/${id}/toggle-status`);
