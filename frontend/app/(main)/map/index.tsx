import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Platform, Linking, ActivityIndicator, Keyboard } from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { setTabBarVisible } from "../../../src/components/MainTabs";
import { LoginRequiredCard } from "../../../src/components/LoginRequiredCard";
import {
  LocationItem,
  CampusPath,
  CampusGate,
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  TNU_CAMPUS_BOUNDARY,
  TNU_CAMPUS_CENTER,
  TNU_CAMPUS_GATES,
  TNU_SAMPLE_TEST_LOCATIONS,
  TNU_OSM_WAY_241971731_BOUNDARY,
  HOUSE_NUM_TO_ID,
  parseCampusRoom,
  findLocationByRoomOrQuery,
  generateLeafletMapHtml,
  MapSearchBar,
  MapControlsOverlay,
  MapLocationDetailCard,
  MapLocationPickerModal,
  useMapGps,
  useMapData,
} from "../../../src/features/map";

// Tái xuất các kiểu dữ liệu và hằng số để tương thích ngược 100% với các màn hình khác
export type { LocationItem, CampusPath, CampusGate };
export {
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  TNU_CAMPUS_BOUNDARY,
  TNU_CAMPUS_CENTER,
  TNU_CAMPUS_GATES,
  TNU_OSM_WAY_241971731_BOUNDARY,
  parseCampusRoom,
  findLocationByRoomOrQuery,
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
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

  // Trạng thái xác thực tài khoản sinh viên
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Trạng thái đang kích hoạt chế độ chỉ đường đi bộ (Ẩn thanh nav & nút phụ trợ để tối đa màn hình)
  const [isRoutingActive, setIsRoutingActive] = useState<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<{
    distanceMeters?: number;
    durationMinutes?: number;
  } | null>(null);

  // Lớp bản đồ đang hiển thị ("satellite" | "osm")
  const [mapLayer, setMapLayer] = useState<"osm" | "satellite">("satellite");

  // Kiểm tra đăng nhập
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

  // Hook quản lý cảm biến GPS và La bàn (Tiết kiệm CPU & RAM trên điện thoại)
  const {
    userLocation,
    locationLoading,
    showLocationPicker,
    setShowLocationPicker,
    currentLocationName,
    bearing,
    compassMode,
    fetchRealGpsLocation,
    handleSelectSampleLocation,
    toggleCompassMode,
    resetBearing,
    rotateStep,
    setBearing,
    stopCompassTracking,
  } = useMapGps({
    onLocationUpdated: (coords, accuracy, centerOnUser) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "UPDATE_USER_LOCATION",
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: accuracy || 10,
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
    },
    onBearingUpdated: (b, animated) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "SET_BEARING",
          bearing: b,
          animated: animated,
        })
      );
    },
  });

  // Hook quản lý dữ liệu bản đồ, đường đi bộ, tìm kiếm & khoảng cách (Có Memory Cache + Storage)
  const {
    locations,
    campusPaths,
    search,
    setSearch,
    targetRoom,
    setTargetRoom,
    targetSubject,
    selectedCategory,
    setSelectedCategory,
    showSuggestions,
    setShowSuggestions,
    selectedLoc,
    setSelectedLoc,
    searchResults,
    currentParsed,
    matchedTargetId,
    computedDistanceText,
    computedWalkingMinutes,
    computedDistanceKm,
  } = useMapData({
    search: params.search,
    room: params.room,
    subject: params.subject,
    building: params.building,
    buildingCode: params.buildingCode,
    t: params.t,
    userLocation,
    onFocusLocation: (matched) => {
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
        const timer = setTimeout(sendFocus, 200);
        return () => clearTimeout(timer);
      }
    },
  });

  // Tự động kiểm tra quyền & khôi phục tab bar khi đổi tab
  useFocusEffect(
    useCallback(() => {
      checkAuth();
      return () => {
        setTabBarVisible(true);
      };
    }, [checkAuth])
  );

  // Khi bản đồ sẵn sàng trong WebView
  const handleMapReady = useCallback(() => {
    isMapReadyRef.current = true;
    resetBearing();
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
    // Lớp mặc định là vệ tinh sắc nét
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "SWITCH_LAYER",
        layer: "satellite",
      })
    );
    if (locations && locations.length > 0) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "UPDATE_LOCATIONS",
          locations: locations,
        })
      );
    }
    if (campusPaths && campusPaths.length > 0) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "SET_CAMPUS_PATHS",
          paths: campusPaths,
        })
      );
    }
  }, [selectedLoc, locations, campusPaths, resetBearing]);

  // Xử lý thông điệp từ Leaflet WebView
  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (!data) return;

        if (data.type === "MAP_READY") {
          handleMapReady();
        } else if (data.type === "SELECT_LOCATION") {
          Keyboard.dismiss();
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
          setIsRoutingActive(true);
          setTabBarVisible(false);
        } else if (data.type === "MANUAL_ROTATE") {
          stopCompassTracking();
          setBearing(data.bearing);
        }
      } catch (err) {
        console.error("Lỗi parse message từ webview:", err);
      }
    },
    [handleMapReady, locations, setSelectedLoc, setShowSuggestions, stopCompassTracking, setBearing]
  );

  // Chọn danh mục bộ lọc
  const handleSelectCategory = useCallback(
    (catId: string) => {
      Keyboard.dismiss();
      setSelectedCategory(catId);
      setShowSuggestions(false);
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "FILTER_CATEGORY",
          category: catId,
        })
      );
    },
    [setSelectedCategory, setShowSuggestions]
  );

  // Chọn một địa điểm cụ thể
  const handleSelectLocation = useCallback(
    (loc: LocationItem) => {
      Keyboard.dismiss();
      setSelectedLoc(loc);

      // Nếu query tìm kiếm là mã phòng (2.20, 8.3.4,...), lưu lại để card hiển thị chi tiết phòng
      const parsed = parseCampusRoom(search);
      if (parsed.buildingNumber && HOUSE_NUM_TO_ID[parsed.buildingNumber] === loc.id) {
        setTargetRoom(search.trim());
        setSearch(parsed.fullDisplay);
      } else {
        setSearch(loc.name);
      }

      setShowSuggestions(false);
      setActiveRoute(null);
      setIsRoutingActive(false);
      setTabBarVisible(true);

      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "FOCUS_LOCATION",
          id: loc.id,
          lat: loc.lat,
          lng: loc.lng,
        })
      );
    },
    [search, setSelectedLoc, setTargetRoom, setSearch, setShowSuggestions]
  );

  // Xử lý submit tìm kiếm
  const handleSearchSubmit = useCallback(() => {
    Keyboard.dismiss();
    if (!search.trim()) return;
    const matched = findLocationByRoomOrQuery(search, locations) || searchResults[0];
    if (matched) {
      handleSelectLocation(matched);
    }
  }, [search, locations, searchResults, handleSelectLocation]);

  // Đổi lớp bản đồ (osm / satellite)
  const handleToggleLayer = useCallback(() => {
    const next = mapLayer === "osm" ? "satellite" : "osm";
    setMapLayer(next);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "SWITCH_LAYER",
        layer: next,
      })
    );
  }, [mapLayer]);

  // Điều khiển phóng to / thu nhỏ / reset góc nhìn
  const handleZoomIn = useCallback(() => {
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_IN" }));
  }, []);

  const handleZoomOut = useCallback(() => {
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_OUT" }));
  }, []);

  const handleResetView = useCallback(() => {
    resetBearing();
    webViewRef.current?.postMessage(JSON.stringify({ type: "RESET_VIEW" }));
  }, [resetBearing]);

  // Kích hoạt chỉ đường đi bộ trực tiếp ngay trên bản đồ khuôn viên
  const handleStartInAppDirections = useCallback(async () => {
    if (!selectedLoc) return;

    if (!userLocation) {
      await fetchRealGpsLocation(false);
    }

    const orig = userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : { lat: 12.65138, lng: 108.02366 };

    if (computedDistanceKm !== null) {
      setActiveRoute({
        distanceMeters: Math.round(computedDistanceKm * 1000),
        durationMinutes: computedWalkingMinutes || 1,
      });
    }

    setIsRoutingActive(true);
    setTabBarVisible(false);

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "DRAW_ROUTE",
        origin: orig,
        destination: { lat: selectedLoc.lat, lng: selectedLoc.lng },
        originName: currentLocationName || "Vị trí của bạn",
        destinationName: selectedLoc.name,
      })
    );
  }, [selectedLoc, userLocation, fetchRealGpsLocation, computedDistanceKm, computedWalkingMinutes, currentLocationName]);

  // Hủy đường đi bộ đang vẽ
  const handleClearRoute = useCallback(() => {
    setIsRoutingActive(false);
    setActiveRoute(null);
    setTabBarVisible(true);
    webViewRef.current?.postMessage(JSON.stringify({ type: "CLEAR_ROUTE" }));
  }, []);

  // Mở app Google Maps bên ngoài
  const handleOpenExternalGoogleMaps = useCallback(() => {
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
  }, [selectedLoc, userLocation]);

  // Khởi tạo mã HTML 1 lần duy nhất: WebView KHÔNG BAO GIỜ bị reload lại, triệt tiêu lag và nóng máy
  const mapHtmlSource = useMemo(() => {
    return {
      html: generateLeafletMapHtml(
        TAY_NGUYEN_CAMPUS_LOCATIONS,
        TNU_CAMPUS_BOUNDARY,
        [TNU_CAMPUS_CENTER.lat, TNU_CAMPUS_CENTER.lng],
        [],
        TNU_CAMPUS_GATES
      ),
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* ─── THANH TIÊU ĐỀ NAV HEADER ─────────────────────────────────── */}
      <NavHeader title="Bản đồ khuôn viên" subtitle="Đại học Tây Nguyên • Khuôn viên nội bộ" />

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
        /* ─── KHUNG BẢN ĐỒ TƯƠNG TÁC (EDGE-TO-EDGE CANVAS) ─────────────── */
        <View
          style={{
            flex: 1,
            backgroundColor: "#F8FAFC",
            position: "relative",
            marginBottom: 0,
            overflow: "hidden",
          }}
        >
          {/* WebView Tối ưu CPU, RAM, GPU */}
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={mapHtmlSource}
            onMessage={handleWebViewMessage}
            style={{ flex: 1, backgroundColor: "#F8FAFC" }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            geolocationEnabled={true}
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            androidLayerType="hardware"
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            startInLoadingState={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            bounces={false}
            renderLoading={() => (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" }}>
                <ActivityIndicator size="large" color={AppColors.primary} />
              </View>
            )}
          />

          {/* ── THANH TIÊU ĐỀ NỔI KHI ĐANG NHÚNG CHỈ ĐƯỜNG GOOGLE MAPS ── */}
          {isRoutingActive && selectedLoc && (
            <View
              style={{
                position: "absolute",
                top: 10,
                left: 12,
                right: 12,
                zIndex: 60,
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.16,
                shadowRadius: 10,
                elevation: 8,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <TouchableOpacity
                onPress={handleClearRoute}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 4,
                  paddingRight: 8,
                }}
              >
                <Feather name="arrow-left" size={18} color={AppColors.primary} />
                <Text style={{ fontSize: 12.5, fontWeight: "800", color: AppColors.primary }}>
                  Bản đồ trường
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1, marginHorizontal: 8, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12.5, fontWeight: "800", color: AppColors.text }} numberOfLines={1}>
                  {selectedLoc.name}
                </Text>
                <Text style={{ fontSize: 11, color: "#059669", fontWeight: "700" }}>
                  {computedDistanceText ? `${computedDistanceText} • ~${computedWalkingMinutes} phút đi bộ` : "Chỉ đường đi bộ Google Maps"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleClearRoute}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="x" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* ─── THANH TÌM KIẾM NỔI & DANH MỤC LỌC NHANH (Memoized) ─────── */}
          {!isRoutingActive && (
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
                Keyboard.dismiss();
                setSearch("");
                setShowSuggestions(false);
              }}
              onFocus={() => setShowSuggestions(true)}
              onSelectLocation={handleSelectLocation}
              onSelectCategory={handleSelectCategory}
              onSubmitSearch={handleSearchSubmit}
            />
          )}

          {/* ── CÁC NÚT ĐIỀU KHIỂN NỔI & LA BÀN (Memoized) ──────────────── */}
          <MapControlsOverlay
            mapLayer={mapLayer}
            bearing={bearing}
            compassMode={compassMode}
            locationLoading={locationLoading}
            hasUserLocation={Boolean(userLocation)}
            activeRoute={activeRoute}
            isRoutingActive={isRoutingActive}
            onToggleLayer={handleToggleLayer}
            onCompassPress={() => {
              if (bearing !== 0 && !compassMode) {
                resetBearing();
              } else {
                toggleCompassMode();
              }
            }}
            onResetBearing={resetBearing}
            onUserLocationPress={() => setShowLocationPicker(true)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onRotateStep={rotateStep}
            onClearRoute={handleClearRoute}
          />

          {/* ── THẺ CHI TIẾT TÒA NHÀ ĐANG CHỌN (Memoized) ──────────────── */}
          {!isRoutingActive && selectedLoc && (
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

          {/* ── THANH TRẠNG THÁI DẪN ĐƯỜNG TỐI GIẢN (KHI ĐANG CHỈ ĐƯỜNG) ── */}
          {isRoutingActive && (
            <View
              style={{
                position: "absolute",
                bottom: Math.max(insets.bottom, 16),
                left: 14,
                right: 14,
                zIndex: 50,
                backgroundColor: "#FFFFFF",
                borderRadius: 22,
                paddingVertical: 14,
                paddingHorizontal: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.16,
                shadowRadius: 16,
                elevation: 10,
                borderWidth: 1,
                borderColor: "rgba(226, 232, 240, 0.9)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#EFF6FF",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: "#BFDBFE",
                    }}
                  >
                    <Feather name="navigation" size={22} color={AppColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: "800",
                        color: "#64748B",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Đang chỉ đường đi bộ tới
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "900",
                        color: "#0F172A",
                        marginTop: 1,
                      }}
                      numberOfLines={1}
                    >
                      {targetRoom && currentParsed ? currentParsed.fullDisplay : selectedLoc?.name || "Điểm đến"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: "800",
                        color: "#059669",
                        marginTop: 2,
                      }}
                    >
                      {activeRoute?.distanceMeters
                        ? `~${activeRoute.distanceMeters}m`
                        : computedDistanceText || "Đang tính..."}
                      {activeRoute?.durationMinutes
                        ? ` • ~${activeRoute.durationMinutes} phút đi bộ`
                        : computedWalkingMinutes
                        ? ` • ~${computedWalkingMinutes} phút đi bộ`
                        : " • Đi bộ"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleClearRoute}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: "#FEE2E2",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: "#FECACA",
                  }}
                >
                  <Feather name="x-circle" size={16} color="#DC2626" />
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#DC2626" }}>Dừng</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── MODAL CHỌN ĐỊNH VỊ (GPS THỰC TẾ HOẶC VỊ TRÍ MẪU ĐỂ TEST) ── */}
          <MapLocationPickerModal
            visible={showLocationPicker}
            insetsBottom={insets.bottom}
            onClose={() => setShowLocationPicker(false)}
            onSelectRealGps={() => fetchRealGpsLocation(true)}
            onSelectSampleLocation={handleSelectSampleLocation}
          />
        </View>
      )}
    </View>
  );
}
