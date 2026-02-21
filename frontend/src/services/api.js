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
  updateStatus: (id, data) => api.patch(`/sessions/${id}/status`, data),
  bulkComplete: () => api.post('/sessions/bulk-complete'),
};

// Students endpoints
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  linkToUser: (id, data) => api.put(`/students/${id}/link`, data),
  searchUsers: (q) => api.get('/students/search-users', { params: { q } }),
};

// Users endpoints (Admin)
export const usersAPI = {
  getAll: (search) => api.get('/users', { params: search ? { search } : {} }),
  getById: (id) => api.get(`/users/${id}`),
  assignRole: (id, data) => api.put(`/users/${id}/roles`, data),
  removeRole: (id, role) => api.delete(`/users/${id}/roles/${role}`),
};

// Student Link Requests endpoints
export const linkRequestsAPI = {
  searchStudents: (name) => api.get('/studentlinkrequests/search-students', { params: { name } }),
  claim: (data) => api.post('/studentlinkrequests/claim', data),
  createStudent: (data) => api.post('/studentlinkrequests/create-student', data),
  getMyRequests: () => api.get('/studentlinkrequests/my'),
  getAll: (status) => api.get('/studentlinkrequests/all', { params: status ? { status } : {} }),
  getPending: () => api.get('/studentlinkrequests/pending'),
  getPendingCount: () => api.get('/studentlinkrequests/pending-count'),
  approve: (id, data) => api.put(`/studentlinkrequests/${id}/approve`, data || {}),
  reject: (id, data) => api.put(`/studentlinkrequests/${id}/reject`, data || {}),
  clearResolved: () => api.delete('/studentlinkrequests/clear-resolved'),
};

// Attendance endpoints
export const attendanceAPI = {
  getForSession: (sessionId) => api.get(`/attendance/session/${sessionId}`),
  markForSession: (sessionId, data) => api.post(`/attendance/session/${sessionId}`, data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getForStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
  getStudentSummary: (studentId) => api.get(`/attendance/student/${studentId}/summary`),
  getMy: () => api.get('/attendance/my'),
};

// Class Types endpoints
export const classTypesAPI = {
  getAll: (params) => api.get('/classtypes', { params }),
  getById: (id) => api.get(`/classtypes/${id}`),
  create: (data) => api.post('/classtypes', data),
  update: (id, data) => api.put(`/classtypes/${id}`, data),
  delete: (id) => api.delete(`/classtypes/${id}`),
};

// Package Definitions endpoints (Admin)
export const packageDefinitionsAPI = {
  getAll: (params) => api.get('/packagedefinitions', { params }),
  create: (data) => api.post('/packagedefinitions', data),
  update: (id, data) => api.put(`/packagedefinitions/${id}`, data),
  delete: (id) => api.delete(`/packagedefinitions/${id}`),
};

// Billing endpoints
export const billingAPI = {
  getPackages: (params) => api.get('/billing/packages', { params }),
  enrollPackage: (data) => api.post('/billing/packages', data),
  bulkEnrollPackage: (data) => api.post('/billing/packages/bulk', data),
  deletePackage: (id) => api.delete(`/billing/packages/${id}`),
  getPayments: (params) => api.get('/billing/payments', { params }),
  recordPayment: (data) => api.post('/billing/payments', data),
  deletePayment: (id) => api.delete(`/billing/payments/${id}`),
  getSummary: (params) => api.get('/billing/summary', { params }),
  getStudentBalance: (studentId, params) => api.get(`/billing/student/${studentId}`, { params }),
  getMy: () => api.get('/billing/my'),
};

export default api;
