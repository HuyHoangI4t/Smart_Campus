import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { View, Platform, Linking, Keyboard } from "react-native";
import { WebView } from "react-native-webview";
//import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { setTabBarVisible } from "../../../src/components/MainTabs";
import { LoginRequiredCard } from "../../../src/components/LoginRequiredCard";
import { MapSkeleton } from "../../../src/components/Skeleton";
import {
  LocationItem,
  UserCoords,
  CampusPath,
  CampusGate,
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  TNU_CAMPUS_BOUNDARY,
  TNU_CAMPUS_CENTER,
  TNU_CAMPUS_GATES,
  TNU_OSM_WAY_241971731_BOUNDARY,
  DEFAULT_CAMPUS_PATHS,
  HOUSE_NUM_TO_ID,
  parseCampusRoom,
  findLocationByRoomOrQuery,
  generateLeafletMapHtml,
  MapSearchBar,
  MapControlsOverlay,
  MapLocationDetailCard,
  MapLocationPickerModal,
  MapRouteStatusCard,
  MapTopGateSelector,
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
    gateId?: string;
    gateName?: string;
    arrived?: boolean;
  } | null>(null);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  // Lớp bản đồ đang hiển thị ("satellite" | "osm")
  const [mapLayer, setMapLayer] = useState<"osm" | "satellite">("satellite");

  // Kiểm tra đăng nhập
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const userStr = await AsyncStorage.getItem("@auth_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const mssv = u.mssv || u.masv || "";
        if (mssv && mssv !== "guest") {
          setIsLoggedIn(true);
          return true;
        }
      }
      setIsLoggedIn(false);
      return false;
    } catch {
      setIsLoggedIn(false);
      return false;
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
    startPositionWatch,
    stopPositionWatch,
  } = useMapGps({
    onLocationUpdated: useCallback((coords: UserCoords, accuracy: number, centerOnUser: boolean) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "UPDATE_USER_LOCATION",
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: accuracy || 10,
          centerOnUser: !!centerOnUser,
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
    }, []),
    onBearingUpdated: useCallback((b: number, animated: boolean) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "SET_BEARING",
          bearing: b,
          animated: animated,
        })
      );
    }, []),
    onHeadingUpdated: useCallback((h: number) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "UPDATE_USER_HEADING",
          heading: h,
        })
      );
    }, []),
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
    dismissSelectedLoc,
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
    onFocusLocation: useCallback((matched: LocationItem) => {
      setActiveRoute(null);
      if (isMapReadyRef.current) {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "FOCUS_LOCATION",
            id: matched.id,
            lat: matched.lat,
            lng: matched.lng,
          })
        );
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "REQUEST_LOCATION_DISTANCE",
            id: matched.id,
            lat: matched.lat,
            lng: matched.lng,
          })
        );
      }
    }, []),
  });

  // Khoảng cách lộ trình đi bộ thực tế tính từ vị trí người dùng (User Location)
  const [selectedLocRouteDistance, setSelectedLocRouteDistance] = useState<{
    distanceMeters?: number;
    durationMinutes?: number;
  } | null>(null);

  // Ref lưu vị trí người dùng để tránh useFocusEffect re-render liên tục gây hiện lại nav
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  // Kích hoạt lấy tọa độ tức thì ngay khi component mount để loại bỏ hoàn toàn độ trễ khởi động (<100ms)
  useEffect(() => {
    checkAuth().then((isAuthed) => {
      if (isAuthed) {
        fetchRealGpsLocation(false, true);
      }
    });
  }, [checkAuth, fetchRealGpsLocation]);

  // Tự động kiểm tra quyền & làm mới vị trí khi tab được focus
  useFocusEffect(
    useCallback(() => {
      checkAuth().then((isAuthed) => {
        if (isAuthed && !userLocationRef.current) {
          fetchRealGpsLocation(false, true);
        }
      });
      return () => {
        // Chỉ khôi phục tab bar khi rời khỏi màn hình Map hoàn toàn (chuyển sang tab khác)
        setTabBarVisible(true);
      };
    }, [checkAuth, fetchRealGpsLocation])
  );

  // Khi bản đồ sẵn sàng trong WebView
  const handleMapReady = useCallback(() => {
    isMapReadyRef.current = true;
    resetBearing();
    if (userLocation) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "UPDATE_USER_LOCATION",
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          accuracy: 10,
        })
      );
    }
    if (selectedLoc) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "FOCUS_LOCATION",
          id: selectedLoc.id,
          lat: selectedLoc.lat,
          lng: selectedLoc.lng,
        })
      );
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "REQUEST_LOCATION_DISTANCE",
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
  }, [userLocation, selectedLoc, locations, campusPaths, resetBearing]);

  // Ref lưu mốc yêu cầu tính khoảng cách gần nhất để triệt tiêu bridge message spam
  const lastDistanceRequestRef = useRef<{ locId?: number; lat?: number; lng?: number }>({});

  // Cập nhật khoảng cách lộ trình thông minh (chỉ gửi khi chọn địa điểm mới hoặc người dùng dịch chuyển >= 8m)
  useEffect(() => {
    if (isMapReadyRef.current && selectedLoc && userLocation) {
      const last = lastDistanceRequestRef.current;
      const movedMeters = (last.lat !== undefined && last.lng !== undefined)
        ? Math.abs(userLocation.latitude - last.lat) * 111000 + Math.abs(userLocation.longitude - last.lng) * 111000
        : Infinity;

      if (last.locId !== selectedLoc.id || movedMeters >= 8) {
        lastDistanceRequestRef.current = {
          locId: selectedLoc.id,
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        };
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "REQUEST_LOCATION_DISTANCE",
            id: selectedLoc.id,
            lat: selectedLoc.lat,
            lng: selectedLoc.lng,
          })
        );
      }
    }
  }, [userLocation, selectedLoc]);

  // Đồng bộ mạng lưới lối đi ngay khi tải xong từ Cache/API sang WebView (tránh trường hợp Map ready trước khi Paths nạp xong)
  useEffect(() => {
    if (isMapReadyRef.current && campusPaths && campusPaths.length > 0) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "SET_CAMPUS_PATHS",
          paths: campusPaths,
        })
      );
    }
  }, [campusPaths]);

  // Tự động ẩn thanh Tab Navigation khi đang chỉ đường để tối đa không gian hiển thị như Google Maps
  useEffect(() => {
    setTabBarVisible(!isRoutingActive);
  }, [isRoutingActive]);

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
            if (typeof data.distanceMeters === "number") {
              setSelectedLocRouteDistance({
                distanceMeters: data.distanceMeters,
                durationMinutes: data.durationMinutes,
              });
            } else {
              setSelectedLocRouteDistance(null);
            }
          }
        } else if (data.type === "LOCATION_DISTANCE_RESULT") {
          if (typeof data.distanceMeters === "number") {
            setSelectedLocRouteDistance({
              distanceMeters: data.distanceMeters,
              durationMinutes: data.durationMinutes,
            });
          }
        } else if (data.type === "DESELECT_LOCATION") {
          dismissSelectedLoc();
          setSelectedLocRouteDistance(null);
        } else if (data.type === "ROUTE_INFO") {
          setActiveRoute({
            distanceMeters: data.distanceMeters,
            durationMinutes: data.durationMinutes,
            gateId: data.gateId,
            gateName: data.gateName,
          });
          if (data.gateId) {
            setSelectedGateId(data.gateId);
          }
          if (typeof data.bearing === "number") {
            setBearing(data.bearing);
          }
          setIsRoutingActive(true);
          setTabBarVisible(false);
        } else if (data.type === "ROUTE_PROGRESS") {
          setActiveRoute((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              distanceMeters: data.remainingDistanceMeters,
              durationMinutes: data.remainingMinutes,
              arrived: !!data.arrived,
            };
          });
        } else if (data.type === "MANUAL_ROTATE") {
          stopCompassTracking();
          setBearing(data.bearing);
        }
      } catch (err) {
        console.error("Lỗi parse message từ webview:", err);
      }
    },
    [handleMapReady, locations, setSelectedLoc, setShowSuggestions, stopCompassTracking, setBearing, dismissSelectedLoc]
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

      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "REQUEST_LOCATION_DISTANCE",
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

  // Đặt lại góc nhìn toàn cảnh trường
  const handleResetView = useCallback(() => {
    resetBearing();
    webViewRef.current?.postMessage(JSON.stringify({ type: "RESET_VIEW" }));
  }, [resetBearing]);

  // Kích hoạt chỉ đường đi bộ trực tiếp ngay trên bản đồ khuôn viên
  const handleStartInAppDirections = useCallback(async (forcedGateId?: any) => {
    if (!selectedLoc) return;

    // Ngăn chặn truyền nhầm React Native GestureResponderEvent từ nút bấm onPress vào gateId
    const safeGateId = typeof forcedGateId === "string" ? forcedGateId : undefined;

    let origCoords = userLocation;
    if (!origCoords) {
      origCoords = await fetchRealGpsLocation(false, false);
    }

    const orig = origCoords
      ? { lat: origCoords.latitude, lng: origCoords.longitude }
      : { lat: 12.65138, lng: 108.02366 };

    const initialDist =
      selectedLocRouteDistance?.distanceMeters ??
      (computedDistanceKm !== null ? Math.round(computedDistanceKm * 1000) : undefined);
    const initialMin = selectedLocRouteDistance?.durationMinutes ?? computedWalkingMinutes ?? 1;

    const gateToUse = safeGateId || selectedGateId;
    const gateObj = gateToUse ? TNU_CAMPUS_GATES.find((g) => g.id === gateToUse) : null;

    if (initialDist !== undefined) {
      setActiveRoute({
        distanceMeters: initialDist,
        durationMinutes: initialMin,
        gateId: safeGateId || selectedGateId || undefined,
        gateName: gateObj?.name,
      });
    }

    setIsRoutingActive(true);
    setTabBarVisible(false);
    startPositionWatch();

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "DRAW_ROUTE",
        origin: orig,
        destination: { lat: selectedLoc.lat, lng: selectedLoc.lng },
        originName: origCoords ? (currentLocationName || "GPS thực tế") : "Cổng trước [Mặc định]",
        destinationName: selectedLoc.name,
        gateId: typeof gateToUse === "string" ? gateToUse : undefined,
      })
    );
  }, [selectedLoc, userLocation, fetchRealGpsLocation, startPositionWatch, selectedLocRouteDistance, computedDistanceKm, computedWalkingMinutes, currentLocationName, selectedGateId]);

  // Đổi cổng vào khác khi dẫn đường từ ngoài trường (Lê Duẩn <-> Y Wang <-> Bệnh viện)
  const handleSwitchGate = useCallback((targetGateId?: string) => {
    if (!selectedLoc) return;
    if (typeof targetGateId === "string") {
      setSelectedGateId(targetGateId);
      handleStartInAppDirections(targetGateId);
      return;
    }
    const gateIds = TNU_CAMPUS_GATES.map((g) => g.id);
    const currentId = activeRoute?.gateId || selectedGateId || gateIds[0];
    const currentIndex = gateIds.indexOf(currentId);
    const nextGateId = gateIds[(currentIndex + 1) % gateIds.length];
    setSelectedGateId(nextGateId);
    handleStartInAppDirections(nextGateId);
  }, [selectedLoc, activeRoute, selectedGateId, handleStartInAppDirections]);

  // Hủy đường đi bộ đang vẽ
  const handleClearRoute = useCallback(() => {
    setIsRoutingActive(false);
    setActiveRoute(null);
    setSelectedGateId(null);
    setSelectedLocRouteDistance(null);
    setTabBarVisible(true);
    stopPositionWatch();
    webViewRef.current?.postMessage(JSON.stringify({ type: "CLEAR_ROUTE" }));
  }, [stopPositionWatch]);

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

  // Tính chuỗi khoảng cách và thời gian đi bộ hiển thị trên Card dựa theo lộ trình thực tế
  const displayDistanceText = useMemo(() => {
    if (selectedLocRouteDistance?.distanceMeters !== undefined) {
      const d = selectedLocRouteDistance.distanceMeters;
      return d < 1000 ? `~${d}m` : `~${(d / 1000).toFixed(1)}km`;
    }
    return computedDistanceText;
  }, [selectedLocRouteDistance, computedDistanceText]);

  const displayWalkingMinutes = useMemo(() => {
    if (selectedLocRouteDistance?.durationMinutes !== undefined) {
      return selectedLocRouteDistance.durationMinutes;
    }
    return computedWalkingMinutes;
  }, [selectedLocRouteDistance, computedWalkingMinutes]);

  // Khởi tạo mã HTML 1 lần duy nhất: WebView KHÔNG BAO GIỜ bị reload lại, triệt tiêu lag và nóng máy
  const mapHtmlSource = useMemo(() => {
    return {
      html: generateLeafletMapHtml(
        TAY_NGUYEN_CAMPUS_LOCATIONS,
        TNU_OSM_WAY_241971731_BOUNDARY,
        [TNU_CAMPUS_CENTER.lat, TNU_CAMPUS_CENTER.lng],
        DEFAULT_CAMPUS_PATHS,
        TNU_CAMPUS_GATES
      ),
    };
  }, []);

  // Memoized handlers cho MapSearchBar và MapControlsOverlay (chống re-render thừa khi GPS cập nhật tọa độ)
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    setShowSuggestions(true);
  }, [setSearch, setShowSuggestions]);

  const handleClearSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearch("");
    setShowSuggestions(false);
  }, [setSearch, setShowSuggestions]);

  const handleSearchFocus = useCallback(() => {
    setShowSuggestions(true);
  }, [setShowSuggestions]);

  const handleCompassPress = useCallback(() => {
    if (bearing !== 0 && !compassMode) {
      resetBearing();
    } else {
      toggleCompassMode();
    }
  }, [bearing, compassMode, resetBearing, toggleCompassMode]);

  const handleUserLocationPress = useCallback(() => {
    fetchRealGpsLocation(true, false);
    startPositionWatch();
  }, [fetchRealGpsLocation, startPositionWatch]);

  const handleUserLocationLongPress = useCallback(() => {
    setShowLocationPicker(true);
  }, [setShowLocationPicker]);

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* ─── THANH TIÊU ĐỀ NAV HEADER ─────────────────────────────────── */}
      <NavHeader title="Bản đồ khuôn viên" subtitle="Đại học Tây Nguyên • Khuôn viên nội bộ" />

      {isLoggedIn === null ? (
        <MapSkeleton />
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
            renderLoading={() => <MapSkeleton />}
          />

          {/* ── THANH CHUYỂN CỔNG NỔI PHÍA TRÊN (DƯỚI HEADER) KHI ĐANG CHỈ ĐƯỜNG ── */}
          {isRoutingActive && (
            <MapTopGateSelector
              currentGateId={activeRoute?.gateId || selectedGateId || "front_gate"}
              currentGateName={activeRoute?.gateName}
              onSelectGate={(gateId) => {
                handleSwitchGate(gateId);
              }}
            />
          )}

          {/* ─── THANH TÌM KIẾM NỔI & DANH MỤC LỌC NHANH (Memoized) ─────── */}
          {!isRoutingActive && (
            <MapSearchBar
              search={search}
              showSuggestions={showSuggestions}
              searchResults={searchResults}
              selectedCategory={selectedCategory}
              totalLocations={locations.length}
              onSearchChange={handleSearchChange}
              onClearSearch={handleClearSearch}
              onFocus={handleSearchFocus}
              onSelectLocation={handleSelectLocation}
              onSelectCategory={handleSelectCategory}
              onSubmitSearch={handleSearchSubmit}
            />
          )}

          {/* ── CÁC NÚT ĐIỀU KHIỂN NỔI & LA BÀN (Memoized) ──────────────── */}
          {!isRoutingActive && (
            <MapControlsOverlay
              mapLayer={mapLayer}
              bearing={bearing}
              compassMode={compassMode}
              locationLoading={locationLoading}
              hasUserLocation={Boolean(userLocation)}
              activeRoute={activeRoute}
              isRoutingActive={isRoutingActive}
              onToggleLayer={handleToggleLayer}
              onCompassPress={handleCompassPress}
              onResetBearing={resetBearing}
              onUserLocationPress={handleUserLocationPress}
              onUserLocationLongPress={handleUserLocationLongPress}
              onResetView={handleResetView}
              onRotateStep={rotateStep}
              onClearRoute={handleClearRoute}
            />
          )}

          {/* ── THẺ CHI TIẾT TÒA NHÀ ĐANG CHỌN (Memoized) ──────────────── */}
          {!isRoutingActive && selectedLoc && (
            <MapLocationDetailCard
              selectedLoc={selectedLoc}
              userLocation={userLocation}
              matchedTargetId={matchedTargetId}
              currentParsed={currentParsed}
              targetSubject={targetSubject}
              distanceText={displayDistanceText}
              walkingMinutes={displayWalkingMinutes}
              onClose={() => {
                dismissSelectedLoc();
                setSelectedLocRouteDistance(null);
                handleClearRoute();
              }}
              onStartDirections={() => handleStartInAppDirections()}
              onOpenGoogleMaps={handleOpenExternalGoogleMaps}
            />
          )}

          {/* ── THANH TRẠNG THÁI DẪN ĐƯỜNG TỐI GIẢN (KHI ĐANG CHỈ ĐƯỜNG) ── */}
          {isRoutingActive && (
            <MapRouteStatusCard
              bottomOffset={Math.max(insets.bottom, 14)}
              activeRoute={activeRoute}
              targetRoom={targetRoom}
              currentParsed={currentParsed}
              selectedLoc={selectedLoc}
              onSwitchGate={handleSwitchGate}
              onClearRoute={handleClearRoute}
            />
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
