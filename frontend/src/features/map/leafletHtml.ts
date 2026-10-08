import { LocationItem, CampusPath, CampusGate } from "./types";
import { TNU_CAMPUS_GATES } from "./constants";

export function generateLeafletMapHtml(
  locations: LocationItem[],
  boundary: [number, number][],
  center: [number, number] = [12.65067, 108.02621],
  campusPaths: CampusPath[] = [],
  gates: CampusGate[] = TNU_CAMPUS_GATES
): string {
  const locationsJson = JSON.stringify(locations);
  const boundaryJson = JSON.stringify(boundary);
  const centerJson = JSON.stringify(center);
  const campusPathsJson = JSON.stringify(campusPaths);
  const gatesJson = JSON.stringify(gates);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
    /* Khung xoay bao phủ toàn bộ màn hình kể cả xoay 360 độ trên màn hình điện thoại dài */
    #map-rotator {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 160vmax;
      height: 160vmax;
      margin-left: -80vmax;
      margin-top: -80vmax;
      transform-origin: 50% 50%;
      will-change: transform;
    }
    #map {
      width: 100%;
      height: 100%;
      background: #F8FAFC;
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

    // Khởi tạo bản đồ trung tâm Trường ĐH Tây Nguyên (Không giới hạn vùng di chuyển, mở lên luôn căn giữa trường)
    var map = L.map('map', {
      center: centerData,
      zoom: 17,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false
    });

    map.whenReady(function() {
      applyBearing(0, false);
    });

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

    // Kích hoạt lớp vệ tinh khuôn viên và đồng bộ clip-path khi bản đồ di chuyển/zoom
    googleSatLayer.addTo(map);
    map.on('zoom viewreset moveend resize move', updateSatelliteClip);
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
        var gateIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div class="gate-badge-marker ' + (g.id === 'back_gate' ? 'back-gate' : '') + '">' +
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
      'layers': '<svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
      'map-pin': '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    };

    var markerObjects = {};
    var currentActiveMarkerId = null;

    // Render 37 markers địa điểm
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

      var marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      marker.on('click', function() {
        setActiveMarker(loc.id);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SELECT_LOCATION',
            id: loc.id
          }));
        }
      });

      markerObjects[loc.id] = marker;
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
      locationsData.forEach(function(loc) {
        var m = markerObjects[loc.id];
        if (!m) return;
        var el = m.getElement();
        if (!el) return;
        if (isAll || (loc.category && loc.category.toLowerCase() === cat.toLowerCase())) {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
        } else {
          el.style.opacity = '0.22';
          el.style.pointerEvents = 'none';
        }
      });
    }

    // Biến quản lý User Location và Tuyến đường (Routing)
    var userLocationMarker = null;
    var routeLayerGroup = L.layerGroup().addTo(map);

    function updateUserLocation(lat, lng) {
      if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng]);
      } else {
        var userIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">' +
            '<div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(16,185,129,0.3);animation:pulseAnim 2s infinite;"></div>' +
            '<div style="width:14px;height:14px;border-radius:50%;background:#10B981;border:2.5px solid #FFFFFF;box-shadow:0 2px 5px rgba(0,0,0,0.4);"></div>' +
          '</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
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

    // Thuật toán Dijkstra tìm đường đi bộ tối ưu qua mạng lưới lối đi nội bộ trường
    function findCampusWalkwayRoute(origLat, origLng, destLat, destLng) {
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

      // Nối các giao lộ (những điểm thuộc các tuyến khác nhau cách nhau <= 12m)
      for (var i = 0; i < vertices.length; i++) {
        for (var j = i + 1; j < vertices.length; j++) {
          var d = getDistanceMeters(vertices[i][0], vertices[i][1], vertices[j][0], vertices[j][1]);
          if (d <= 12) {
            addEdge(i, j, Math.max(1, d));
          }
        }
      }

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

      // Dijkstra
      var dist = {};
      var prev = {};
      var visited = {};
      var pq = [{ node: startNode, dist: 0 }];
      dist[startNode] = 0;

      while (pq.length > 0) {
        pq.sort(function(a, b) { return a.dist - b.dist; });
        var cur = pq.shift();
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

      return {
        coordinates: routeCoords,
        distanceMeters: totalDistMeters,
        durationMinutes: durMinutes
      };
    }

    // Kiểm tra tọa độ có nằm bên trong tường bao khuôn viên trường không (Ray-casting)
    function isPointInCampus(lat, lng) {
      if (!boundaryData || boundaryData.length < 3) return true;
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
    function getBestGate(origLat, origLng, destLat, destLng, isEntering) {
      if (!gatesData || gatesData.length === 0) return null;
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

    // Lấy chỉ đường ngoài đường phố công cộng qua OSRM (Google Maps road network)
    function fetchExternalOsrmRoute(startLat, startLng, targetLat, targetLng, callback) {
      var osrmUrl = 'https://router.project-osrm.org/route/v1/walking/' +
        startLng + ',' + startLat + ';' + targetLng + ',' + targetLat +
        '?overview=full&geometries=geojson';

      fetch(osrmUrl)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.routes && data.routes.length > 0) {
            var coords = data.routes[0].geometry.coordinates.map(function(c) {
              return [c[1], c[0]];
            });
            var distMeters = Math.round(data.routes[0].distance);
            var durMin = Math.max(1, Math.round(data.routes[0].duration / 60));
            callback(coords, distMeters, durMin);
          } else {
            callback(null, null, null);
          }
        })
        .catch(function(err) {
          callback(null, null, null);
        });
    }

    // Vẽ và gửi thông tin tuyến đường
    function renderAndFinishRoute(coords, distanceMeters, durationMinutes) {
      if (!coords || coords.length < 2) return;

      L.polyline(coords, {
        color: '#93C5FD',
        weight: 8,
        opacity: 0.6
      }).addTo(routeLayerGroup);

      var routePoly = L.polyline(coords, {
        color: '#2563EB',
        weight: 5,
        opacity: 0.95,
        className: 'walking-route-path'
      }).addTo(routeLayerGroup);

      map.fitBounds(routePoly.getBounds(), { padding: [35, 35], animate: true });

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ROUTE_INFO',
          distanceMeters: distanceMeters,
          durationMinutes: durationMinutes
        }));
      }
    }

    // Vẽ đường đi bộ trực tiếp ngay trên bản đồ
    // Quy tắc: Ô viền làm tường (không cho đi xuyên qua), chỉ được qua Cổng trước và Cổng sau
    // Phía ngoài khu vực trường lấy chỉ đường gg map (đường phố ngoài), khi vào khuôn viên trường mới lấy đường thiết kế nội bộ
    function drawWalkingRoute(origLat, origLng, destLat, destLng, origName, destName) {
      routeLayerGroup.clearLayers();

      var startIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="route-pin" style="background-color: #10B981;">A</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([origLat, origLng], { icon: startIcon, zIndexOffset: 990 }).addTo(routeLayerGroup);

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
          renderAndFinishRoute(internalRoute.coordinates, internalRoute.distanceMeters, internalRoute.durationMinutes);
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
            renderAndFinishRoute(coords, dist, dur);
          } else {
            drawFallbackDirectRoute(origLat, origLng, destLat, destLng);
          }
        });
        return;
      }

      // TRƯỜNG HỢP 3: TỪ NGOÀI KHU VỰC TRƯỜNG VÀO TRONG KHUÔN VIÊN TRƯỜNG
      // Phía ngoài lấy chỉ đường của gg map, đến cổng trường mới lấy đường thiết kế nội bộ
      if (!origIn && destIn) {
        var gate = getBestGate(origLat, origLng, destLat, destLng, true);
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

          renderAndFinishRoute(combinedCoords, totalDist, totalDur);
        });
        return;
      }

      // TRƯỜNG HỢP 4: TỪ TRONG KHUÔN VIÊN TRƯỜNG ĐI RA NGOÀI ĐƯỜNG
      if (origIn && !destIn) {
        var gate = getBestGate(origLat, origLng, destLat, destLng, false);
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

          renderAndFinishRoute(combinedCoords, totalDist, totalDur);
        });
        return;
      }
    }

    function drawFallbackDirectRoute(origLat, origLng, destLat, destLng) {
      var waypoints = [[origLat, origLng], [destLat, destLng]];
      var poly = L.polyline(waypoints, {
        color: '#2563EB',
        weight: 5,
        opacity: 0.9,
        className: 'walking-route-path'
      }).addTo(routeLayerGroup);

      map.fitBounds(poly.getBounds(), { padding: [50, 50], animate: true });

      var R = 6371000;
      var dLat = (destLat - origLat) * Math.PI / 180;
      var dLon = (destLng - origLng) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(origLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var dist = Math.round(R * c);
      var dur = Math.max(1, Math.round(dist / 80));

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ROUTE_INFO',
          distanceMeters: dist,
          durationMinutes: dur
        }));
      }
    }

    function clearRoute() {
      routeLayerGroup.clearLayers();
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
            setActiveMarker(msg.id);
            map.flyTo([msg.lat, msg.lng], 18, { animate: true, duration: 1.0 });
            break;

          case 'DRAW_ROUTE':
            drawWalkingRoute(
              msg.origin.lat,
              msg.origin.lng,
              msg.destination.lat,
              msg.destination.lng,
              msg.originName,
              msg.destinationName
            );
            break;

          case 'CLEAR_ROUTE':
            clearRoute();
            break;

          case 'UPDATE_USER_LOCATION':
            updateUserLocation(msg.lat, msg.lng);
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
              renderCampusPathsNetwork(campusPathsData);
            }
            break;

          case 'RESET_VIEW':
            applyBearing(0, true);
            map.flyTo(centerData, 17, { animate: true, duration: 1.0 });
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
}

