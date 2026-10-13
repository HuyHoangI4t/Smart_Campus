import { useState, useRef, useCallback, useEffect } from "react";
import { Alert, Platform } from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { calculateDistanceKm } from "../utils";
import { TNU_CAMPUS_CENTER, TNU_SAMPLE_TEST_LOCATIONS } from "../constants";
import { isGuestUser } from "../../../services/permissionService";

export interface UserCoords {
  latitude: number;
  longitude: number;
}

interface UseMapGpsOptions {
  onLocationUpdated?: (coords: UserCoords, accuracy: number, centerOnUser: boolean) => void;
  onBearingUpdated?: (bearing: number, animated: boolean) => void;
  onHeadingUpdated?: (heading: number) => void;
}

export function useMapGps(options: UseMapGpsOptions = {}) {
  const { onLocationUpdated, onBearingUpdated, onHeadingUpdated } = options;

  const [userLocation, setUserLocation] = useState<UserCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>("GPS của bạn");

  const [bearing, setBearing] = useState<number>(0);
  const [compassMode, setCompassMode] = useState<boolean>(false);
  const [isWatchingPosition, setIsWatchingPosition] = useState<boolean>(false);

  // Refs quản lý Subscriptions ngăn chặn hoàn toàn Memory Leak
  const isMountedRef = useRef<boolean>(true);
  const isTabFocusedRef = useRef<boolean>(true);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const positionSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const compassModeRef = useRef<boolean>(false);
  const lastSentHeadingRef = useRef<number>(0);
  const lastHeadingTimeRef = useRef<number>(0);
  const lastPositionTimeRef = useRef<number>(0);

  // Dọn dẹp an toàn watcher vị trí
  const stopPositionWatch = useCallback(() => {
    if (positionSubscriptionRef.current) {
      positionSubscriptionRef.current.remove();
      positionSubscriptionRef.current = null;
    }
    if (isMountedRef.current) {
      setIsWatchingPosition(false);
    }
  }, []);

  // Dọn dẹp an toàn watcher la bàn
  const stopCompassTracking = useCallback(() => {
    compassModeRef.current = false;
    if (isMountedRef.current) {
      setCompassMode(false);
    }
  }, []);

  const stopHeadingTracking = useCallback(() => {
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
    }
    stopCompassTracking();
  }, [stopCompassTracking]);

  // Dọn dẹp toàn bộ cảm biến khi unmount hoặc unfocus
  const stopAllTracking = useCallback(() => {
    stopHeadingTracking();
    stopPositionWatch();
  }, [stopHeadingTracking, stopPositionWatch]);

  // Bắt đầu theo dõi và tinh chỉnh tọa độ ngầm có độ chính xác cao (Background Refinement)
  // Chip GPS vệ tinh sẽ âm thầm thu hẹp bán kính sai số từng mét khi sẵn sàng mà không làm đơ UI
  const startPositionWatch = useCallback(async () => {
    if (!isTabFocusedRef.current || !isMountedRef.current) return;
    try {
      if (await isGuestUser()) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isTabFocusedRef.current || !isMountedRef.current || status !== "granted") return;

      if (positionSubscriptionRef.current) return;

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 1.5, // Cập nhật mượt mà khi di chuyển >= 1.5 mét
          timeInterval: 1500,     // Chu kỳ quét 1.5 giây
        },
        (loc) => {
          if (!isTabFocusedRef.current || !isMountedRef.current || !loc.coords) return;
          const now = Date.now();
          if (now - lastPositionTimeRef.current < 1000) return;
          lastPositionTimeRef.current = now;

          const freshCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const acc = loc.coords.accuracy || 5;

          setUserLocation(freshCoords);
          setCurrentLocationName("GPS thực tế");
          // Gửi cờ isRefined = true để Leaflet làm mượt vị trí
          onLocationUpdated?.(freshCoords, acc, false);
        }
      );

      positionSubscriptionRef.current = sub;
      if (isMountedRef.current) setIsWatchingPosition(true);
    } catch {
      // Bỏ qua lỗi
    }
  }, [onLocationUpdated]);

  // CHIẾN LƯỢC ĐỊNH VỊ LAI (HYBRID LOCATION STRATEGY - GOOGLE MAPS STYLE):
  // 1. Phản hồi tức thì (<100ms): Đọc ngay vị trí cache (Last Known Location) hoặc vị trí mạng (Balanced/Low qua Wi-Fi/Cell)
  //    để hiển thị ngay tâm bản đồ, ghim vị trí sơ bộ mà không bắt người dùng phải chờ chip GPS quay.
  // 2. Tinh chỉnh ngầm (Background Refinement): Kích hoạt request ngầm có độ chính xác cao để mượt mà làm mịn tọa độ.
  const fetchRealGpsLocation = useCallback(
    async (centerOnUser = true, silent = false): Promise<UserCoords | null> => {
      if (!isTabFocusedRef.current || !isMountedRef.current) return null;
      setShowLocationPicker(false);
      setLocationLoading(true);

      let instantCoords: UserCoords | null = null;

      try {
        if (await isGuestUser()) {
          if (isMountedRef.current) setLocationLoading(false);
          return null;
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isTabFocusedRef.current || !isMountedRef.current) return null;

        if (permission.status !== "granted") {
          if (isMountedRef.current) setLocationLoading(false);
          if (!silent) {
            Alert.alert(
              "Quyền vị trí GPS",
              "Vui lòng cấp quyền truy cập vị trí trong Cài đặt để ứng dụng định vị."
            );
          }
          return null;
        }

        if (Platform.OS === "android" && (permission as any).android?.accuracy === "coarse" && !silent) {
          Alert.alert(
            "Cần bật Vị trí chính xác",
            "Thiết bị đang cấp quyền vị trí ước lượng (sai số 100-300m). Để hiển thị đúng tòa nhà trong trường, vui lòng chọn 'Chính xác' trong Cài đặt quyền vị trí của ứng dụng."
          );
        }

        // ── BƯỚC 1: LẤY VỊ TRÍ TỨC THÌ (<100ms) BẰNG CACHE HOẶC ĐỊNH VỊ MẠNG (BALANCED) ──
        // Tuyệt đối không bật chip GPS vệ tinh công suất cao ngay lúc này để tránh lag/delay
        try {
          const lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
          if (isTabFocusedRef.current && isMountedRef.current && lastLoc && lastLoc.coords) {
            instantCoords = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
            setUserLocation(instantCoords);
            setCurrentLocationName("Vị trí ước lượng");
            onLocationUpdated?.(instantCoords, lastLoc.coords.accuracy || 35, centerOnUser);
          }
        } catch {
          // Bỏ qua lỗi cache
        }

        // Nếu chưa có vị trí cache, thử quét nhanh qua Wi-Fi/Cell Tower (Balanced) với timeout siêu ngắn 1.5s
        if (!instantCoords) {
          try {
            const quickPromise = Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const quickTimeout = new Promise<null>((r) => setTimeout(() => r(null), 1500));
            const quickLoc = (await Promise.race([quickPromise, quickTimeout])) as Location.LocationObject | null;
            if (isTabFocusedRef.current && isMountedRef.current && quickLoc && quickLoc.coords) {
              instantCoords = { latitude: quickLoc.coords.latitude, longitude: quickLoc.coords.longitude };
              setUserLocation(instantCoords);
              setCurrentLocationName("Vị trí mạng");
              onLocationUpdated?.(instantCoords, quickLoc.coords.accuracy || 25, centerOnUser);
            }
          } catch {
            // Bỏ qua
          }
        }

        // ── BƯỚC 2: TINH CHỈNH VỊ TRÍ NGẦM VỚI ĐỘ CHÍNH XÁC CAO (BACKGROUND REFINEMENT) ──
        // Sau khi UI đã có vị trí hiển thị, âm thầm gọi request Highest Accuracy và khởi động Watcher
        // để thu hẹp độ chính xác từng mét ngay khi chip GPS sẵn sàng
        startPositionWatch();

        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          mayShowUserSettingsDialog: !silent,
        })
          .then((freshLoc) => {
            if (isTabFocusedRef.current && isMountedRef.current && freshLoc && freshLoc.coords) {
              const freshCoords = { latitude: freshLoc.coords.latitude, longitude: freshLoc.coords.longitude };
              setUserLocation(freshCoords);
              setCurrentLocationName("GPS thực tế");
              // Tinh chỉnh cập nhật lại tọa độ chính xác cao vào bản đồ (êm dịu, không giật màn hình)
              onLocationUpdated?.(freshCoords, freshLoc.coords.accuracy || 5, false);

              const distKm = calculateDistanceKm(
                freshCoords.latitude,
                freshCoords.longitude,
                TNU_CAMPUS_CENTER.lat,
                TNU_CAMPUS_CENTER.lng
              );
              if (distKm > 2.5 && !silent) {
                Alert.alert(
                  "Đang ở ngoài trường",
                  `GPS xác định bạn đang cách trường ĐH Tây Nguyên ~${distKm.toFixed(1)}km.\n\nNếu muốn test vẽ đường đi bộ nội bộ trường, bạn có thể chọn một trong các 'Vị trí mẫu' tại cổng trường!`
                );
              }
            }
          })
          .catch(() => {
            // Nếu quét Highest accuracy thất bại do trong hầm/nhà kín, watcher vẫn sẽ tiếp tục lắng nghe ngầm
          });

      } catch (err) {
        console.warn("Lỗi vị trí GPS:", err);
        if (!silent && isMountedRef.current) {
          Alert.alert(
            "Chưa lấy được GPS chính xác",
            "Vui lòng ra vị trí thông thoáng hoặc bật 'Độ chính xác vị trí của Google' trong Cài đặt máy để bắt tín hiệu tốt hơn."
          );
        }
      } finally {
        if (isMountedRef.current) {
          setLocationLoading(false);
        }
      }
      return instantCoords;
    },
    [onLocationUpdated, startPositionWatch]
  );

  // Chọn vị trí mẫu
  const handleSelectSampleLocation = useCallback(
    (sample: typeof TNU_SAMPLE_TEST_LOCATIONS[0]) => {
      setShowLocationPicker(false);
      const coords = { latitude: sample.latitude, longitude: sample.longitude };
      setUserLocation(coords);
      setCurrentLocationName(sample.name);
      onLocationUpdated?.(coords, 8, true);
    },
    [onLocationUpdated]
  );

  // Theo dõi La bàn / Hướng nhìn (watchHeadingAsync)
  const startHeadingTracking = useCallback(async () => {
    if (!isTabFocusedRef.current || !isMountedRef.current) return;
    try {
      if (await isGuestUser()) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isTabFocusedRef.current || !isMountedRef.current || status !== "granted") return;

      if (headingSubscriptionRef.current) return;

      const sub = await Location.watchHeadingAsync((headingData) => {
        if (!isTabFocusedRef.current || !isMountedRef.current) return;
        const h = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        if (h !== undefined && h !== null && !isNaN(h) && h >= 0) {
          const rounded = Math.round(h);
          const now = Date.now();

          // Throttling 450ms
          if (now - lastHeadingTimeRef.current < 450) return;

          let diff = Math.abs(rounded - lastSentHeadingRef.current);
          if (diff > 180) diff = 360 - diff;

          // Chống rung tay: Chỉ gửi khi góc thay đổi >= 8 độ
          if (diff >= 8) {
            lastSentHeadingRef.current = rounded;
            lastHeadingTimeRef.current = now;
            onHeadingUpdated?.(rounded);

            if (compassModeRef.current) {
              setBearing(rounded);
              onBearingUpdated?.(rounded, true);
            }
          }
        }
      });

      headingSubscriptionRef.current = sub;
    } catch {
      // Thiết bị không có cảm biến la bàn
    }
  }, [onHeadingUpdated, onBearingUpdated]);

  const toggleCompassMode = useCallback(() => {
    if (compassMode) {
      compassModeRef.current = false;
      setCompassMode(false);
      setBearing(0);
      onBearingUpdated?.(0, true);
    } else {
      compassModeRef.current = true;
      setCompassMode(true);
      if (lastSentHeadingRef.current > 0) {
        setBearing(lastSentHeadingRef.current);
        onBearingUpdated?.(lastSentHeadingRef.current, true);
      }
      startHeadingTracking();
    }
  }, [compassMode, startHeadingTracking, onBearingUpdated]);

  const resetBearing = useCallback(() => {
    compassModeRef.current = false;
    setCompassMode(false);
    setBearing(0);
    onBearingUpdated?.(0, true);
  }, [onBearingUpdated]);

  const rotateStep = useCallback(
    (delta: number) => {
      compassModeRef.current = false;
      setCompassMode(false);
      setBearing((prev) => {
        const next = (((prev + delta) % 360) + 360) % 360;
        onBearingUpdated?.(next, true);
        return next;
      });
    },
    [onBearingUpdated]
  );

  // Quản lý vòng đời khi chuyển Tab
  useFocusEffect(
    useCallback(() => {
      isTabFocusedRef.current = true;
      startHeadingTracking();
      startPositionWatch();
      return () => {
        isTabFocusedRef.current = false;
        setLocationLoading(false);
        setShowLocationPicker(false);
        stopAllTracking();
      };
    }, [startHeadingTracking, startPositionWatch, stopAllTracking])
  );

  // Quản lý vòng đời khi Component Unmount hoàn toàn (Ngăn chặn Memory Leak)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopAllTracking();
    };
  }, [stopAllTracking]);

  return {
    userLocation,
    locationLoading,
    showLocationPicker,
    setShowLocationPicker,
    currentLocationName,
    bearing,
    compassMode,
    isWatchingPosition,
    fetchRealGpsLocation,
    startPositionWatch,
    stopPositionWatch,
    handleSelectSampleLocation,
    toggleCompassMode,
    resetBearing,
    rotateStep,
    setBearing,
    stopCompassTracking,
  };
}
