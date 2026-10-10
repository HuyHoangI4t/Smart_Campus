/**
 * API Service for Admin Portal
 */

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.__ENV__ && window.__ENV__.API_URL) return window.__ENV__.API_URL;
    const host = window.location.hostname || 'localhost';
    const proto = window.location.protocol || 'http:';
    return `${proto}//${host}:5000`;
  }
  return 'http://localhost:5000';
};
const API_BASE = getApiBase();

const AdminAPI = {
  baseUrl: `${API_BASE}/api/admin`,
  authUrl: `${API_BASE}/api/auth`,

  _token: '',

  getToken() {
    if (this._token) return this._token;
    try {
      this._token = localStorage.getItem('ttn_admin_token') || '';
    } catch {
      this._token = '';
    }
    return this._token;
  },

  setToken(token) {
    this._token = token || '';
    try {
      if (token) {
        localStorage.setItem('ttn_admin_token', token);
      } else {
        localStorage.removeItem('ttn_admin_token');
      }
    } catch {}
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
    this._token = '';
    try {
      localStorage.removeItem('ttn_admin_token');
      localStorage.removeItem('ttn_admin_user');
    } catch {}
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
    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
    const token = this.getToken();

    if (!isAuthEndpoint && !token) {
      console.warn(`[AdminAPI] Bỏ qua gọi ${endpoint} do chưa có token đăng nhập.`);
      return { success: false, message: 'Chưa đăng nhập' };
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : (endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${this.baseUrl}/${endpoint}`);
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
        if (!endpoint.includes('/auth/login')) {
          this.clearAuth();
          if (window.App && typeof window.App.showAuthView === 'function') {
            window.App.showAuthView();
            window.App.showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
          }
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

  async updateNotification(id, data) {
    return this.request(`/api/admin/notifications/${id}`, {
      method: 'PUT',
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

  async updateFeedbackStatus(id, status = 'Đã giải quyết') {
    return this.request(`/api/admin/feedback/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
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

  async updateSosStatus(id, status = 'Đã xử lý') {
    return this.request(`/api/admin/sos/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async deleteSosAlert(id) {
    return this.request(`/api/admin/sos/${id}`, {
      method: 'DELETE'
    });
  },

  // Map Locations Management (CRUD 37 địa điểm)
  async getLocations(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.append('search', params.search);
    if (params.category && params.category !== 'Tất cả') qs.append('category', params.category);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request(`/api/admin/locations${query}`);
  },

  async createLocation(locationData) {
    return this.request('/api/admin/locations', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  },

  async updateLocation(id, locationData) {
    return this.request(`/api/admin/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(locationData)
    });
  },

  async deleteLocation(id) {
    return this.request(`/api/admin/locations/${id}`, {
      method: 'DELETE'
    });
  },

  async resetLocations() {
    return this.request('/api/admin/locations/reset', {
      method: 'POST'
    });
  },

  // Campus Paths & Walkways (Mạng lưới đường nội bộ tự vẽ)
  async getPaths() {
    return this.request('/api/admin/paths');
  },

  async createPath(pathData) {
    return this.request('/api/admin/paths', {
      method: 'POST',
      body: JSON.stringify(pathData)
    });
  },

  async updatePath(id, pathData) {
    return this.request(`/api/admin/paths/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pathData)
    });
  },

  async deletePath(id) {
    return this.request(`/api/admin/paths/${id}`, {
      method: 'DELETE'
    });
  },

  async resetPaths() {
    return this.request('/api/admin/paths/reset', {
      method: 'POST'
    });
  }
};

window.AdminAPI = AdminAPI;
