/**
 * Master App Controller - Quản trị hệ thống Đại Học Tây Nguyên
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

const App = {
  currentTab: 'dashboard',
  confirmCallback: null,

  init() {
    this.startClock();
    this.checkAuth();
    this.bindGlobalEvents();
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

    const nameEl = document.getElementById('headerAdminName');
    const emailEl = document.getElementById('headerAdminEmail');
    if (nameEl) nameEl.textContent = user.ho_ten || user.fullName || user.email || 'Quản trị viên';
    if (emailEl) emailEl.textContent = user.email || 'admin@ttn.edu.vn';

    // Khởi tạo tab mặc định
    this.switchTab('dashboard');
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
        AdminAPI.clearAuth();
        this.showToast('Đã đăng xuất', 'info');
        this.showAuthView();
      }
    );
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Cập nhật giao diện nút tab
    const tabs = ['dashboard', 'users', 'notifications', 'feedback', 'sos'];
    tabs.forEach(t => {
      const btn = document.getElementById(`navbtn-${t}`);
      const content = document.getElementById(`tab-${t}`);
      
      if (btn) {
        if (t === tabId) {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition bg-brand-800 text-white shadow-sm';
        } else {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition text-slate-600 hover:bg-slate-100';
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

    // Tải dữ liệu tương ứng cho tab
    if (tabId === 'dashboard') DashboardModule.init();
    if (tabId === 'users') UsersModule.init();
    if (tabId === 'notifications') NotificationsModule.init();
    if (tabId === 'feedback') FeedbackModule.init();
    if (tabId === 'sos') SosModule.init();

    if (window.lucide) window.lucide.createIcons();
  },

  refreshCurrentTab() {
    this.showToast('Đang làm mới dữ liệu...', 'info');
    this.switchTab(this.currentTab);
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
  }
};

window.App = App;

// Khởi chạy khi tài liệu tải xong
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
