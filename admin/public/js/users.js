/**
 * Users Module - Quản lý tài khoản sinh viên & quản trị viên
 */

const UsersModule = {
  users: [],
  filteredUsers: [],
  currentFilter: 'all',
  searchQuery: '',
  editingUserId: null,

  async init() {
    await this.loadUsers();
    this.bindEvents();
  },

  bindEvents() {
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilter();
      });
    }

    const roleFilter = document.getElementById('userRoleFilter');
    if (roleFilter) {
      roleFilter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.applyFilter();
      });
    }

    const avtInput = document.getElementById('modalAvatarInput');
    if (avtInput) {
      avtInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const avtPreview = document.getElementById('modalAvatarPreview');
        if (avtPreview) {
          avtPreview.src = val || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        }
      });
    }
  },

  async loadUsers() {
    try {
      const res = await AdminAPI.getUsers();
      if (!res.success) throw new Error(res.message);

      this.users = res.users || [];
      this.applyFilter();
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      if (window.App) window.App.showToast('Không thể tải người dùng: ' + err.message, 'error');
    }
  },

  applyFilter() {
    this.filteredUsers = this.users.filter(u => {
      // Role filter
      if (this.currentFilter !== 'all' && u.role !== this.currentFilter) {
        return false;
      }

      // Search query
      if (this.searchQuery) {
        const str = `${u.mssv || ''} ${u.ho_ten || ''} ${u.email || ''} ${u.lop || ''} ${u.khoa || ''}`.toLowerCase();
        if (!str.includes(this.searchQuery)) return false;
      }

      return true;
    });

    this.renderTable();
  },

  renderTable() {
    const tbody = document.getElementById('usersTableBody');
    const countEl = document.getElementById('usersCountLabel');

    if (countEl) {
      countEl.textContent = `Hiển thị ${this.filteredUsers.length} / ${this.users.length} tài khoản`;
    }

    if (!tbody) return;

    if (this.filteredUsers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
            <p class="text-sm font-medium">Không tìm thấy tài khoản người dùng phù hợp</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = this.filteredUsers.map((u, idx) => {
      const isStudent = u.role === 'sinh_vien' || !u.role;
      const firstLetter = (u.ho_ten || 'U').charAt(0).toUpperCase();
      const hasAvatar = !!(u.avatar && typeof u.avatar === 'string' && u.avatar.trim().length > 0);
      
      const avatarHtml = hasAvatar
        ? `<div class="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center shadow-xs">
             <img src="${u.avatar}" alt="${escapeHtml(u.ho_ten || '')}" class="w-full h-full object-cover"
               onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'font-bold text-xs text-brand-800\\'>${firstLetter}</span>';" />
           </div>`
        : `<div class="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-brand-800 shrink-0">
             ${firstLetter}
           </div>`;

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="text-center font-semibold text-slate-400 text-xs">${idx + 1}</td>
          <td>
            <div class="flex items-center gap-3">
              ${avatarHtml}
              <div>
                <p class="font-bold text-xs sm:text-sm text-slate-900">${escapeHtml(u.ho_ten || 'Chưa cập nhật')}</p>
                <p class="text-xs text-slate-400 font-mono">${escapeHtml(u.email || '')}</p>
              </div>
            </div>
          </td>
          <td>
            <span class="font-mono font-bold text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200">
              ${escapeHtml(u.mssv || 'N/A')}
            </span>
          </td>
          <td>
            <span class="badge ${isStudent ? 'badge-student' : 'badge-admin'}">
              <i data-lucide="${isStudent ? 'graduation-cap' : 'shield'}" class="w-3 h-3"></i>
              ${isStudent ? 'Sinh viên' : 'Quản trị viên'}
            </span>
          </td>
          <td class="text-xs text-slate-600">
            <p class="font-medium">${escapeHtml(u.lop || '-')}</p>
            <p class="text-[11px] text-slate-400">${escapeHtml(u.khoa || '-')}</p>
          </td>
          <td class="text-xs text-slate-500 font-mono">
            ${escapeHtml(u.so_dien_thoai || '-')}
          </td>
          <td class="text-right">
            <div class="inline-flex items-center gap-1.5">
              <button onclick="UsersModule.openEditModal(${u.id})" title="Chỉnh sửa"
                class="p-1.5 text-slate-500 hover:text-brand-500 hover:bg-slate-100 rounded-lg transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="UsersModule.confirmDelete(${u.id}, '${escapeHtml(u.mssv || '')}')" title="Xóa tài khoản"
                class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  openCreateModal() {
    const form = document.getElementById('userForm');
    if (form) form.reset();
    document.getElementById('userModalTitle').textContent = 'Thêm mới tài khoản người dùng';
    document.getElementById('modalMssvInput').readOnly = false;
    document.getElementById('modalPasswordHelp').classList.add('hidden');
    document.getElementById('modalPasswordInput').required = true;
    
    const avtInput = document.getElementById('modalAvatarInput');
    const avtPreview = document.getElementById('modalAvatarPreview');
    if (avtInput) avtInput.value = '';
    if (avtPreview) avtPreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    this.editingUserId = null;
    openModal('userModal');
  },

  openEditModal(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;

    this.editingUserId = id;
    document.getElementById('userModalTitle').textContent = `Chỉnh sửa tài khoản: ${user.mssv || user.ho_ten}`;
    
    document.getElementById('modalMssvInput').value = user.mssv || '';
    document.getElementById('modalMssvInput').readOnly = true; // Không sửa MSSV
    document.getElementById('modalNameInput').value = user.ho_ten || '';
    document.getElementById('modalEmailInput').value = user.email || '';
    document.getElementById('modalPhoneInput').value = user.so_dien_thoai || '';
    document.getElementById('modalClassInput').value = user.lop || '';
    document.getElementById('modalFacultyInput').value = user.khoa || '';
    document.getElementById('modalRoleInput').value = user.role || 'sinh_vien';
    
    const avtInput = document.getElementById('modalAvatarInput');
    const avtPreview = document.getElementById('modalAvatarPreview');
    const defaultAvt = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    if (avtInput) avtInput.value = user.avatar || '';
    if (avtPreview) avtPreview.src = user.avatar || defaultAvt;

    const pwdInput = document.getElementById('modalPasswordInput');
    pwdInput.value = '';
    pwdInput.required = false;
    document.getElementById('modalPasswordHelp').classList.remove('hidden');

    openModal('userModal');
  },

  handleAvatarFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      if (window.App) window.App.showToast('Vui lòng chọn ảnh kích thước dưới 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const avtInput = document.getElementById('modalAvatarInput');
      const avtPreview = document.getElementById('modalAvatarPreview');
      if (avtInput) avtInput.value = base64;
      if (avtPreview) avtPreview.src = base64;
    };
    reader.readAsDataURL(file);
  },

  async handleSaveUser(e) {
    e.preventDefault();
    const btn = document.getElementById('saveUserBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Đang lưu...';

    const avtInput = document.getElementById('modalAvatarInput');
    const payload = {
      mssv: document.getElementById('modalMssvInput').value.trim(),
      ho_ten: document.getElementById('modalNameInput').value.trim(),
      email: document.getElementById('modalEmailInput').value.trim(),
      so_dien_thoai: document.getElementById('modalPhoneInput').value.trim(),
      lop: document.getElementById('modalClassInput').value.trim(),
      khoa: document.getElementById('modalFacultyInput').value.trim(),
      role: document.getElementById('modalRoleInput').value,
      avatar: avtInput ? avtInput.value.trim() : undefined,
    };

    const newPwd = document.getElementById('modalPasswordInput').value.trim();
    if (newPwd) {
      payload.password = newPwd;
    }

    try {
      if (this.editingUserId) {
        await AdminAPI.updateUser(this.editingUserId, payload);
        window.App.showToast('Cập nhật tài khoản thành công', 'success');
      } else {
        if (!payload.password) throw new Error('Vui lòng nhập mật khẩu cho tài khoản mới');
        await AdminAPI.createUser(payload);
        window.App.showToast('Tạo tài khoản mới thành công', 'success');
      }

      closeModal('userModal');
      await this.loadUsers();
      DashboardModule.loadStats();
    } catch (err) {
      window.App.showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Lưu thông tin';
    }
  },

  confirmDelete(id, mssv) {
    window.App.showConfirm(
      'Xác nhận xóa tài khoản',
      `Bạn có chắc chắn muốn xóa tài khoản MSSV: <b>${mssv}</b>? Thao tác này sẽ xóa toàn bộ dữ liệu liên quan và không thể khôi phục.`,
      async () => {
        try {
          await AdminAPI.deleteUser(id);
          window.App.showToast(`Đã xóa thành công tài khoản MSSV ${mssv}`, 'success');
          await this.loadUsers();
          DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi xóa: ' + err.message, 'error');
        }
      }
    );
  }
};

window.UsersModule = UsersModule;
