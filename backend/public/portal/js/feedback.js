/**
 * Feedback Module - Quản lý tiếp nhận phản ánh & góp ý từ sinh viên
 */

const FeedbackModule = {
  feedbackList: [],

  async init() {
    await this.loadFeedback();
  },

  async loadFeedback() {
    try {
      const res = await AdminAPI.getFeedback();
      if (!res.success) throw new Error(res.message);

      this.feedbackList = res.feedback || [];
      this.renderTable();
    } catch (err) {
      console.error('Lỗi tải phản ánh:', err);
      if (window.App) window.App.showToast('Không thể tải danh sách phản hồi: ' + err.message, 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('feedbackTableBody');
    const countEl = document.getElementById('feedbackCountLabel');

    if (countEl) countEl.textContent = `Tổng cộng: ${this.feedbackList.length} phản ánh`;
    if (!tbody) return;

    if (this.feedbackList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400">
            <i data-lucide="message-square" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
            <p class="text-sm font-medium">Chưa có ý kiến phản hồi nào từ sinh viên</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = this.feedbackList.map((f, idx) => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="text-center font-semibold text-slate-400 text-xs">${idx + 1}</td>
        <td>
          <div class="space-y-0.5">
            <p class="font-bold text-xs sm:text-sm text-slate-900">${escapeHtml(f.ho_ten || 'Sinh viên')}</p>
            <p class="font-mono text-xs text-brand-800 font-semibold">${escapeHtml(f.mssv || 'N/A')}</p>
            <p class="text-[11px] text-slate-400">${escapeHtml(f.lop || '')}</p>
          </div>
        </td>
        <td>
          <span class="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
            ${escapeHtml(formatCategory(f.category || f.chuyen_muc))}
          </span>
        </td>
        <td>
          ${f.status === 'Đã giải quyết' ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Đã giải quyết
            </span>
          ` : f.status === 'Đang xử lý' ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i> Đang xử lý
            </span>
          ` : `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">
              <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Chờ tiếp nhận
            </span>
          `}
        </td>
        <td>
          <div class="max-w-md space-y-1">
            <p class="font-bold text-xs text-slate-800 truncate">${escapeHtml(f.title || f.tieu_de || 'Ý kiến phản ánh')}</p>
            <p class="text-xs text-slate-500 line-clamp-2">${escapeHtml(f.content || f.noi_dung || '')}</p>
          </div>
        </td>
        <td class="text-xs text-slate-500 whitespace-nowrap font-medium">
          ${escapeHtml(formatDateTime(f.created_at))}
        </td>
        <td class="text-right">
          <div class="inline-flex items-center gap-1.5">
            ${f.status !== 'Đã giải quyết' ? `
              <button onclick="FeedbackModule.confirmResolve(${f.id})" title="Đánh dấu đã giải quyết"
                class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                Xử lý
              </button>
            ` : `
              <button onclick="FeedbackModule.confirmReopen(${f.id})" title="Đã giải quyết (Nhấn để mở lại)"
                class="px-2 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                Xong
              </button>
            `}
            <button onclick="FeedbackModule.viewDetail(${f.id})" title="Xem chi tiết"
              class="p-1.5 text-slate-500 hover:text-brand-500 hover:bg-slate-100 rounded-lg transition">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="FeedbackModule.confirmDelete(${f.id})" title="Xóa phản ánh"
              class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  viewDetail(id) {
    this.currentDetailId = id;
    const item = this.feedbackList.find(f => f.id === id);
    if (!item) return;

    document.getElementById('fbModalStudent').textContent = `${item.ho_ten || 'Sinh viên'} (${item.mssv || 'N/A'}) - Lớp: ${item.lop || '-'}`;
    document.getElementById('fbModalCategory').textContent = formatCategory(item.category || item.chuyen_muc);
    const statusEl = document.getElementById('fbModalStatus');
    if (statusEl) {
      statusEl.textContent = item.status || 'Chờ tiếp nhận';
      statusEl.className = 'text-xs font-bold mt-0.5 ' + (item.status === 'Đã giải quyết' ? 'text-emerald-600' : (item.status === 'Đang xử lý' ? 'text-blue-600' : 'text-amber-600'));
    }
    document.getElementById('fbModalTitle').textContent = item.title || item.tieu_de || 'Ý kiến phản ánh';
    document.getElementById('fbModalContent').textContent = item.content || item.noi_dung || '';
    document.getElementById('fbModalDate').textContent = formatDateTime(item.created_at);

    openModal('feedbackDetailModal');
  },

  confirmResolve(id) {
    window.App.showConfirm(
      'Xử lý phản ánh',
      'Đánh dấu ý kiến phản ánh này là "Đã giải quyết"? Sinh viên sẽ nhận được thông báo trạng thái cập nhật trên ứng dụng.',
      async () => {
        try {
          await AdminAPI.updateFeedbackStatus(id, 'Đã giải quyết');
          window.App.showToast('Đã đánh dấu giải quyết phản ánh thành công', 'success');
          await this.loadFeedback();
          if (window.DashboardModule) DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi cập nhật trạng thái: ' + err.message, 'error');
        }
      }
    );
  },

  confirmReopen(id) {
    window.App.showConfirm(
      'Mở lại phản ánh',
      'Chuyển trạng thái phản ánh này về "Đang xử lý"?',
      async () => {
        try {
          await AdminAPI.updateFeedbackStatus(id, 'Đang xử lý');
          window.App.showToast('Đã chuyển trạng thái sang Đang xử lý', 'success');
          await this.loadFeedback();
          if (window.DashboardModule) DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi cập nhật: ' + err.message, 'error');
        }
      }
    );
  },

  async resolveCurrentModal() {
    if (!this.currentDetailId) return;
    try {
      await AdminAPI.updateFeedbackStatus(this.currentDetailId, 'Đã giải quyết');
      window.App.showToast('Đã cập nhật trạng thái: Đã giải quyết', 'success');
      closeModal('feedbackDetailModal');
      await this.loadFeedback();
      if (window.DashboardModule) DashboardModule.loadStats();
    } catch (err) {
      window.App.showToast('Lỗi khi cập nhật: ' + err.message, 'error');
    }
  },

  async progressCurrentModal() {
    if (!this.currentDetailId) return;
    try {
      await AdminAPI.updateFeedbackStatus(this.currentDetailId, 'Đang xử lý');
      window.App.showToast('Đã cập nhật trạng thái: Đang xử lý', 'success');
      closeModal('feedbackDetailModal');
      await this.loadFeedback();
      if (window.DashboardModule) DashboardModule.loadStats();
    } catch (err) {
      window.App.showToast('Lỗi khi cập nhật: ' + err.message, 'error');
    }
  },

  confirmDelete(id) {
    window.App.showConfirm(
      'Xóa phản ánh',
      'Bạn có chắc chắn muốn xóa phản ánh này khỏi hệ thống quản lý?',
      async () => {
        try {
          await AdminAPI.deleteFeedback(id);
          window.App.showToast('Đã xóa ý kiến phản ánh', 'success');
          await this.loadFeedback();
          if (window.DashboardModule) DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi xóa: ' + err.message, 'error');
        }
      }
    );
  }
};

window.FeedbackModule = FeedbackModule;
