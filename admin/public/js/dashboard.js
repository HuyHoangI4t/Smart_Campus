/**
 * Dashboard Module - Quản lý tổng quan & biểu đồ
 * (LƯU Ý: Đã loại bỏ hoàn toàn Bản ghi điểm theo yêu cầu)
 */

const DashboardModule = {
  charts: {
    activity: null,
    distribution: null
  },

  async init() {
    await this.loadStats();
  },

  async loadStats() {
    try {
      const res = await AdminAPI.getStats();
      if (!res.success) throw new Error(res.message);

      const stats = res.stats || {};

      // 1. Cập nhật các thẻ KPI
      const elTotalUsers = document.getElementById('statTotalUsers');
      const elTotalStudents = document.getElementById('statTotalStudents');
      const elTotalNotifs = document.getElementById('statTotalNotifs');
      const elTotalFeedback = document.getElementById('statTotalFeedback');
      const elTotalSos = document.getElementById('statTotalSos');
      const elTotalLocations = document.getElementById('statTotalLocations');

      if (elTotalUsers) elTotalUsers.textContent = Number(stats.totalUsers || 0).toLocaleString();
      if (elTotalStudents) elTotalStudents.textContent = Number(stats.totalStudents || 0).toLocaleString();
      if (elTotalNotifs) elTotalNotifs.textContent = Number(stats.totalNotifications || 0).toLocaleString();
      if (elTotalFeedback) elTotalFeedback.textContent = Number(stats.totalFeedback || 0).toLocaleString();
      if (elTotalSos) elTotalSos.textContent = Number(stats.totalSosAlerts || 0).toLocaleString();
      if (elTotalLocations) elTotalLocations.textContent = Number(stats.totalLocations || 0).toLocaleString();

      // Cập nhật huy hiệu SOS trên thanh điều hướng nếu có cảnh báo
      const badgeSosNav = document.getElementById('navBadgeSos');
      if (badgeSosNav) {
        const count = Number(stats.totalSosAlerts || 0);
        badgeSosNav.textContent = count;
        badgeSosNav.style.display = count > 0 ? 'inline-flex' : 'none';
      }

      // 2. Render biểu đồ Chart.js
      this.renderCharts(stats, res.activityChart);

      // 3. Render danh sách gần đây
      this.renderRecentFeedback(res.recentFeedback || []);
      this.renderRecentSos(res.recentSos || []);

    } catch (err) {
      console.error('Lỗi tải thống kê Dashboard:', err);
      if (window.App) window.App.showToast('Không thể tải dữ liệu thống kê: ' + err.message, 'error');
    }
  },

  renderCharts(stats, activityChart = null) {
    if (typeof Chart === 'undefined') return;

    // Chart 1: Phân bố đối tượng & tính năng (Doughnut)
    const ctxDist = document.getElementById('chartDistribution');
    if (ctxDist) {
      if (this.charts.distribution) this.charts.distribution.destroy();

      const students = Number(stats.totalStudents || 0);
      const admins = Math.max(0, Number(stats.totalUsers || 0) - students);
      const feedback = Number(stats.totalFeedback || 0);
      const sos = Number(stats.totalSosAlerts || 0);

      this.charts.distribution = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
          labels: ['Sinh viên', 'Quản trị viên', 'Phản ánh', 'Cảnh báo SOS'],
          datasets: [{
            data: [students, admins, feedback, sos],
            backgroundColor: ['#2563EB', '#F59E0B', '#10B981', '#EF4444'],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
            }
          },
          cutout: '68%'
        }
      });
    }

    // Chart 2: Thống kê hoạt động gần đây (Bar Chart)
    const ctxAct = document.getElementById('chartActivity');
    if (ctxAct) {
      if (this.charts.activity) this.charts.activity.destroy();

      const labels = (activityChart && Array.isArray(activityChart.labels) && activityChart.labels.length)
        ? activityChart.labels
        : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

      const interactions = (activityChart && Array.isArray(activityChart.interactions) && activityChart.interactions.length)
        ? activityChart.interactions
        : [120, 190, 240, 210, 280, 160, 95];

      const feedback = (activityChart && Array.isArray(activityChart.feedback) && activityChart.feedback.length)
        ? activityChart.feedback
        : [5, 12, 8, 15, 6, 3, 2];

      this.charts.activity = new Chart(ctxAct, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Lượt tương tác',
              data: interactions,
              backgroundColor: '#132F73',
              borderRadius: 6
            },
            {
              label: 'Phản ánh sinh viên',
              data: feedback,
              backgroundColor: '#38BDF8',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
            },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const idx = items[0]?.dataIndex;
                  if (activityChart && activityChart.dates && activityChart.dates[idx]) {
                    return `${items[0].label} (${activityChart.dates[idx]})`;
                  }
                  return items[0]?.label || '';
                }
              }
            }
          },
          scales: {
            y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 10 }, beginAtZero: true } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }
  },

  renderRecentFeedback(list) {
    const container = document.getElementById('recentFeedbackList');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-slate-400 text-xs">
          Chưa có ý kiến phản hồi nào gần đây
        </div>
      `;
      return;
    }

    container.innerHTML = list.slice(0, 4).map(item => `
      <div class="p-3.5 hover:bg-slate-50 transition border-b border-slate-100 last:border-0 flex items-start justify-between gap-3">
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs text-slate-800 truncate">${escapeHtml(item.title || 'Góp ý')}</span>
            <span class="badge badge-student text-[10px] py-0.5 px-2">${escapeHtml(item.mssv || 'N/A')}</span>
          </div>
          <p class="text-xs text-slate-500 line-clamp-1">${escapeHtml(item.content || '')}</p>
        </div>
        <button onclick="FeedbackModule.viewDetail(${item.id})" class="text-xs font-semibold text-brand-500 hover:text-brand-800 whitespace-nowrap">
          Chi tiết
        </button>
      </div>
    `).join('');
  },

  renderRecentSos(list) {
    const container = document.getElementById('recentSosList');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-slate-400 text-xs">
          Hiện tại không có cảnh báo khẩn cấp nào
        </div>
      `;
      return;
    }

    container.innerHTML = list.slice(0, 4).map(item => `
      <div class="p-3.5 hover:bg-red-50/50 transition border-b border-slate-100 last:border-0 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
          </div>
          <div class="space-y-0.5 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs text-slate-800">MSSV: ${escapeHtml(item.mssv || 'N/A')}</span>
              <span class="text-[10px] text-slate-400">${escapeHtml(formatDateTime(item.created_at))}</span>
            </div>
            <p class="text-xs text-slate-600 truncate">${escapeHtml(item.message || item.location_name || 'Khẩn cấp!')}</p>
          </div>
        </div>
        <button onclick="SosModule.viewDetail(${item.id})" class="px-2.5 py-1 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Xử lý
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }
};

window.DashboardModule = DashboardModule;
