import { LocationItem } from "./types";

export function generateLeafletMapHtml(
  locations: LocationItem[],
  boundary: [number, number][],
  center: [number, number] = [12.65067, 108.02621]
): string {
  const locationsJson = JSON.stringify(locations);
  const boundaryJson = JSON.stringify(boundary);
  const centerJson = JSON.stringify(center);

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
      background: #0F172A;
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
      background: #0F172A;
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
      background: #0F172A;
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

    // Khởi tạo bản đồ trung tâm Trường ĐH Tây Nguyên
    var map = L.map('map', {
      center: centerData,
      zoom: 17,
      minZoom: 15.5,
      maxZoom: 19,
      zoomControl: false,
      maxBounds: [
        [12.6460, 108.0210],
        [12.6555, 108.0310]
      ],
      maxBoundsViscosity: 0.95
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

    // Lớp Bản đồ OpenStreetMap chuẩn
    var osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap'
    }).addTo(map);

    // Lớp Vệ tinh Esri World Imagery
    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri Satellite'
    });

    var currentLayer = 'osm';

    // ── CẮT HẾT CÁC VÙNG BÊN NGOÀI BẰNG LỚP MẶT NẠ (INVERTED POLYGON MASK) ──
    // Vòng ngoài bao phủ rộng lớn toàn cầu
    var outerWorldCoords = [
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180]
    ];
    // Đa giác rỗng ở giữa (hole) chính là boundaryData của trường ĐH Tây Nguyên
    var maskPolygon = L.polygon([outerWorldCoords, boundaryData], {
      color: 'transparent',
      fillColor: '#0F172A',
      fillOpacity: 0.94,
      interactive: false,
      zIndex: 400
    }).addTo(map);

    // Đường viền rực rỡ bám sát ranh giới trường
    var boundaryOutline = L.polyline(boundaryData.concat([boundaryData[0]]), {
      color: '#3B82F6',
      weight: 3.5,
      opacity: 0.95
    }).addTo(map);

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

    // Vẽ đường đi bộ trực tiếp ngay trên bản đồ
    function drawWalkingRoute(origLat, origLng, destLat, destLng, origName, destName) {
      routeLayerGroup.clearLayers();

      var startIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="route-pin" style="background-color: #10B981;">A</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([origLat, origLng], { icon: startIcon }).addTo(routeLayerGroup);

      var endIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="route-pin" style="background-color: #EF4444;">B</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([destLat, destLng], { icon: endIcon }).addTo(routeLayerGroup);

      var osrmUrl = 'https://router.project-osrm.org/route/v1/walking/' +
        origLng + ',' + origLat + ';' + destLng + ',' + destLat +
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

            map.fitBounds(routePoly.getBounds(), { padding: [25, 25], animate: true });

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ROUTE_INFO',
                distanceMeters: distMeters,
                durationMinutes: durMin
              }));
            }
          } else {
            drawFallbackDirectRoute(origLat, origLng, destLat, destLng);
          }
        })
        .catch(function(err) {
          drawFallbackDirectRoute(origLat, origLng, destLat, destLng);
        });
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
              map.removeLayer(osmLayer);
              satelliteLayer.addTo(map);
              currentLayer = 'satellite';
            } else {
              map.removeLayer(satelliteLayer);
              osmLayer.addTo(map);
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

