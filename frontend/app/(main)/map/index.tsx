import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Platform, Linking, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetMapLocations } from "../../../src/services/api";
import {
  LocationItem,
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  TNU_CAMPUS_BOUNDARY,
  parseCampusRoom,
  findLocationByRoomOrQuery,
  generateLeafletMapHtml,
  MapSearchBar,
  MapControlsOverlay,
  MapLocationDetailCard,
} from "../../../src/features/map";

// Tái xuất các kiểu dữ liệu và hằng số để tương thích ngược nếu có module khác import
export type { LocationItem };
export { TAY_NGUYEN_CAMPUS_LOCATIONS, TNU_CAMPUS_BOUNDARY, parseCampusRoom, findLocationByRoomOrQuery };

export default function MapScreen() {
  const params = useLocalSearchParams<{ search?: string; room?: string; subject?: string }>();
  const webViewRef = useRef<WebView>(null);
  const [, setMapReady] = useState(false);

  const [targetRoom] = useState<string>(params.room ? String(params.room).trim() : "");
  const [targetSubject] = useState<string>(params.subject ? String(params.subject).trim() : "");
  const currentParsed = targetRoom ? parseCampusRoom(targetRoom) : null;

  // Giữ ô tìm kiếm trống nếu đi từ Home/Schedule có room
  const [search, setSearch] = useState<string>(() => {
    return params.search ? String(params.search).trim() : "";
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState<LocationItem[]>(TAY_NGUYEN_CAMPUS_LOCATIONS);

  // Chọn địa điểm ban đầu
  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(() => {
    const initialQuery = params.room || params.search || "";
    if (initialQuery) {
      const matched = findLocationByRoomOrQuery(String(initialQuery), TAY_NGUYEN_CAMPUS_LOCATIONS);
      if (matched) return matched;
    }
    return TAY_NGUYEN_CAMPUS_LOCATIONS[0];
  });

  // Chế độ bản đồ (osm | satellite)
  const [mapLayer, setMapLayer] = useState<"osm" | "satellite">("satellite");

  // Vị trí người dùng
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  // Trạng thái tuyến đường đi bộ đang vẽ
  const [activeRoute, setActiveRoute] = useState<{
    distanceMeters?: number;
    durationMinutes?: number;
  } | null>(null);

  // ─── TÍNH NĂNG XOAY MAP THEO LA BÀN & XOAY THỦ CÔNG ───────────────────────────
  const [bearing, setBearing] = useState<number>(0);
  const [compassMode, setCompassMode] = useState<boolean>(false);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Tải danh sách địa điểm từ API Backend nếu có
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await apiGetMapLocations();
        if (res && res.locations && Array.isArray(res.locations) && res.locations.length > 0 && isMounted) {
          const normalized: LocationItem[] = res.locations.map((l: any) => ({
            id: Number(l.id),
            name: String(l.name || ""),
            category: String(l.category || "Địa điểm"),
            building: String(l.building || l.name || ""),
            floor: String(l.floor || ""),
            description: String(l.description || ""),
            lat: Number(l.lat || 12.6509),
            lng: Number(l.lng || 108.0241),
            icon: String(l.icon || "map-pin"),
            x: Number(l.x ?? 50),
            y: Number(l.y ?? 50),
            color: String(l.color || "#2563EB"),
          }));
          setLocations(normalized);
        }
      } catch {
        // Dùng danh sách 37 địa điểm chuẩn đã được nạp
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lấy vị trí GPS của người dùng
  const requestUserLocation = useCallback(async (centerOnUser = false) => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);

      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "UPDATE_USER_LOCATION",
          lat: coords.latitude,
          lng: coords.longitude,
        })
      );

      if (centerOnUser) {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "FOCUS_LOCATION",
            lat: coords.latitude,
            lng: coords.longitude,
          })
        );
      }
    } catch (err) {
      console.warn("Lỗi vị trí:", err);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // ─── THEO DÕI HƯỚNG LA BÀN THIẾT BỊ (COMPASS HEADING) ĐÃ TỐI ƯU HÓA ────────
  const lastSentBearingRef = useRef<number>(0);
  const lastHeadingTimeRef = useRef<number>(0);

  const startCompassTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền vị trí", "Vui lòng cấp quyền vị trí để kích hoạt tính năng xoay theo la bàn.");
        return;
      }

      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
      }

      const sub = await Location.watchHeadingAsync((headingData) => {
        const h = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        if (h !== undefined && h !== null && !isNaN(h) && h >= 0) {
          const rounded = Math.round(h);
          const now = Date.now();
          const diff = Math.abs(rounded - lastSentBearingRef.current);
          if ((diff >= 3 || diff >= 357) && (now - lastHeadingTimeRef.current >= 120)) {
            lastSentBearingRef.current = rounded;
            lastHeadingTimeRef.current = now;
            setBearing(rounded);
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: "SET_BEARING",
                bearing: rounded,
                animated: true,
              })
            );
          }
        }
      });

      headingSubscriptionRef.current = sub;
      setCompassMode(true);
    } catch (err) {
      console.warn("Lỗi cảm biến la bàn:", err);
    }
  };

  const stopCompassTracking = () => {
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
    }
    setCompassMode(false);
  };

  const toggleCompassMode = () => {
    if (compassMode) {
      stopCompassTracking();
    } else {
      startCompassTracking();
    }
  };

  // Đặt lại hướng Bắc (0 độ)
  const handleResetBearing = () => {
    stopCompassTracking();
    setBearing(0);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "SET_BEARING",
        bearing: 0,
        animated: true,
      })
    );
  };

  // Xoay nhanh thủ công theo nấc (+30 độ hoặc -30 độ)
  const handleRotateStep = (delta: number) => {
    stopCompassTracking();
    const next = ((bearing + delta) % 360 + 360) % 360;
    setBearing(next);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "SET_BEARING",
        bearing: next,
        animated: true,
      })
    );
  };

  // Dọn dẹp đăng ký cảm biến khi rời màn hình
  useEffect(() => {
    return () => {
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
      }
    };
  }, []);

  // Khi bản đồ sẵn sàng, focus vào tòa nhà đang chọn
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (selectedLoc) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "FOCUS_LOCATION",
          id: selectedLoc.id,
          lat: selectedLoc.lat,
          lng: selectedLoc.lng,
        })
      );
    }
    // Chuyển sang lớp vệ tinh mặc định
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "SWITCH_LAYER",
        layer: "satellite",
      })
    );
    requestUserLocation(false);
  }, [selectedLoc, requestUserLocation]);

  // Xử lý thông điệp gửi từ Leaflet WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data) return;

      if (data.type === "MAP_READY") {
        handleMapReady();
      } else if (data.type === "SELECT_LOCATION") {
        const found = locations.find((l) => l.id === data.id);
        if (found) {
          setSelectedLoc(found);
        }
      } else if (data.type === "ROUTE_INFO") {
        setActiveRoute({
          distanceMeters: data.distanceMeters,
          durationMinutes: data.durationMinutes,
        });
      } else if (data.type === "MANUAL_ROTATE") {
        if (compassMode) {
          stopCompassTracking();
        }
        setBearing(data.bearing);
      }
    } catch (err) {
      console.error("Lỗi parse message từ webview:", err);
    }
  };

  // Focus tòa nhà khi chọn từ danh sách tìm kiếm
  const handleSelectLocation = (loc: LocationItem) => {
    setSelectedLoc(loc);
    setSearch(loc.name);
    setShowSuggestions(false);
    setActiveRoute(null);

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "FOCUS_LOCATION",
        id: loc.id,
        lat: loc.lat,
        lng: loc.lng,
      })
    );
  };

  // Chuyển đổi lớp bản đồ (Thường vs Vệ tinh)
  const handleToggleLayer = () => {
    const next = mapLayer === "osm" ? "satellite" : "osm";
    setMapLayer(next);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "SWITCH_LAYER",
        layer: next,
      })
    );
  };

  // Điều khiển Zoom
  const handleZoomIn = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_IN" }));
  };
  const handleZoomOut = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_OUT" }));
  };
  const handleResetView = () => {
    handleResetBearing();
    webViewRef.current?.postMessage(JSON.stringify({ type: "RESET_VIEW" }));
  };

  // Kích hoạt chỉ đường đi bộ trực tiếp ngay trên bản đồ Leaflet
  const handleStartInAppDirections = () => {
    if (!selectedLoc) return;

    const origin = userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : { lat: 12.651380, lng: 108.023660 };

    const originName = userLocation ? "Vị trí của bạn" : "Cổng chính Lê Duẩn";

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "DRAW_ROUTE",
        origin: origin,
        originName: originName,
        destination: { lat: selectedLoc.lat, lng: selectedLoc.lng },
        destinationName: selectedLoc.name,
      })
    );
  };

  // Hủy đường đi bộ đang hiển thị
  const handleClearRoute = () => {
    setActiveRoute(null);
    webViewRef.current?.postMessage(JSON.stringify({ type: "CLEAR_ROUTE" }));
  };

  // Mở ứng dụng Google Maps ngoài
  const handleOpenExternalGoogleMaps = () => {
    if (!selectedLoc) return;
    const { lat, lng, name } = selectedLoc;

    if (userLocation) {
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const dest = `${lat},${lng}`;
      const dirUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`;
      Linking.openURL(dirUrl).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
      return;
    }

    const scheme = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    Linking.openURL(scheme).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  // Gợi ý tìm kiếm
  const searchResults = search.trim()
    ? locations.filter((loc) => {
        const q = search.trim().toLowerCase();
        return (
          loc.name.toLowerCase().includes(q) ||
          loc.building.toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q) ||
          (loc.description && loc.description.toLowerCase().includes(q))
        );
      })
    : [];

  const matchedTargetId = targetRoom ? parseCampusRoom(targetRoom).buildingNumber : null;

  // Memoize mã nguồn HTML để WebView KHÔNG bị reload lại mỗi khi bearing hoặc userLocation thay đổi
  const mapHtmlSource = useMemo(() => {
    return {
      html: generateLeafletMapHtml(locations, TNU_CAMPUS_BOUNDARY),
    };
  }, [locations]);

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* ─── THANH ĐIỀU HƯỚNG TRÊN CÙNG ───────────────────────────────────── */}
      <NavHeader
        title="Bản đồ khuôn viên"
        subtitle="Đại học Tây Nguyên • Khuôn viên nội bộ"
      />

      {/* ─── Ô TÌM KIẾM TÒA NHÀ TRÊN CÙNG ─────────────────────────────────── */}
      <MapSearchBar
        search={search}
        showSuggestions={showSuggestions}
        searchResults={searchResults}
        onSearchChange={(text) => {
          setSearch(text);
          setShowSuggestions(true);
        }}
        onClearSearch={() => {
          setSearch("");
          setShowSuggestions(false);
        }}
        onFocus={() => setShowSuggestions(true)}
        onSelectLocation={handleSelectLocation}
      />

      {/* ─── KHUNG BẢN ĐỒ TƯƠNG TÁC (REACT-NATIVE-WEBVIEW + LEAFLET.JS) ────── */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F172A",
          position: "relative",
          marginHorizontal: 12,
          marginTop: 6,
          marginBottom: 95,
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1.5,
          borderColor: "#334155",
        }}
      >
        {/* Leaflet Web View */}
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={mapHtmlSource}
          onMessage={handleWebViewMessage}
          style={{ flex: 1, backgroundColor: "#0F172A" }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0F172A" }}>
              <ActivityIndicator size="large" color={AppColors.primary} />
            </View>
          )}
        />

        {/* ── CÁC NÚT ĐIỀU KHIỂN NỔI & LA BÀN ──────────────────────────────── */}
        <MapControlsOverlay
          mapLayer={mapLayer}
          bearing={bearing}
          compassMode={compassMode}
          locationLoading={locationLoading}
          hasUserLocation={Boolean(userLocation)}
          activeRoute={activeRoute}
          onToggleLayer={handleToggleLayer}
          onCompassPress={() => {
            if (bearing !== 0 && !compassMode) {
              handleResetBearing();
            } else {
              toggleCompassMode();
            }
          }}
          onResetBearing={handleResetBearing}
          onUserLocationPress={() => requestUserLocation(true)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onRotateStep={handleRotateStep}
          onClearRoute={handleClearRoute}
        />

        {/* ── THẺ CHI TIẾT TÒA NHÀ ĐANG CHỌN (GÓC DƯỚI BẢN ĐỒ) ──────────────── */}
        {selectedLoc && (
          <MapLocationDetailCard
            selectedLoc={selectedLoc}
            userLocation={userLocation}
            matchedTargetId={matchedTargetId}
            currentParsed={currentParsed}
            targetSubject={targetSubject}
            onClose={() => {
              setSelectedLoc(null);
              handleClearRoute();
            }}
            onStartDirections={handleStartInAppDirections}
            onOpenGoogleMaps={handleOpenExternalGoogleMaps}
          />
        )}
      </View>
    </View>
  );
}
