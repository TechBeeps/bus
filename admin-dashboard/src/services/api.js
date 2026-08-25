import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const API_BASE_URL = 'https://api.shreemateshwaribus.com/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleet_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;

// Auth
export const adminLogin = (payload) => client.post('/admin/login', payload);
export const getAdminMe = () => client.get('/admin/me');

// System Settings (Cashback & Min Spend)
export const getSystemSettings = () => client.get('/admin/settings');
export const updateSystemSettings = (payload) => client.post('/admin/settings', payload);

// Cities (Replacing Static Routes)
export const getCities = () => client.get('/cities');
export const createCity = (payload) => client.post('/cities', payload);
export const updateCity = (id, payload) => client.put(`/cities/${id}`, payload);
export const deleteCity = (id) => client.delete(`/cities/${id}`);

// Conductors
export const getConductors = () => client.get('/conductors');
export const createConductor = (payload) => client.post('/conductors', payload);
export const updateConductor = (id, payload) => client.put(`/conductors/${id}`, payload);
export const deleteConductor = (id) => client.delete(`/conductors/${id}`);

// Buses
export const getBuses = () => client.get('/buses');
export const createBus = (payload) => client.post('/buses', payload);
export const updateBus = (id, payload) => client.put(`/buses/${id}`, payload);
export const deleteBus = (id) => client.delete(`/buses/${id}`);
export const reassignBusConductor = (id, payload) => client.post(`/buses/${id}/reassign`, payload);

// Conductor Shift Audit Logs
export const getShiftLogs = (params) => client.get('/conductor/shift-logs', { params });
export const createShiftLog = (payload) => client.post('/conductor/shift-logs', payload);

// All Tickets (Admin)
export const getAdminTickets = (params) => client.get('/admin/tickets', { params });

// Monthly Passes (Admin)
export const getAdminMonthlyPasses = (params) => client.get('/admin/monthly-passes', { params });
export const createAdminMonthlyPass = (payload) => client.post('/admin/monthly-passes', payload);
export const updateAdminMonthlyPass = (id, payload) => client.put(`/admin/monthly-passes/${id}`, payload);
export const deleteAdminMonthlyPass = (id) => client.delete(`/admin/monthly-passes/${id}`);

// Customers (Admin)
export const getAdminCustomers = (params) => client.get('/admin/customers', { params });

// Loyalty Milestone Rules (Admin)
export const getLoyaltyRules = () => client.get('/admin/loyalty-rules');
export const createLoyaltyRule = (payload) => client.post('/admin/loyalty-rules', payload);
export const deleteLoyaltyRule = (id) => client.delete(`/admin/loyalty-rules/${id}`);
