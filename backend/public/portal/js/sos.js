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

      return `
        <tr class="hover:bg-red-50/40 transition border-b border-slate-100 bg-red-50/20">
          <td class="text-center font-bold text-red-600 text-xs">${idx + 1}</td>
          <td>
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <p class="font-bold text-xs sm:text-sm text-slate-900">${escapeHtml(a.ho_ten || 'Sinh viên')}</p>
              </div>
              <p class="font-mono text-xs font-bold text-brand-800">MSSV: ${escapeHtml(a.mssv || 'N/A')}</p>
              <p class="text-[11px] text-slate-400">${escapeHtml(a.lop || '')}</p>
            </div>
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
            ${escapeHtml(a.created_at || 'Vừa xong')}
          </td>
          <td class="text-right">
            <button onclick="SosModule.confirmResolve(${a.id})"
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 ml-auto">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              Đã xử lý
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  viewDetail(id) {
    // Chuyển trực tiếp sang tab SOS và cuộn tới hàng
    window.App.switchTab('sos');
  },

  confirmResolve(id) {
    window.App.showConfirm(
      'Xác nhận hoàn tất xử lý SOS',
      'Đánh dấu cảnh báo khẩn cấp này đã được lực lượng an ninh xử lý an toàn?',
      async () => {
        try {
          await AdminAPI.deleteSosAlert(id);
          window.App.showToast('Đã đóng cảnh báo SOS thành công', 'success');
          await this.loadAlerts();
          DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi cập nhật: ' + err.message, 'error');
        }
      }
    );
  }
};

window.SosModule = SosModule;
