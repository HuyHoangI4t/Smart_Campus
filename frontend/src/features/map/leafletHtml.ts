import { LocationItem, CampusPath, CampusGate } from "./types";
import { TNU_CAMPUS_GATES } from "./constants";
import { LEAFLET_CSS, LEAFLET_JS } from "./leafletBundle";

const htmlCache = new Map<string, string>();

export function generateLeafletMapHtml(
  locations: LocationItem[],
  boundary: [number, number][],
  center: [number, number] = [12.65067, 108.02621],
  campusPaths: CampusPath[] = [],
  gates: CampusGate[] = TNU_CAMPUS_GATES
): string {
  const cacheKey = `${locations.length}_${campusPaths.length}_${gates.length}_${boundary.length}`;
  if (htmlCache.has(cacheKey)) {
    return htmlCache.get(cacheKey)!;
  }
  const safeJson = (data: any) => JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  // Tối ưu hóa: Chỉ gửi metadata gọn nhẹ (id, lat, lng, icon, color, category) vào WebView
  const lightweightLocations = locations.map((l) => ({
    id: l.id,
    lat: l.lat,
    lng: l.lng,
    icon: l.icon,
    color: l.color,
    category: l.category,
  }));
  const locationsJson = safeJson(lightweightLocations);
  const boundaryJson = safeJson(boundary);
  const centerJson = safeJson(center);
  const campusPathsJson = safeJson(campusPaths);
  const gatesJson = safeJson(gates);

  const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
${LEAFLET_CSS}
  </style>
  <script>
${LEAFLET_JS}
  </script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #F8FAFC;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #map-viewport {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      background: #F8FAFC;
    }
    /* Khung xoay bao phủ màn hình tối ưu hiệu năng và GPU */
    #map-rotator {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 142vmax;
      height: 142vmax;
      margin-left: -71vmax;
      margin-top: -71vmax;
      transform-origin: 50% 50%;
      will-change: transform;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    #map {
      width: 100%;
      height: 100%;
      background: #F8FAFC;
    }
    /* Tối ưu hóa GPU composite layer & tần số quét cao 90Hz / 120Hz / 144Hz */
    .leaflet-pane, .leaflet-tile, .custom-marker, .walking-route-path {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      will-change: transform;
    }
    /* Marker Styles (Icon-only, no #id) */
    .custom-marker {
      background: transparent;
      border: none;
    }
    .marker-pin-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      cursor: pointer;
    }
    .marker-pin-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2.5px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      /* Giữ icon luôn thẳng đứng bất kể bản đồ xoay góc nào */
      transform: rotate(var(--counter-rot, 0deg));
    }
    .marker-pin-badge svg {
      width: 14px;
      height: 14px;
      stroke: #FFFFFF;
      fill: none;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .marker-pulse-ring {
      display: none;
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.28);
      animation: pulseAnim 1.6s infinite ease-out;
      z-index: -1;
    }
    .custom-marker.active .marker-pulse-ring {
      display: block;
    }
    .custom-marker.active .marker-pin-badge {
      width: 36px;
      height: 36px;
      border-width: 3px;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4), 0 6px 14px rgba(0,0,0,0.35);
      transform: rotate(var(--counter-rot, 0deg)) scale(1.18);
    }
    .custom-marker.active .marker-pin-badge svg {
      width: 18px;
      height: 18px;
    }

    @keyframes pulseAnim {
      0% { transform: scale(0.7); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    /* Walking Route Animation */
    .walking-route-path {
      stroke-dasharray: 8, 8;
      animation: dashMove 1.2s linear infinite;
    }
    @keyframes dashMove {
      from { stroke-dashoffset: 16; }
      to { stroke-dashoffset: 0; }
    }
    .route-pin {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      color: #FFFFFF;
      font-weight: bold;
      font-size: 11px;
      transform: rotate(var(--counter-rot, 0deg));
    }
    /* Nhãn và mốc Cổng trường */
    .gate-badge-marker {
      background: #0F172A;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 10.5px;
      padding: 4px 9px;
      border-radius: 12px;
      border: 2px solid #10B981;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      transform: translate(-50%, -50%) rotate(var(--counter-rot, 0deg));
    }
    .gate-badge-marker.back-gate {
      border-color: #3B82F6;
    }
    .gate-badge-marker.hospital-gate {
      border-color: #EF4444;
    }
    /* Điểm đón ngoài đường phố */
    .outside-point-marker {
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
      cursor: pointer;
    }
    .outside-point-marker::after {
      content: '';
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.28);
      animation: pulseAnim 2.2s infinite ease-out;
    }
    .outside-point-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #FFFFFF;
    }
    /* Vị trí người dùng: Mũi tên tam giác điều hướng sắc nét phong cách Google Maps */
    .user-nav-marker-container {
      background: transparent !important;
      border: none !important;
    }
    .user-nav-marker-wrapper {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .user-nav-pulse-ring {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.22);
      animation: pulseAnim 2s infinite ease-out;
      pointer-events: none;
    }
    .user-nav-arrow {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: 50% 50%;
      -webkit-transform-origin: 50% 50%;
      transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.45));
      will-change: transform;
    }
    .user-nav-arrow-svg {
      width: 30px;
      height: 30px;
      display: block;
      overflow: visible;
    }
    /* Thu gọn marker khi zoom xa (< 16) để giảm tải layout & animation DOM */
    .zoomed-out .marker-pin-badge {
      width: 14px;
      height: 14px;
      border-width: 1.5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .zoomed-out .marker-pin-badge svg {
      display: none;
    }
    .zoomed-out .custom-marker.active .marker-pin-badge {
      width: 32px;
      height: 32px;
    }
    .zoomed-out .custom-marker.active .marker-pin-badge svg {
      display: block;
    }
  </style>
</head>
<body>
  <div id="map-viewport">
    <div id="map-rotator">
      <div id="map"></div>
    </div>
  </div>

  <script>
    var locationsData = ${locationsJson};
    var boundaryData = ${boundaryJson};
    var centerData = ${centerJson};
    var campusPathsData = ${campusPathsJson} || [];
    var gatesData = ${gatesJson} || [];

    function getPathBranches(rawCoords) {
      if (!rawCoords) return [];
      var coords = rawCoords;
      if (typeof coords === 'string') {
        try { coords = JSON.parse(coords); } catch (e) { return []; }
      }
      if (!Array.isArray(coords) || coords.length === 0) return [];
      if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
        return [coords];
      }
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        return coords.filter(function(b) { return Array.isArray(b) && b.length >= 2; });
      }
      return [];
    }

    var currentBearing = 0;
    var mapRotator = document.getElementById('map-rotator');
    var mapViewport = document.getElementById('map-viewport');

    // Hàm cập nhật góc xoay bản đồ (Bearing)
    function applyBearing(deg, animated) {
      currentBearing = ((deg % 360) + 360) % 360;
      if (animated) {
        mapRotator.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
      } else {
        mapRotator.style.transition = 'none';
      }
      mapRotator.style.transform = 'rotate(' + (-currentBearing) + 'deg)';
      document.documentElement.style.setProperty('--counter-rot', currentBearing + 'deg');
    }

    // Đảm bảo lúc mới mở bản đồ luôn theo đúng chuẩn hướng Bắc - Nam (0 độ)
    applyBearing(0, false);

    // Khởi tạo bản đồ trung tâm Trường ĐH Tây Nguyên (Tối ưu Canvas 2D phần cứng cực nhanh)
    var map = L.map('map', {
      center: centerData,
      zoom: 17,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      preferCanvas: true
    });

    map.whenReady(function() {
      applyBearing(0, false);
      handleZoomOptimization();
      setTimeout(function() {
        getCampusGraph();
      }, 150);
    });

    function handleZoomOptimization() {
      var z = map.getZoom();
      if (z < 16) {
        document.body.classList.add('zoomed-out');
      } else {
        document.body.classList.remove('zoomed-out');
      }
    }
    map.on('zoomend', handleZoomOptimization);

    // ── XỬ LÝ KÉO DI CHUYỂN BẢN ĐỒ KHI BẢN ĐỒ ĐANG XOAY ──────────────────
    if (L.Draggable && L.Draggable.prototype._onMove) {
      var origOnMove = L.Draggable.prototype._onMove;
      L.Draggable.prototype._onMove = function(e) {
        if (currentBearing !== 0 && this._startPoint) {
          var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
          var rawX = first.clientX - this._startPoint.x;
          var rawY = first.clientY - this._startPoint.y;
          var rad = currentBearing * Math.PI / 180;
          var cos = Math.cos(rad);
          var sin = Math.sin(rad);
          var rotX = rawX * cos - rawY * sin;
          var rotY = rawX * sin + rawY * cos;

          var fakeE = {
            clientX: this._startPoint.x + rotX,
            clientY: this._startPoint.y + rotY,
            preventDefault: function() { if (e.preventDefault) e.preventDefault(); }
          };
          if (e.touches) {
            fakeE.touches = [{ clientX: this._startPoint.x + rotX, clientY: this._startPoint.y + rotY }];
          }
          origOnMove.call(this, fakeE);
        } else {
          origOnMove.call(this, e);
        }
      };
    }

    // ── GESTURE XOAY BẰNG 2 NGÓN TAY CỦA NGƯỜI DÙNG TRÊN MÀN HÌNH ─────────
    var isTwoFingerTouch = false;
    var startAngle = 0;
    var initialBearing = 0;

    function getTouchAngle(t1, t2) {
      return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
    }

    mapViewport.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        isTwoFingerTouch = true;
        startAngle = getTouchAngle(e.touches[0], e.touches[1]);
        initialBearing = currentBearing;
      }
    }, { passive: false });

    mapViewport.addEventListener('touchmove', function(e) {
      if (isTwoFingerTouch && e.touches.length === 2) {
        var curAngle = getTouchAngle(e.touches[0], e.touches[1]);
        var delta = curAngle - startAngle;

        if (Math.abs(delta) > 2) {
          var newBearing = (initialBearing - delta);
          newBearing = ((newBearing % 360) + 360) % 360;
          applyBearing(newBearing, false);

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MANUAL_ROTATE',
              bearing: Math.round(newBearing)
            }));
          }
        }
      }
    }, { passive: true });

    mapViewport.addEventListener('touchend', function(e) {
      if (e.touches.length < 2) {
        isTwoFingerTouch = false;
      }
    }, { passive: true });

    // ── LỚP BẢN ĐỒ 2D GOOGLE MAPS (ẨN TOÀN BỘ TÊN ĐỊA DANH / CÔNG TRÌNH / POI) ──
    var googleRoadLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&apistyle=s.t:3|p.v:off|s.t:4|p.v:off&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      keepBuffer: 1,
      updateWhenIdle: true,
      updateWhenZooming: false,
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // ── PANE RIÊNG CHO LỚP VỆ TINH GOOGLE MAPS CỦA KHUÔN VIÊN TRƯỜNG ──
    map.createPane('satelliteCampusPane');
    var satellitePane = map.getPane('satelliteCampusPane');
    satellitePane.style.zIndex = '250';

    // Lớp Vệ tinh Google Maps nguyên bản (lyrs=s: ảnh chụp vệ tinh sắc nét, hoàn toàn không có tên địa danh / công trình)
    var googleSatLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      keepBuffer: 1,
      updateWhenIdle: true,
      updateWhenZooming: false,
      pane: 'satelliteCampusPane',
      attribution: '&copy; Google Maps'
    });

    var currentLayer = 'satellite';

    // Hàm cắt lớp vệ tinh theo đúng ranh giới khuôn viên trường:
    // Bên trong khuôn viên là ảnh vệ tinh, xung quanh khuôn viên là bản đồ 2D đường phố
    function updateSatelliteClip() {
      if (!satellitePane) return;
      var points = boundaryData.map(function(coord) {
        var pt = map.latLngToLayerPoint(coord);
        return Math.round(pt.x) + 'px ' + Math.round(pt.y) + 'px';
      });
      var polyStr = 'polygon(' + points.join(', ') + ')';
      satellitePane.style.clipPath = polyStr;
      satellitePane.style.webkitClipPath = polyStr;
    }

    // Tối ưu hiệu năng: Dùng requestAnimationFrame throttling khi người dùng kéo/vuốt bản đồ
    var clipDirty = false;
    function scheduleSatelliteClip() {
      if (clipDirty) return;
      clipDirty = true;
      requestAnimationFrame(function() {
        updateSatelliteClip();
        clipDirty = false;
      });
    }

    // Kích hoạt lớp vệ tinh khuôn viên và đồng bộ clip-path khi bản đồ di chuyển/zoom
    googleSatLayer.addTo(map);
    map.on('zoomend viewreset moveend resize', updateSatelliteClip);
    map.on('move', scheduleSatelliteClip);
    setTimeout(updateSatelliteClip, 100);

    // ── TƯỜNG RÀO KIÊN CỐ BAO QUANH KHUÔN VIÊN TRƯỜNG (Ô VIỀN LÀM TƯỜNG) ──
    // Chân tường nền kiên cố
    var boundaryWallBase = L.polyline(boundaryData.concat([boundaryData[0]]), {
      color: '#0F172A',
      weight: 6.5,
      opacity: 0.95
    }).addTo(map);

    // Hoa văn thân tường ranh giới
    var boundaryWallInner = L.polyline(boundaryData.concat([boundaryData[0]]), {
      color: '#475569',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '8, 12'
    }).addTo(map);

    // ── CỔNG TRƯỜNG & 2 ĐIỂM KẾT NỐI BÊN NGOÀI (LÊ DUẨN & Y WANG) ──────────
    var gatesLayerGroup = L.layerGroup().addTo(map);

    function renderGates() {
      gatesLayerGroup.clearLayers();
      if (!gatesData || !gatesData.length) return;

      gatesData.forEach(function(g) {
        // 1. Điểm cổng chính thức tại tường bao
        var gateBadgeClass = 'gate-badge-marker' + (g.id === 'back_gate' ? ' back-gate' : (g.id === 'hospital_gate' ? ' hospital-gate' : ''));
        var gateIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div class="' + gateBadgeClass + '">' +
            '<svg style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;display:inline-block;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M9 15h.01"/></svg>' +
            '<span>' + g.name + '</span>' +
          '</div>',
          iconSize: [0, 0]
        });
        L.marker(g.gatePoint, { icon: gateIcon, zIndexOffset: 850 }).addTo(gatesLayerGroup);

        // 2. Điểm đón ngoài đường phố (Lê Duẩn / Y Wang)
        var outIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div class="outside-point-marker" title="Điểm ngoài: ' + g.name + '">' +
            '<div class="outside-point-dot"></div>' +
          '</div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        var outMarker = L.marker(g.outsidePoint, { icon: outIcon, zIndexOffset: 860 }).addTo(gatesLayerGroup);
        outMarker.bindTooltip('Điểm đón ngoài - ' + g.name + '<br><small style="color:#64748B">Kết nối đường phố Google Maps</small>', {
          permanent: false,
          direction: 'top'
        });

        // 3. Đường thông hành qua cổng (nối Điểm ngoài -> Cổng -> Điểm trong)
        L.polyline([g.outsidePoint, g.gatePoint, g.insidePoint], {
          color: '#10B981',
          weight: 3.5,
          dashArray: '3, 5',
          opacity: 0.9
        }).addTo(gatesLayerGroup);
      });
    }

    renderGates();

    // ── LỚP MẠNG LƯỚI LỐI ĐI BỘ NỘI BỘ TRƯỜNG ĐH TÂY NGUYÊN (ẨN KHỎI BẢN ĐỒ) ──
    // Giữ trong bộ nhớ để tính toán chỉ đường bộ (Dijkstra) khi người dùng yêu cầu, không vẽ trực tiếp lên bản đồ
    var campusPathsLayer = L.layerGroup();

    function renderCampusPathsNetwork(paths) {
      campusPathsLayer.clearLayers();
    }

    renderCampusPathsNetwork(campusPathsData);

    // Danh sách SVG icons
    var svgIcons = {
      'briefcase': '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      'book-open': '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      'book': '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      'cpu': '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>',
      'activity': '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
      'award': '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
      'home': '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      'coffee': '<svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
      'droplet': '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
      'layers': '<svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
      'map-pin': '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    };

    var locationsLayerGroup = L.layerGroup().addTo(map);
    var markerObjects = {};
    var currentActiveMarkerId = null;

    function renderLocationMarkers(data) {
      locationsLayerGroup.clearLayers();
      markerObjects = {};
      locationsData = data || [];

      locationsData.forEach(function(loc) {
        var iconHtml = svgIcons[loc.icon] || svgIcons['map-pin'];
        var markerHtml = '<div class="marker-pin-wrapper">' +
          '<div class="marker-pulse-ring"></div>' +
          '<div class="marker-pin-badge" style="background-color: ' + (loc.color || '#2563EB') + ';">' +
            iconHtml +
          '</div>' +
        '</div>';

        var customIcon = L.divIcon({
          className: 'custom-marker',
          html: markerHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        var marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(locationsLayerGroup);

        marker.on('click', function() {
          setActiveMarker(loc.id);
          computeRouteDistanceToLoc(loc.lat, loc.lng, function(distMeters, durMin) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SELECT_LOCATION',
                id: loc.id,
                distanceMeters: distMeters,
                durationMinutes: durMin
              }));
            }
          });
        });

        markerObjects[loc.id] = marker;
      });
    }

    renderLocationMarkers(locationsData);

    // Click vào vùng trống bản đồ để bỏ chọn địa điểm
    map.on('click', function() {
      setActiveMarker(null);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DESELECT_LOCATION'
        }));
      }
    });

    function setActiveMarker(locId) {
      if (currentActiveMarkerId && markerObjects[currentActiveMarkerId]) {
        var oldEl = markerObjects[currentActiveMarkerId].getElement();
        if (oldEl) oldEl.classList.remove('active');
      }
      currentActiveMarkerId = locId;
      if (locId && markerObjects[locId]) {
        var newEl = markerObjects[locId].getElement();
        if (newEl) newEl.classList.add('active');
      }
    }

    function filterCategory(cat) {
      var isAll = !cat || cat === 'all';
      var isWc = cat && cat.toLowerCase() === 'wc';
      var matchedBounds = [];
      locationsData.forEach(function(loc) {
        var m = markerObjects[loc.id];
        if (!m) return;
        var el = m.getElement();
        if (!el) return;
        var match = isAll;
        if (!isAll) {
          var locCat = (loc.category || '').toLowerCase();
          var locName = (loc.name || '').toLowerCase();
          var locDesc = (loc.description || '').toLowerCase();
          if (isWc) {
            match = locCat === 'wc' || locName.indexOf('wc') !== -1 || locDesc.indexOf('vệ sinh') !== -1;
          } else {
            match = locCat === cat.toLowerCase();
          }
        }
        if (match) {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          if (loc.lat && loc.lng) {
            matchedBounds.push([loc.lat, loc.lng]);
          }
        } else {
          el.style.opacity = '0.22';
          el.style.pointerEvents = 'none';
        }
      });
      if (!isAll && matchedBounds.length > 0) {
        try {
          map.fitBounds(matchedBounds, { padding: [60, 60], maxZoom: 18, animate: true });
        } catch(e) {}
      }
    }

    // Biến quản lý User Location và Tuyến đường (Routing)
    var userLocationMarker = null;
    var userAccuracyCircle = null;
    var currentUserLat = null;
    var currentUserLng = null;
    var currentUserHeading = 0;
    var routeLayerGroup = L.layerGroup().addTo(map);
    var activeRouteState = {
      isActive: false,
      coords: [],
      gateInfo: null,
      traversedPoly: null,
      remainingPoly: null,
      remainingGlow: null,
      lastPassedSegmentIndex: 0,
      totalDistance: 0
    };

    function computeRouteDistanceToLoc(destLat, destLng, callback) {
      if (currentUserLat === null || currentUserLng === null) {
        callback(null, null);
        return;
      }
      var origLat = currentUserLat;
      var origLng = currentUserLng;
      var origIn = isPointInCampus(origLat, origLng);
      var destIn = isPointInCampus(destLat, destLng);

      // Trong trường -> Trong trường
      if (origIn && destIn) {
        var internal = findCampusWalkwayRoute(origLat, origLng, destLat, destLng);
        if (internal && internal.distanceMeters) {
          callback(internal.distanceMeters, internal.durationMinutes);
          return;
        }
        var straight = getDistanceMeters(origLat, origLng, destLat, destLng);
        callback(straight, Math.max(1, Math.round(straight / 75)));
        return;
      }

      // Ngoài trường -> Trong trường
      if (!origIn && destIn) {
        var gate = getBestGate(origLat, origLng, destLat, destLng, true);
        if (gate) {
          var intRoute = findCampusWalkwayRoute(gate.insidePoint[0], gate.insidePoint[1], destLat, destLng);
          var intDist = (intRoute && intRoute.distanceMeters)
            ? intRoute.distanceMeters
            : getDistanceMeters(gate.insidePoint[0], gate.insidePoint[1], destLat, destLng);
          var gateDist = getDistanceMeters(gate.outsidePoint[0], gate.outsidePoint[1], gate.insidePoint[0], gate.insidePoint[1]);
          var fastExt = buildPerimeterRoadFallback(origLat, origLng, gate.outsidePoint[0], gate.outsidePoint[1]);
          var instantTotDist = Math.round(fastExt.distance + gateDist + intDist);
          // Trả kết quả tức thì (0ms) cho Card xem trước
          callback(instantTotDist, Math.max(1, Math.round(instantTotDist / 75)));

          // Tinh chỉnh ngầm bằng OSRM nếu có kết nối mạng
          fetchExternalOsrmRoute(origLat, origLng, gate.outsidePoint[0], gate.outsidePoint[1], function(extCoords, extDist, extDur) {
            if (extDist !== null && extDist !== undefined) {
              var safeExtDist = extDist;
              var refinedTotDist = Math.round(safeExtDist + gateDist + intDist);
              callback(refinedTotDist, Math.max(1, Math.round(refinedTotDist / 75)));
            }
          });
          return;
        }
      }

      // Ngoài trường -> Ngoài trường
      if (!origIn && !destIn) {
        var fastExtRoad = buildPerimeterRoadFallback(origLat, origLng, destLat, destLng);
        callback(fastExtRoad.distance, fastExtRoad.duration);

        fetchExternalOsrmRoute(origLat, origLng, destLat, destLng, function(extCoords, extDist, extDur) {
          if (extDist !== null && extDist !== undefined) {
            callback(extDist, extDur || Math.max(1, Math.round(extDist / 75)));
          }
        });
        return;
      }

      var fallbackDist = getDistanceMeters(origLat, origLng, destLat, destLng);
      callback(fallbackDist, Math.max(1, Math.round(fallbackDist / 75)));
    }

    function updateUserHeading(heading) {
      if (typeof heading !== 'number' || isNaN(heading)) return;
      var targetAngle = ((heading % 360) + 360) % 360;
      currentUserHeading = targetAngle;

      var arrowEl = document.getElementById('user-nav-arrow');
      if (arrowEl) {
        if (!hasArrowRotatedOnce) {
          currentArrowCumulativeAngle = targetAngle;
          hasArrowRotatedOnce = true;
        } else {
          var diff = (targetAngle - (((currentArrowCumulativeAngle % 360) + 360) % 360));
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          currentArrowCumulativeAngle += diff;
        }
        arrowEl.style.transform = 'rotate(' + currentArrowCumulativeAngle + 'deg)';
      }
    }

    function createUserNavIconHtml() {
      return '<div class="user-nav-marker-wrapper">' +
        '<div class="user-nav-pulse-ring"></div>' +
        '<div class="user-nav-arrow" id="user-nav-arrow" style="transform: rotate(' + currentUserHeading + 'deg);">' +
          '<svg viewBox="0 0 24 24" class="user-nav-arrow-svg">' +
            '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
          '</svg>' +
        '</div>' +
      '</div>';
    }

    var isFirstLocationUpdate = true;

    function updateUserLocation(lat, lng, accuracy, heading, centerOnUser) {
      var prevLat = currentUserLat;
      var prevLng = currentUserLng;

      currentUserLat = lat;
      currentUserLng = lng;

      if (typeof heading === 'number' && !isNaN(heading)) {
        currentUserHeading = ((heading % 360) + 360) % 360;
      }

      if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng]);
        var arrowEl = document.getElementById('user-nav-arrow');
        if (arrowEl) {
          arrowEl.style.transform = 'rotate(' + currentUserHeading + 'deg)';
        }
      } else {
        var userIcon = L.divIcon({
          className: 'user-nav-marker-container',
          html: createUserNavIconHtml(),
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
        userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      }

      // Vòng tròn bán kính sai số (Accuracy Circle)
      if (accuracy && accuracy > 0 && accuracy <= 500) {
        if (userAccuracyCircle) {
          userAccuracyCircle.setLatLng([lat, lng]);
          userAccuracyCircle.setRadius(accuracy);
        } else {
          userAccuracyCircle = L.circle([lat, lng], {
            radius: accuracy,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '3, 4'
          }).addTo(map);
        }
      } else if (userAccuracyCircle) {
        map.removeLayer(userAccuracyCircle);
        userAccuracyCircle = null;
      }

      // Xử lý cập nhật tâm bản đồ mượt mà (Google Maps Style):
      // - Lần đầu tiên nhận tọa độ (Instant Cache/Network): setView hoặc panTo ngay trong <100ms
      // - Khi có tinh chỉnh độ chính xác cao (Refinement): panTo mượt mà (animation duration 0.5s), không giật nảy
      if (centerOnUser) {
        map.panTo([lat, lng], { animate: true, duration: 0.6 });
        isFirstLocationUpdate = false;
      } else if (isFirstLocationUpdate) {
        map.setView([lat, lng], map.getZoom() || 17, { animate: false });
        isFirstLocationUpdate = false;
      } else if (prevLat !== null && prevLng !== null) {
        var dShift = getDistanceMeters(prevLat, prevLng, lat, lng);
        // Nếu tọa độ tinh chỉnh có độ dịch chuyển đáng kể (5m - 100m) và người dùng chưa chủ động kéo bản đồ ra xa
        if (dShift >= 5 && dShift <= 120) {
          var bounds = map.getBounds();
          if (bounds.contains([lat, lng])) {
            map.panTo([lat, lng], { animate: true, duration: 0.5 });
          }
        }
      }

      // Nếu lộ trình đang kích hoạt, cập nhật ngay quãng đường đã đi (đổi màu xám) và tính lại số mét còn lại
      if (activeRouteState.isActive) {
        updateRouteProgress(lat, lng);
      }
    }

    // Hàm tính khoảng cách mét (Haversine)
    function getDistanceMeters(lat1, lon1, lat2, lon2) {
      var R = 6371000;
      var dLat = (lat2 - lat1) * Math.PI / 180;
      var dLon = (lon2 - lon1) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }

    // Bộ nhớ đệm đồ thị giao lộ và kết quả tìm đường trong WebView
    var campusGraphCache = null;
    var webviewRouteCache = {};

    function getCampusGraph() {
      if (campusGraphCache) return campusGraphCache;
      if (!campusPathsData || !campusPathsData.length) return null;

      var vertices = [];
      var adj = {};

      function addEdge(u, v, weight) {
        if (!adj[u]) adj[u] = [];
        if (!adj[v]) adj[v] = [];
        adj[u].push({ node: v, weight: weight });
        adj[v].push({ node: u, weight: weight });
      }

      var nodeIndex = 0;
      campusPathsData.forEach(function(path) {
        var branches = getPathBranches(path.coordinates);
        branches.forEach(function(pts) {
          var prevIdx = -1;
          for (var i = 0; i < pts.length; i++) {
            var curIdx = nodeIndex++;
            vertices.push([pts[i][0], pts[i][1]]);
            if (prevIdx !== -1) {
              var w = getDistanceMeters(vertices[prevIdx][0], vertices[prevIdx][1], vertices[curIdx][0], vertices[curIdx][1]);
              addEdge(prevIdx, curIdx, Math.max(1, w));
            }
            prevIdx = curIdx;
          }
        });
      });

      if (vertices.length < 2) return null;

      // 1. Nối các giao lộ & ngã rẽ giữa các tuyến (những điểm cách nhau <= 25m)
      for (var i = 0; i < vertices.length; i++) {
        for (var j = i + 1; j < vertices.length; j++) {
          var d = getDistanceMeters(vertices[i][0], vertices[i][1], vertices[j][0], vertices[j][1]);
          if (d <= 25) {
            addEdge(i, j, Math.max(1, d));
          }
        }
      }

      // 2. Thuật toán liên thông hóa toàn diện (Component Bridging):
      // Đảm bảo không có bất kỳ cụm đường nào bị cô lập (đặc biệt khu vực Sân thể thao, Sân quần vợt, KTX, Thao trường)
      // Loại bỏ hoàn toàn lỗi không tìm được đường dẫn đến fallback đường chim bay
      var comp = new Array(vertices.length).fill(-1);
      var compList = [];
      var cId = 0;
      for (var cIdx = 0; cIdx < vertices.length; cIdx++) {
        if (comp[cIdx] === -1) {
          var curComp = [];
          var q = [cIdx];
          comp[cIdx] = cId;
          while (q.length > 0) {
            var u = q.shift();
            curComp.push(u);
            var nbrs = adj[u] || [];
            for (var n = 0; n < nbrs.length; n++) {
              var v = nbrs[n].node;
              if (comp[v] === -1) {
                comp[v] = cId;
                q.push(v);
              }
            }
          }
          compList.push(curComp);
          cId++;
        }
      }

      while (compList.length > 1) {
        var mainComp = compList[0];
        var otherComp = compList[1];
        var bestU = -1, bestV = -1, bestDist = Infinity;
        for (var m = 0; m < mainComp.length; m++) {
          for (var o = 0; o < otherComp.length; o++) {
            var uNode = mainComp[m], vNode = otherComp[o];
            var dUV = getDistanceMeters(vertices[uNode][0], vertices[uNode][1], vertices[vNode][0], vertices[vNode][1]);
            if (dUV < bestDist) {
              bestDist = dUV;
              bestU = uNode;
              bestV = vNode;
            }
          }
        }
        if (bestU !== -1 && bestV !== -1 && bestDist <= 85) {
          addEdge(bestU, bestV, Math.max(1, bestDist));
        }
        compList[0] = mainComp.concat(otherComp);
        compList.splice(1, 1);
      }

      campusGraphCache = { vertices: vertices, adj: adj };
      return campusGraphCache;
    }

    // Thuật toán Dijkstra tìm đường đi bộ tối ưu qua mạng lưới lối đi nội bộ trường
    function findCampusWalkwayRoute(origLat, origLng, destLat, destLng) {
      var routeKey = origLat.toFixed(5) + ',' + origLng.toFixed(5) + '->' + destLat.toFixed(5) + ',' + destLng.toFixed(5);
      if (webviewRouteCache[routeKey]) {
        return webviewRouteCache[routeKey];
      }

      var graph = getCampusGraph();
      if (!graph) return null;

      var vertices = graph.vertices;
      var adj = graph.adj;

      // Tìm mốc gần nhất tới Origin và Destination
      var startNode = -1;
      var startMinDist = Infinity;
      var endNode = -1;
      var endMinDist = Infinity;

      for (var k = 0; k < vertices.length; k++) {
        var dStart = getDistanceMeters(origLat, origLng, vertices[k][0], vertices[k][1]);
        if (dStart < startMinDist) {
          startMinDist = dStart;
          startNode = k;
        }
        var dEnd = getDistanceMeters(destLat, destLng, vertices[k][0], vertices[k][1]);
        if (dEnd < endMinDist) {
          endMinDist = dEnd;
          endNode = k;
        }
      }

      // Nếu điểm xuất phát hoặc điểm đến cách mạng lối đi nội bộ quá 600m -> trả về null để dự phòng
      if (startMinDist > 600 || endMinDist > 600 || startNode === -1 || endNode === -1) {
        return null;
      }

      // Dijkstra O((V + E) log V) siêu tốc với MinHeap Priority Queue
      function WebviewMinHeap() {
        this.heap = [];
      }
      WebviewMinHeap.prototype.push = function(item) {
        this.heap.push(item);
        var idx = this.heap.length - 1;
        while (idx > 0) {
          var pIdx = (idx - 1) >> 1;
          if (this.heap[idx].dist >= this.heap[pIdx].dist) break;
          var tmp = this.heap[idx]; this.heap[idx] = this.heap[pIdx]; this.heap[pIdx] = tmp;
          idx = pIdx;
        }
      };
      WebviewMinHeap.prototype.pop = function() {
        if (this.heap.length === 0) return null;
        var top = this.heap[0];
        var bottom = this.heap.pop();
        if (this.heap.length > 0) {
          this.heap[0] = bottom;
          var idx = 0, len = this.heap.length;
          while (true) {
            var left = (idx << 1) + 1, right = left + 1, smallest = idx;
            if (left < len && this.heap[left].dist < this.heap[smallest].dist) smallest = left;
            if (right < len && this.heap[right].dist < this.heap[smallest].dist) smallest = right;
            if (smallest === idx) break;
            var t = this.heap[idx]; this.heap[idx] = this.heap[smallest]; this.heap[smallest] = t;
            idx = smallest;
          }
        }
        return top;
      };

      var dist = {};
      var prev = {};
      var visited = {};
      var pq = new WebviewMinHeap();
      dist[startNode] = 0;
      pq.push({ node: startNode, dist: 0 });

      while (pq.heap.length > 0) {
        var cur = pq.pop();
        var u = cur.node;

        if (visited[u]) continue;
        visited[u] = true;

        if (u === endNode) break;

        var neighbors = adj[u] || [];
        for (var n = 0; n < neighbors.length; n++) {
          var edge = neighbors[n];
          var v = edge.node;
          var alt = dist[u] + edge.weight;
          if (dist[v] === undefined || alt < dist[v]) {
            dist[v] = alt;
            prev[v] = u;
            pq.push({ node: v, dist: alt });
          }
        }
      }

      if (dist[endNode] === undefined) return null;

      var pathIndices = [];
      var curr = endNode;
      while (curr !== undefined) {
        pathIndices.unshift(curr);
        curr = prev[curr];
      }

      var routeCoords = [[origLat, origLng]];
      pathIndices.forEach(function(idx) {
        routeCoords.push([vertices[idx][0], vertices[idx][1]]);
      });
      routeCoords.push([destLat, destLng]);

      var totalDistMeters = Math.round(startMinDist + dist[endNode] + endMinDist);
      var durMinutes = Math.max(1, Math.round(totalDistMeters / 75)); // ~75m/phút đi bộ

      var result = {
        coordinates: routeCoords,
        distanceMeters: totalDistMeters,
        durationMinutes: durMinutes
      };
      webviewRouteCache[routeKey] = result;
      return result;
    }

    // Kiểm tra tọa độ có nằm bên trong tường bao khuôn viên trường không (Thuật toán Ray-Casting)
    function isPointInCampus(lat, lng) {
      if (!boundaryData || boundaryData.length < 3) return false;
      var x = lat, y = lng;
      var inside = false;
      for (var i = 0, j = boundaryData.length - 1; i < boundaryData.length; j = i++) {
        var xi = boundaryData[i][0], yi = boundaryData[i][1];
        var xj = boundaryData[j][0], yj = boundaryData[j][1];
        var intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    // Chọn Cổng trường tối ưu (Cổng trước Lê Duẩn hoặc Cổng sau Y Wang)
    function getBestGate(origLat, origLng, destLat, destLng, isEntering, preferredGateId) {
      if (!gatesData || gatesData.length === 0) return null;
      if (preferredGateId) {
        for (var p = 0; p < gatesData.length; p++) {
          if (gatesData[p].id === preferredGateId) return gatesData[p];
        }
      }
      var bestGate = gatesData[0];
      var minEstDist = Infinity;

      for (var i = 0; i < gatesData.length; i++) {
        var g = gatesData[i];
        var dExt = isEntering
          ? getDistanceMeters(origLat, origLng, g.outsidePoint[0], g.outsidePoint[1])
          : getDistanceMeters(g.outsidePoint[0], g.outsidePoint[1], destLat, destLng);
        var dInt = isEntering
          ? getDistanceMeters(g.insidePoint[0], g.insidePoint[1], destLat, destLng)
          : getDistanceMeters(origLat, origLng, g.insidePoint[0], g.insidePoint[1]);
        var est = dExt + dInt;
        if (est < minEstDist) {
          minEstDist = est;
          bestGate = g;
        }
      }
      return bestGate;
    }

    // Ghép nối các mảng tọa độ và khử điểm trùng lặp
    function stitchPathCoordinates() {
      var result = [];
      for (var a = 0; a < arguments.length; a++) {
        var arr = arguments[a];
        if (!arr || !arr.length) continue;
        for (var i = 0; i < arr.length; i++) {
          var pt = arr[i];
          if (!pt || pt.length < 2) continue;
          if (result.length > 0) {
            var last = result[result.length - 1];
            if (Math.abs(last[0] - pt[0]) < 0.000005 && Math.abs(last[1] - pt[1]) < 0.000005) {
              continue;
            }
          }
          result.push([pt[0], pt[1]]);
        }
      }
      return result;
    }

    // Tuyến đường trục giao thông chính bao quanh trường (Đường Lê Duẩn & Đường Y Wang)
    var EXTERIOR_PERIMETER_ROADS = {
      leDuan: [
        [12.64800, 108.02210],
        [12.64936, 108.02271],
        [12.650645, 108.022990], // Cổng Bệnh viện ĐH Tây Nguyên
        [12.651536, 108.023856], // Cổng chính (Lê Duẩn)
        [12.65267, 108.02494],
        [12.65386, 108.02579]
      ],
      yWang: [
        [12.64650, 108.02650],
        [12.64748, 108.02705],
        [12.648372, 108.028044], // Cổng sau (Y Wang)
        [12.64950, 108.02925],
        [12.65013, 108.02963]
      ]
    };

    function buildPerimeterRoadFallback(startLat, startLng, targetLat, targetLng) {
      var road = (startLng <= 108.0255 && targetLng <= 108.0255)
        ? EXTERIOR_PERIMETER_ROADS.leDuan
        : EXTERIOR_PERIMETER_ROADS.yWang;

      var sIdx = 0, minSDist = Infinity;
      var tIdx = 0, minTDist = Infinity;

      for (var r = 0; r < road.length; r++) {
        var ds = getDistanceMeters(startLat, startLng, road[r][0], road[r][1]);
        if (ds < minSDist) { minSDist = ds; sIdx = r; }
        var dt = getDistanceMeters(targetLat, targetLng, road[r][0], road[r][1]);
        if (dt < minTDist) { minTDist = dt; tIdx = r; }
      }

      var coords = [[startLat, startLng]];
      if (sIdx <= tIdx) {
        for (var i = sIdx; i <= tIdx; i++) coords.push([road[i][0], road[i][1]]);
      } else {
        for (var i = sIdx; i >= tIdx; i--) coords.push([road[i][0], road[i][1]]);
      }
      coords.push([targetLat, targetLng]);

      var totalD = 0;
      for (var c = 0; c < coords.length - 1; c++) {
        totalD += getDistanceMeters(coords[c][0], coords[c][1], coords[c + 1][0], coords[c + 1][1]);
      }
      return {
        coords: coords,
        distance: Math.round(totalD),
        duration: Math.max(1, Math.round(totalD / 75))
      };
    }

    // Bộ nhớ đệm tuyến đường ngoại vi & Deduplication đang chờ
    var externalRouteCache = {};
    var externalInFlight = {};

    // Lấy chỉ đường ngoài đường phố công cộng qua OpenStreetMap / OSRM đa tầng với timeout & fallback
    function fetchExternalOsrmRoute(startLat, startLng, targetLat, targetLng, callback) {
      var directDist = getDistanceMeters(startLat, startLng, targetLat, targetLng);
      if (directDist <= 12) {
        callback([[startLat, startLng], [targetLat, targetLng]], directDist, 1);
        return;
      }

      var cacheKey = startLat.toFixed(4) + ',' + startLng.toFixed(4) + '->' + targetLat.toFixed(4) + ',' + targetLng.toFixed(4);
      if (externalRouteCache[cacheKey]) {
        var hit = externalRouteCache[cacheKey];
        callback(hit.coords, hit.distance, hit.duration);
        return;
      }

      if (externalInFlight[cacheKey]) {
        externalInFlight[cacheKey].push(callback);
        return;
      }
      externalInFlight[cacheKey] = [callback];

      function resolveAll(coords, dist, dur) {
        externalRouteCache[cacheKey] = { coords: coords, distance: dist, duration: dur };
        var cbs = externalInFlight[cacheKey] || [callback];
        delete externalInFlight[cacheKey];
        for (var i = 0; i < cbs.length; i++) {
          try { cbs[i](coords, dist, dur); } catch(e) {}
        }
      }

      var providers = [
        'https://routing.openstreetmap.de/routed-foot/route/v1/foot/' + startLng + ',' + startLat + ';' + targetLng + ',' + targetLat + '?overview=full&geometries=geojson',
        'https://router.project-osrm.org/route/v1/walking/' + startLng + ',' + startLat + ';' + targetLng + ',' + targetLat + '?overview=full&geometries=geojson',
        'https://routing.openstreetmap.de/routed-car/route/v1/driving/' + startLng + ',' + startLat + ';' + targetLng + ',' + targetLat + '?overview=full&geometries=geojson',
        'https://router.project-osrm.org/route/v1/driving/' + startLng + ',' + startLat + ';' + targetLng + ',' + targetLat + '?overview=full&geometries=geojson'
      ];

      var pIdx = 0;
      function tryNextProvider() {
        if (pIdx >= providers.length) {
          // Dự phòng ngoại tuyến: Nội suy dọc theo trục đường Lê Duẩn hoặc Y Wang thay vì vẽ đường chim bay cắt qua nhà dân
          var fallbackPath = buildPerimeterRoadFallback(startLat, startLng, targetLat, targetLng);
          resolveAll(fallbackPath.coords, fallbackPath.distance, fallbackPath.duration);
          return;
        }

        var url = providers[pIdx++];
        var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = controller ? setTimeout(function() { controller.abort(); }, 1800) : null;

        fetch(url, controller ? { signal: controller.signal } : {})
          .then(function(res) {
            if (timer) clearTimeout(timer);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then(function(data) {
            if (data && data.routes && data.routes.length > 0 && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
              var coords = data.routes[0].geometry.coordinates.map(function(c) {
                return [c[1], c[0]];
              });
              if (coords && coords.length >= 2) {
                var distMeters = Math.round(data.routes[0].distance || directDist);
                var durMin = Math.max(1, Math.round((data.routes[0].duration || (distMeters / 1.25)) / 60));
                resolveAll(coords, distMeters, durMin);
                return;
              }
            }
            tryNextProvider();
          })
          .catch(function() {
            if (timer) clearTimeout(timer);
            tryNextProvider();
          });
      }

      tryNextProvider();
    }

    // Tính góc phương vị ban đầu của tuyến đường để xoay bản đồ theo hướng đi như Google Maps
    function computeInitialRouteBearing(coords) {
      if (!coords || coords.length < 2) return 0;
      var startLat = coords[0][0];
      var startLng = coords[0][1];

      // Tìm điểm dọc lộ trình cách mốc xuất phát tối thiểu 15m để hướng đi ổn định, không bị giật
      var targetLat = coords[1][0];
      var targetLng = coords[1][1];
      for (var i = 1; i < coords.length; i++) {
        var d = getDistanceMeters(startLat, startLng, coords[i][0], coords[i][1]);
        if (d >= 15) {
          targetLat = coords[i][0];
          targetLng = coords[i][1];
          break;
        }
      }

      var dLon = (targetLng - startLng) * Math.PI / 180;
      var lat1Rad = startLat * Math.PI / 180;
      var lat2Rad = targetLat * Math.PI / 180;
      var y = Math.sin(dLon) * Math.cos(lat2Rad);
      var x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
      var brng = Math.atan2(y, x) * 180 / Math.PI;
      return Math.round((brng + 360) % 360);
    }

    // Hàm làm mượt các khúc cua gấp (Corner Filleting / Bézier Smoothing)
    // Giữ nguyên các đoạn thẳng trên lối đi bộ, chỉ bo tròn tự nhiên tại các khúc cua/ngã rẽ
    function smoothRouteCoordinates(coords) {
      if (!coords || coords.length < 3) return coords || [];

      // 1. Khử các điểm quá gần nhau (< 1.2 mét) hoặc trùng lặp
      var cleaned = [coords[0]];
      for (var i = 1; i < coords.length; i++) {
        var prev = cleaned[cleaned.length - 1];
        var cur = coords[i];
        var d = getDistanceMeters(prev[0], prev[1], cur[0], cur[1]);
        if (d >= 1.2 || i === coords.length - 1) {
          cleaned.push(cur);
        }
      }

      if (cleaned.length < 3) return cleaned;

      // 2. Bo tròn các khúc cua bằng Quadratic Bézier fillet
      var smoothed = [cleaned[0]];

      for (var i = 1; i < cleaned.length - 1; i++) {
        var pPrev = cleaned[i - 1];
        var pCur = cleaned[i];
        var pNext = cleaned[i + 1];

        var d1 = getDistanceMeters(pPrev[0], pPrev[1], pCur[0], pCur[1]);
        var d2 = getDistanceMeters(pCur[0], pCur[1], pNext[0], pNext[1]);

        if (d1 < 1.5 || d2 < 1.5) {
          smoothed.push(pCur);
          continue;
        }

        // Tính góc lệch hướng giữa 2 đoạn đường
        var b1 = computeInitialRouteBearing([pPrev, pCur]);
        var b2 = computeInitialRouteBearing([pCur, pNext]);
        var angleDiff = Math.abs(b1 - b2);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        // Nếu góc đổi hướng nhỏ (< 18 độ), đoạn đường gần như thẳng, không cần bo
        if (angleDiff < 18) {
          smoothed.push(pCur);
          continue;
        }

        // Bán kính bo góc (từ 3.0 - 6.5 mét tùy theo độ dài của đoạn đường)
        var maxRadius = Math.min(6.5, d1 * 0.4, d2 * 0.4);

        // Điểm bắt đầu cua (trên đoạn pPrev -> pCur)
        var ratio1 = (d1 - maxRadius) / d1;
        var pStart = [
          pPrev[0] + ratio1 * (pCur[0] - pPrev[0]),
          pPrev[1] + ratio1 * (pCur[1] - pPrev[1])
        ];

        // Điểm kết thúc cua (trên đoạn pCur -> pNext)
        var ratio2 = maxRadius / d2;
        var pEnd = [
          pCur[0] + ratio2 * (pNext[0] - pCur[0]),
          pCur[1] + ratio2 * (pNext[1] - pCur[1])
        ];

        smoothed.push(pStart);

        // Thêm các điểm nội suy cong bậc 2 (Quadratic Bézier) giữa pStart, pCur (control point), pEnd
        var numSteps = angleDiff > 60 ? 5 : 4;
        for (var step = 1; step < numSteps; step++) {
          var t = step / numSteps;
          var oneMinusT = 1 - t;
          var lat = oneMinusT * oneMinusT * pStart[0] + 2 * oneMinusT * t * pCur[0] + t * t * pEnd[0];
          var lng = oneMinusT * oneMinusT * pStart[1] + 2 * oneMinusT * t * pCur[1] + t * t * pEnd[1];
          smoothed.push([lat, lng]);
        }

        smoothed.push(pEnd);
      }

      smoothed.push(cleaned[cleaned.length - 1]);
      return smoothed;
    }

    // Vẽ và gửi thông tin tuyến đường
    function renderAndFinishRoute(coords, distanceMeters, durationMinutes, gateInfo) {
      if (!coords || coords.length < 2) return;

      var finalCoords = smoothRouteCoordinates(coords);

      activeRouteState.isActive = true;
      activeRouteState.coords = finalCoords;
      activeRouteState.gateInfo = gateInfo;
      activeRouteState.lastPassedSegmentIndex = 0;
      activeRouteState.totalDistance = distanceMeters;

      // 1. Đoạn đường đã đi qua (Màu xám Slate #94A3B8 theo khuyến nghị người dùng)
      activeRouteState.traversedPoly = L.polyline([], {
        color: '#94A3B8',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1.0
      }).addTo(routeLayerGroup);

      // 2. Lớp phát sáng xanh dưới lộ trình còn lại
      activeRouteState.remainingGlow = L.polyline(finalCoords, {
        color: '#93C5FD',
        weight: 8,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1.0
      }).addTo(routeLayerGroup);

      // 3. Lộ trình còn lại phía trước (Màu xanh dương #2563EB)
      activeRouteState.remainingPoly = L.polyline(finalCoords, {
        color: '#2563EB',
        weight: 5,
        opacity: 0.95,
        className: 'walking-route-path',
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1.0
      }).addTo(routeLayerGroup);

      // Tự động xoay bản đồ theo hướng lộ trình như Google Maps (hướng đi luôn thẳng lên trên)
      var routeBearing = computeInitialRouteBearing(finalCoords);
      applyBearing(routeBearing, true);

      // Cập nhật góc và vị trí của hình tam giác điều hướng
      updateUserHeading(routeBearing);
      updateUserLocation(finalCoords[0][0], finalCoords[0][1], 10, routeBearing);

      // Đưa hình tam giác vị trí hiện tại về GIỮA MÀN HÌNH và ZOOM như Google Maps
      map.setView([finalCoords[0][0], finalCoords[0][1]], 18, {
        animate: true,
        duration: 0.6
      });

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ROUTE_INFO',
          distanceMeters: distanceMeters,
          durationMinutes: durationMinutes,
          gateId: gateInfo ? gateInfo.id : null,
          gateName: gateInfo ? gateInfo.name : null,
          bearing: routeBearing
        }));
      }
    }

    // Cập nhật tiến trình đi bộ thời gian thực:
    // 1. Quãng đường đã đi qua chuyển sang màu xám (#94A3B8)
    // 2. Quãng đường còn lại tiếp tục giữ màu xanh (#2563EB)
    // 3. Tự động tính toán lại số mét còn lại và thời gian đi bộ theo khúc cua thực tế
    function updateRouteProgress(userLat, userLng) {
      if (!activeRouteState.isActive || !activeRouteState.coords || activeRouteState.coords.length < 2) {
        return;
      }

      var coords = activeRouteState.coords;
      var numPts = coords.length;
      var destPt = coords[numPts - 1];

      // Khoảng cách trực tiếp tới điểm đến
      var distToDestination = getDistanceMeters(userLat, userLng, destPt[0], destPt[1]);

      // Nếu đã đến rất gần điểm đích (<= 8 mét)
      if (distToDestination <= 8) {
        if (activeRouteState.traversedPoly) {
          activeRouteState.traversedPoly.setLatLngs(coords);
        }
        if (activeRouteState.remainingPoly) {
          activeRouteState.remainingPoly.setLatLngs([]);
        }
        if (activeRouteState.remainingGlow) {
          activeRouteState.remainingGlow.setLatLngs([]);
        }
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ROUTE_PROGRESS',
            remainingDistanceMeters: 0,
            remainingMinutes: 0,
            arrived: true
          }));
        }
        return;
      }

      var bestIdx = activeRouteState.lastPassedSegmentIndex;
      var bestT = 0;
      var bestQ = coords[bestIdx];
      var minDistance = Infinity;

      // Giới hạn tìm kiếm từ segment hiện tại trở đi (cho phép lùi 1 segment để dung sai rung lắc GPS)
      var startSeg = Math.max(0, activeRouteState.lastPassedSegmentIndex - 1);

      for (var i = startSeg; i < numPts - 1; i++) {
        var A = coords[i];
        var B = coords[i + 1];

        var latMid = ((A[0] + B[0]) / 2) * (Math.PI / 180);
        var mPerDegLat = 110574;
        var mPerDegLng = 111320 * Math.cos(latMid);

        var Vx = (B[1] - A[1]) * mPerDegLng;
        var Vy = (B[0] - A[0]) * mPerDegLat;
        var lenSq = Vx * Vx + Vy * Vy;

        if (lenSq < 0.001) continue;

        var Ux = (userLng - A[1]) * mPerDegLng;
        var Uy = (userLat - A[0]) * mPerDegLat;

        var t = (Ux * Vx + Uy * Vy) / lenSq;
        var clampedT = Math.max(0, Math.min(1, t));

        var Qlat = A[0] + clampedT * (B[0] - A[0]);
        var Qlng = A[1] + clampedT * (B[1] - A[1]);

        var dist = getDistanceMeters(userLat, userLng, Qlat, Qlng);

        // Ưu tiên các segment phía trước nếu khoảng cách tương đương (giảm hiện tượng nhảy ngược)
        var forwardBias = (i - startSeg) * 0.15;
        if (dist - forwardBias < minDistance) {
          minDistance = dist - forwardBias;
          bestIdx = i;
          bestT = clampedT;
          bestQ = [Qlat, Qlng];
        }
      }

      // Cập nhật mốc phân đoạn đã đi qua (chống thụt lùi khi GPS dao động)
      if (bestIdx > activeRouteState.lastPassedSegmentIndex) {
        activeRouteState.lastPassedSegmentIndex = bestIdx;
      }

      // Tạo mảng tọa độ đã đi qua (Màu xám)
      var traversed = [];
      for (var k = 0; k <= bestIdx; k++) {
        traversed.push(coords[k]);
      }
      if (bestT > 0.02 && bestT < 0.98) {
        traversed.push(bestQ);
      }

      // Tạo mảng tọa độ còn lại cần đi (Màu xanh)
      var remaining = [];
      if (bestT > 0.02 && bestT < 0.98) {
        remaining.push(bestQ);
      }
      for (var m = bestIdx + 1; m < numPts; m++) {
        remaining.push(coords[m]);
      }

      if (remaining.length === 0) {
        remaining.push(destPt);
      }

      // Cập nhật hiển thị bản đồ
      if (activeRouteState.traversedPoly) {
        activeRouteState.traversedPoly.setLatLngs(traversed);
      }
      if (activeRouteState.remainingPoly) {
        activeRouteState.remainingPoly.setLatLngs(remaining);
      }
      if (activeRouteState.remainingGlow) {
        activeRouteState.remainingGlow.setLatLngs(remaining);
      }

      // Tính tổng khoảng cách còn lại chính xác theo các khúc cua
      var remDist = 0;
      for (var r = 0; r < remaining.length - 1; r++) {
        remDist += getDistanceMeters(
          remaining[r][0], remaining[r][1],
          remaining[r + 1][0], remaining[r + 1][1]
        );
      }
      remDist = Math.round(remDist);
      var remMinutes = Math.max(remDist > 0 ? 1 : 0, Math.round(remDist / 80));

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ROUTE_PROGRESS',
          remainingDistanceMeters: remDist,
          remainingMinutes: remMinutes,
          arrived: remDist <= 8
        }));
      }
    }

    // Vẽ đường đi bộ trực tiếp ngay trên bản đồ
    // Quy tắc: Ô viền làm tường (không cho đi xuyên qua), chỉ được qua Cổng trước và Cổng sau
    // Phía ngoài khu vực trường lấy chỉ đường gg map (đường phố ngoài), khi vào khuôn viên trường mới lấy đường thiết kế nội bộ
    function drawWalkingRoute(origLat, origLng, destLat, destLng, origName, destName, preferredGateId) {
      routeLayerGroup.clearLayers();

      // Cập nhật vị trí mốc xuất phát cho hình tam giác điều hướng người dùng
      updateUserLocation(origLat, origLng, 10);

      var endIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="route-pin" style="background-color: #EF4444;">B</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([destLat, destLng], { icon: endIcon, zIndexOffset: 990 }).addTo(routeLayerGroup);

      var origIn = isPointInCampus(origLat, origLng);
      var destIn = isPointInCampus(destLat, destLng);

      // TRƯỜNG HỢP 1: CẢ 2 ĐỀU Ở TRONG KHUÔN VIÊN TRƯỜNG
      // Đi 100% bằng đường thiết kế nội bộ, tuyệt đối không ra ngoài hay xuyên tường
      if (origIn && destIn) {
        var internalRoute = findCampusWalkwayRoute(origLat, origLng, destLat, destLng);
        if (internalRoute && internalRoute.coordinates && internalRoute.coordinates.length >= 2) {
          renderAndFinishRoute(internalRoute.coordinates, internalRoute.distanceMeters, internalRoute.durationMinutes, null);
          return;
        }
        drawFallbackDirectRoute(origLat, origLng, destLat, destLng);
        return;
      }

      // TRƯỜNG HỢP 2: CẢ 2 ĐỀU Ở NGOÀI KHUÔN VIÊN TRƯỜNG
      // Đi hoàn toàn trên đường phố công cộng (OSRM / Google Maps)
      if (!origIn && !destIn) {
        fetchExternalOsrmRoute(origLat, origLng, destLat, destLng, function(coords, dist, dur) {
          if (coords && coords.length >= 2) {
            renderAndFinishRoute(coords, dist, dur, null);
          } else {
            drawFallbackDirectRoute(origLat, origLng, destLat, destLng);
          }
        });
        return;
      }

      // TRƯỜNG HỢP 3: TỪ NGOÀI KHU VỰC TRƯỜNG VÀO TRONG KHUÔN VIÊN TRƯỜNG
      // Phía ngoài lấy chỉ đường của gg map, đến cổng trường mới lấy đường thiết kế nội bộ
      if (!origIn && destIn) {
        var gate = getBestGate(origLat, origLng, destLat, destLng, true, preferredGateId);
        if (!gate) {
          drawFallbackDirectRoute(origLat, origLng, destLat, destLng);
          return;
        }

        // Đoạn trong: từ Cổng trường (điểm trong) đi theo đường thiết kế đến đích
        var internalRoute = findCampusWalkwayRoute(gate.insidePoint[0], gate.insidePoint[1], destLat, destLng);
        var intCoords = (internalRoute && internalRoute.coordinates && internalRoute.coordinates.length >= 2)
          ? internalRoute.coordinates
          : [gate.insidePoint, [destLat, destLng]];
        var intDist = (internalRoute && internalRoute.distanceMeters)
          ? internalRoute.distanceMeters
          : getDistanceMeters(gate.insidePoint[0], gate.insidePoint[1], destLat, destLng);

        // Đoạn ngoài: từ điểm xuất phát đến Điểm đón ngoài của Cổng đã chọn
        fetchExternalOsrmRoute(origLat, origLng, gate.outsidePoint[0], gate.outsidePoint[1], function(extCoords, extDist, extDur) {
          var safeExt = (extCoords && extCoords.length >= 2) ? extCoords : [[origLat, origLng], gate.outsidePoint];
          var safeExtDist = (extDist !== null && extDist !== undefined)
            ? extDist
            : getDistanceMeters(origLat, origLng, gate.outsidePoint[0], gate.outsidePoint[1]);

          // Ghép nối: [Đường phố ngoài] + [Cổng trường] + [Đường thiết kế nội bộ]
          var gateTransition = [gate.outsidePoint, gate.gatePoint, gate.insidePoint];
          var combinedCoords = stitchPathCoordinates(safeExt, gateTransition, intCoords);
          var totalDist = Math.round(safeExtDist + getDistanceMeters(gate.outsidePoint[0], gate.outsidePoint[1], gate.insidePoint[0], gate.insidePoint[1]) + intDist);
          var totalDur = Math.max(1, Math.round(totalDist / 75));

          renderAndFinishRoute(combinedCoords, totalDist, totalDur, gate);
        });
        return;
      }

      // TRƯỜNG HỢP 4: TỪ TRONG KHUÔN VIÊN TRƯỜNG ĐI RA NGOÀI ĐƯỜNG
      if (origIn && !destIn) {
        var gate = getBestGate(origLat, origLng, destLat, destLng, false, preferredGateId);
        if (!gate) {
          drawFallbackDirectRoute(origLat, origLng, destLat, destLng);
          return;
        }

        // Đoạn trong: từ điểm xuất phát theo đường thiết kế ra Cổng trường
        var internalRoute = findCampusWalkwayRoute(origLat, origLng, gate.insidePoint[0], gate.insidePoint[1]);
        var intCoords = (internalRoute && internalRoute.coordinates && internalRoute.coordinates.length >= 2)
          ? internalRoute.coordinates
          : [[origLat, origLng], gate.insidePoint];
        var intDist = (internalRoute && internalRoute.distanceMeters)
          ? internalRoute.distanceMeters
          : getDistanceMeters(origLat, origLng, gate.insidePoint[0], gate.insidePoint[1]);

        // Đoạn ngoài: từ Điểm đón ngoài của Cổng đến đích đến
        fetchExternalOsrmRoute(gate.outsidePoint[0], gate.outsidePoint[1], destLat, destLng, function(extCoords, extDist, extDur) {
          var safeExt = (extCoords && extCoords.length >= 2) ? extCoords : [gate.outsidePoint, [destLat, destLng]];
          var safeExtDist = (extDist !== null && extDist !== undefined)
            ? extDist
            : getDistanceMeters(gate.outsidePoint[0], gate.outsidePoint[1], destLat, destLng);

          // Ghép nối: [Đường thiết kế nội bộ] + [Cổng trường] + [Đường phố ngoài]
          var gateTransition = [gate.insidePoint, gate.gatePoint, gate.outsidePoint];
          var combinedCoords = stitchPathCoordinates(intCoords, gateTransition, safeExt);
          var totalDist = Math.round(intDist + getDistanceMeters(gate.insidePoint[0], gate.insidePoint[1], gate.outsidePoint[0], gate.outsidePoint[1]) + safeExtDist);
          var totalDur = Math.max(1, Math.round(totalDist / 75));

          renderAndFinishRoute(combinedCoords, totalDist, totalDur, gate);
        });
        return;
      }
    }

    function drawFallbackDirectRoute(origLat, origLng, destLat, destLng) {
      var waypoints = [[origLat, origLng], [destLat, destLng]];
      var dist = getDistanceMeters(origLat, origLng, destLat, destLng);
      var dur = Math.max(1, Math.round(dist / 80));
      renderAndFinishRoute(waypoints, dist, dur, null);
    }

    function clearRoute() {
      routeLayerGroup.clearLayers();
      activeRouteState.isActive = false;
      activeRouteState.coords = [];
      activeRouteState.traversedPoly = null;
      activeRouteState.remainingPoly = null;
      activeRouteState.remainingGlow = null;
      activeRouteState.lastPassedSegmentIndex = 0;
      applyBearing(0, true);
    }

    window.addEventListener('message', function(event) {
      handleRNMessage(event.data);
    });
    document.addEventListener('message', function(event) {
      handleRNMessage(event.data);
    });

    function handleRNMessage(raw) {
      try {
        var msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!msg || !msg.type) return;

        switch (msg.type) {
          case 'FOCUS_LOCATION':
            if (msg.id) {
              setActiveMarker(msg.id);
            }
            map.flyTo([msg.lat, msg.lng], msg.zoom || 18, { animate: true, duration: 0.8 });
            break;

          case 'DRAW_ROUTE':
            drawWalkingRoute(
              msg.origin.lat,
              msg.origin.lng,
              msg.destination.lat,
              msg.destination.lng,
              msg.originName,
              msg.destinationName,
              msg.gateId
            );
            break;

          case 'CLEAR_ROUTE':
            clearRoute();
            break;

          case 'UPDATE_USER_LOCATION':
            updateUserLocation(msg.lat, msg.lng, msg.accuracy, msg.heading, msg.centerOnUser);
            break;

          case 'UPDATE_USER_HEADING':
            updateUserHeading(msg.heading);
            break;

          case 'SET_BEARING':
            applyBearing(msg.bearing, msg.animated !== false);
            break;

          case 'SWITCH_LAYER':
            if (msg.layer === 'satellite') {
              if (!map.hasLayer(googleSatLayer)) {
                googleSatLayer.addTo(map);
              }
              updateSatelliteClip();
              currentLayer = 'satellite';
            } else {
              if (map.hasLayer(googleSatLayer)) {
                map.removeLayer(googleSatLayer);
              }
              currentLayer = 'osm';
            }
            break;

          case 'ZOOM_IN':
            map.zoomIn();
            break;

          case 'ZOOM_OUT':
            map.zoomOut();
            break;

          case 'FILTER_CATEGORY':
            filterCategory(msg.category);
            break;

          case 'SET_CAMPUS_PATHS':
            if (msg.paths && Array.isArray(msg.paths)) {
              campusPathsData = msg.paths;
              campusGraphCache = null;
              webviewRouteCache = {};
              renderCampusPathsNetwork(campusPathsData);
            }
            break;

          case 'UPDATE_LOCATIONS':
            if (msg.locations && Array.isArray(msg.locations)) {
              renderLocationMarkers(msg.locations);
            }
            break;

          case 'RESET_VIEW':
            applyBearing(0, true);
            map.flyTo(centerData, 17, { animate: true, duration: 1.0 });
            break;

          case 'REQUEST_LOCATION_DISTANCE':
            computeRouteDistanceToLoc(msg.lat, msg.lng, function(distMeters, durMin) {
              if (window.ReactNativeWebView && distMeters !== null && distMeters !== undefined) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'LOCATION_DISTANCE_RESULT',
                  id: msg.id,
                  distanceMeters: distMeters,
                  durationMinutes: durMin
                }));
              }
            });
            break;
        }
      } catch (err) {
        console.error('Lỗi nhận message:', err);
      }
    }

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>`;
  htmlCache.set(cacheKey, finalHtml);
  return finalHtml;
}

