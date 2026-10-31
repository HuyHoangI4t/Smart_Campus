/**
 * SOS Module - Trung tâm trực ban & xử lý cảnh báo khẩn cấp (Live SOS Emergency Center)
 * Tích hợp bản đồ định vị thời gian thực Leaflet, cảnh báo chớp đỏ, và đồng bộ tự động.
 */

const SosModule = {
  alerts: [],
  map: null,
  currentTileLayer: null,
  mapType: 'roadmap', // 'roadmap' | 'satellite'
  currentFilter: 'all', // 'all' | 'active' | 'resolved'
  markers: new Map(), // key: alertId -> L.marker
  boundaryWallLayer: null,

  async init() {
    await this.loadAlerts();
    this.initMap();
  },

  async loadAlerts() {
    try {
      const res = await AdminAPI.getSosAlerts();
      if (!res.success) throw new Error(res.message);

      this.alerts = res.alerts || [];
      this.renderTable();
      this.renderMapMarkers();
    } catch (err) {
      console.error('Lỗi tải cảnh báo SOS:', err);
      if (window.App) window.App.showToast('Không thể tải cảnh báo SOS: ' + err.message, 'error');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 1. BẢN ĐỒ SOS THỜI GIAN THỰC (LEAFLET)
  // ─────────────────────────────────────────────────────────────
  initMap() {
    const container = document.getElementById('sosCampusMap');
    if (!container || !window.L) return;

    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
        this.renderMapMarkers();
      }, 200);
      return;
    }

    if (container._leaflet_id && !this.map) container._leaflet_id = null;

    // Tọa độ trung tâm ĐH Tây Nguyên
    this.map = L.map('sosCampusMap', {
      center: [12.6509, 108.0241],
      zoom: 17,
      minZoom: 15,
      maxZoom: 20,
      zoomControl: true,
      attributionControl: false
    });

    this.setMapType(this.mapType);
    this.renderCampusBoundary();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.renderMapMarkers();
      }
    }, 250);
  },

  setMapType(type) {
    if (!this.map || !window.L) return;
    this.mapType = type;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    let tileUrl = '';
    if (type === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    } else {
      tileUrl = 'https://mt1.google.com/vt/lyrs=m&apistyle=s.t:3|p.v:off|s.t:4|p.v:off&x={x}&y={y}&z={z}';
    }

    this.currentTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(this.map);

    const btnRoadmap = document.getElementById('btnSosMapRoadmap');
    const btnSatellite = document.getElementById('btnSosMapSatellite');
    if (btnRoadmap && btnSatellite) {
      if (type === 'satellite') {
        btnSatellite.className = 'px-2 py-1 rounded-md font-bold text-[11px] bg-white text-brand-700 shadow-xs';
        btnRoadmap.className = 'px-2 py-1 rounded-md font-medium text-[11px] text-slate-600 hover:text-slate-900';
      } else {
        btnRoadmap.className = 'px-2 py-1 rounded-md font-bold text-[11px] bg-white text-brand-700 shadow-xs';
        btnSatellite.className = 'px-2 py-1 rounded-md font-medium text-[11px] text-slate-600 hover:text-slate-900';
      }
    }
  },

  renderCampusBoundary() {
    if (!this.map || !window.L) return;
    const boundary = (window.LocationsModule && LocationsModule.boundary) || null;
    if (!boundary || !boundary.length) return;

    if (this.boundaryWallLayer) {
      this.map.removeLayer(this.boundaryWallLayer);
    }

    this.boundaryWallLayer = L.polygon(boundary, {
      color: '#EF4444',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#EF4444',
      fillOpacity: 0.04
    }).addTo(this.map);
  },

  resolveCoordinates(alert) {
    if (!alert) return null;
    const lat = alert.latitude !== undefined && alert.latitude !== null ? Number(alert.latitude) : (alert.vi_do !== undefined ? Number(alert.vi_do) : (alert.lat !== undefined ? Number(alert.lat) : null));
    const lng = alert.longitude !== undefined && alert.longitude !== null ? Number(alert.longitude) : (alert.kinh_do !== undefined ? Number(alert.kinh_do) : (alert.lng !== undefined ? Number(alert.lng) : null));

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'gps' };
    }

    // Nếu không có tọa độ GPS, thử tìm vị trí theo tên địa điểm trong khuôn viên
    const locText = (alert.location || alert.location_name || alert.vi_tri || '').toLowerCase().trim();
    if (locText && window.LocationsModule && LocationsModule.locations) {
      const matched = LocationsModule.locations.find(loc => {
        const name = (loc.name || '').toLowerCase();
        const b = (loc.building || '').toLowerCase();
        return name.includes(locText) || locText.includes(name) || (b && (b.includes(locText) || locText.includes(b)));
      });
      if (matched && matched.lat && matched.lng) {
        return { lat: Number(matched.lat), lng: Number(matched.lng), source: 'location_name', locationName: matched.name };
      }
    }

    return null;
  },

  renderMapMarkers() {
    if (!this.map || !window.L) return;

    // Xóa toàn bộ marker hiện có
    for (const marker of this.markers.values()) {
      this.map.removeLayer(marker);
    }
    this.markers.clear();

    // Lọc danh sách cảnh báo theo filter hiện tại
    const filtered = this.alerts.filter(a => {
      const isResolved = a.status === 'Đã xử lý' || a.status === 'Đã giải quyết';
      if (this.currentFilter === 'active') return !isResolved;
      if (this.currentFilter === 'resolved') return isResolved;
      return true;
    });

    const activeCount = this.alerts.filter(a => a.status !== 'Đã xử lý' && a.status !== 'Đã giải quyết').length;
    const statusEl = document.getElementById('sosMapStatusCount');
    if (statusEl) {
      statusEl.textContent = `(${filtered.length} hiển thị • ${activeCount} cần hỗ trợ)`;
    }

    const bounds = [];

    filtered.forEach(alert => {
      const coords = this.resolveCoordinates(alert);
      if (!coords) return;

      const { lat, lng } = coords;
      const isResolved = alert.status === 'Đã xử lý' || alert.status === 'Đã giải quyết';
      const mssv = alert.mssv || 'N/A';
      const hoTen = alert.ho_ten || 'Sinh viên';
      const locationName = alert.location || alert.location_name || coords.locationName || 'Trong khuôn viên trường';
      const phone = alert.so_dien_thoai || alert.phone || '';
      const lop = alert.lop || '';
      const message = alert.message || alert.incident_type || 'Yêu cầu cứu trợ khẩn cấp';
      const timeStr = formatDateTime(alert.created_at);

      bounds.push([lat, lng]);

      let icon;
      if (!isResolved) {
        // Cảnh báo chưa xử lý: Marker chớp đỏ SOS khẩn cấp
        const beaconHtml = `
          <div class="sos-beacon-wrapper" title="CẢNH BÁO SOS: ${escapeHtml(hoTen)} (${escapeHtml(mssv)})">
            <div class="sos-beacon-ring"></div>
            <div class="sos-beacon-ring delayed"></div>
            <div class="sos-beacon-core">
              <svg style="width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2.5;" viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="sos-beacon-label">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#fff;animation:sosBeaconFlash 0.8s infinite;"></span>
              SOS: ${escapeHtml(mssv)}
            </div>
          </div>
        `;
        icon = L.divIcon({
          className: 'sos-custom-leaflet-marker',
          html: beaconHtml,
          iconSize: [52, 52],
          iconAnchor: [26, 26],
          popupAnchor: [0, -30]
        });
      } else {
        // Cảnh báo đã xử lý: Marker xanh lá an toàn
        const resolvedHtml = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #10B981;
            border: 2.5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(16,185,129,0.5);
          " title="Đã xử lý an toàn: ${escapeHtml(hoTen)} (${escapeHtml(mssv)})">
            <svg style="width: 16px; height: 16px; stroke: #ffffff; fill: none; stroke-width: 2.5;" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        `;
        icon = L.divIcon({
          className: 'sos-resolved-marker',
          html: resolvedHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20]
        });
      }

      const marker = L.marker([lat, lng], {
        icon,
        zIndexOffset: isResolved ? 100 : 9999
      }).addTo(this.map);

      const popupHtml = `
        <div class="p-2 text-slate-800 font-sans" style="min-width: 260px; max-width: 320px;">
          <div class="flex items-center gap-2 pb-2 mb-2 border-b ${isResolved ? 'border-emerald-100' : 'border-red-100'}">
            <span class="w-2.5 h-2.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-red-600 animate-ping'}"></span>
            <span class="font-extrabold text-xs sm:text-sm ${isResolved ? 'text-emerald-700' : 'text-red-600'}">
              ${isResolved ? '✅ ĐÃ XỬ LÝ AN TOÀN' : '🚨 CẢNH BÁO SOS KHẨN CẤP'}
            </span>
          </div>

          <div class="space-y-1.5 text-xs mb-3">
            <p class="font-bold text-sm text-slate-900">${escapeHtml(hoTen)} <span class="font-mono text-brand-700 text-xs font-semibold">(${escapeHtml(mssv)})</span></p>
            ${lop ? `<p class="text-slate-500 text-[11px]">Lớp: <b>${escapeHtml(lop)}</b></p>` : ''}

            <div class="${isResolved ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'} p-2 rounded-lg border">
              <p class="font-bold mb-0.5 flex items-center gap-1 text-[11px]">
                <svg class="w-3.5 h-3.5 inline ${isResolved ? 'text-emerald-600' : 'text-red-600'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${escapeHtml(locationName)}
              </p>
              ${message ? `<p class="italic text-[11px] ${isResolved ? 'text-emerald-700' : 'text-red-700'} mt-1">"${escapeHtml(message)}"</p>` : ''}
            </div>

            <p class="text-[10px] text-slate-400">Thời gian: <b>${escapeHtml(timeStr)}</b></p>
            <p class="text-[10px] text-slate-400">Tọa độ: <span class="font-mono font-bold text-slate-600">${lat.toFixed(6)}, ${lng.toFixed(6)}</span></p>
          </div>

          <div class="flex items-center gap-2 pt-1 border-t border-slate-100">
            ${phone ? `
              <a href="tel:${phone}" class="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 shadow-sm transition">
                <svg class="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Gọi (${phone})
              </a>
            ` : ''}

            ${!isResolved ? `
              <button onclick="SosModule.confirmResolve(${alert.id})" class="flex-1 py-1.5 px-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 shadow-sm transition">
                <svg class="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                Xử lý
              </button>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      this.markers.set(alert.id, marker);
    });

    if (bounds.length > 0 && this.currentFilter === 'active') {
      try {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      } catch (e) {}
    }
  },

  focusAlertOnMap(alertId) {
    const id = Number(alertId);
    if (window.LocationsModule && typeof LocationsModule.focusSosOnMap === 'function') {
      LocationsModule.focusSosOnMap(id);
    }

    // Đảm bảo tab SOS đang mở
    if (window.App && App.currentTab !== 'sos') {
      App.switchTab('sos');
    }

    // Cuộn mượt đến bản đồ SOS
    const mapContainer = document.getElementById('sosCampusMap');
    if (mapContainer) {
      mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      if (!this.map) this.initMap();
      if (this.map) this.map.invalidateSize();

      if (this.markers.has(id)) {
        const marker = this.markers.get(id);
        const latlng = marker.getLatLng();
        this.map.flyTo(latlng, 18, { animate: true, duration: 0.8 });
        setTimeout(() => marker.openPopup(), 900);
      } else {
        // Nếu marker chưa có do đang lọc, thử đổi sang filter 'all'
        const alert = this.alerts.find(a => Number(a.id) === id);
        if (alert) {
          this.setFilter('all');
          setTimeout(() => {
            if (this.markers.has(id)) {
              const marker = this.markers.get(id);
              this.map.flyTo(marker.getLatLng(), 18, { animate: true, duration: 0.8 });
              setTimeout(() => marker.openPopup(), 900);
            }
          }, 300);
        } else {
          window.App.showToast('Không tìm thấy dữ liệu tọa độ của cảnh báo SOS này.', 'warning');
        }
      }
    }, 200);
  },

  setFilter(filter) {
    this.currentFilter = filter;

    const btnActive = document.getElementById('sosFilterActiveBtn');
    const btnAll = document.getElementById('sosFilterAllBtn');
    const btnResolved = document.getElementById('sosFilterResolvedBtn');

    if (btnActive && btnAll && btnResolved) {
      btnActive.className = 'px-2.5 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900';
      btnAll.className = 'px-2.5 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900';
      btnResolved.className = 'px-2.5 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900';

      if (filter === 'active') {
        btnActive.className = 'px-2.5 py-1 rounded-md font-bold text-xs bg-white text-red-600 shadow-xs';
      } else if (filter === 'resolved') {
        btnResolved.className = 'px-2.5 py-1 rounded-md font-bold text-xs bg-white text-emerald-700 shadow-xs';
      } else {
        btnAll.className = 'px-2.5 py-1 rounded-md font-bold text-xs bg-white text-slate-900 shadow-xs';
      }
    }

    this.renderTable();
    this.renderMapMarkers();
  },

  resetMapView() {
    if (!this.map) return;
    this.map.flyTo([12.6509, 108.0241], 17, { animate: true, duration: 0.8 });
  },

  // ─────────────────────────────────────────────────────────────
  // 2. BẢNG DANH SÁCH CẢNH BÁO SOS
  // ─────────────────────────────────────────────────────────────
  renderTable() {
    const tbody = document.getElementById('sosTableBody');
    const countEl = document.getElementById('sosCountLabel');

    const total = this.alerts.length;
    const activeCount = this.alerts.filter(a => a.status !== 'Đã xử lý' && a.status !== 'Đã giải quyết').length;

    if (countEl) {
      countEl.textContent = `Tổng: ${total} • ${activeCount} cần cứu`;
    }
    const panelSosBadge = document.getElementById('panelSosBadge');
    if (panelSosBadge) {
      panelSosBadge.textContent = activeCount;
      if (activeCount > 0) {
        panelSosBadge.classList.remove('hidden');
      } else {
        panelSosBadge.classList.add('hidden');
      }
    }
    if (!tbody) return;

    // Lọc danh sách theo filter hiện tại
    const displayedAlerts = this.alerts.filter(a => {
      const isResolved = a.status === 'Đã xử lý' || a.status === 'Đã giải quyết';
      if (this.currentFilter === 'active') return !isResolved;
      if (this.currentFilter === 'resolved') return isResolved;
      return true;
    });

    if (displayedAlerts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            <i data-lucide="shield-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80"></i>
            <p class="text-sm font-semibold text-slate-700">Không có cảnh báo trong bộ lọc</p>
            <p class="text-xs text-slate-400 mt-0.5">${this.currentFilter === 'active' ? 'Hiện không có cảnh báo SOS nào đang cần cứu hộ' : 'Không tìm thấy dữ liệu cảnh báo'}</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = displayedAlerts.map((a, idx) => {
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
              <p class="text-xs font-semibold text-slate-800">${escapeHtml(a.location_name || a.location || a.vi_tri || 'Trong khuôn viên trường')}</p>
              <div class="flex flex-wrap items-center gap-2">
                <button onclick="SosModule.focusAlertOnMap(${a.id})" class="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition">
                  <i data-lucide="crosshair" class="w-3 h-3"></i> Xem trên bản đồ SOS
                </button>
                <button onclick="SosModule.viewOnCampusMap(${a.id})" class="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition">
                  <i data-lucide="map" class="w-3 h-3"></i> Bản đồ lớn
                </button>
                ${hasCoords ? `
                  <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank"
                    class="inline-flex items-center gap-1 text-[11px] font-bold text-brand-500 hover:text-brand-800 hover:underline">
                    <i data-lucide="external-link" class="w-3 h-3"></i>
                    (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})
                  </a>
                ` : ''}
              </div>
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

  viewOnCampusMap(id) {
    if (window.LocationsModule) {
      LocationsModule.focusSosOnMap(id);
    }
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
          if (window.LocationsModule) LocationsModule.loadActiveSosAlerts();
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
          if (window.LocationsModule) LocationsModule.loadActiveSosAlerts();
          if (window.DashboardModule) DashboardModule.loadStats();
        } catch (err) {
          window.App.showToast('Lỗi khi xóa: ' + err.message, 'error');
        }
      }
    );
  }
};

window.SosModule = SosModule;
