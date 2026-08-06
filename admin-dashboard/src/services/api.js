import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default client;

// Buses
export const getBuses = () => client.get('/buses');
export const createBus = (payload) => client.post('/buses', payload);
export const updateBus = (id, payload) => client.put(`/buses/${id}`, payload);
export const deleteBus = (id) => client.delete(`/buses/${id}`);

// Conductors
export const getConductors = () => client.get('/conductors');
export const createConductor = (payload) => client.post('/conductors', payload);
export const updateConductor = (id, payload) => client.put(`/conductors/${id}`, payload);
export const deleteConductor = (id) => client.delete(`/conductors/${id}`);

// Routes
export const getRoutes = () => client.get('/routes');
export const createRoute = (payload) => client.post('/routes', payload);
export const updateRoute = (id, payload) => client.put(`/routes/${id}`, payload);
export const deleteRoute = (id) => client.delete(`/routes/${id}`);
