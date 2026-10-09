import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Platform, Linking, ActivityIndicator, Alert, Keyboard, Modal, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { setTabBarVisible } from "../../../src/components/MainTabs";
import { LoginRequiredCard } from "../../../src/components/LoginRequiredCard";
import { apiGetMapLocations, apiGetCampusPaths } from "../../../src/services/api";
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
  calculateDistanceKm,
  generateLeafletMapHtml,
  MapSearchBar,
  MapControlsOverlay,
  MapLocationDetailCard,
} from "../../../src/features/map";

// Tái xuất các kiểu dữ liệu và hằng số để tương thích ngược nếu có module khác import
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
  const [, setMapReady] = useState(false);

  const [targetRoom, setTargetRoom] = useState<string>(params.room ? String(params.room).trim() : "");
  const [targetSubject, setTargetSubject] = useState<string>(params.subject ? String(params.subject).trim() : "");
  const currentParsed = targetRoom ? parseCampusRoom(targetRoom) : null;

  // Trạng thái đăng nhập (Khách / chưa đăng nhập không được xem bản đồ)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Trạng thái đang kích hoạt chế độ chỉ đường đi bộ (Ẩn thanh nav & nút phụ trợ để tối đa màn hình)
  const [isRoutingActive, setIsRoutingActive] = useState<boolean>(false);

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



  // Giữ ô tìm kiếm trống nếu đi từ Home/Schedule có room
  const [search, setSearch] = useState<string>(() => {
    return params.search ? String(params.search).trim() : "";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState<LocationItem[]>(TAY_NGUYEN_CAMPUS_LOCATIONS);
  const [campusPaths, setCampusPaths] = useState<CampusPath[]>([]);

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
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>("GPS của bạn");

  // Trạng thái tuyến đường đi bộ đang vẽ
  const [activeRoute, setActiveRoute] = useState<{
    distanceMeters?: number;
    durationMinutes?: number;
  } | null>(null);

  // ─── TÍNH NĂNG XOAY MAP THEO LA BÀN & XOAY THỦ CÔNG ───────────────────────────
  const [bearing, setBearing] = useState<number>(0);
  const [compassMode, setCompassMode] = useState<boolean>(false);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isTabFocusedRef = useRef<boolean>(true);

  // 1. Lấy vị trí GPS thật từ điện thoại (Chỉ quét 1 lần khi người dùng bấm nút trong tab bản đồ, KHÔNG chạy ngầm khi đổi tab)
  const fetchRealGpsLocation = useCallback(async (centerOnUser = true) => {
    if (!isTabFocusedRef.current) return;
    setShowLocationPicker(false);
    setLocationLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!isTabFocusedRef.current) return;

      if (permission.status !== "granted") {
        setLocationLoading(false);
        Alert.alert(
          "Quyền vị trí GPS",
          "Vui lòng cấp quyền truy cập vị trí trong Cài đặt để ứng dụng định vị."
        );
        return;
      }

      // Phát hiện nếu Android cấp quyền Vị trí tương đối (Approximate)
      if (Platform.OS === "android" && (permission as any).android?.accuracy === "coarse") {
        Alert.alert(
          "Đang dùng vị trí ước lượng",
          "Expo Go hiện chỉ có quyền 'Vị trí tương đối'. Hệ điều hành Android làm lệch tọa độ từ 1km - 3km để bảo mật.\n\nCách sửa:\nVào Cài đặt máy > Ứng dụng > Expo Go > Quyền vị trí > Bật 'Dùng vị trí chính xác' (Use precise location)."
        );
      }

      // Thử lấy vị trí đệm trước để phản hồi tức thì
      try {
        const lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
        if (!isTabFocusedRef.current) return;
        if (lastLoc && lastLoc.coords) {
          const cached = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
          setUserLocation(cached);
          setCurrentLocationName("GPS thực tế");
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: "UPDATE_USER_LOCATION",
              lat: cached.latitude,
              lng: cached.longitude,
              accuracy: lastLoc.coords.accuracy || 15,
            })
          );
          if (centerOnUser) {
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: "FOCUS_LOCATION",
                lat: cached.latitude,
                lng: cached.longitude,
              })
            );
          }
        }
      } catch {
        // bỏ qua
      }

      // Quét GPS vệ tinh thực tế một lần (Accuracy.High: chuẩn xác, phản hồi nhanh dưới 2s, không làm nóng máy)
      const freshLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });

      if (!isTabFocusedRef.current) return;

      if (freshLoc && freshLoc.coords) {
        const freshCoords = { latitude: freshLoc.coords.latitude, longitude: freshLoc.coords.longitude };
        setUserLocation(freshCoords);
        setCurrentLocationName("GPS thực tế");
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "UPDATE_USER_LOCATION",
            lat: freshCoords.latitude,
            lng: freshCoords.longitude,
            accuracy: freshLoc.coords.accuracy || 10,
          })
        );

        if (centerOnUser) {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: "FOCUS_LOCATION",
              lat: freshCoords.latitude,
              lng: freshCoords.longitude,
            })
          );
        }

        // Tính khoảng cách tới trường ĐH Tây Nguyên
        const distKm = calculateDistanceKm(
          freshCoords.latitude,
          freshCoords.longitude,
          TNU_CAMPUS_CENTER.lat,
          TNU_CAMPUS_CENTER.lng
        );
        if (distKm > 2) {
          Alert.alert(
            "Đang ở ngoài trường",
            `GPS xác định bạn đang cách trường ĐH Tây Nguyên ~${distKm.toFixed(1)}km.\n\nNếu muốn test vẽ đường đi bộ nội bộ trường, bạn có thể chọn một trong các 'Vị trí mẫu' tại cổng trường!`
          );
        }
      }
    } catch (err) {
      console.warn("Lỗi vị trí GPS:", err);
      Alert.alert(
        "Chưa lấy được GPS",
        "Hãy bật định vị trong Cài đặt máy hoặc chọn một 'Vị trí mẫu' tại trường để test bản đồ."
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // 2. Chọn vị trí mẫu tại trường ĐH Tây Nguyên (Cổng trước, Cổng BV, Cổng sau, Tòa nhà điều hành...)
  const handleSelectSampleLocation = useCallback((sample: typeof TNU_SAMPLE_TEST_LOCATIONS[0]) => {
    setShowLocationPicker(false);
    const coords = { latitude: sample.latitude, longitude: sample.longitude };
    setUserLocation(coords);
    setCurrentLocationName(sample.name);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "UPDATE_USER_LOCATION",
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: 8,
      })
    );
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "FOCUS_LOCATION",
        lat: coords.latitude,
        lng: coords.longitude,
      })
    );
  }, []);

  // 3. Khi bấm nút GPS: Mở bảng chọn Vị trí mẫu / GPS thực tế
  const requestUserLocation = useCallback(async () => {
    setShowLocationPicker(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      isTabFocusedRef.current = true;
      checkAuth();
      // Lúc mới mở luôn luôn căn đúng chuẩn hướng Bắc - Nam (bearing = 0)
      setBearing(0);
      setCompassMode(false);
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
        headingSubscriptionRef.current = null;
      }
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "SET_BEARING",
          bearing: 0,
          animated: false,
        })
      );

      return () => {
        // KHI CHUYỂN SANG TAB KHÁC: TẮT HOÀN TOÀN TẤT CẢ DỊCH VỤ GPS & CẢM BIẾN
        isTabFocusedRef.current = false;
        setLocationLoading(false);
        setShowLocationPicker(false);
        if (headingSubscriptionRef.current) {
          headingSubscriptionRef.current.remove();
          headingSubscriptionRef.current = null;
        }
        setCompassMode(false);
        setTabBarVisible(true);
      };
    }, [checkAuth])
  );

  // Tải danh sách địa điểm và mạng lưới lối đi nội bộ (Hỗ trợ Offline Cache qua AsyncStorage)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // 1. Nạp cache offline từ AsyncStorage nếu có
      try {
        const cachedPathsStr = await AsyncStorage.getItem("@offline_campus_paths");
        if (cachedPathsStr && isMounted) {
          const cachedPaths = JSON.parse(cachedPathsStr);
          if (Array.isArray(cachedPaths) && cachedPaths.length > 0) {
            setCampusPaths(cachedPaths);
          }
        }
      } catch {
        // bỏ qua lỗi cache
      }

      // 2. Tải địa điểm từ API Backend và lưu cache offline
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
          AsyncStorage.setItem("@offline_map_locations", JSON.stringify(normalized)).catch(() => {});
        }
      } catch {
        // Dùng danh sách 37 địa điểm chuẩn đã được nạp
      }

      // 3. Tải mạng lưới đường đi từ API Backend và lưu cache offline
      try {
        const pathsRes = await apiGetCampusPaths();
        if (pathsRes && pathsRes.paths && Array.isArray(pathsRes.paths) && isMounted) {
          const normalizedPaths: CampusPath[] = pathsRes.paths.map((p: any) => ({
            id: Number(p.id),
            name: String(p.name || ""),
            path_type: String(p.path_type || "walkway"),
            coordinates: Array.isArray(p.coordinates)
              ? p.coordinates
              : typeof p.coordinates === "string"
              ? JSON.parse(p.coordinates)
              : [],
          }));
          setCampusPaths(normalizedPaths);
          AsyncStorage.setItem("@offline_campus_paths", JSON.stringify(normalizedPaths)).catch(() => {});
          if (isMapReadyRef.current) {
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: "SET_CAMPUS_PATHS",
                paths: normalizedPaths,
              })
            );
          }
        }
      } catch {
        // Bỏ qua nếu chưa nạp được paths
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── THEO DÕI HƯỚNG LA BÀN THIẾT BỊ (COMPASS HEADING) ĐÃ TỐI ƯU HÓA ────────
  const lastSentBearingRef = useRef<number>(0);
  const lastHeadingTimeRef = useRef<number>(0);

  const startCompassTracking = async () => {
    if (!isTabFocusedRef.current) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isTabFocusedRef.current) return;
      if (status !== "granted") {
        Alert.alert("Quyền vị trí", "Vui lòng cấp quyền vị trí.");
        return;
      }

      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
      }

      const sub = await Location.watchHeadingAsync((headingData) => {
        if (!isTabFocusedRef.current) return;
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

  // Khi bản đồ sẵn sàng, focus vào tòa nhà đang chọn và đảm bảo luôn chuẩn hướng Bắc - Nam
  const handleMapReady = useCallback(() => {
    isMapReadyRef.current = true;
    setMapReady(true);
    setBearing(0);
    setCompassMode(false);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "SET_BEARING",
        bearing: 0,
        animated: false,
      })
    );
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
    if (locations && locations.length > 0) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "UPDATE_LOCATIONS",
          locations: locations,
        })
      );
    }
    if (campusPaths.length > 0) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "SET_CAMPUS_PATHS",
          paths: campusPaths,
        })
      );
    }
  }, [selectedLoc, locations, campusPaths]);

  // Xử lý thông điệp gửi từ Leaflet WebView
  const handleWebViewMessage = (event: any) => {
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
    Keyboard.dismiss();
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
    Keyboard.dismiss();
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
  };

  // Xử lý khi nhấn nút Search / Enter trên bàn phím
  const handleSearchSubmit = () => {
    Keyboard.dismiss();
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

  const computedDistanceKm = useMemo(() => {
    if (!selectedLoc || !userLocation) return null;
    return calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng);
  }, [selectedLoc, userLocation]);

  const computedDistanceText = useMemo(() => {
    if (computedDistanceKm === null) return "";
    return computedDistanceKm < 1
      ? `~${Math.round(computedDistanceKm * 1000)}m`
      : `~${computedDistanceKm.toFixed(1)}km`;
  }, [computedDistanceKm]);

  const computedWalkingMinutes = useMemo(() => {
    if (computedDistanceKm === null) return null;
    return Math.max(1, Math.ceil((computedDistanceKm * 1000) / 80));
  }, [computedDistanceKm]);

  // Kích hoạt chỉ đường đi bộ trực tiếp ngay trên bản đồ khuôn viên
  const handleStartInAppDirections = async () => {
    if (!selectedLoc) return;

    if (!userLocation) {
      await fetchRealGpsLocation(false);
    }

    const orig = userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : { lat: 12.651380, lng: 108.023660 };

    if (computedDistanceKm !== null) {
      setActiveRoute({
        distanceMeters: Math.round(computedDistanceKm * 1000),
        durationMinutes: computedWalkingMinutes || 1,
      });
    }

    setIsRoutingActive(true);
    setTabBarVisible(false);

    // Gửi lệnh DRAW_ROUTE cho Leaflet WebView vẽ cung đường đi bộ trực tiếp trên bản đồ
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "DRAW_ROUTE",
        origin: orig,
        destination: { lat: selectedLoc.lat, lng: selectedLoc.lng },
        originName: currentLocationName || "Vị trí của bạn",
        destinationName: selectedLoc.name,
      })
    );
  };

  // Hủy đường đi bộ đang hiển thị
  const handleClearRoute = () => {
    setIsRoutingActive(false);
    setActiveRoute(null);
    setTabBarVisible(true);
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
            backgroundColor: "#F8FAFC",
            position: "relative",
            marginBottom: 0,
            overflow: "hidden",
          }}
        >
          {/* WebView: Bản đồ khuôn viên với Google Maps tiles & vẽ cung đường đi bộ trực tiếp */}
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

          {/* ─── THANH TÌM KIẾM NỔI & BĂNG DANH MỤC LỌC NHANH (ẨN KHI ĐANG CHỈ ĐƯỜNG) ─── */}
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

          {/* ── CÁC NÚT ĐIỀU KHIỂN NỔI & LA BÀN ──────────────────────────────── */}
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
                handleResetBearing();
              } else {
                toggleCompassMode();
              }
            }}
            onResetBearing={handleResetBearing}
            onUserLocationPress={() => requestUserLocation()}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onRotateStep={handleRotateStep}
            onClearRoute={handleClearRoute}
          />

          {/* ── THẺ CHI TIẾT TÒA NHÀ ĐANG CHỌN (ẨN KHI ĐANG CHỈ ĐƯỜNG ĐỂ TỐI ĐA KHÔNG GIAN) ── */}
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

          {/* ── THANH TRẠNG THÁI DẪN ĐƯỜNG TỐI GIẢN (KHI ĐANG CHỈ ĐƯỜNG) ──────── */}
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
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#DC2626" }}>
                    Dừng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* ── MODAL CHỌN ĐIỂM ĐỊNH VỊ (GPS THỰC TẾ HOẶC VỊ TRÍ MẪU ĐỂ TEST) ── */}
          <Modal
            visible={showLocationPicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLocationPicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowLocationPicker(false)}
              style={{
                flex: 1,
                backgroundColor: "rgba(15, 23, 42, 0.55)",
                justifyContent: "flex-end",
              }}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: Math.max(insets.bottom, 20),
                  maxHeight: "82%",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 16,
                }}
              >
                {/* Thanh kéo nhỏ phía trên */}
                <View style={{ alignItems: "center", marginBottom: 14 }}>
                  <View style={{ width: 40, height: 4.5, borderRadius: 3, backgroundColor: "#E2E8F0" }} />
                </View>

                {/* Tiêu đề Modal */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A" }}>
                      Chọn điểm định vị của bạn
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      Dùng GPS điện thoại hoặc vị trí mẫu để test tính năng trong trường
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowLocationPicker(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#F1F5F9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="x" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                  {/* Tùy chọn 1: Bắt GPS thực tế của điện thoại */}
                  <TouchableOpacity
                    onPress={() => fetchRealGpsLocation(true)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#EFF6FF",
                      borderRadius: 18,
                      padding: 14,
                      marginBottom: 14,
                      borderWidth: 1.5,
                      borderColor: "#93C5FD",
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: "#2563EB",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 14.5, fontWeight: "800", color: "#1E40AF" }}>
                          Vị trí GPS thực tế của máy
                        </Text>
                        <View style={{ backgroundColor: "#DBEAFE", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: "800", color: "#2563EB" }}>Vệ tinh</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 11.5, color: "#3B82F6", marginTop: 2 }}>
                        Bắt tọa độ thật từ chip GPS điện thoại (quét 1 lần, không nóng máy)
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#3B82F6" />
                  </TouchableOpacity>

                  {/* Phân cách danh sách vị trí mẫu */}
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginLeft: 2 }}>
                    Vị trí mẫu tại trường ĐH Tây Nguyên (Dùng test nhanh)
                  </Text>

                  {TNU_SAMPLE_TEST_LOCATIONS.map((sample) => (
                    <TouchableOpacity
                      key={sample.id}
                      onPress={() => handleSelectSampleLocation(sample)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#F8FAFC",
                        borderRadius: 16,
                        padding: 12,
                        marginBottom: 9,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: sample.id === "hospital_gate" ? "#FEE2E2" : "#F1F5F9",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <MaterialIcons
                          name={sample.icon as any}
                          size={20}
                          color={sample.id === "hospital_gate" ? "#EF4444" : "#2563EB"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: "800", color: "#1E293B" }}>
                            {sample.name}
                          </Text>
                          {sample.badge && (
                            <View
                              style={{
                                backgroundColor: sample.id === "hospital_gate" ? "#FEE2E2" : "#E2E8F0",
                                paddingHorizontal: 6,
                                paddingVertical: 1.5,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "800",
                                  color: sample.id === "hospital_gate" ? "#DC2626" : "#475569",
                                }}
                              >
                                {sample.badge}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                          {sample.desc}
                        </Text>
                      </View>
                      <Feather name="arrow-right" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    </View>
  );
}
