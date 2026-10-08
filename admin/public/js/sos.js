/**
 * SOS Module - Trung tâm trực ban & xử lý cảnh báo khẩn cấp
 */

const SosModule = {
  alerts: [],

  async init() {
    await this.loadAlerts();
  },

  async loadAlerts() {
    try {
      const res = await AdminAPI.getSosAlerts();
      if (!res.success) throw new Error(res.message);

      this.alerts = res.alerts || [];
      this.renderTable();
    } catch (err) {
      console.error('Lỗi tải cảnh báo SOS:', err);
      if (window.App) window.App.showToast('Không thể tải cảnh báo SOS: ' + err.message, 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('sosTableBody');
    const countEl = document.getElementById('sosCountLabel');

    if (countEl) countEl.textContent = `Hiện có: ${this.alerts.length} cảnh báo`;
    if (!tbody) return;

    if (this.alerts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400">
            <i data-lucide="shield-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80"></i>
            <p class="text-sm font-semibold text-slate-700">Khuôn viên an toàn</p>
            <p class="text-xs text-slate-400 mt-0.5">Hiện không có cảnh báo cứu trợ khẩn cấp nào</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = this.alerts.map((a, idx) => {
      const lat = a.latitude || a.vi_do;
      const lng = a.longitude || a.kinh_do;
      const hasCoords = lat && lng;
      const phone = a.so_dien_thoai || a.phone;
      const isResolved = a.status === 'Đã xử lý' || a.status === 'Đã giải quyết';

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100 ${isResolved ? 'bg-white' : 'bg-red-50/20'}">
          <td class="text-center font-bold ${isResolved ? 'text-slate-400' : 'text-red-600'} text-xs">${idx + 1}</td>
          <td>
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                ${!isResolved ? '<span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>' : ''}
                <p class="font-bold text-xs sm:text-sm text-slate-900">${escapeHtml(a.ho_ten || 'Sinh viên')}</p>
              </div>
              <p class="font-mono text-xs font-bold text-brand-800">MSSV: ${escapeHtml(a.mssv || 'N/A')}</p>
              <p class="text-[11px] text-slate-400">${escapeHtml(a.lop || '')}</p>
            </div>
          </td>
          <td>
            ${isResolved ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Đã xử lý
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
                <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Cần cứu hộ
              </span>
            `}
          </td>
          <td>
            ${phone ? `
              <a href="tel:${phone}" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 transition">
                <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
                ${phone}
              </a>
            ` : '<span class="text-xs text-slate-400">Chưa có SĐT</span>'}
          </td>
          <td>
            <div class="space-y-1">
              <p class="text-xs font-semibold text-slate-800">${escapeHtml(a.location_name || a.vi_tri || 'Trong khuôn viên trường')}</p>
              ${hasCoords ? `
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank"
                  class="inline-flex items-center gap-1 text-[11px] font-bold text-brand-500 hover:text-brand-800 hover:underline">
                  <i data-lucide="map-pin" class="w-3 h-3"></i>
                  Xem trên Google Maps (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})
                </a>
              ` : ''}
              ${a.message ? `<p class="text-xs text-red-600 italic">"${escapeHtml(a.message)}"</p>` : ''}
            </div>
          </td>
          <td class="text-xs text-slate-500 whitespace-nowrap font-medium">
            ${escapeHtml(formatDateTime(a.created_at))}
          </td>
          <td class="text-right">
            <div class="inline-flex items-center gap-1.5 ml-auto">
              ${!isResolved ? `
                <button onclick="SosModule.confirmResolve(${a.id})" title="Đánh dấu đã xử lý an toàn"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                  Xử lý
                </button>
              ` : `
                <span class="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                  <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                  An toàn
                </span>
              `}
              <button onclick="SosModule.confirmDelete(${a.id})" title="Xóa cảnh báo"
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

  viewDetail(id) {
    window.App.switchTab('sos');
  },

  confirmResolve(id) {
    window.App.showConfirm(
      'Xác nhận xử lý SOS',
      'Đánh dấu cảnh báo khẩn cấp này là "Đã xử lý an toàn"? Sinh viên sẽ nhận được cập nhật trạng thái hỗ trợ trên ứng dụng.',
      async () => {
        try {
          await AdminAPI.updateSosStatus(id, 'Đã xử lý');
          window.App.showToast('Đã xử lý cảnh báo SOS an toàn', 'success');
          await this.loadAlerts();
          if (window.DashboardModule) DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi cập nhật trạng thái: ' + err.message, 'error');
        }
      }
    );
  },

  confirmDelete(id) {
    window.App.showConfirm(
      'Xóa cảnh báo SOS',
      'Bạn có chắc chắn muốn xóa cảnh báo này khỏi lịch sử hệ thống?',
      async () => {
        try {
          await AdminAPI.deleteSosAlert(id);
          window.App.showToast('Đã xóa cảnh báo SOS', 'success');
          await this.loadAlerts();
          if (window.DashboardModule) DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi xóa: ' + err.message, 'error');
        }
      }
    );
  }
};

window.SosModule = SosModule;
