import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Platform, Linking, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { LoginRequiredCard } from "../../../src/components/LoginRequiredCard";
import { apiGetMapLocations } from "../../../src/services/api";
import {
  LocationItem,
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  TNU_CAMPUS_BOUNDARY,
  TNU_CAMPUS_CENTER,
  TNU_OSM_WAY_241971731_BOUNDARY,
  HOUSE_NUM_TO_ID,
  parseCampusRoom,
  findLocationByRoomOrQuery,
  generateLeafletMapHtml,
  MapSearchBar,
  MapControlsOverlay,
  MapLocationDetailCard,
} from "../../../src/features/map";

// Tái xuất các kiểu dữ liệu và hằng số để tương thích ngược nếu có module khác import
export type { LocationItem };
export {
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  TNU_CAMPUS_BOUNDARY,
  TNU_CAMPUS_CENTER,
  TNU_OSM_WAY_241971731_BOUNDARY,
  parseCampusRoom,
  findLocationByRoomOrQuery,
};

export default function MapScreen() {
  const params = useLocalSearchParams<{
    search?: string;
    room?: string;
    subject?: string;
    building?: string;
    buildingCode?: string;
    t?: string;
  }>();
  const webViewRef = useRef<WebView>(null);
  const isMapReadyRef = useRef<boolean>(false);
  const [, setMapReady] = useState(false);

  const [targetRoom, setTargetRoom] = useState<string>(params.room ? String(params.room).trim() : "");
  const [targetSubject, setTargetSubject] = useState<string>(params.subject ? String(params.subject).trim() : "");
  const currentParsed = targetRoom ? parseCampusRoom(targetRoom) : null;

  // Trạng thái đăng nhập (Khách / chưa đăng nhập không được xem bản đồ)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem("@auth_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const mssv = u.mssv || u.masv || "";
        if (mssv && mssv !== "guest") {
          setIsLoggedIn(true);
          return;
        }
      }
      setIsLoggedIn(false);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [checkAuth])
  );

  // Giữ ô tìm kiếm trống nếu đi từ Home/Schedule có room
  const [search, setSearch] = useState<string>(() => {
    return params.search ? String(params.search).trim() : "";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState<LocationItem[]>(TAY_NGUYEN_CAMPUS_LOCATIONS);

  // Chọn địa điểm ban đầu
  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(() => {
    const initialQuery = params.building || params.room || params.search || "";
    if (initialQuery) {
      const matched = findLocationByRoomOrQuery(String(initialQuery), TAY_NGUYEN_CAMPUS_LOCATIONS);
      if (matched) return matched;
    }
    return TAY_NGUYEN_CAMPUS_LOCATIONS[0];
  });

  // Cập nhật và focus đúng tòa giảng đường khi params thay đổi (ví dụ: bấm "Xem trên bản đồ" từ Thời khóa biểu)
  useEffect(() => {
    const roomParam = params.room ? String(params.room).trim() : "";
    const subjectParam = params.subject ? String(params.subject).trim() : "";
    const buildingParam = params.building ? String(params.building).trim() : "";
    const buildingCodeParam = params.buildingCode ? String(params.buildingCode).trim() : "";
    const searchParam = params.search ? String(params.search).trim() : "";

    const query = buildingParam || buildingCodeParam || roomParam || searchParam;
    if (!query) return;

    if (roomParam) setTargetRoom(roomParam);
    if (subjectParam) setTargetSubject(subjectParam);
    if (searchParam) setSearch(searchParam);

    const matched =
      (buildingParam ? findLocationByRoomOrQuery(buildingParam, locations) : null) ||
      (buildingCodeParam ? findLocationByRoomOrQuery(buildingCodeParam, locations) : null) ||
      (roomParam ? findLocationByRoomOrQuery(roomParam, locations) : null) ||
      (searchParam ? findLocationByRoomOrQuery(searchParam, locations) : null);

    if (matched) {
      setSelectedLoc(matched);
      setActiveRoute(null);

      const sendFocus = () => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "FOCUS_LOCATION",
            id: matched.id,
            lat: matched.lat,
            lng: matched.lng,
          })
        );
      };

      if (isMapReadyRef.current) {
        sendFocus();
        const t = setTimeout(sendFocus, 200);
        return () => clearTimeout(t);
      }
    }
  }, [params.room, params.subject, params.building, params.buildingCode, params.search, params.t, locations]);

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
            lat: Number(l.lat || TNU_CAMPUS_CENTER.lat),
            lng: Number(l.lng || TNU_CAMPUS_CENTER.lng),
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
    isMapReadyRef.current = true;
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
        setShowSuggestions(false);
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

  // Chọn danh mục từ băng lọc chip
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setShowSuggestions(false);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "FILTER_CATEGORY",
        category: catId,
      })
    );
  };

  // Focus tòa nhà khi chọn từ danh sách tìm kiếm
  const handleSelectLocation = (loc: LocationItem) => {
    setSelectedLoc(loc);

    // Nếu query tìm kiếm là mã phòng (2.20, 8.3.4,...), lưu lại để card hiển thị đầy đủ chi tiết phòng
    const parsed = parseCampusRoom(search);
    if (parsed.buildingNumber && HOUSE_NUM_TO_ID[parsed.buildingNumber] === loc.id) {
      setTargetRoom(search.trim());
      setSearch(parsed.fullDisplay);
    } else {
      setSearch(loc.name);
    }

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

  // Xử lý khi nhấn nút Search / Enter trên bàn phím
  const handleSearchSubmit = () => {
    if (!search.trim()) return;
    const matched = findLocationByRoomOrQuery(search, locations) || searchResults[0];
    if (matched) {
      handleSelectLocation(matched);
    }
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

  // Gợi ý tìm kiếm & lọc theo danh mục
  const searchResults = useMemo(() => {
    let list = locations;
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((loc) => loc.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;

    // 1. Kiểm tra xem query có trỏ tới tòa nhà/phòng học cụ thể nào không (vd: 2.20 -> Nhà 2, 8.3.4 -> Nhà 8, 304.GD3 -> Nhà 3,...)
    const matchedByRoom = findLocationByRoomOrQuery(q, locations);

    const filtered = list.filter((loc) => {
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.building.toLowerCase().includes(q) ||
        loc.category.toLowerCase().includes(q) ||
        (loc.description && loc.description.toLowerCase().includes(q))
      );
    });

    // Nếu tìm thấy địa điểm khớp theo phòng học (2.20, 8.3.4,...), đưa nó lên vị trí đầu tiên
    if (matchedByRoom) {
      const rest = filtered.filter((l) => l.id !== matchedByRoom.id);
      return [matchedByRoom, ...rest];
    }

    return filtered;
  }, [search, selectedCategory, locations]);

  const matchedTargetId = targetRoom ? parseCampusRoom(targetRoom).buildingNumber : null;

  // Memoize mã nguồn HTML để WebView KHÔNG bị reload lại mỗi khi bearing hoặc userLocation thay đổi
  const mapHtmlSource = useMemo(() => {
    return {
      html: generateLeafletMapHtml(locations, TNU_CAMPUS_BOUNDARY, [TNU_CAMPUS_CENTER.lat, TNU_CAMPUS_CENTER.lng]),
    };
  }, [locations]);

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* ─── THANH ĐIỀU HƯỚNG TRÊN CÙNG (GIỮ NGUYÊN 100%) ──────────────── */}
      <NavHeader
        title="Bản đồ khuôn viên"
        subtitle="Đại học Tây Nguyên • Khuôn viên nội bộ"
      />

      {isLoggedIn === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : !isLoggedIn ? (
        <View style={{ flex: 1, marginBottom: 88 }}>
          <LoginRequiredCard
            mode="fullscreen"
            title="Vui lòng đăng nhập để xem"
            message="Đăng nhập tài khoản sinh viên để xem và tra cứu bản đồ khuôn viên trường Đại học Tây Nguyên."
            icon="map-pin"
          />
        </View>
      ) : (
        /* ─── KHUNG BẢN ĐỒ TƯƠNG TÁC HIỆN ĐẠI (EDGE-TO-EDGE CANVAS) ────── */
        <View
          style={{
            flex: 1,
            backgroundColor: "#0F172A",
            position: "relative",
            marginBottom: 88,
            overflow: "hidden",
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

          {/* ─── THANH TÌM KIẾM NỔI & BĂNG DANH MỤC LỌC NHANH ─────────────── */}
          <MapSearchBar
            search={search}
            showSuggestions={showSuggestions}
            searchResults={searchResults}
            selectedCategory={selectedCategory}
            totalLocations={locations.length}
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
            onSelectCategory={handleSelectCategory}
            onSubmitSearch={handleSearchSubmit}
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
      )}
    </View>
  );
}
