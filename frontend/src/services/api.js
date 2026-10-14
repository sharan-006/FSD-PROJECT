const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('qveue_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Auth API
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  quickDemoLogin: (payload) => request('/auth/quick-demo-login', { method: 'POST', body: payload }),
  getMe: () => request('/auth/me'),
};

// Organizations API
export const orgApi = {
  getAll: () => request('/organizations'),
  getById: (id) => request(`/organizations/${id}`),
  create: (data) => request('/organizations', { method: 'POST', body: data }),
  update: (id, data) => request(`/organizations/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/organizations/${id}`, { method: 'DELETE' }),
};

// Services API
export const serviceApi = {
  getByOrg: (orgId) => request(`/services/org/${orgId}`),
  getById: (id) => request(`/services/${id}`),
  create: (data) => request('/services', { method: 'POST', body: data }),
  update: (id, data) => request(`/services/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/services/${id}`, { method: 'DELETE' }),
};

// Counters API
export const counterApi = {
  getByOrg: (orgId) => request(`/counters/org/${orgId}`),
  create: (data) => request('/counters', { method: 'POST', body: data }),
  updateStatus: (id, data) => request(`/counters/${id}/status`, { method: 'PUT', body: data }),
  delete: (id) => request(`/counters/${id}`, { method: 'DELETE' }),
};

// Queues API
export const queueApi = {
  join: (data) => request('/queues/join', { method: 'POST', body: data }),
  getPreview: (orgId, serviceId) => 
    serviceId ? request(`/queues/preview/${orgId}/${serviceId}`) : request(`/queues/preview/${orgId}`),
  getStatus: (queueId) => request(`/queues/${queueId}/status`),
  getMyActiveTickets: () => request('/queues/active/my-tickets'),
  getMyHistory: () => request('/queues/history/my-tickets'),
  cancelTicket: (entryId) => request(`/queues/entry/${entryId}/cancel`, { method: 'POST' }),
  
  // Staff queue operations
  getStaffQueue: () => request('/queues/staff/my-queue'),
  callNext: (queueId, body = {}) => request(`/queues/${queueId}/next`, { method: 'POST', body }),
  recall: (queueId, body = {}) => request(`/queues/${queueId}/recall`, { method: 'POST', body }),
  skip: (queueId) => request(`/queues/${queueId}/skip`, { method: 'POST' }),
  complete: (queueId) => request(`/queues/${queueId}/complete`, { method: 'POST' }),
  pause: (queueId) => request(`/queues/${queueId}/pause`, { method: 'POST' }),
  resume: (queueId) => request(`/queues/${queueId}/resume`, { method: 'POST' }),
};

// Notifications API
export const notificationApi = {
  getMy: () => request('/notifications/my'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

// Admin API
export const adminApi = {
  getAnalytics: () => request('/admin/analytics'),
  getUsers: (role) => request(`/admin/users${role ? `?role=${role}` : ''}`),
  getQueuesMonitor: () => request('/admin/queues-monitor'),
  getNetworkInfo: () => request('/admin/network-info'),
};
