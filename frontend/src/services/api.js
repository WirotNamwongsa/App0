// src/services/api.js
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: BASE });

// Attach token automatically
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Handle auth errors
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Scout
export const scoutApi = {
  getProfile: () => api.get('/scouts/me'),
  getQR: () => api.get('/scouts/me/qr'),
  getSchedule: () => api.get('/scouts/me/schedule'),
};

// Leader
export const leaderApi = {
  getPatrol: () => api.get('/leader/patrol'),
  getScout: (id) => api.get(`/leader/scouts/${id}`),
  updateScout: (id, data) => api.patch(`/leader/scouts/${id}`, data),
};

// Camp Manager
export const campApi = {
  getDashboard: () => api.get('/camp/dashboard'),
  getStructure: () => api.get('/camp/structure'),
  createTroop: (data) => api.post('/camp/troops', data),
  createPatrol: (troopId, data) => api.post(`/camp/troops/${troopId}/patrols`, data),
  getPatrol: (id) => api.get(`/camp/patrols/${id}`),
  addScout: (data) => api.post('/camp/scouts', data),
  moveScout: (id, targetPatrolId) => api.patch(`/camp/scouts/${id}/move`, { targetPatrolId }),
  removeScout: (id) => api.delete(`/camp/scouts/${id}`),
  getSchedule: () => api.get('/camp/schedule'),
  createSchedule: (data) => api.post('/camp/schedule', data),
  getReport: () => api.get('/camp/report'),
};

// Staff
export const staffApi = {
  getActivity: () => api.get('/staff/activity'),
  scan: (data) => api.post('/staff/scan', data),
  batchSync: (scans) => api.post('/staff/scan/batch', { scans }),
  getScanned: (scheduleId) => api.get(`/staff/scanned/${scheduleId}`),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getReport: () => api.get('/admin/report'),
  getActivities: () => api.get('/admin/activities'),
  createActivity: (data) => api.post('/admin/activities', data),
  updateActivity: (id, data) => api.patch(`/admin/activities/${id}`, data),
  getAccounts: () => api.get('/admin/accounts'),
  createAccount: (data) => api.post('/admin/accounts', data),
  updateAccount: (id, data) => api.patch(`/admin/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/admin/accounts/${id}`),
  getAuditLog: (params) => api.get('/admin/audit', { params }),
  importScouts: (scouts) => api.post('/admin/import', { scouts }),
};

// Activities (shared)
export const activityApi = {
  getAll: () => api.get('/activities'),
};

export default api;
