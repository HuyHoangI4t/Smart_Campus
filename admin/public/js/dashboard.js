/**
 * Dashboard Module - Quản lý tổng quan & biểu đồ
 * Thiết kế giao diện hiện đại theo phong cách Apex / SaaS Dashboard Template
 */

const DashboardModule = {
  charts: {
    activity: null,
    distribution: null,
    trend: null
  },
  isFetching: false,
  lastSosCount: null,

  async init() {
    await this.loadStats(false);
    // Realtime được quản lý tập trung thông qua Socket.IO (Event-driven, 0 HTTP polling)
  },

  // Tương thích ngược: Không sử dụng setInterval polling nữa
  startRealtime() {
    // Không cần polling vì Socket.IO sẽ tự động push khi có thay đổi
  },

  stopRealtime() {
    // Không cần clearInterval vì đã chuyển sang Socket.IO
  },

  // Phát âm thanh cảnh báo khi có SOS mới phát sinh
  playAlertSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.30);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  },

  async loadStats(silent = false) {
    if (!AdminAPI.getToken()) return;
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const res = await AdminAPI.getStats();
      if (!res || !res.success) throw new Error(res?.message || 'Không thể tải thống kê');

      const stats = res.stats || {};

      // 1. Cập nhật các thẻ KPI
      const elTotalUsers = document.getElementById('statTotalUsers');
      const elTotalStudents = document.getElementById('statTotalStudents');
      const elTotalNotifs = document.getElementById('statTotalNotifs');
      const elTotalFeedback = document.getElementById('statTotalFeedback');
      const elTotalSos = document.getElementById('statTotalSos');
      const elTotalLocations = document.getElementById('statTotalLocations');

      const elKpiUserBadge = document.getElementById('kpiUserBadge');
      const elKpiStudentBadge = document.getElementById('kpiStudentBadge');
      const elKpiLocationBadge = document.getElementById('kpiLocationBadge');
      const elKpiNotifBadge = document.getElementById('kpiNotifBadge');
      const elKpiFeedbackBadge = document.getElementById('kpiFeedbackBadge');
      const elKpiSosBadge = document.getElementById('kpiSosBadge');

      const elNavLocationsCount = document.getElementById('totalLocationsCount');

      // Department cards (Row 3)
      const elTeamStudents = document.getElementById('statTeamStudentsCount');
      const elTeamFeedback = document.getElementById('statTeamFeedbackCount');
      const elTeamLocations = document.getElementById('statTeamLocationsCount');
      const elTeamSos = document.getElementById('statTeamSosCount');

      const usersCount = Number(stats.totalUsers || 0);
      const studentsCount = Number(stats.totalStudents || 0);
      const notifsCount = Number(stats.totalNotifications || 0);
      const fbCount = Number(stats.totalFeedback || 0);
      const sosCount = Number(stats.totalSosAlerts || 0);
      const locCount = Number(stats.totalLocations || 0);

      // Cảnh báo thời gian thực nếu có ca SOS mới phát sinh
      if (this.lastSosCount !== null && sosCount > this.lastSosCount) {
        this.playAlertSound();
        if (window.App && typeof window.App.showToast === 'function') {
          window.App.showToast(`🚨 CẢNH BÁO SOS: Hệ thống vừa nhận thêm ${sosCount - this.lastSosCount} yêu cầu cứu trợ khẩn cấp!`, 'error');
        }
      }
      this.lastSosCount = sosCount;

      if (elTotalUsers) elTotalUsers.textContent = usersCount.toLocaleString();
      if (elTotalStudents) elTotalStudents.textContent = studentsCount.toLocaleString();
      if (elTotalNotifs) elTotalNotifs.textContent = notifsCount.toLocaleString();
      if (elTotalFeedback) elTotalFeedback.textContent = fbCount.toLocaleString();
      if (elTotalSos) elTotalSos.textContent = sosCount.toLocaleString();
      if (elTotalLocations) elTotalLocations.textContent = locCount.toLocaleString();

      if (elKpiUserBadge) elKpiUserBadge.textContent = `${usersCount} tài khoản`;
      if (elKpiStudentBadge) elKpiStudentBadge.textContent = `${studentsCount} SV`;
      if (elKpiLocationBadge) elKpiLocationBadge.textContent = `${locCount} điểm`;
      if (elKpiNotifBadge) elKpiNotifBadge.textContent = `${notifsCount} tin`;
      if (elKpiFeedbackBadge) elKpiFeedbackBadge.textContent = `${fbCount} ý kiến`;
      if (elKpiSosBadge) elKpiSosBadge.textContent = sosCount > 0 ? `${sosCount} sự cố` : 'An toàn';

      if (elNavLocationsCount) elNavLocationsCount.textContent = locCount;

      // Cập nhật khối đơn vị vận hành (Row 3)
      if (elTeamStudents) elTeamStudents.textContent = `${studentsCount} Sinh viên`;
      if (elTeamFeedback) elTeamFeedback.textContent = `${fbCount} Phản ánh`;
      if (elTeamLocations) elTeamLocations.textContent = `${locCount} Điểm ghim`;
      if (elTeamSos) elTeamSos.textContent = sosCount > 0 ? `${sosCount} Cần hỗ trợ` : 'Trực ban sẵn sàng';

      // Cập nhật huy hiệu SOS trên thanh điều hướng nếu có cảnh báo
      const badgeSosNav = document.getElementById('navBadgeSos');
      if (badgeSosNav) {
        badgeSosNav.textContent = sosCount;
        badgeSosNav.style.display = sosCount > 0 ? 'inline-flex' : 'none';
      }

      // 2. Render biểu đồ Chart.js (3 biểu đồ chuẩn template: Donut, Bar, Spline Line)
      this.renderCharts(stats, res.activityChart);

      // 3. Render danh sách gần đây
      this.renderRecentFeedback(res.recentFeedback || []);
      this.renderRecentSos(res.recentSos || []);

      if (!silent && window.App && typeof window.App.showToast === 'function') {
        window.App.showToast('Đã làm mới dữ liệu thời gian thực', 'success');
      }

    } catch (err) {
      if (!silent) {
        console.error('Lỗi tải thống kê Dashboard:', err);
        if (window.App) window.App.showToast('Không thể tải dữ liệu thống kê: ' + err.message, 'error');
      }
    } finally {
      this.isFetching = false;
    }
  },

  renderCharts(stats, activityChart = null) {
    if (typeof Chart === 'undefined') return;

    // ─── Biểu đồ 1: Cơ Cấu Dữ Liệu & Tài Khoản (Doughnut Chart) ──────
    const ctxDist = document.getElementById('chartDistribution');
    if (ctxDist) {
      const students = Number(stats.totalStudents || 0);
      const admins = Math.max(0, Number(stats.totalUsers || 0) - students);
      const feedback = Number(stats.totalFeedback || 0);
      const sos = Number(stats.totalSosAlerts || 0);
      const totalItems = students + admins + feedback + sos;

      // Cập nhật chân biểu đồ phân bổ
      const elDistStudent = document.getElementById('distStudentPct');
      const elDistAdmin = document.getElementById('distAdminPct');
      const elDistFeedback = document.getElementById('distFeedbackCount');

      if (elDistStudent) {
        const pct = totalItems > 0 ? Math.round((students / totalItems) * 100) : 0;
        elDistStudent.textContent = `${pct}%`;
      }
      if (elDistAdmin) {
        const pct = totalItems > 0 ? Math.round((admins / totalItems) * 100) : 0;
        elDistAdmin.textContent = `${pct}%`;
      }
      if (elDistFeedback) {
        elDistFeedback.textContent = `${feedback} ý kiến`;
      }

      // Cập nhật mượt mà nếu biểu đồ đã tồn tại (Realtime Không giật)
      if (this.charts.distribution) {
        this.charts.distribution.data.datasets[0].data = [students, admins, feedback, sos];
        this.charts.distribution.update('none');
      } else {
        this.charts.distribution = new Chart(ctxDist, {
          type: 'doughnut',
          data: {
            labels: ['Sinh viên', 'Quản trị viên', 'Phản ánh', 'Cảnh báo SOS'],
            datasets: [{
              data: [students, admins, feedback, sos],
              backgroundColor: ['#2563EB', '#F59E0B', '#10B981', '#EF4444'],
              borderWidth: 3,
              borderRadius: 6,
              borderColor: '#FFFFFF',
              hoverOffset: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'nearest',
              intersect: false
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 10,
                  boxHeight: 10,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  padding: 14,
                  font: { size: 11, family: 'Inter', weight: '600' }
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                titleColor: '#FFFFFF',
                bodyColor: '#F8FAFC',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                boxPadding: 6,
                callbacks: {
                  label: (item) => {
                    const val = Number(item.raw ?? 0);
                    const total = totalItems || 1;
                    const pct = Math.round((val / total) * 100);
                    return ` ${item.label}: ${val.toLocaleString('vi-VN')} (${pct}%)`;
                  }
                }
              }
            },
            cutout: '72%'
          }
        });
      }
    }

    // ─── Biểu đồ 2: Tần Suất Hoạt Động & Tương Tác (Bar Chart) ───────
    const ctxAct = document.getElementById('chartActivity');
    if (ctxAct) {
      const labels = (activityChart && Array.isArray(activityChart.labels) && activityChart.labels.length)
        ? activityChart.labels
        : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

      const interactions = (activityChart && Array.isArray(activityChart.interactions) && activityChart.interactions.length)
        ? activityChart.interactions
        : [0, 0, 0, 0, 0, 0, 0];

      const feedbackData = (activityChart && Array.isArray(activityChart.feedback) && activityChart.feedback.length)
        ? activityChart.feedback
        : [0, 0, 0, 0, 0, 0, 0];

      // Tính toán số liệu thực tế cho chân biểu đồ cột
      const totalInteractions = interactions.reduce((sum, val) => sum + Number(val || 0), 0);
      const avgInteractions = Math.round(totalInteractions / Math.max(1, interactions.length));

      const elAvgSummary = document.getElementById('activityAvgSummary');
      if (elAvgSummary) {
        elAvgSummary.innerHTML = `Trung bình: <strong>~${avgInteractions.toLocaleString()} lượt/ngày</strong>`;
      }

      const prevInteractions = (activityChart && Array.isArray(activityChart.prevInteractions))
        ? activityChart.prevInteractions
        : [];
      const totalPrevInteractions = prevInteractions.reduce((sum, val) => sum + Number(val || 0), 0);

      const elTrendSummary = document.getElementById('activityTrendSummary');
      if (elTrendSummary) {
        if (totalPrevInteractions > 0) {
          const diffPct = Math.round(((totalInteractions - totalPrevInteractions) / totalPrevInteractions) * 100);
          if (diffPct >= 0) {
            elTrendSummary.className = 'text-emerald-600 font-semibold flex items-center gap-1';
            elTrendSummary.innerHTML = `<i data-lucide="trending-up" class="w-3.5 h-3.5"></i> Tăng ${diffPct}% so với tuần trước`;
          } else {
            elTrendSummary.className = 'text-amber-600 font-semibold flex items-center gap-1';
            elTrendSummary.innerHTML = `<i data-lucide="trending-down" class="w-3.5 h-3.5"></i> Giảm ${Math.abs(diffPct)}% so với tuần trước`;
          }
        } else {
          elTrendSummary.className = 'text-blue-600 font-semibold flex items-center gap-1';
          elTrendSummary.innerHTML = `<i data-lucide="activity" class="w-3.5 h-3.5"></i> Tổng ${totalInteractions.toLocaleString()} lượt tuần này`;
        }
      }

      // Cập nhật mượt mà nếu biểu đồ đã tồn tại (Realtime Không giật)
      if (this.charts.activity) {
        this.charts.activity.data.labels = labels;
        this.charts.activity.data.datasets[0].data = interactions;
        this.charts.activity.data.datasets[1].data = feedbackData;
        this.charts.activity.update('none');
      } else {
        this.charts.activity = new Chart(ctxAct, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Lượt truy cập',
              data: interactions,
              backgroundColor: '#2563EB',
              hoverBackgroundColor: '#1D4ED8',
              borderRadius: 6,
              maxBarThickness: 24,
              categoryPercentage: 0.7,
              barPercentage: 0.85
            },
            {
              label: 'Phản ánh sinh viên',
              data: feedbackData,
              backgroundColor: '#38BDF8',
              hoverBackgroundColor: '#0284C7',
              borderRadius: 6,
              maxBarThickness: 24,
              categoryPercentage: 0.7,
              barPercentage: 0.85
            }
          ]
        },
        plugins: [{
          id: 'barValuePlugin',
          afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              if (meta.hidden) return;
              meta.data.forEach((bar, index) => {
                const val = dataset.data[index];
                if (val === undefined || val === null || val === 0) return;
                ctx.save();
                ctx.fillStyle = '#64748B';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(Number(val).toLocaleString('vi-VN'), bar.x, bar.y - 3);
                ctx.restore();
              });
            });
          }
        }],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          hover: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 11, family: 'Inter', weight: '600' }
              }
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              titleColor: '#FFFFFF',
              bodyColor: '#F8FAFC',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                title: (items) => {
                  const idx = items[0]?.dataIndex;
                  if (activityChart && activityChart.dates && activityChart.dates[idx]) {
                    return `${items[0].label} (${activityChart.dates[idx]})`;
                  }
                  return items[0]?.label || '';
                },
                label: (context) => {
                  const val = Number(context.raw ?? 0);
                  const unit = context.dataset.label?.includes('Phản ánh') ? 'ý kiến' : 'lượt';
                  return ` ${context.dataset.label}: ${val.toLocaleString('vi-VN')} ${unit}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#F1F5F9' },
              border: { dash: [4, 4] },
              ticks: { font: { size: 10 }, color: '#94A3B8' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: '600' }, color: '#64748B' }
            }
          }
        }
      });
      }
    }

    // ─── Biểu đồ 3: Xu Hướng Cảnh Báo SOS & Giải Quyết (Spline Line Chart) ─────
    const ctxTrend = document.getElementById('chartTrend');
    if (ctxTrend) {
      const labels = (activityChart && Array.isArray(activityChart.labels) && activityChart.labels.length)
        ? activityChart.labels
        : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

      const sosData = (activityChart && Array.isArray(activityChart.sos) && activityChart.sos.length)
        ? activityChart.sos
        : [0, 0, 0, 0, 0, 0, 0];

      const resolvedData = (activityChart && Array.isArray(activityChart.resolved) && activityChart.resolved.length)
        ? activityChart.resolved
        : [0, 0, 0, 0, 0, 0, 0];

      // Cập nhật chân biểu đồ xu hướng giải quyết từ dữ liệu thực tế (SOS & Phản ánh)
      const totalSos = Number(stats.totalSosAlerts || 0);
      const resolvedSos = Number(stats.resolvedSosAlerts || 0);
      const totalFb = Number(stats.totalFeedback || 0);
      const resolvedFb = Number(stats.resolvedFeedback || 0);
      const totalIncidents = totalSos + totalFb;
      const totalResolved = resolvedSos + resolvedFb;

      const elResolveRate = document.getElementById('feedbackResolveRate');
      if (elResolveRate) {
        if (totalIncidents > 0) {
          const rate = Math.round((totalResolved / totalIncidents) * 100);
          elResolveRate.innerHTML = `Đã giải quyết: <strong class="text-emerald-600">${totalResolved}/${totalIncidents} (${rate}%)</strong> <span class="text-slate-400 font-normal ml-1">• SOS: <strong class="text-rose-600">${resolvedSos}/${totalSos}</strong></span>`;
        } else {
          elResolveRate.innerHTML = `Tỷ lệ xử lý: <strong class="text-slate-600">Chưa có sự vụ</strong>`;
        }
      }

      const gradRed = ctxTrend.getContext('2d').createLinearGradient(0, 0, 0, 220);
      gradRed.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
      gradRed.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      const gradGreen = ctxTrend.getContext('2d').createLinearGradient(0, 0, 0, 220);
      gradGreen.addColorStop(0, 'rgba(16, 185, 129, 0.20)');
      gradGreen.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      // Cập nhật mượt mà nếu biểu đồ đã tồn tại (Realtime Không giật)
      if (this.charts.trend) {
        this.charts.trend.data.labels = labels;
        this.charts.trend.data.datasets[0].data = sosData;
        this.charts.trend.data.datasets[1].data = resolvedData;
        this.charts.trend.update('none');
      } else {
        this.charts.trend = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Cảnh báo SOS',
              data: sosData,
              borderColor: '#EF4444',
              backgroundColor: gradRed,
              fill: true,
              tension: 0.45,
              borderWidth: 2.5,
              pointRadius: 4,
              pointHoverRadius: 7,
              pointHitRadius: 25,
              pointBackgroundColor: '#EF4444'
            },
            {
              label: 'Phản ánh đã giải quyết',
              data: resolvedData,
              borderColor: '#10B981',
              backgroundColor: gradGreen,
              fill: true,
              tension: 0.45,
              borderWidth: 2.5,
              pointRadius: 4,
              pointHoverRadius: 7,
              pointHitRadius: 25,
              pointBackgroundColor: '#10B981'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          hover: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 11, family: 'Inter', weight: '600' }
              }
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              titleColor: '#FFFFFF',
              bodyColor: '#F8FAFC',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                title: (items) => {
                  const idx = items[0]?.dataIndex;
                  if (activityChart && activityChart.dates && activityChart.dates[idx]) {
                    return `${items[0].label} (${activityChart.dates[idx]})`;
                  }
                  return items[0]?.label || '';
                },
                label: (context) => {
                  const val = Number(context.raw ?? 0);
                  const unit = context.dataset.label?.includes('SOS') ? 'ca khẩn cấp' : 'vụ hoàn tất';
                  return ` ${context.dataset.label}: ${val.toLocaleString('vi-VN')} ${unit}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#F1F5F9' },
              border: { dash: [4, 4] },
              ticks: {
                stepSize: 1,
                precision: 0,
                font: { size: 10 },
                color: '#94A3B8'
              }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: '600' }, color: '#64748B' }
            }
          }
        }
      });
      }
    }
  },

  renderRecentFeedback(list) {
    const container = document.getElementById('recentFeedbackList');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
          Chưa có ý kiến phản hồi nào gần đây
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
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
        <button onclick="FeedbackModule.viewDetail(${item.id})" class="text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap px-2.5 py-1 rounded-lg hover:bg-blue-50 transition">
          Xem
        </button>
      </div>
    `).join('');
  },

  renderRecentSos(list) {
    const container = document.getElementById('recentSosList');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs">
          <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2 text-emerald-400"></i>
          Hiện tại không có cảnh báo khẩn cấp nào
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
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
        <button onclick="SosModule.viewDetail(${item.id})" class="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-sm transition">
          Xử lý
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }
};

window.DashboardModule = DashboardModule;
