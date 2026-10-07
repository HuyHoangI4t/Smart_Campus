/**
 * Notifications Module - Quản lý phát thông báo toàn trường
 */

const NotificationsModule = {
  notifications: [],

  async init() {
    await this.loadNotifications();
  },

  async loadNotifications() {
    try {
      let data = null;
      try {
        if (window.AdminAPI && typeof window.AdminAPI.request === 'function') {
          data = await window.AdminAPI.request('/api/admin/notifications');
        }
      } catch (e) {
        // Fallback fetch
      }

      if (!data || !data.success) {
        const res = await fetch('/api/campus/notifications');
        data = await res.json().catch(() => ({ success: false }));
      }

      this.notifications = (data && (data.data || data.notifications)) || [];
      this.renderList();
    } catch (err) {
      console.error('Lỗi tải danh sách thông báo:', err);
    }
  },

  renderList() {
    const container = document.getElementById('notificationsTableBody');
    const countEl = document.getElementById('notifCountLabel');

    if (countEl) countEl.textContent = `Tổng cộng: ${this.notifications.length} thông báo`;
    if (!container) return;

    if (this.notifications.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="py-12 text-center text-slate-400">
            <i data-lucide="bell" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
            <p class="text-sm font-medium">Chưa có thông báo nào trong hệ thống</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = this.notifications.map((n, idx) => {
      let typeBadge = 'bg-blue-100 text-blue-700';
      let typeLabel = 'Thông báo chung';
      if (n.type === 'academic') { typeBadge = 'bg-indigo-100 text-indigo-700'; typeLabel = 'Học vụ'; }
      if (n.type === 'urgent') { typeBadge = 'bg-red-100 text-red-700 font-bold'; typeLabel = 'Khẩn cấp'; }
      if (n.type === 'event') { typeBadge = 'bg-emerald-100 text-emerald-700'; typeLabel = 'Sự kiện'; }

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="text-center font-semibold text-slate-400 text-xs">${idx + 1}</td>
          <td>
            <div class="space-y-1 max-w-md">
              <p class="font-bold text-xs sm:text-sm text-slate-900">${escapeHtml(n.title || 'Không có tiêu đề')}</p>
              <p class="text-xs text-slate-500 line-clamp-2">${escapeHtml(n.content || '')}</p>
            </div>
          </td>
          <td>
            <span class="inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadge}">
              ${typeLabel}
            </span>
          </td>
          <td class="text-xs text-slate-500 whitespace-nowrap">
            <p class="font-medium text-slate-700">${escapeHtml(n.sender || 'Phòng Đào Tạo')}</p>
            <p class="text-[11px] text-slate-400">${escapeHtml(formatDateTime(n.created_at || n.date))}</p>
          </td>
          <td class="text-right">
            <div class="inline-flex items-center gap-1.5 ml-auto">
              <button onclick="NotificationsModule.openEditModal(${n.id})" title="Chỉnh sửa thông báo"
                class="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="NotificationsModule.confirmDelete(${n.id})" title="Xóa thông báo"
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

  openEditModal(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (!notif) return;

    document.getElementById('editNotifIdInput').value = notif.id;
    document.getElementById('editNotifTitleInput').value = notif.title || '';
    document.getElementById('editNotifTypeSelect').value = notif.type || 'general';
    document.getElementById('editNotifSenderInput').value = notif.sender || 'Phòng Đào Tạo';
    document.getElementById('editNotifContentInput').value = notif.content || '';
    document.getElementById('notifEditModalTitle').textContent = `Chỉnh sửa thông báo #${notif.id}`;

    openModal('notifEditModal');
  },

  async handleSaveEdit(e) {
    e.preventDefault();
    const btn = document.getElementById('saveNotifEditBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Đang lưu...';

    const id = document.getElementById('editNotifIdInput').value;
    const payload = {
      title: document.getElementById('editNotifTitleInput').value.trim(),
      type: document.getElementById('editNotifTypeSelect').value,
      sender: document.getElementById('editNotifSenderInput').value.trim() || 'Phòng Đào Tạo',
      content: document.getElementById('editNotifContentInput').value.trim()
    };

    try {
      if (!payload.title || !payload.content) throw new Error('Vui lòng điền đầy đủ tiêu đề và nội dung');

      await AdminAPI.updateNotification(id, payload);
      window.App.showToast('Cập nhật thông báo thành công!', 'success');
      closeModal('notifEditModal');
      await this.loadNotifications();
      if (window.DashboardModule) DashboardModule.loadStats();
    } catch (err) {
      window.App.showToast('Lỗi khi cập nhật: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Lưu thay đổi</span>';
      if (window.lucide) window.lucide.createIcons();
    }
  },

  async handleCreate(e) {
    e.preventDefault();
    const btn = document.getElementById('createNotifBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Đang đăng...';

    const payload = {
      title: document.getElementById('notifTitleInput').value.trim(),
      content: document.getElementById('notifContentInput').value.trim(),
      type: document.getElementById('notifTypeSelect').value,
      sender: document.getElementById('notifSenderInput').value.trim() || 'Phòng Đào Tạo',
      date: new Date().toLocaleDateString('vi-VN')
    };

    try {
      if (!payload.title || !payload.content) throw new Error('Vui lòng điền đầy đủ tiêu đề và nội dung');

      await AdminAPI.createNotification(payload);
      window.App.showToast('Đăng thông báo mới thành công!', 'success');
      
      document.getElementById('notifForm').reset();
      await this.loadNotifications();
      if (window.DashboardModule) DashboardModule.loadStats();
    } catch (err) {
      window.App.showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Phát thông báo ngay';
    }
  },

  confirmDelete(id) {
    window.App.showConfirm(
      'Xóa thông báo',
      'Bạn có chắc chắn muốn xóa thông báo này? Sinh viên sẽ không còn nhìn thấy trên ứng dụng.',
      async () => {
        try {
          await AdminAPI.deleteNotification(id);
          window.App.showToast('Đã xóa thông báo thành công', 'success');
          await this.loadNotifications();
          if (window.DashboardModule) DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi xóa: ' + err.message, 'error');
        }
      }
    );
  }
};

window.NotificationsModule = NotificationsModule;
