const API = {
  get baseURL() {
    const url = window.APP_CONFIG?.apiBaseURL || '/api';
    return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...options.headers };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
      ...options,
      headers,
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
    };

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        this.setUser(null);
        window.location.hash = '#/login';
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  },

  auth: {
    login: (body) => API.request('/auth/login', { method: 'POST', body }),
    register: (body) => API.request('/auth/register', { method: 'POST', body }),
    forgotPassword: (body) => API.request('/auth/forgot-password', { method: 'POST', body }),
    resetPassword: (body) => API.request('/auth/reset-password', { method: 'POST', body }),
    changePassword: (body) => API.request('/auth/change-password', { method: 'PUT', body }),
    getMe: () => API.request('/auth/me'),
    getEmployees: () => API.request('/auth/employees'),
  },

  tasks: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/tasks${query ? `?${query}` : ''}`);
    },
    get: (id) => API.request(`/tasks/${id}`),
    create: (body) => API.request('/tasks', { method: 'POST', body }),
    update: (id, body) => API.request(`/tasks/${id}`, { method: 'PUT', body }),
    delete: (id) => API.request(`/tasks/${id}`, { method: 'DELETE' }),
    addComment: (id, text) =>
      API.request(`/tasks/${id}/comments`, { method: 'POST', body: { text } }),
    uploadAttachments: (id, formData) =>
      API.request(`/tasks/${id}/attachments`, { method: 'POST', body: formData }),
    deleteAttachment: (id, attachmentId) =>
      API.request(`/tasks/${id}/attachments/${attachmentId}`, { method: 'DELETE' }),
    downloadUrl: (filename) => {
      const token = API.getToken();
      return `${API.baseURL}/tasks/uploads/${filename}?token=${token}`;
    },
    getDownloadHeaders: () => ({
      Authorization: `Bearer ${API.getToken()}`,
    }),
  },

  admin: {
    overview: () => API.request('/admin/overview'),
    employees: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/admin/employees${query ? `?${query}` : ''}`);
    },
    employee: (id) => API.request(`/admin/employees/${id}`),
    departments: () => API.request('/admin/departments'),
    leaderboard: () => API.request('/admin/leaderboard'),
  },
};

window.API = API;
