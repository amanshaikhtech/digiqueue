const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('digiqueue_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'API request failed.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    getMe: () => request('/auth/me'),
  },

  // Tokens (Public & Staff)
  tokens: {
    issue: (payload) =>
      request('/tokens/issue', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getStatus: (tokenId) => request(`/tokens/${tokenId}/status`),
    markNoShow: (tokenId) =>
      request(`/tokens/${tokenId}/no-show`, {
        method: 'PATCH',
      }),
  },

  // Doctors & Sessions
  doctors: {
    getByClinic: (clinicId) => request(`/doctors/clinic/${clinicId}`),
    getQR: (doctorId) => request(`/doctors/${doctorId}/qr`),
    getCurrentSession: (doctorId) => request(`/doctors/${doctorId}/current-session`),
    resetSession: (doctorId) =>
      request(`/doctors/${doctorId}/reset-session`, {
        method: 'POST',
      }),
    callNext: (doctorId) =>
      request(`/doctors/${doctorId}/next`, {
        method: 'PATCH',
      }),
    completeCurrent: (doctorId) =>
      request(`/doctors/${doctorId}/complete-current`, {
        method: 'PATCH',
      }),
    getAnalytics: (doctorId) => request(`/doctors/${doctorId}/analytics`),
  },

  // Admin
  admin: {
    getClinics: () => request('/admin/clinics'),
    createClinic: (payload) =>
      request('/admin/clinics', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getDoctors: () => request('/admin/doctors'),
    createDoctor: (payload) =>
      request('/admin/doctors', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    toggleDoctor: (doctorId) =>
      request(`/admin/doctors/${doctorId}/toggle`, {
        method: 'PATCH',
      }),
    getSupervisors: () => request('/admin/supervisors'),
    createSupervisor: (payload) =>
      request('/admin/supervisors', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    toggleSupervisor: (userId) =>
      request(`/admin/supervisors/${userId}/toggle`, {
        method: 'PATCH',
      }),
    getAnalytics: () => request('/admin/analytics'),
  },
};
