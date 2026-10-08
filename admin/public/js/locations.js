/**
 * Locations Module - Quản lý Bản đồ & CRUD 37 Địa điểm Trường Đại học Tây Nguyên
 */

const LocationsModule = {
  locations: [],
  filteredLocations: [],
  searchQuery: '',
  categoryFilter: 'Tất cả',
  editingLocationId: null,

  // Trạng thái chọn nhanh tọa độ trên bản đồ
  isPickingMode: false,
  pickingTargetId: null,
  pickedCoords: null,
  stagedFormData: null,

  map: null,
  mapMarkers: [],
  pickerMarker: null,
  currentTileLayer: null,
  mapType: 'roadmap', // 'roadmap' | 'satellite'

  CATEGORIES: [
    'Tất cả',
    'Hành chính',
    'Giảng đường',
    'Phòng thí nghiệm',
    'Y tế',
    'Thư viện',
    'Ký túc xá',
    'Thể thao',
    'Dịch vụ',
    'Tiện ích',
    'Học tập',
    'Phòng máy',
    'Khác'
  ],

  async init() {
    this.initCategoryDropdown();
    this.bindEvents();
    await this.loadLocations();
    this.initMap();
  },

  initCategoryDropdown() {
    const filterSelect = document.getElementById('locationCategoryFilter');
    if (filterSelect && filterSelect.options.length <= 1) {
      filterSelect.innerHTML = this.CATEGORIES.map(c => 
        `<option value="${c}">${c}</option>`
      ).join('');
    }

    const modalCategory = document.getElementById('modalLocCategory');
    if (modalCategory && modalCategory.options.length <= 1) {
      modalCategory.innerHTML = this.CATEGORIES.filter(c => c !== 'Tất cả').map(c => 
        `<option value="${c}">${c}</option>`
      ).join('');
    }
  },

  bindEvents() {
    const searchInput = document.getElementById('locationSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilter();
      });
    }

    const categoryFilter = document.getElementById('locationCategoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.applyFilter();
      });
    }

    const form = document.getElementById('locationForm');
    if (form) {
      form.onsubmit = (e) => this.handleSaveLocation(e);
    }
  },

  async loadLocations() {
    try {
      const res = await AdminAPI.getLocations();
      if (!res.success) throw new Error(res.message);

      this.locations = res.locations || [];
      this.updateTotalBadges();
      this.applyFilter();
    } catch (err) {
      console.error('Lỗi tải danh sách địa điểm:', err);
      if (window.App) window.App.showToast('Không thể tải địa điểm: ' + err.message, 'error');
    }
  },

  updateTotalBadges() {
    const badgeEl = document.getElementById('totalLocationsCount');
    if (badgeEl) badgeEl.textContent = this.locations.length;

    const dashStat = document.getElementById('statTotalLocations');
    if (dashStat) dashStat.textContent = this.locations.length;
  },

  applyFilter() {
    this.filteredLocations = this.locations.filter(loc => {
      // Category filter
      if (this.categoryFilter !== 'Tất cả' && loc.category !== this.categoryFilter) {
        return false;
      }

      // Search query
      if (this.searchQuery) {
        const text = `${loc.name || ''} ${loc.building || ''} ${loc.floor || ''} ${loc.category || ''} ${loc.description || ''}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }

      return true;
    });

    this.renderTable();
    this.renderMapMarkers();
  },

  // ─────────────────────────────────────────────────────────────
  // BẢN ĐỒ LEAFLET & MARKERS
  // ─────────────────────────────────────────────────────────────
  initMap() {
    const mapContainer = document.getElementById('adminCampusMap');
    if (!mapContainer || !window.L) return;

    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
      return;
    }

    // Tọa độ trung tâm ĐH Tây Nguyên: 12.6509, 108.0241
    this.map = L.map('adminCampusMap', {
      center: [12.6509, 108.0241],
      zoom: 17,
      minZoom: 15,
      maxZoom: 20,
      zoomControl: true,
      attributionControl: false
    });

    this.setMapType('roadmap');

    // Click bản đồ để chọn tọa độ
    this.map.on('click', (e) => {
      const lat = Number(e.latlng.lat).toFixed(8);
      const lng = Number(e.latlng.lng).toFixed(8);

      this.pickedCoords = { lat, lng };

      const latInput = document.getElementById('modalLocLat');
      const lngInput = document.getElementById('modalLocLng');

      if (latInput && lngInput) {
        latInput.value = lat;
        lngInput.value = lng;
      }

      this.updatePickerMarker([e.latlng.lat, e.latlng.lng]);

      const coordsEl = document.getElementById('pickingBannerCoords');
      if (coordsEl) {
        coordsEl.textContent = `Tọa độ: ${lat}, ${lng} (Nhấp bản đồ hoặc kéo chốt ghim đỏ)`;
      }

      if (window.App) {
        window.App.showToast(`Đã chọn tọa độ trên bản đồ: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`, 'info');
      }
    });

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
      this.renderMapMarkers();
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
      // Google Satellite nguyên bản
      tileUrl = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    } else {
      // Google Roadmap ẩn nhãn công trình POI (giữ chữ đường rõ ràng)
      tileUrl = 'https://mt1.google.com/vt/lyrs=m&apistyle=s.t:3|p.v:off|s.t:4|p.v:off&x={x}&y={y}&z={z}';
    }

    this.currentTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(this.map);

    // Cập nhật trạng thái nút chuyển đổi
    const btnRoadmap = document.getElementById('btnMapRoadmap');
    const btnSat = document.getElementById('btnMapSatellite');
    if (btnRoadmap && btnSat) {
      if (type === 'satellite') {
        btnSat.className = 'px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-800 text-white shadow-sm transition';
        btnRoadmap.className = 'px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-100 transition';
      } else {
        btnRoadmap.className = 'px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-800 text-white shadow-sm transition';
        btnSat.className = 'px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-100 transition';
      }
    }
  },

  renderMapMarkers() {
    if (!this.map || !window.L) return;

    // Xóa markers cũ
    this.mapMarkers.forEach(m => this.map.removeLayer(m));
    this.mapMarkers = [];

    const bounds = [];

    this.filteredLocations.forEach(loc => {
      const lat = parseFloat(loc.lat);
      const lng = parseFloat(loc.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);

      const pinColor = loc.color || '#3B82F6';
      const pinHtml = `
        <div style="
          background-color: ${pinColor};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            transform: rotate(45deg);
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
          ">${loc.id}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-campus-marker',
        html: pinHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

      // Popup thông tin chi tiết với các nút hành động nhanh
      const popupHtml = `
        <div class="p-1 text-slate-800 font-sans" style="min-width: 230px; max-width: 290px;">
          <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
            <span class="px-2 py-0.5 rounded text-[10px] font-black tracking-wide" style="background-color: ${pinColor}20; color: ${pinColor};">
              #${loc.id} - ${escapeHtml(loc.category || 'Địa điểm')}
            </span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 leading-snug mb-1.5">${escapeHtml(loc.name)}</h4>
          ${loc.building ? `<p class="text-xs text-slate-600 mb-1">🏢 <b>${escapeHtml(loc.building)}</b> ${loc.floor ? `(${escapeHtml(loc.floor)})` : ''}</p>` : ''}
          ${loc.description ? `<p class="text-xs text-slate-500 mb-2 leading-relaxed italic line-clamp-3">${escapeHtml(loc.description)}</p>` : ''}
          <div class="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-3 flex items-center justify-between">
            <span>📍 Tọa độ:</span>
            <b>${lat.toFixed(6)}, ${lng.toFixed(6)}</b>
          </div>
          <div class="flex items-center gap-1.5 pt-1">
            <button onclick="LocationsModule.startQuickMoveLocation(${loc.id})" title="Chọn nhanh tọa độ mới trên bản đồ" class="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition text-center whitespace-nowrap">
              🎯 Đổi vị trí
            </button>
            <button onclick="LocationsModule.openEditModal(${loc.id})" class="flex-1 py-1.5 px-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold transition text-center whitespace-nowrap">
              ✏️ Sửa
            </button>
            <button onclick="LocationsModule.confirmDelete(${loc.id}, '${escapeHtml(loc.name).replace(/'/g, "\\'")}')" class="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition text-center">
              🗑️ Xóa
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.locationId = loc.id;
      this.mapMarkers.push(marker);
    });

    if (bounds.length > 0 && this.categoryFilter !== 'Tất cả') {
      try {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      } catch (e) {
        console.warn('fitBounds error:', e);
      }
    }
  },

  updatePickerMarker(latlng) {
    if (!this.map || !window.L) return;

    if (!this.pickerMarker) {
      const pickerIcon = L.divIcon({
        className: 'picker-pin',
        html: `
          <div style="
            background-color: #EF4444;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid #ffffff;
            box-shadow: 0 0 15px rgba(239,68,68,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
          ">
            <div style="transform: rotate(45deg); color: #fff; font-size: 15px; font-weight: bold;">📍</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      this.pickerMarker = L.marker(latlng, { icon: pickerIcon, draggable: true }).addTo(this.map);
      
      const onMarkerMove = (e) => {
        const pos = e.target.getLatLng();
        const lat = pos.lat.toFixed(8);
        const lng = pos.lng.toFixed(8);
        this.pickedCoords = { lat, lng };

        const latInput = document.getElementById('modalLocLat');
        const lngInput = document.getElementById('modalLocLng');
        if (latInput && lngInput) {
          latInput.value = lat;
          lngInput.value = lng;
        }

        const coordsEl = document.getElementById('pickingBannerCoords');
        if (coordsEl) {
          coordsEl.textContent = `Tọa độ: ${lat}, ${lng} (Nhấp bản đồ hoặc kéo chốt ghim đỏ)`;
        }
      };

      this.pickerMarker.on('drag', onMarkerMove);
      this.pickerMarker.on('dragend', onMarkerMove);
    } else {
      this.pickerMarker.setLatLng(latlng);
    }
  },

  focusLocationOnMap(id) {
    const loc = this.locations.find(l => l.id === id);
    if (!loc || !this.map) return;

    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    this.map.flyTo([lat, lng], 19, { duration: 1.2 });

    const marker = this.mapMarkers.find(m => m.locationId === id);
    if (marker) {
      setTimeout(() => marker.openPopup(), 1200);
    }

    const mapCard = document.getElementById('adminCampusMapCard');
    if (mapCard) {
      mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  resetMapView() {
    if (!this.map) return;
    this.map.flyTo([12.6509, 108.0241], 17, { duration: 1 });
  },

  // ─────────────────────────────────────────────────────────────
  // DANH SÁCH BẢNG DỮ LIỆU (CRUD TABLE)
  // ─────────────────────────────────────────────────────────────
  renderTable() {
    const tbody = document.getElementById('locationsTableBody');
    const countEl = document.getElementById('locationsTableCount');
    if (!tbody) return;

    if (countEl) {
      countEl.textContent = `Hiển thị ${this.filteredLocations.length} / ${this.locations.length} địa điểm`;
    }

    if (this.filteredLocations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-400">
            <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <i data-lucide="map-pin-off" class="w-6 h-6"></i>
            </div>
            <p class="font-semibold text-sm">Không tìm thấy địa điểm nào phù hợp</p>
            <p class="text-xs text-slate-400 mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc danh mục</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = this.filteredLocations.map(loc => {
      const pinColor = loc.color || '#3B82F6';
      const lat = Number(loc.lat || 0).toFixed(6);
      const lng = Number(loc.lng || 0).toFixed(6);

      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <!-- ID -->
          <td class="p-4 font-mono text-xs font-bold text-slate-500">
            <span class="px-2 py-1 bg-slate-100 rounded-lg">#${loc.id}</span>
          </td>

          <!-- Tên địa điểm & Mô tả -->
          <td class="p-4">
            <div class="flex items-start gap-2.5">
              <div class="w-3.5 h-3.5 rounded-full mt-1 shrink-0 shadow-sm" style="background-color: ${pinColor}"></div>
              <div>
                <span class="font-bold text-slate-900 text-sm hover:text-brand-800 cursor-pointer block" onclick="LocationsModule.focusLocationOnMap(${loc.id})">
                  ${escapeHtml(loc.name)}
                </span>
                ${loc.description ? `<p class="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">${escapeHtml(loc.description)}</p>` : ''}
              </div>
            </div>
          </td>

          <!-- Tòa nhà & Tầng -->
          <td class="p-4">
            <div class="text-xs text-slate-700">
              <span class="font-semibold">${escapeHtml(loc.building || 'Chưa đặt')}</span>
              ${loc.floor ? `<span class="text-slate-400 block text-[11px]">${escapeHtml(loc.floor)}</span>` : ''}
            </div>
          </td>

          <!-- Chuyên mục -->
          <td class="p-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1"
                  style="background-color: ${pinColor}15; color: ${pinColor}; border: 1px solid ${pinColor}30;">
              ${escapeHtml(loc.category || 'Khác')}
            </span>
          </td>

          <!-- Tọa độ GPS -->
          <td class="p-4 font-mono text-xs text-slate-600 whitespace-nowrap">
            <button onclick="LocationsModule.focusLocationOnMap(${loc.id})" title="Nhấp để xem trên bản đồ"
              class="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-brand-800 rounded-lg transition inline-flex items-center gap-1">
              <i data-lucide="crosshair" class="w-3.5 h-3.5 text-blue-500"></i>
              <span>${lat}, ${lng}</span>
            </button>
          </td>

          <!-- Thao tác -->
          <td class="p-4 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="LocationsModule.startQuickMoveLocation(${loc.id})" title="Chọn nhanh tọa độ mới trên bản đồ"
                class="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                <i data-lucide="crosshair" class="w-4 h-4"></i>
              </button>
              <button onclick="LocationsModule.focusLocationOnMap(${loc.id})" title="Định vị trên bản đồ"
                class="p-2 text-slate-500 hover:text-brand-800 hover:bg-slate-100 rounded-lg transition">
                <i data-lucide="map" class="w-4 h-4"></i>
              </button>
              <button onclick="LocationsModule.openEditModal(${loc.id})" title="Chỉnh sửa thông tin & tọa độ"
                class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="LocationsModule.confirmDelete(${loc.id}, '${escapeHtml(loc.name).replace(/'/g, "\\'")}')" title="Xóa địa điểm"
                class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  // ─────────────────────────────────────────────────────────────
  // MODAL THÊM / SỬA ĐỊA ĐIỂM
  // ─────────────────────────────────────────────────────────────
  openCreateModal() {
    this.editingLocationId = null;
    this.stagedFormData = null;
    this.cancelPickingCoords();

    document.getElementById('locationModalTitle').textContent = 'Thêm Địa Điểm Khuôn Viên Mới';
    document.getElementById('locationForm').reset();

    // Tọa độ mặc định: Trung tâm trường
    document.getElementById('modalLocLat').value = '12.65090000';
    document.getElementById('modalLocLng').value = '108.02410000';
    document.getElementById('modalLocColor').value = '#3B82F6';
    document.getElementById('modalLocCategory').value = 'Giảng đường';

    this.updatePickerMarker([12.6509, 108.0241]);
    openModal('locationModal');
  },

  openEditModal(id) {
    const loc = this.locations.find(l => l.id === id);
    if (!loc) return;

    this.editingLocationId = id;
    this.stagedFormData = null;
    this.cancelPickingCoords();

    document.getElementById('locationModalTitle').textContent = `Chỉnh sửa địa điểm #${loc.id}: ${loc.name}`;

    document.getElementById('modalLocName').value = loc.name || '';
    document.getElementById('modalLocCategory').value = loc.category || 'Giảng đường';
    document.getElementById('modalLocBuilding').value = loc.building || '';
    document.getElementById('modalLocFloor').value = loc.floor || '';
    document.getElementById('modalLocDescription').value = loc.description || '';
    document.getElementById('modalLocLat').value = Number(loc.lat || 12.6509).toFixed(8);
    document.getElementById('modalLocLng').value = Number(loc.lng || 108.0241).toFixed(8);
    document.getElementById('modalLocColor').value = loc.color || '#3B82F6';

    const lat = parseFloat(loc.lat) || 12.6509;
    const lng = parseFloat(loc.lng) || 108.0241;
    this.updatePickerMarker([lat, lng]);

    openModal('locationModal');
  },

  // Khi bấm "Chọn nhanh trên bản đồ" từ Modal
  pickCoordsFromMapHelp() {
    // Thu thập dữ liệu đang có trong form để bảo toàn
    this.stagedFormData = {
      name: document.getElementById('modalLocName').value.trim(),
      category: document.getElementById('modalLocCategory').value,
      building: document.getElementById('modalLocBuilding').value.trim(),
      floor: document.getElementById('modalLocFloor').value.trim(),
      description: document.getElementById('modalLocDescription').value.trim(),
      color: document.getElementById('modalLocColor').value,
      lat: document.getElementById('modalLocLat').value.trim(),
      lng: document.getElementById('modalLocLng').value.trim(),
    };

    closeModal('locationModal');
    this.startPickingCoordinates(this.editingLocationId, this.stagedFormData);
  },

  // Bắt đầu chế độ chọn nhanh tọa độ trên bản đồ
  startPickingCoordinates(targetId, initialData = null) {
    this.isPickingMode = true;
    this.pickingTargetId = targetId;
    if (initialData) {
      this.stagedFormData = initialData;
    }

    const loc = targetId ? this.locations.find(l => l.id === targetId) : null;
    const targetName = this.stagedFormData?.name || loc?.name || (targetId ? `Địa điểm #${targetId}` : 'Địa điểm mới');

    const lat = parseFloat(this.stagedFormData?.lat || loc?.lat) || 12.6509;
    const lng = parseFloat(this.stagedFormData?.lng || loc?.lng) || 108.0241;
    this.pickedCoords = { lat: lat.toFixed(8), lng: lng.toFixed(8) };

    // Hiện thanh thông báo nổi trên bản đồ
    const banner = document.getElementById('mapPickingBanner');
    if (banner) banner.classList.remove('hidden');

    const titleEl = document.getElementById('pickingBannerTitle');
    if (titleEl) {
      titleEl.innerHTML = `<span>Đang chọn tọa độ cho: <b>${escapeHtml(targetName)}</b></span>`;
    }

    const coordsEl = document.getElementById('pickingBannerCoords');
    if (coordsEl) {
      coordsEl.textContent = `Tọa độ: ${this.pickedCoords.lat}, ${this.pickedCoords.lng} (Nhấp bản đồ hoặc kéo chốt ghim đỏ)`;
    }

    const btnSaveText = document.getElementById('btnSavePickedText');
    if (btnSaveText) {
      btnSaveText.textContent = targetId ? 'Lưu vị trí này ngay' : 'Áp dụng & Điền tiếp';
    }

    this.updatePickerMarker([lat, lng]);

    if (this.map) {
      this.map.flyTo([lat, lng], 18, { duration: 0.8 });
    }

    const mapCard = document.getElementById('adminCampusMapCard');
    if (mapCard) {
      mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (window.App) {
      window.App.showToast(`Chế độ chọn nhanh: Nhấp vào bản đồ hoặc kéo chốt ghim đỏ, sau đó nhấn "${targetId ? 'Lưu vị trí này ngay' : 'Áp dụng & Điền tiếp'}"!`, 'info');
    }

    if (window.lucide) window.lucide.createIcons();
  },

  // Di chuyển nhanh từ Popup bản đồ hoặc bảng
  startQuickMoveLocation(id) {
    const loc = this.locations.find(l => l.id === id);
    if (!loc) return;
    this.startPickingCoordinates(id, loc);
  },

  // Xác nhận lưu tọa độ vừa chọn trên bản đồ
  async confirmSavePickedCoords() {
    if (!this.pickedCoords || isNaN(parseFloat(this.pickedCoords.lat)) || isNaN(parseFloat(this.pickedCoords.lng))) {
      if (window.App) window.App.showToast('Vui lòng nhấp vào vị trí trên bản đồ trước khi lưu!', 'error');
      return;
    }

    const numLat = parseFloat(this.pickedCoords.lat);
    const numLng = parseFloat(this.pickedCoords.lng);

    // Trường hợp 1: Đang sửa địa điểm đã có sẵn (hoặc Quick Move) -> Lưu trực tiếp vào Database!
    if (this.pickingTargetId) {
      const loc = this.locations.find(l => l.id === this.pickingTargetId);
      const btn = document.getElementById('btnSavePickedCoords');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="inline-block animate-spin mr-1">⟳</span> Đang lưu...';
      }

      const payload = {
        name: this.stagedFormData?.name || loc?.name || '',
        category: this.stagedFormData?.category || loc?.category || 'Giảng đường',
        building: this.stagedFormData?.building || loc?.building || '',
        floor: this.stagedFormData?.floor || loc?.floor || '',
        description: this.stagedFormData?.description || loc?.description || '',
        color: this.stagedFormData?.color || loc?.color || '#3B82F6',
        icon: loc?.icon || 'map-pin',
        lat: numLat,
        lng: numLng
      };

      try {
        await AdminAPI.updateLocation(this.pickingTargetId, payload);
        if (window.App) {
          window.App.showToast(`Đã lưu vị trí mới thành công cho "${payload.name}"!`, 'success');
        }

        const savedId = this.pickingTargetId;
        this.cancelPickingCoords();
        await this.loadLocations();
        this.focusLocationOnMap(savedId);
      } catch (err) {
        if (window.App) window.App.showToast('Lỗi lưu vị trí: ' + err.message, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> <span id="btnSavePickedText">Lưu vị trí này ngay</span>';
          if (window.lucide) window.lucide.createIcons();
        }
      }
      return;
    }

    // Trường hợp 2: Đang thêm địa điểm mới -> Áp dụng tọa độ vào Form và mở lại Form để điền tiếp
    document.getElementById('modalLocLat').value = Number(numLat).toFixed(8);
    document.getElementById('modalLocLng').value = Number(numLng).toFixed(8);

    if (this.stagedFormData) {
      if (this.stagedFormData.name) document.getElementById('modalLocName').value = this.stagedFormData.name;
      if (this.stagedFormData.category) document.getElementById('modalLocCategory').value = this.stagedFormData.category;
      if (this.stagedFormData.building) document.getElementById('modalLocBuilding').value = this.stagedFormData.building;
      if (this.stagedFormData.floor) document.getElementById('modalLocFloor').value = this.stagedFormData.floor;
      if (this.stagedFormData.description) document.getElementById('modalLocDescription').value = this.stagedFormData.description;
      if (this.stagedFormData.color) document.getElementById('modalLocColor').value = this.stagedFormData.color;
    }

    this.cancelPickingCoords();
    openModal('locationModal');

    if (window.App) {
      window.App.showToast(`Đã lấy tọa độ: ${numLat.toFixed(6)}, ${numLng.toFixed(6)}. Nhấn "Lưu địa điểm" để hoàn tất!`, 'success');
    }
  },

  // Hủy chế độ chọn tọa độ
  cancelPickingCoords() {
    this.isPickingMode = false;
    this.pickingTargetId = null;
    this.pickedCoords = null;
    this.stagedFormData = null;

    const banner = document.getElementById('mapPickingBanner');
    if (banner) banner.classList.add('hidden');

    if (this.pickerMarker && this.map) {
      this.map.removeLayer(this.pickerMarker);
      this.pickerMarker = null;
    }
  },

  async handleSaveLocation(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveLocationBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Đang lưu...';

    const payload = {
      name: document.getElementById('modalLocName').value.trim(),
      category: document.getElementById('modalLocCategory').value,
      building: document.getElementById('modalLocBuilding').value.trim(),
      floor: document.getElementById('modalLocFloor').value.trim(),
      description: document.getElementById('modalLocDescription').value.trim(),
      lat: parseFloat(document.getElementById('modalLocLat').value),
      lng: parseFloat(document.getElementById('modalLocLng').value),
      color: document.getElementById('modalLocColor').value,
      icon: 'map-pin'
    };

    try {
      if (!payload.name) throw new Error('Vui lòng nhập tên địa điểm');
      if (isNaN(payload.lat) || isNaN(payload.lng)) throw new Error('Tọa độ vĩ độ và kinh độ phải là số hợp lệ');

      if (this.editingLocationId) {
        await AdminAPI.updateLocation(this.editingLocationId, payload);
        if (window.App) window.App.showToast('Cập nhật địa điểm thành công!', 'success');
      } else {
        await AdminAPI.createLocation(payload);
        if (window.App) window.App.showToast('Thêm địa điểm mới thành công!', 'success');
      }

      closeModal('locationModal');
      await this.loadLocations();
    } catch (err) {
      if (window.App) window.App.showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> <span>Lưu địa điểm</span>';
      if (window.lucide) window.lucide.createIcons();
    }
  },

  confirmDelete(id, name) {
    if (!window.App) return;
    window.App.showConfirm(
      'Xóa địa điểm',
      `Bạn có chắc chắn muốn xóa địa điểm "${name}" khỏi bản đồ trường?`,
      async () => {
        try {
          await AdminAPI.deleteLocation(id);
          window.App.showToast('Đã xóa địa điểm thành công', 'info');
          await this.loadLocations();
        } catch (err) {
          window.App.showToast('Lỗi khi xóa địa điểm: ' + err.message, 'error');
        }
      }
    );
  },

  // ─────────────────────────────────────────────────────────────
  // KHÔI PHỤC 37 ĐỊA ĐIỂM GỐC CỦA ĐẠI HỌC TÂY NGUYÊN
  // ─────────────────────────────────────────────────────────────
  confirmResetDefaults() {
    if (!window.App) return;
    window.App.showConfirm(
      'Khôi phục 37 địa điểm mặc định',
      'Hành động này sẽ thiết lập lại bản đồ về đúng 37 địa điểm mặc định của Trường ĐH Tây Nguyên (Khu Hiệu Bộ, Nhà 2, Nhà 5, Thư viện, Ký túc xá...). Bạn có chắc chắn muốn thực hiện?',
      async () => {
        try {
          const res = await AdminAPI.resetLocations();
          window.App.showToast(res.message || 'Khôi phục 37 địa điểm thành công!', 'success');
          await this.loadLocations();
          this.resetMapView();
        } catch (err) {
          window.App.showToast('Lỗi khôi phục: ' + err.message, 'error');
        }
      }
    );
  }
};

window.LocationsModule = LocationsModule;
