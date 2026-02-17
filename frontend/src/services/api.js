import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Ensure dates from backend are treated as UTC
// Backend stores UTC but may not include 'Z' suffix
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function ensureUtcDates(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' && isoDateRegex.test(obj) && !obj.endsWith('Z')) {
    return obj + 'Z';
  }
  if (Array.isArray(obj)) return obj.map(ensureUtcDates);
  if (typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = ensureUtcDates(obj[key]);
    }
    return result;
  }
  return obj;
}

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = ensureUtcDates(response.data);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Sessions endpoints
export const sessionsAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  createBulk: (data) => api.post('/sessions/bulk', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id) => api.delete(`/sessions/${id}`),
};

// Students endpoints (to be implemented)
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Student Link Requests endpoints
export const linkRequestsAPI = {
  searchStudents: (name) => api.get('/studentlinkrequests/search-students', { params: { name } }),
  claim: (data) => api.post('/studentlinkrequests/claim', data),
  createStudent: (data) => api.post('/studentlinkrequests/create-student', data),
  getMyRequests: () => api.get('/studentlinkrequests/my'),
  getPending: () => api.get('/studentlinkrequests/pending'),
  getPendingCount: () => api.get('/studentlinkrequests/pending-count'),
  approve: (id, data) => api.put(`/studentlinkrequests/${id}/approve`, data || {}),
  reject: (id, data) => api.put(`/studentlinkrequests/${id}/reject`, data || {}),
};

export default api;
