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

  // Lấy vị trí GPS thật (tối ưu hóa pin và phản hồi tức thời)
  const fetchRealGpsLocation = useCallback(
    async (centerOnUser = true, silent = false): Promise<UserCoords | null> => {
      if (!isTabFocusedRef.current || !isMountedRef.current) return null;
      setShowLocationPicker(false);
      setLocationLoading(true);

      let resultCoords: UserCoords | null = null;

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

        // Bước 1: Đọc nhanh từ cache OS nhưng CHỈ CHẤP NHẬN nếu sai số nhỏ (accuracy <= 35m)
        // Tuyệt đối không dùng cache trạm phát sóng di động BTS (sai số 150m - 500m) làm GPS chốt
        try {
          const lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 30000 });
          if (isTabFocusedRef.current && isMountedRef.current && lastLoc && lastLoc.coords) {
            const acc = lastLoc.coords.accuracy || 100;
            // Chỉ hiển thị tạm thời nếu độ chính xác khả dĩ
            if (acc <= 45) {
              const cached = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
              resultCoords = cached;
              setUserLocation(cached);
              setCurrentLocationName("GPS thực tế");
              onLocationUpdated?.(cached, acc, centerOnUser);
            }
          }
        } catch {
          // Bỏ qua
        }

        // Bước 2: Quét trực tiếp vệ tinh GPS bằng Accuracy.Highest (độ chính xác cao nhất)
        const positionPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          mayShowUserSettingsDialog: !silent,
        });

        // Tăng timeout lên 8 giây để chip GNSS phần cứng đủ thời gian kết nối vệ tinh khi ở trong khuôn viên trường
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
        const freshLoc = (await Promise.race([positionPromise, timeoutPromise])) as Location.LocationObject | null;

        if (!isTabFocusedRef.current || !isMountedRef.current) return resultCoords;

        if (freshLoc && freshLoc.coords) {
          const freshCoords = { latitude: freshLoc.coords.latitude, longitude: freshLoc.coords.longitude };
          resultCoords = freshCoords;
          setUserLocation(freshCoords);
          setCurrentLocationName("GPS thực tế");
          onLocationUpdated?.(freshCoords, freshLoc.coords.accuracy || 5, centerOnUser);

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
        } else if (!resultCoords) {
          // Nếu cả cache và fresh đều chưa kịp thì tiếp tục kích hoạt watcher để nhận fix ngay khi vệ tinh khóa
          startPositionWatch();
        }
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
      return resultCoords;
    },
    [onLocationUpdated]
  );

  // Bắt đầu theo dõi vị trí liên tục theo thời gian thực (watchPositionAsync độ chính xác cao nhất)
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
          distanceInterval: 1.5, // Cập nhật ngay khi người dùng bước đi >= 1.5 mét
          timeInterval: 1500,     // Chu kỳ 1.5 giây để liên tục tinh chỉnh tọa độ
        },
        (loc) => {
          if (!isTabFocusedRef.current || !isMountedRef.current || !loc.coords) return;
          const now = Date.now();
          if (now - lastPositionTimeRef.current < 1000) return;
          lastPositionTimeRef.current = now;

          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(coords);
          setCurrentLocationName("GPS thực tế");
          onLocationUpdated?.(coords, loc.coords.accuracy || 5, false);
        }
      );

      positionSubscriptionRef.current = sub;
      if (isMountedRef.current) setIsWatchingPosition(true);
    } catch {
      // Bỏ qua lỗi
    }
  }, [onLocationUpdated]);

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
