/**
 * Master App Controller - Quản trị hệ thống Đại Học Tây Nguyên
 * Giao diện hiện đại Apex / SaaS Dashboard Template
 */

// Helper an toàn tránh XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper quản lý modal
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  }
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.add('hidden');
    el.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }
}

// Helper định dạng ngày giờ chuẩn Việt Nam (HH:mm DD/MM/YYYY)
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  if (typeof dateStr === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch (e) {
    return String(dateStr);
  }
}

// Helper chuẩn hóa chuyên mục phản ánh sang tiếng Việt
function formatCategory(cat) {
  if (!cat) return 'Góp ý chung';
  const map = {
    'facility': 'Cơ sở vật chất',
    'teaching': 'Chất lượng giảng dạy',
    'academic': 'Chất lượng giảng dạy',
    'canteen': 'Căng tin & Dịch vụ',
    'security': 'An ninh & Gửi xe',
    'parking': 'An ninh & Gửi xe',
    'procedure': 'Thủ tục sinh viên',
    'other': 'Khác'
  };
  return map[cat.toLowerCase()] || cat;
}

const App = {
  currentTab: 'dashboard',
  confirmCallback: null,
  sidebarMode: 'vertical', // 'vertical' hoặc 'detached'
  currentZoom: '80%',
  globalSosTimer: null,
  lastKnownSosCount: null,

  init() {
    this.startClock();
    this.initZoom();
    this.initSidebarMode();
    this.checkAuth();
    this.bindGlobalEvents();
    this.startGlobalSosMonitor();
  },

  // Giám sát cảnh báo SOS khẩn cấp ngầm trên toàn bộ hệ thống
  startGlobalSosMonitor() {
    if (this.globalSosTimer) clearInterval(this.globalSosTimer);
    this.globalSosTimer = setInterval(async () => {
      const token = AdminAPI.getToken();
      if (!token) return;

      try {
        const res = await AdminAPI.getSosAlerts();
        if (!res || !res.success) return;

        const alerts = res.alerts || [];
        const unresolved = alerts.filter(a => a.status !== 'Đã xử lý' && a.status !== 'Đã giải quyết');
        const unresolvedCount = unresolved.length;

        // Cập nhật huy hiệu trên thanh điều hướng sidebar
        const badgeSosNav = document.getElementById('navBadgeSos');
        if (badgeSosNav) {
          if (unresolvedCount > 0) {
            badgeSosNav.textContent = unresolvedCount;
            badgeSosNav.classList.remove('hidden');
            badgeSosNav.style.display = 'inline-flex';
          } else {
            badgeSosNav.classList.add('hidden');
            badgeSosNav.style.display = 'none';
          }
        }

        // Phát hiện cảnh báo SOS mới phát sinh thời gian thực
        if (this.lastKnownSosCount !== null && unresolvedCount > this.lastKnownSosCount) {
          if (window.DashboardModule && typeof window.DashboardModule.playAlertSound === 'function') {
            window.DashboardModule.playAlertSound();
          }
          this.showToast(`🚨 CẢNH BÁO SOS: Có ${unresolvedCount - this.lastKnownSosCount} yêu cầu cứu trợ khẩn cấp mới!`, 'error');

          // Nếu đang mở tab SOS, tự động làm mới danh sách bảng
          if (this.currentTab === 'sos' && window.SosModule) {
            SosModule.loadAlerts();
          }
        }
        this.lastKnownSosCount = unresolvedCount;
      } catch (e) {
        // Silent error on background poll
      }
    }, 4000);
  },

  // Khởi tạo mức thu nhỏ giao diện (Mặc định 80% theo yêu cầu)
  initZoom() {
    const saved = localStorage.getItem('admin_ui_zoom') || '80%';
    this.setZoom(saved, false);
  },

  setZoom(zoomVal, notify = true) {
    this.currentZoom = zoomVal;
    localStorage.setItem('admin_ui_zoom', zoomVal);

    // Cập nhật thuộc tính zoom trên thẻ html
    document.documentElement.style.zoom = zoomVal;
    document.documentElement.className = document.documentElement.className
      .replace(/zoom-\d+/g, '')
      .trim();
    document.documentElement.classList.add(`zoom-${zoomVal.replace('%', '')}`);

    const label = document.getElementById('zoomLabel');
    if (label) label.textContent = zoomVal;

    if (notify) {
      this.showToast(`Thu phóng giao diện: ${zoomVal}`, 'info');
    }

    // Tự động căn chỉnh lại bản đồ Leaflet nếu đang mở tab bản đồ
    if (window.LocationsModule && window.LocationsModule.map) {
      setTimeout(() => window.LocationsModule.map.invalidateSize(), 150);
    }
  },

  cycleZoom() {
    const levels = ['80%', '90%', '100%'];
    const idx = levels.indexOf(this.currentZoom);
    const next = levels[(idx + 1) % levels.length];
    this.setZoom(next, true);
  },

  // Đồng hồ thời gian thực
  startClock() {
    const clockEl = document.getElementById('liveClock');
    const update = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + now.toLocaleDateString('vi-VN');
      }
    };
    update();
    setInterval(update, 1000);
  },

  // Khởi tạo chế độ hiển thị Sidebar (Dọc vs Nổi)
  initSidebarMode() {
    const saved = localStorage.getItem('admin_sidebar_mode') || 'vertical';
    this.sidebarMode = saved;
    this.applySidebarMode();
  },

  toggleSidebarMode() {
    this.sidebarMode = (this.sidebarMode === 'vertical') ? 'detached' : 'vertical';
    localStorage.setItem('admin_sidebar_mode', this.sidebarMode);
    this.applySidebarMode();
    this.showToast(`Đã chuyển sang kiểu Sidebar: ${this.sidebarMode === 'detached' ? 'Nổi (Detached)' : 'Dọc (Vertical)'}`, 'info');
  },

  applySidebarMode() {
    const layout = document.getElementById('mainLayout');
    const tag = document.getElementById('sidebarModeTag');
    if (layout) {
      if (this.sidebarMode === 'detached') {
        layout.classList.add('mode-detached');
        if (tag) tag.textContent = 'Nổi';
      } else {
        layout.classList.remove('mode-detached');
        if (tag) tag.textContent = 'Dọc';
      }
    }
  },

  // Điều khiển Mobile Sidebar Drawer
  toggleMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    if (sidebar && overlay) {
      const isOpen = sidebar.classList.contains('mobile-open');
      if (isOpen) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.add('hidden');
      } else {
        sidebar.classList.add('mobile-open');
        overlay.classList.remove('hidden');
      }
    }
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.add('hidden');
  },

  checkAuth() {
    const token = AdminAPI.getToken();
    const user = AdminAPI.getUser();

    if (token && user) {
      this.showMainView(user);
    } else {
      this.showAuthView();
    }
  },

  showAuthView() {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  showMainView(user) {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');

    const displayName = user.ho_ten || user.fullName || user.email || 'Quản trị viên';
    const displayEmail = user.email || 'admin@ttn.edu.vn';
    const avatarUrl = user.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTffzZtOfmsnGMh1O97etZoJGLvIZTQLuEwcT7BwgtIRQ&s=10';

    const nameEl = document.getElementById('headerAdminName');
    const emailEl = document.getElementById('headerAdminEmail');
    const sNameEl = document.getElementById('sidebarAdminName');
    const sRoleEl = document.getElementById('sidebarAdminRole');
    const headerAvatarEl = document.getElementById('headerAdminAvatar');
    const sidebarAvatarEl = document.getElementById('sidebarAdminAvatar');

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = displayEmail;
    if (sNameEl) sNameEl.textContent = displayName;
    if (sRoleEl) sRoleEl.textContent = user.role === 'admin' ? 'Quản Trị Viên Cấp Cao' : 'Cán Bộ Phụ Trách';
    if (headerAvatarEl && avatarUrl) headerAvatarEl.src = avatarUrl;
    if (sidebarAvatarEl && avatarUrl) sidebarAvatarEl.src = avatarUrl;

    // Khởi tạo tab mặc định
    this.switchTab('dashboard');

    // Tự động tải avatar & thông tin mới nhất trực tiếp từ bảng users
    this.fetchAdminProfile();
  },

  // Đồng bộ thông tin và avatar Admin mới nhất từ MySQL users table
  async fetchAdminProfile() {
    try {
      const user = AdminAPI.getUser();
      const mssv = (user && user.mssv) ? user.mssv : 'admin';
      const res = await AdminAPI.request(`/api/auth/profile?mssv=${encodeURIComponent(mssv)}`);
      if (res && res.success && res.profile) {
        const p = res.profile;
        const updatedUser = { ...(user || {}), ...p };
        AdminAPI.setUser(updatedUser);

        const headerAvatarEl = document.getElementById('headerAdminAvatar');
        const sidebarAvatarEl = document.getElementById('sidebarAdminAvatar');
        const sNameEl = document.getElementById('sidebarAdminName');
        const nameEl = document.getElementById('headerAdminName');

        if (p.avatar) {
          if (headerAvatarEl) headerAvatarEl.src = p.avatar;
          if (sidebarAvatarEl) sidebarAvatarEl.src = p.avatar;
        }
        if (p.ho_ten || p.fullName) {
          const name = p.ho_ten || p.fullName;
          if (sNameEl) sNameEl.textContent = name;
          if (nameEl) nameEl.textContent = name;
        }
      }
    } catch (e) {
      // Bỏ qua lỗi mạng nền
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const uInput = document.getElementById('loginUsername').value.trim();
    const pInput = document.getElementById('loginPassword').value;
    const alertBox = document.getElementById('loginAlert');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (!uInput || !pInput) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Đang xác thực...';
    alertBox.classList.add('hidden');

    try {
      const res = await AdminAPI.login(uInput, pInput);
      if (res.success && res.token && res.user) {
        if (res.user.role !== 'admin') {
          throw new Error('Tài khoản này không có quyền Quản trị viên (Admin).');
        }

        AdminAPI.setToken(res.token);
        AdminAPI.setUser(res.user);
        this.showToast('Đăng nhập thành công!', 'success');
        this.showMainView(res.user);
      } else {
        throw new Error(res.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      alertBox.textContent = err.message || 'Không thể kết nối đến máy chủ';
      alertBox.className = 'mb-5 p-3.5 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200 block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Đăng nhập Quản Trị</span> <i data-lucide="arrow-right" class="w-4 h-4 ml-2"></i>';
      if (window.lucide) window.lucide.createIcons();
    }
  },

  handleLogout() {
    this.showConfirm(
      'Đăng xuất hệ thống',
      'Bạn có chắc chắn muốn đăng xuất khỏi Trang Quản Trị Web?',
      () => {
        if (window.DashboardModule) DashboardModule.stopRealtime();
        if (this.globalSosTimer) {
          clearInterval(this.globalSosTimer);
          this.globalSosTimer = null;
        }
        AdminAPI.clearAuth();
        this.showToast('Đã đăng xuất', 'info');
        this.showAuthView();
      }
    );
  },

  switchTab(tabId) {
    const prevTab = this.currentTab;
    this.currentTab = tabId;
    this.closeMobileSidebar();

    // Dừng đồng bộ Realtime nếu rời khỏi tab Dashboard
    if (prevTab === 'dashboard' && tabId !== 'dashboard' && window.DashboardModule) {
      DashboardModule.stopRealtime();
    }

    // Cập nhật giao diện nút tab trên sidebar
    const tabs = ['dashboard', 'users', 'locations', 'notifications', 'feedback', 'sos'];
    tabs.forEach(t => {
      const btn = document.getElementById(`navbtn-${t}`);
      const content = document.getElementById(`tab-${t}`);
      
      if (btn) {
        if (t === tabId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }

      if (content) {
        if (t === tabId) {
          content.classList.remove('hidden');
          content.classList.add('animate-fade-in');
        } else {
          content.classList.add('hidden');
          content.classList.remove('animate-fade-in');
        }
      }
    });

    // Tải dữ liệu tương ứng cho từng tab
    if (tabId === 'dashboard') DashboardModule.init();
    if (tabId === 'users') UsersModule.init();
    if (tabId === 'locations') LocationsModule.init();
    if (tabId === 'notifications') NotificationsModule.init();
    if (tabId === 'feedback') FeedbackModule.init();
    if (tabId === 'sos') SosModule.init();

    if (window.lucide) window.lucide.createIcons();
  },

  refreshCurrentTab() {
    this.showToast('Đang làm mới dữ liệu...', 'info');
    this.switchTab(this.currentTab);
  },

  handleGlobalSearch(e) {
    if (e.key === 'Enter') {
      const query = (e.target.value || '').trim().toLowerCase();
      if (!query) return;

      if (query.includes('dia diem') || query.includes('dia') || query.includes('phong') || query.includes('nha') || query.includes('ban do')) {
        this.switchTab('locations');
        const locSearch = document.getElementById('locationSearchInput');
        if (locSearch) {
          locSearch.value = query;
          if (window.LocationsModule) {
            LocationsModule.searchQuery = query;
            LocationsModule.applyFilter();
          }
        }
      } else if (query.includes('thong bao') || query.includes('tin')) {
        this.switchTab('notifications');
      } else if (query.includes('phan anh') || query.includes('y kien') || query.includes('gop y')) {
        this.switchTab('feedback');
      } else if (query.includes('sos') || query.includes('khan cap') || query.includes('cuu')) {
        this.switchTab('sos');
      } else {
        // Mặc định tìm kiếm tài khoản sinh viên
        this.switchTab('users');
        const userSearch = document.getElementById('userSearchInput');
        if (userSearch) {
          userSearch.value = query;
          if (window.UsersModule) {
            UsersModule.searchQuery = query;
            UsersModule.applyFilter();
          }
        }
      }
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'info';
    let iconColor = 'text-blue-500';
    if (type === 'success') { icon = 'check-circle'; iconColor = 'text-emerald-500'; }
    if (type === 'error') { icon = 'alert-circle'; iconColor = 'text-red-500'; }

    toast.innerHTML = `
      <div class="${iconColor} shrink-0 mt-0.5">
        <i data-lucide="${icon}" class="w-5 h-5"></i>
      </div>
      <div class="flex-1 text-xs sm:text-sm font-medium text-slate-800">${escapeHtml(message)}</div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  showConfirm(title, message, callback) {
    this.confirmCallback = callback;
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').innerHTML = message;
    openModal('confirmModal');
  },

  executeConfirm() {
    closeModal('confirmModal');
    if (typeof this.confirmCallback === 'function') {
      this.confirmCallback();
      this.confirmCallback = null;
    }
  },

  bindGlobalEvents() {
    // Đóng modal khi bấm vào nền overlay
    window.addEventListener('click', (e) => {
      if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        const modal = e.target.closest('[id$="Modal"]');
        if (modal) closeModal(modal.id);
      }
    });

    // Phím tắt Ctrl + K để focus vào ô tìm kiếm toàn cục
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }
};

window.App = App;

// Khởi chạy khi tài liệu tải xong
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
