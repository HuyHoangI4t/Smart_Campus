/**
 * API Service for Admin Portal
 */

const AdminAPI = {
  baseUrl: '/api/admin',
  authUrl: '/api/auth',

  getToken() {
    return localStorage.getItem('ttn_admin_token') || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('ttn_admin_token', token);
    } else {
      localStorage.removeItem('ttn_admin_token');
    }
  },

  getUser() {
    try {
      const u = localStorage.getItem('ttn_admin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('ttn_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ttn_admin_user');
    }
  },

  clearAuth() {
    localStorage.removeItem('ttn_admin_token');
    localStorage.removeItem('ttn_admin_user');
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('/') ? endpoint : `${this.baseUrl}/${endpoint}`;
    const defaultHeaders = this.getHeaders();
    
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({ success: false, message: 'Dữ liệu trả về không hợp lệ' }));

      if (res.status === 401) {
        this.clearAuth();
        if (window.App && typeof window.App.showAuthView === 'function') {
          window.App.showAuthView();
          window.App.showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        }
        throw new Error(data.message || 'Hết phiên đăng nhập');
      }

      if (!res.ok && !data.success) {
        throw new Error(data.message || `Lỗi máy chủ (${res.status})`);
      }

      return data;
    } catch (err) {
      console.error(`[AdminAPI Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth Endpoints
  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: username,
        mssv: username,
        password: password
      })
    });
  },

  // Dashboard Stats (Đã loại bỏ bản ghi điểm)
  async getStats() {
    return this.request('/api/admin/stats');
  },

  // Users Management
  async getUsers(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.append('search', params.search);
    if (params.role) qs.append('role', params.role);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request(`/api/admin/users${query}`);
  },

  async createUser(userData) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUser(id, userData) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(id) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Notifications
  async createNotification(data) {
    return this.request('/api/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteNotification(id) {
    return this.request(`/api/admin/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  // Feedback
  async getFeedback() {
    return this.request('/api/admin/feedback');
  },

  async deleteFeedback(id) {
    return this.request(`/api/admin/feedback/${id}`, {
      method: 'DELETE'
    });
  },

  // SOS Alerts
  async getSosAlerts() {
    return this.request('/api/admin/sos');
  },

  async deleteSosAlert(id) {
    return this.request(`/api/admin/sos/${id}`, {
      method: 'DELETE'
    });
  }
};

window.AdminAPI = AdminAPI;
