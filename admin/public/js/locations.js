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

  // Trạng thái tự vẽ mạng lưới đường đi (hỗ trợ nhiều nhánh / multi-branch & auto-snap)
  paths: [],
  editingPathId: null,
  isDrawingPathMode: false,
  drawingBranches: [[]], // Danh sách các nhánh: [ [p1, p2, ...], [p3, p4, ...] ]
  currentBranchIndex: 0,
  drawingBranchPolylines: [], // Polylines tương ứng cho từng nhánh
  drawingMarkers: [], // Toàn bộ markers mốc
  pathLayers: [],
  showPathsOnMap: false,
  boundaryWallLayers: [],
  gateLayers: [],
  gates: [
    {
      id: 'front_gate',
      name: 'Cổng trước (Lê Duẩn)',
      gatePoint: [12.651536, 108.023856],
      insidePoint: [12.65144, 108.02395],
      outsidePoint: [12.65154752, 108.02385583]
    },
    {
      id: 'back_gate',
      name: 'Cổng sau (Y Wang)',
      gatePoint: [12.64837195, 108.02804429],
      insidePoint: [12.64850, 108.02798],
      outsidePoint: [12.64837195, 108.02804429]
    }
  ],
  boundary: [
  [
    12.64936184489708,
    108.023709984411
  ],
  [
    12.64939692098337,
    108.0238593195032
  ],
  [
    12.64922366673725,
    108.0240207114143
  ],
  [
    12.64914996044008,
    108.0240744632604
  ],
  [
    12.64910731131839,
    108.024143411979
  ],
  [
    12.64905641908621,
    108.0243138201567
  ],
  [
    12.64897030232368,
    108.024311073955
  ],
  [
    12.64846679989001,
    108.0241911062746
  ],
  [
    12.64835017475937,
    108.0247583489782
  ],
  [
    12.64825912642829,
    108.0252039642648
  ],
  [
    12.64879024169141,
    108.0253483229021
  ],
  [
    12.6487228183857,
    108.0255963896767
  ],
  [
    12.64881339164961,
    108.025958958011
  ],
  [
    12.6480975797379,
    108.026419767791
  ],
  [
    12.64746230619225,
    108.0270818650112
  ],
  [
    12.64783491871413,
    108.0274820029304
  ],
  [
    12.64817683713212,
    108.0278523418964
  ],
  [
    12.64834014924507,
    108.0280072175512
  ],
  [
    12.64837815224221,
    108.0280034990301
  ],
  [
    12.64843362651117,
    108.0280736004634
  ],
  [
    12.648424127415,
    108.0281079564623
  ],
  [
    12.64851185632938,
    108.0282133043701
  ],
  [
    12.64887356697684,
    108.0285996439882
  ],
  [
    12.64924557138193,
    108.0290044662777
  ],
  [
    12.64940948705378,
    108.0291786420854
  ],
  [
    12.64957989265152,
    108.0293607651568
  ],
  [
    12.6497233278739,
    108.0295277768443
  ],
  [
    12.64979058097085,
    108.0295986717908
  ],
  [
    12.6498738024417,
    108.0296363735788
  ],
  [
    12.65004690533162,
    108.029681693164
  ],
  [
    12.65012590824586,
    108.0296826255635
  ],
  [
    12.6502227605403,
    108.029608578842
  ],
  [
    12.65037273737863,
    108.0294754334155
  ],
  [
    12.65068472907029,
    108.0291690340094
  ],
  [
    12.65130925932491,
    108.0285346899524
  ],
  [
    12.65253281247356,
    108.0273262157134
  ],
  [
    12.65326595038413,
    108.0266371644356
  ],
  [
    12.65351972219521,
    108.0263648962711
  ],
  [
    12.6536705590384,
    108.026217818969
  ],
  [
    12.65381199629214,
    108.0260589411716
  ],
  [
    12.65367438187265,
    108.025658267053
  ],
  [
    12.65316607382772,
    108.0252839823841
  ],
  [
    12.65288132324158,
    108.0250658838366
  ],
  [
    12.65241666236353,
    108.024653847315
  ],
  [
    12.65209761057217,
    108.024331765829
  ],
  [
    12.65178083015148,
    108.0239849309481
  ],
  [
    12.65163902006585,
    108.023884193641
  ],
  [
    12.65155443502066,
    108.0238907083279
  ],
  [
    12.65150095363651,
    108.0238432594696
  ],
  [
    12.65152219056682,
    108.0237942110838
  ],
  [
    12.65095951369571,
    108.023257667042
  ],
  [
    12.65066664206127,
    108.0229636143608
  ],
  [
    12.6504510945065,
    108.0227472291479
  ],
  [
    12.65042001012422,
    108.0227337420068
  ],
  [
    12.65038955548521,
    108.0227619676594
  ],
  [
    12.65010276714285,
    108.0230426974618
  ],
  [
    12.64980850157077,
    108.0233338952721
  ],
  [
    12.64951862228554,
    108.0236355295628
  ],
  [
    12.64936184489708,
    108.023709984411
  ]
],

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
    await this.loadCampusPaths();
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

    // Click bản đồ: Chọn tọa độ hoặc Vẽ mốc đường đi
    this.map.on('click', (e) => {
      // 1. Đang ở chế độ Vẽ đường đi nội bộ
      if (this.isDrawingPathMode) {
        this.handleDrawPathMapClick(e);
        return;
      }

      // 2. Chế độ chọn tọa độ địa điểm thông thường
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
      this.renderCampusBoundaryWall();
      this.renderMapMarkers();
      this.renderCampusPaths();
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

  renderCampusBoundaryWall() {
    if (!this.map || !window.L || !this.boundary || !this.boundary.length) return;

    this.boundaryWallLayers.forEach(l => this.map.removeLayer(l));
    this.boundaryWallLayers = [];
    this.gateLayers.forEach(l => this.map.removeLayer(l));
    this.gateLayers = [];

    const closedBoundary = this.boundary.concat([this.boundary[0]]);

    // 1. Chân tường nền kiên cố (Ô viền làm tường bao quanh khuôn viên)
    const baseWall = L.polyline(closedBoundary, {
      color: '#0F172A',
      weight: 6.5,
      opacity: 0.95
    }).addTo(this.map);
    baseWall.bindTooltip('Tường rào ranh giới khuôn viên trường ĐH Tây Nguyên (Không cho đi xuyên qua)', {
      sticky: true
    });
    this.boundaryWallLayers.push(baseWall);

    // 2. Hoa văn gạch/đá thân tường ranh giới
    const innerWall = L.polyline(closedBoundary, {
      color: '#475569',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '8, 12'
    }).addTo(this.map);
    this.boundaryWallLayers.push(innerWall);

    // 3. Render 2 Cổng trường & 2 Điểm đón bên ngoài
    this.gates.forEach(g => {
      // Marker Cổng trường (tại vị trí cổng trên tường bao)
      const gateIcon = L.divIcon({
        className: 'custom-campus-marker',
        html: `
          <div style="
            background: #0F172A;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 12px;
            border: 2px solid ${g.id === 'back_gate' ? '#3B82F6' : '#10B981'};
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            transform: translate(-50%, -50%);
          ">
            <svg style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2.2;display:inline-block;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M9 15h.01"/></svg><span>${escapeHtml(g.name)}</span>
          </div>
        `,
        iconSize: [0, 0]
      });

      const gateMarker = L.marker(g.gatePoint, { icon: gateIcon, zIndexOffset: 850 }).addTo(this.map);
      gateMarker.bindPopup(`
        <div class="p-1 font-sans text-slate-800 text-xs">
          <div class="font-bold text-sm mb-1 text-slate-900 flex items-center gap-1.5"><svg class="w-4 h-4 text-emerald-600 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M9 15h.01"/></svg><span>${escapeHtml(g.name)}</span></div>
          <p class="text-slate-600 mb-2">Cổng kiểm soát ra/vào trường chính thức. Lối đi chỉ được phép vượt qua ranh giới khuôn viên tại đây.</p>
          <div class="bg-emerald-50 text-emerald-800 p-1.5 rounded text-[11px] font-semibold border border-emerald-100">
            <span class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5 text-emerald-600 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Kết nối thông suốt với điểm đón ngoài đường phố</span>
          </div>
        </div>
      `);
      this.gateLayers.push(gateMarker);

      // Marker Điểm đón ngoài đường phố (Lê Duẩn / Y Wang)
      const outIcon = L.divIcon({
        className: 'custom-campus-marker',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #2563EB;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <div style="width: 7px; height: 7px; border-radius: 50%; background: #FFFFFF;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const outMarker = L.marker(g.outsidePoint, { icon: outIcon, zIndexOffset: 860 }).addTo(this.map);
      outMarker.bindTooltip(`Điểm đón ngoài: ${escapeHtml(g.name)} (Kết nối Google Maps)`, {
        permanent: false,
        direction: 'top'
      });
      outMarker.bindPopup(`
        <div class="p-1 font-sans text-slate-800 text-xs">
          <div class="font-bold text-sm mb-1 text-blue-900 flex items-center gap-1.5"><svg class="w-4 h-4 text-blue-600 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Điểm đón ngoài: ${escapeHtml(g.name)}</span></div>
          <p class="text-slate-600 mb-1">Tọa độ trên mặt đường công cộng kết nối trực tiếp với mạng lưới giao thông Google Maps.</p>
          <div class="text-[11px] font-mono text-slate-500 bg-slate-50 p-1 rounded border">
            ${g.outsidePoint[0].toFixed(6)}, ${g.outsidePoint[1].toFixed(6)}
          </div>
        </div>
      `);
      this.gateLayers.push(outMarker);

      // Đường thông hành qua cổng (nối ngoài -> cổng -> trong)
      const connector = L.polyline([g.outsidePoint, g.gatePoint, g.insidePoint], {
        color: '#10B981',
        weight: 3.5,
        dashArray: '3, 5',
        opacity: 0.95
      }).addTo(this.map);
      this.gateLayers.push(connector);
    });
  },

  segmentsIntersect(p1, p2, p3, p4) {
    function ccw(a, b, c) {
      return (c[0] - a[0]) * (b[1] - a[1]) > (c[1] - a[1]) * (b[0] - a[0]);
    }
    return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
  },

  checkCrossesWall(p1, p2) {
    if (!this.boundary || this.boundary.length < 3) return false;
    for (let i = 0, j = this.boundary.length - 1; i < this.boundary.length; j = i++) {
      const q1 = this.boundary[j];
      const q2 = this.boundary[i];
      if (this.segmentsIntersect(p1, p2, q1, q2)) {
        const isNearGate = this.gates.some(g => {
          const d1 = L.latLng(p1).distanceTo(L.latLng(g.gatePoint));
          const d2 = L.latLng(p2).distanceTo(L.latLng(g.gatePoint));
          return d1 <= 30 || d2 <= 30;
        });
        if (!isNearGate) return true;
      }
    }
    return false;
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
          ${loc.building ? `<p class="text-xs text-slate-600 mb-1 flex items-center gap-1"><svg class="w-3.5 h-3.5 text-slate-400 inline flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg><span><b>${escapeHtml(loc.building)}</b> ${loc.floor ? `(${escapeHtml(loc.floor)})` : ''}</span></p>` : ''}
          ${loc.description ? `<p class="text-xs text-slate-500 mb-2 leading-relaxed italic line-clamp-3">${escapeHtml(loc.description)}</p>` : ''}
          <div class="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-3 flex items-center justify-between">
            <span class="flex items-center gap-1"><svg class="w-3 h-3 text-slate-400 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Tọa độ:</span>
            <b>${lat.toFixed(6)}, ${lng.toFixed(6)}</b>
          </div>
          <div class="flex items-center gap-1.5 pt-1">
            <button onclick="LocationsModule.startQuickMoveLocation(${loc.id})" title="Chọn nhanh tọa độ mới trên bản đồ" class="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition text-center whitespace-nowrap">
              <svg class="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>Đổi vị trí
            </button>
            <button onclick="LocationsModule.openEditModal(${loc.id})" class="flex-1 py-1.5 px-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold transition text-center whitespace-nowrap">
              <svg class="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Sửa
            </button>
            <button onclick="LocationsModule.confirmDelete(${loc.id}, '${escapeHtml(loc.name).replace(/'/g, "\\'")}')" class="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition text-center">
              <svg class="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Xóa
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
            <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" style="width: 15px; height: 15px; stroke: #ffffff; fill: #ffffff;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#EF4444"/></svg></div>
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
  // TÍNH NĂNG TỰ VẼ ĐƯỜNG ĐI NỘI BỘ TRƯỜNG (CAMPUS PATHS)
  // ─────────────────────────────────────────────────────────────

  // Trợ giúp trích xuất danh sách các nhánh từ dữ liệu coordinates
  getPathBranches(rawCoords) {
    if (!rawCoords) return [];
    let coords = rawCoords;
    if (typeof coords === 'string') {
      try { coords = JSON.parse(coords); } catch (e) { return []; }
    }
    if (!Array.isArray(coords) || coords.length === 0) return [];
    // Dạng 1 nhánh đơn: [ [lat, lng], [lat, lng], ... ]
    if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
      return [coords];
    }
    // Dạng nhiều nhánh (Multi-branch): [ [ [lat, lng], ... ], ... ]
    if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      return coords.filter(b => Array.isArray(b) && b.length >= 2);
    }
    return [];
  },

  calculateBranchDistance(coords) {
    if (!coords || coords.length < 2 || !window.L) return 0;
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = L.latLng(coords[i][0], coords[i][1]);
      const p2 = L.latLng(coords[i + 1][0], coords[i + 1][1]);
      total += p1.distanceTo(p2);
    }
    return Math.round(total);
  },

  calculatePathDistance(rawCoords) {
    const branches = this.getPathBranches(rawCoords);
    if (!branches.length) return 0;
    let total = 0;
    branches.forEach(b => {
      total += this.calculateBranchDistance(b);
    });
    return Math.round(total);
  },

  // Cơ chế Tự Động Bắt Điểm (Auto-Snap) vào các mốc / giao lộ đã có trong bán kính 14 mét
  findSnapCoordinate(latlng, maxDistanceMeters = 14) {
    if (!this.map || !window.L) return null;
    const clickLatLng = L.latLng(latlng);
    let bestPoint = null;
    let minDistance = maxDistanceMeters;

    // 1. Tìm trong các nhánh đang vẽ dở
    this.drawingBranches.forEach(branch => {
      branch.forEach(pt => {
        const d = clickLatLng.distanceTo(L.latLng(pt[0], pt[1]));
        if (d < minDistance) {
          minDistance = d;
          bestPoint = [pt[0], pt[1]];
        }
      });
    });

    // 2. Tìm trong các tuyến đường đã lưu trước đó
    this.paths.forEach(p => {
      const branches = this.getPathBranches(p.coordinates);
      branches.forEach(branch => {
        branch.forEach(pt => {
          const d = clickLatLng.distanceTo(L.latLng(pt[0], pt[1]));
          if (d < minDistance) {
            minDistance = d;
            bestPoint = [pt[0], pt[1]];
          }
        });
      });
    });

    // 3. Tìm trong 2 Cổng trường và 2 Điểm đón bên ngoài
    this.gates.forEach(g => {
      [g.gatePoint, g.insidePoint, g.outsidePoint].forEach(pt => {
        const d = clickLatLng.distanceTo(L.latLng(pt[0], pt[1]));
        if (d < minDistance) {
          minDistance = d;
          bestPoint = [pt[0], pt[1]];
        }
      });
    });

    return bestPoint;
  },

  async loadCampusPaths() {
    try {
      const res = await AdminAPI.getPaths();
      if (res && res.success) {
        this.paths = res.paths || [];
        this.updatePathsCountBadge();
        this.renderCampusPaths();
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách lối đi nội bộ:', err);
    }
  },

  updatePathsCountBadge() {
    const badge = document.getElementById('campusPathsCountBadge');
    if (badge) badge.textContent = this.paths.length;
  },

  renderCampusPaths() {
    if (!this.map || !window.L) return;

    // Xóa các layers lối đi cũ
    this.pathLayers.forEach(l => this.map.removeLayer(l));
    this.pathLayers = [];

    // Mặc định ẩn lối đi thiết kế (chỉ hiển thị khi bật hoặc khi đang tự vẽ đường)
    if (!this.showPathsOnMap && !this.isDrawingPathMode) {
      return;
    }

    this.paths.forEach(p => {
      const branches = this.getPathBranches(p.coordinates);
      if (!branches.length) return;

      let color = '#10B981';
      let weight = 4;
      let dashArray = '6, 8';
      let opacity = 0.95;

      if (p.path_type === 'main_road') {
        color = '#3B82F6';
        weight = 5;
        dashArray = null;
        opacity = 0.9;
      } else if (p.path_type === 'secondary_road') {
        color = '#8B5CF6';
        weight = 4;
        dashArray = null;
        opacity = 0.85;
      }

      const dist = this.calculatePathDistance(p.coordinates);
      const totalPoints = branches.reduce((acc, b) => acc + b.length, 0);
      const typeText = p.path_type === 'walkway' ? 'Lối đi bộ' : (p.path_type === 'main_road' ? 'Trục chính' : 'Đường nội bộ');

      const popupHtml = `
        <div class="p-1 font-sans text-slate-800" style="min-width: 200px;">
          <div class="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background-color: ${color}20; color: ${color};">
              ${typeText}
            </span>
            <span class="text-[11px] font-semibold text-slate-400">#${p.id}</span>
          </div>
          <h5 class="text-xs font-bold text-slate-900 mb-1">${escapeHtml(p.name)}</h5>
          <div class="text-[11px] text-slate-500 mb-2">
            ${branches.length > 1 ? `<b>${branches.length}</b> nhánh • ` : ''}<b>${totalPoints}</b> mốc • Dài: <b class="text-emerald-700">${dist}m</b>
          </div>
          <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <button onclick="LocationsModule.editPathOnMap(${p.id})"
              class="text-xs text-brand-800 hover:text-brand-900 font-bold hover:underline flex items-center gap-1">
              <svg class="w-3.5 h-3.5 inline mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Sửa tuyến này
            </button>
            <button onclick="LocationsModule.confirmDeletePath(${p.id}, '${escapeHtml(p.name).replace(/'/g, "\\'")}')"
              class="text-xs text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-1">
              <svg class="w-3.5 h-3.5 inline mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Xóa
            </button>
          </div>
        </div>
      `;

      branches.forEach(branch => {
        const polyline = L.polyline(branch, {
          color,
          weight,
          dashArray,
          opacity
        }).addTo(this.map);

        polyline.pathId = p.id;
        polyline.bindPopup(popupHtml);
        this.pathLayers.push(polyline);
      });
    });
  },

  toggleShowPaths() {
    this.showPathsOnMap = !this.showPathsOnMap;
    this.renderCampusPaths();
    this.updateShowPathsButton();
    if (window.App) {
      window.App.showToast(this.showPathsOnMap ? 'Đã hiển thị các lối đi thiết kế trên bản đồ' : 'Đã ẩn các lối đi thiết kế khỏi bản đồ', 'info');
    }
  },

  updateShowPathsButton() {
    const btn = document.getElementById('btnToggleShowPaths');
    const label = document.getElementById('labelToggleShowPaths');
    const icon = document.getElementById('iconToggleShowPaths');
    if (!btn || !label) return;

    if (this.showPathsOnMap) {
      label.textContent = 'Ẩn lối đi';
      btn.className = 'px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-emerald-200';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      label.textContent = 'Hiện lối đi';
      btn.className = 'px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) window.lucide.createIcons();
  },

  // Bật / tắt chế độ vẽ đường
  toggleDrawPathMode() {
    if (this.isDrawingPathMode) {
      this.cancelDrawPathMode();
      return;
    }

    if (this.isPickingMode) {
      this.cancelPickingCoords();
    }

    this.isDrawingPathMode = true;
    this.drawingBranches = [[]];
    this.currentBranchIndex = 0;
    this.drawingBranchPolylines = [];
    this.drawingMarkers = [];

    const banner = document.getElementById('pathDrawingBanner');
    if (banner) banner.classList.remove('hidden');

    const btn = document.getElementById('btnToggleDrawPath');
    if (btn) btn.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-700');

    if (this.map) {
      this.map.getContainer().style.cursor = 'crosshair';
    }

    this.renderCampusPaths();
    this.updateDrawingStats();

    if (window.App) {
      window.App.showToast('Đã kích hoạt chế độ tự vẽ! Bạn có thể vẽ nhánh chính, bấm [+ Nhánh mới] để rẽ thêm nhiều nhánh khác.', 'info');
    }
  },

  // Nhấp chuột vào bản đồ khi đang vẽ (Tự động bắt điểm vào giao lộ nếu nhấp gần)
  handleDrawPathMapClick(e) {
    if (!this.map || !window.L) return;

    let lat = Number(e.latlng.lat);
    let lng = Number(e.latlng.lng);
    let isSnapped = false;

    // Kiểm tra bắt điểm tự động vào mốc đã có (giao lộ / ngã rẽ)
    const snapped = this.findSnapCoordinate(e.latlng, 14);
    if (snapped) {
      lat = snapped[0];
      lng = snapped[1];
      isSnapped = true;
    } else {
      lat = Number(lat.toFixed(7));
      lng = Number(lng.toFixed(7));
    }

    const pt = [lat, lng];

    if (!this.drawingBranches[this.currentBranchIndex]) {
      this.drawingBranches[this.currentBranchIndex] = [];
    }
    const currentBranch = this.drawingBranches[this.currentBranchIndex];

    // Tránh bấm trùng điểm cuối cùng của nhánh hiện tại
    if (currentBranch.length > 0) {
      const last = currentBranch[currentBranch.length - 1];
      if (Math.abs(last[0] - pt[0]) < 0.000005 && Math.abs(last[1] - pt[1]) < 0.000005) {
        return;
      }
    }

    // Kiểm tra cảnh báo nếu đoạn đường vừa nối cắt xuyên qua tường rào ranh giới (trừ vị trí cổng)
    if (currentBranch.length > 0) {
      const lastPt = currentBranch[currentBranch.length - 1];
      if (this.checkCrossesWall(lastPt, pt)) {
        if (window.App) {
          window.App.showToast('Nhắc nhở: Ranh giới trường là tường bao kiên cố không thể đi xuyên qua! Lối đi chỉ được kết nối ra ngoài qua Cổng trước (Lê Duẩn) hoặc Cổng sau (Y Wang).', 'warning');
        }
      }
    }

    currentBranch.push(pt);

    // Vẽ marker điểm mốc
    const marker = L.circleMarker(pt, {
      radius: isSnapped ? 7.5 : 6,
      fillColor: isSnapped ? '#F59E0B' : '#10B981',
      color: '#ffffff',
      weight: isSnapped ? 2.5 : 2,
      fillOpacity: 1
    }).addTo(this.map);

    if (isSnapped) {
      marker.bindTooltip('Điểm giao lộ (Đã bắt điểm)', { permanent: false, direction: 'top' });
      if (window.App) {
        window.App.showToast(`Đã hít vào điểm giao lộ (${this.currentBranchIndex > 0 ? 'rẽ nhánh' : 'kết nối'})!`, 'info');
      }
    }

    marker.branchIndex = this.currentBranchIndex;
    this.drawingMarkers.push(marker);

    // Bảng màu cho từng nhánh để phân biệt trực quan
    const branchColors = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'];
    const branchColor = branchColors[this.currentBranchIndex % branchColors.length];

    // Vẽ polyline nối các mốc của nhánh hiện tại
    let poly = this.drawingBranchPolylines[this.currentBranchIndex];
    if (!poly) {
      poly = L.polyline(currentBranch, {
        color: branchColor,
        weight: 5,
        dashArray: '6, 8',
        opacity: 0.95
      }).addTo(this.map);
      this.drawingBranchPolylines[this.currentBranchIndex] = poly;
    } else {
      poly.setLatLngs(currentBranch);
    }

    this.updateDrawingStats();
  },

  // Ngắt nhánh hiện tại và bắt đầu vẽ một nhánh rẽ mới
  startNewBranch() {
    const curBranch = this.drawingBranches[this.currentBranchIndex];
    if (!curBranch || curBranch.length < 2) {
      if (window.App) {
        window.App.showToast('Nhánh hiện tại cần có ít nhất 2 điểm trước khi tạo nhánh mới!', 'warning');
      }
      return;
    }

    this.currentBranchIndex++;
    this.drawingBranches[this.currentBranchIndex] = [];

    this.updateDrawingStats();

    if (window.App) {
      window.App.showToast(`Đã chốt Nhánh ${this.currentBranchIndex}! Hãy nhấp để vẽ Nhánh ${this.currentBranchIndex + 1} (bạn có thể nhấp vào mốc cũ trên bản đồ để rẽ nhánh từ đó).`, 'info');
    }
  },

  updateDrawingStats() {
    let totalPoints = 0;
    let totalDist = 0;

    this.drawingBranches.forEach(b => {
      totalPoints += (b || []).length;
      totalDist += this.calculateBranchDistance(b);
    });

    const curPoints = (this.drawingBranches[this.currentBranchIndex] || []).length;

    const branchLabelEl = document.getElementById('pathDrawingBranchLabel');
    const branchPtsEl = document.getElementById('pathDrawingBranchPoints');
    const totalBranchesEl = document.getElementById('pathDrawingBranchCount');
    const pointCountEl = document.getElementById('pathDrawingPointCount');
    const distEl = document.getElementById('pathDrawingDistance');

    if (branchLabelEl) branchLabelEl.textContent = `Nhánh ${this.currentBranchIndex + 1}`;
    if (branchPtsEl) branchPtsEl.textContent = curPoints;
    if (totalBranchesEl) totalBranchesEl.textContent = Math.max(1, this.drawingBranches.length);
    if (pointCountEl) pointCountEl.textContent = totalPoints;
    if (distEl) distEl.textContent = `${totalDist}m`;
  },

  // Lùi lại 1 điểm mốc vừa chấm (hỗ trợ lùi xuyên qua các nhánh)
  undoLastPathPoint() {
    let curBranch = this.drawingBranches[this.currentBranchIndex];

    if (curBranch && curBranch.length > 0) {
      curBranch.pop();
      const lastMarker = this.drawingMarkers.pop();
      if (lastMarker && this.map) {
        this.map.removeLayer(lastMarker);
      }

      const poly = this.drawingBranchPolylines[this.currentBranchIndex];
      if (poly) {
        if (curBranch.length > 0) {
          poly.setLatLngs(curBranch);
        } else {
          this.map.removeLayer(poly);
          this.drawingBranchPolylines[this.currentBranchIndex] = null;
        }
      }
    } else if (this.currentBranchIndex > 0) {
      // Nhánh hiện tại rỗng -> Quay lại nhánh trước và xóa nhánh rỗng này
      this.drawingBranches.pop();
      this.currentBranchIndex--;
      this.undoLastPathPoint();
      return;
    }

    this.updateDrawingStats();
  },

  // Sửa tuyến đường trực tiếp trên bản đồ (tải các nhánh vào công cụ vẽ để chỉnh sửa và vẽ tiếp)
  editPathOnMap(pathId) {
    const p = this.paths.find(item => item.id === pathId);
    if (!p) return;

    closeModal('managePathsModal');

    this.isDrawingPathMode = true;
    this.editingPathId = p.id;
    this.showPathsOnMap = true;

    // Xóa các mốc vẽ dở cũ
    this.drawingBranchPolylines.forEach(poly => {
      if (poly && this.map) this.map.removeLayer(poly);
    });
    this.drawingBranchPolylines = [];
    this.drawingMarkers.forEach(m => {
      if (m && this.map) this.map.removeLayer(m);
    });
    this.drawingMarkers = [];

    // Tải các nhánh của tuyến này
    const branches = this.getPathBranches(p.coordinates);
    this.drawingBranches = branches.length > 0 ? branches.map(b => b.map(pt => [pt[0], pt[1]])) : [[]];
    this.currentBranchIndex = Math.max(0, this.drawingBranches.length - 1);

    const banner = document.getElementById('pathDrawingBanner');
    if (banner) banner.classList.remove('hidden');

    const btn = document.getElementById('btnToggleDrawPath');
    if (btn) btn.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-700');

    if (this.map) {
      this.map.getContainer().style.cursor = 'crosshair';
    }

    const branchColors = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'];
    const allBounds = [];

    this.drawingBranches.forEach((branch, bIdx) => {
      const color = branchColors[bIdx % branchColors.length];
      branch.forEach(pt => {
        allBounds.push(pt);
        const marker = L.circleMarker(pt, {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1
        }).addTo(this.map);
        marker.branchIndex = bIdx;
        this.drawingMarkers.push(marker);
      });

      if (branch.length > 0) {
        const poly = L.polyline(branch, {
          color,
          weight: 5,
          dashArray: '6, 8',
          opacity: 0.95
        }).addTo(this.map);
        this.drawingBranchPolylines[bIdx] = poly;
      }
    });

    this.updateDrawingStats();

    if (allBounds.length > 0 && this.map) {
      this.map.fitBounds(allBounds, { padding: [50, 50], animate: true });
    }

    if (window.App) {
      window.App.showToast(`Đang chỉnh sửa: "${p.name}" (${this.drawingBranches.length} nhánh). Bạn có thể bấm để vẽ thêm điểm, rẽ nhánh mới hoặc xóa mốc.`, 'info');
    }
  },

  // Hủy chế độ vẽ
  cancelDrawPathMode() {
    this.isDrawingPathMode = false;
    this.editingPathId = null;
    this.drawingBranches = [[]];
    this.currentBranchIndex = 0;

    this.drawingBranchPolylines.forEach(p => {
      if (p && this.map) this.map.removeLayer(p);
    });
    this.drawingBranchPolylines = [];

    if (this.map) {
      this.drawingMarkers.forEach(m => this.map.removeLayer(m));
      this.map.getContainer().style.cursor = '';
    }
    this.drawingMarkers = [];

    const banner = document.getElementById('pathDrawingBanner');
    if (banner) banner.classList.add('hidden');

    this.renderCampusPaths();
    const btn = document.getElementById('btnToggleDrawPath');
    if (btn) btn.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-700');
  },

  // Mở modal lưu tuyến đường / mạng lưới
  openSavePathModal() {
    const validBranches = this.drawingBranches.filter(b => b && b.length >= 2);
    if (validBranches.length === 0) {
      if (window.App) window.App.showToast('Vui lòng vẽ ít nhất 1 nhánh có từ 2 điểm mốc trở lên!', 'warning');
      return;
    }

    let totalPoints = 0;
    let totalDist = 0;
    validBranches.forEach(b => {
      totalPoints += b.length;
      totalDist += this.calculateBranchDistance(b);
    });

    const branchesEl = document.getElementById('savePathModalBranches');
    const countEl = document.getElementById('savePathModalCount');
    const distEl = document.getElementById('savePathModalDistance');

    if (branchesEl) branchesEl.textContent = validBranches.length;
    if (countEl) countEl.textContent = totalPoints;
    if (distEl) distEl.textContent = totalDist + 'm';

    const nameInput = document.getElementById('modalPathName');
    const typeSelect = document.getElementById('modalPathType');

    if (this.editingPathId) {
      const p = this.paths.find(item => item.id === this.editingPathId);
      if (p) {
        if (nameInput) nameInput.value = p.name || '';
        if (typeSelect && p.path_type) typeSelect.value = p.path_type;
      }
    } else {
      if (nameInput) {
        nameInput.value = validBranches.length > 1
          ? `Mạng lưới lối đi ${this.paths.length + 1} (${validBranches.length} nhánh)`
          : `Lối đi nội bộ ${this.paths.length + 1}`;
      }
    }

    openModal('savePathModal');
  },

  // Xác nhận lưu tuyến đường vào database
  async confirmSavePath(e) {
    if (e && e.preventDefault) e.preventDefault();

    const name = document.getElementById('modalPathName').value.trim();
    const path_type = document.getElementById('modalPathType').value;
    const btn = document.getElementById('btnSubmitSavePath');

    const validBranches = this.drawingBranches.filter(b => b && b.length >= 2);
    if (validBranches.length === 0) {
      if (window.App) window.App.showToast('Cần ít nhất 1 nhánh có từ 2 điểm mốc trở lên!', 'warning');
      return;
    }

    // Nếu chỉ có 1 nhánh -> lưu mảng điểm [ [lat, lng], ... ]
    // Nếu có nhiều nhánh -> lưu mảng các nhánh [ [ [lat, lng], ... ], ... ]
    const coordinatesToSave = validBranches.length === 1 ? validBranches[0] : validBranches;

    if (!name) {
      if (window.App) window.App.showToast('Vui lòng nhập tên tuyến đường', 'warning');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
    }

    try {
      let res;
      if (this.editingPathId) {
        res = await AdminAPI.updatePath(this.editingPathId, {
          name,
          path_type,
          coordinates: coordinatesToSave
        });
      } else {
        res = await AdminAPI.createPath({
          name,
          path_type,
          coordinates: coordinatesToSave
        });
      }

      if (!res.success) throw new Error(res.message);

      closeModal('savePathModal');
      let totalDist = 0;
      validBranches.forEach(b => { totalDist += this.calculateBranchDistance(b); });
      const wasEditing = !!this.editingPathId;
      this.cancelDrawPathMode();

      if (window.App) {
        window.App.showToast(wasEditing ? `Đã cập nhật "${name}" thành công!` : `Đã lưu "${name}" (${validBranches.length} nhánh, ${totalDist}m) thành công!`, 'success');
      }

      await this.loadCampusPaths();
    } catch (err) {
      if (window.App) window.App.showToast('Lỗi lưu đường đi: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> <span>Lưu tuyến đường</span>';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  // Quản lý danh sách các lối đi
  openManagePathsModal() {
    const container = document.getElementById('managePathsList');
    const totalEl = document.getElementById('managePathsTotalCount');

    if (totalEl) totalEl.textContent = `Tổng cộng: ${this.paths.length} tuyến`;

    if (!container) return;

    if (!this.paths || this.paths.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400">
          <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <i data-lucide="footprints" class="w-6 h-6"></i>
          </div>
          <p class="font-semibold text-sm">Chưa có tuyến đường nội bộ nào</p>
          <p class="text-xs text-slate-400 mt-1">Bấm nút "Tự vẽ đường đi" trên bản đồ để bắt đầu tạo mạng lưới lối đi.</p>
        </div>
      `;
    } else {
      container.innerHTML = this.paths.map((p, idx) => {
        const branches = this.getPathBranches(p.coordinates);
        const dist = this.calculatePathDistance(p.coordinates);
        const totalPoints = branches.reduce((acc, b) => acc + b.length, 0);

        const typeLabels = {
          'walkway': { text: 'Lối đi bộ', color: 'bg-emerald-100 text-emerald-800' },
          'main_road': { text: 'Trục đường chính', color: 'bg-blue-100 text-blue-800' },
          'secondary_road': { text: 'Đường nhánh', color: 'bg-purple-100 text-purple-800' }
        };
        const typeInfo = typeLabels[p.path_type] || { text: 'Đường đi', color: 'bg-slate-100 text-slate-800' };

        return `
          <div class="py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                ${idx + 1}
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <h5 class="text-xs font-bold text-slate-900">${escapeHtml(p.name)}</h5>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${typeInfo.color}">${typeInfo.text}</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  ${branches.length > 1 ? `<b>${branches.length}</b> nhánh • ` : ''}<b>${totalPoints}</b> mốc • Dài: <span class="font-bold text-slate-700">${dist}m</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="LocationsModule.focusPathOnMap(${p.id})"
                class="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1" title="Xem vị trí trên bản đồ">
                <i data-lucide="eye" class="w-3.5 h-3.5 text-slate-500"></i> Xem
              </button>
              <button onclick="LocationsModule.editPathOnMap(${p.id})"
                class="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-xs font-bold transition flex items-center gap-1" title="Chỉnh sửa tọa độ và vẽ tiếp nhánh">
                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-brand-700"></i> Sửa
              </button>
              <button onclick="LocationsModule.confirmDeletePath(${p.id}, '${escapeHtml(p.name).replace(/'/g, "\\'")}')"
                class="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs transition" title="Xóa tuyến này">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    openModal('managePathsModal');
    if (window.lucide) window.lucide.createIcons();
  },

  focusPathOnMap(id) {
    const p = this.paths.find(x => x.id === id);
    if (!p || !this.map) return;

    closeModal('managePathsModal');

    const branches = this.getPathBranches(p.coordinates);
    if (branches.length > 0) {
      const allPoints = [];
      branches.forEach(b => b.forEach(pt => allPoints.push(pt)));
      this.map.fitBounds(allPoints, { padding: [60, 60], maxZoom: 19 });
      const layer = this.pathLayers.find(l => l.pathId === id);
      if (layer) {
        setTimeout(() => layer.openPopup(), 400);
      }
    }
  },

  confirmDeletePath(id, name) {
    if (!window.App) return;
    window.App.showConfirm(
      'Xóa tuyến đường',
      `Bạn có chắc chắn muốn xóa tuyến đường "${name}" khỏi bản đồ trường?`,
      async () => {
        try {
          await AdminAPI.deletePath(id);
          window.App.showToast('Đã xóa tuyến đường thành công', 'info');
          await this.loadCampusPaths();
          const modal = document.getElementById('managePathsModal');
          if (modal && !modal.classList.contains('hidden')) {
            this.openManagePathsModal();
          }
        } catch (err) {
          window.App.showToast('Lỗi khi xóa: ' + err.message, 'error');
        }
      }
    );
  },

  confirmResetDefaultPaths() {
    if (!window.App) return;
    window.App.showConfirm(
      'Khôi phục mạng lưới lối đi chuẩn',
      'Hành động này sẽ thiết lập lại các tuyến đường và lối đi bộ chính mặc định trong khuôn viên Trường ĐH Tây Nguyên. Bạn có muốn tiếp tục?',
      async () => {
        try {
          const res = await AdminAPI.resetPaths();
          window.App.showToast(res.message || 'Khôi phục các tuyến đường mẫu thành công!', 'success');
          await this.loadCampusPaths();
          const modal = document.getElementById('managePathsModal');
          if (modal && !modal.classList.contains('hidden')) {
            this.openManagePathsModal();
          }
        } catch (err) {
          window.App.showToast('Lỗi khôi phục: ' + err.message, 'error');
        }
      }
    );
  }
};

window.LocationsModule = LocationsModule;
