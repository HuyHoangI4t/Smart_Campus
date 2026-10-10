import { useState, useRef, useCallback } from "react";
import { Alert, Platform } from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { calculateDistanceKm } from "../utils";
import { TNU_CAMPUS_CENTER, TNU_SAMPLE_TEST_LOCATIONS } from "../constants";

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

  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isTabFocusedRef = useRef<boolean>(true);
  const compassModeRef = useRef<boolean>(false);
  const lastSentHeadingRef = useRef<number>(0);
  const lastSentBearingRef = useRef<number>(0);
  const lastHeadingTimeRef = useRef<number>(0);

  // Lấy vị trí GPS thật (tối ưu hóa pin và phản hồi tức thời)
  // Lấy vị trí GPS thật (tối ưu hóa pin và phản hồi tức thời, trả về tọa độ để tránh closure stale state)
  const fetchRealGpsLocation = useCallback(
    async (centerOnUser = true, silent = false): Promise<UserCoords | null> => {
      if (!isTabFocusedRef.current) return null;
      setShowLocationPicker(false);
      setLocationLoading(true);

      let resultCoords: UserCoords | null = null;

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isTabFocusedRef.current) return null;

        if (permission.status !== "granted") {
          setLocationLoading(false);
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
            "Đang dùng vị trí ước lượng",
            "Thiết bị đang cấp quyền vị trí tương đối. Để chỉ đường chính xác, vui lòng bật 'Dùng vị trí chính xác' trong Cài đặt máy."
          );
        }

        // Bước 1: Thử lấy vị trí cache gần nhất để phản hồi ngay 0ms
        try {
          const lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
          if (isTabFocusedRef.current && lastLoc && lastLoc.coords) {
            const cached = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
            resultCoords = cached;
            setUserLocation(cached);
            setCurrentLocationName("GPS thực tế");
            onLocationUpdated?.(cached, lastLoc.coords.accuracy || 15, centerOnUser);
          }
        } catch {
          // Bỏ qua nếu chưa có cache
        }

        // Bước 2: Quét GPS vệ tinh mới
        const positionPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: !silent,
        });

        // Nếu đã có vị trí cache sẵn, trả về ngay 0ms tức thì để bấm chỉ đường phản hồi ngay lập tức
        if (resultCoords) {
          positionPromise.then((freshLoc) => {
            if (isTabFocusedRef.current && freshLoc && freshLoc.coords) {
              const freshCoords = { latitude: freshLoc.coords.latitude, longitude: freshLoc.coords.longitude };
              setUserLocation(freshCoords);
              onLocationUpdated?.(freshCoords, freshLoc.coords.accuracy || 10, false);
            }
          }).catch(() => {});
          return resultCoords;
        }

        // Nếu chưa có cache, chờ tối đa 2.5s (thay vì 7s) để phản hồi siêu tốc không bị treo
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const freshLoc = (await Promise.race([positionPromise, timeoutPromise])) as Location.LocationObject | null;

        if (!isTabFocusedRef.current) return resultCoords;

        if (freshLoc && freshLoc.coords) {
          const freshCoords = { latitude: freshLoc.coords.latitude, longitude: freshLoc.coords.longitude };
          resultCoords = freshCoords;
          setUserLocation(freshCoords);
          setCurrentLocationName("GPS thực tế");
          onLocationUpdated?.(freshCoords, freshLoc.coords.accuracy || 10, centerOnUser);

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
      } catch (err) {
        console.warn("Lỗi vị trí GPS:", err);
        if (!silent) {
          Alert.alert(
            "Chưa lấy được GPS",
            "Hãy bật định vị trong Cài đặt máy hoặc chọn một 'Vị trí mẫu' tại trường để test bản đồ."
          );
        }
      } finally {
        setLocationLoading(false);
      }
      return resultCoords;
    },
    [onLocationUpdated]
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

  // Theo dõi La bàn / Hướng nhìn (Cập nhật hình tam giác người dùng + xoay bản đồ nếu bật compassMode)
  const startHeadingTracking = useCallback(async () => {
    if (!isTabFocusedRef.current) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isTabFocusedRef.current || status !== "granted") return;

      if (headingSubscriptionRef.current) {
        return;
      }

      const sub = await Location.watchHeadingAsync((headingData) => {
        if (!isTabFocusedRef.current) return;
        const h = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        if (h !== undefined && h !== null && !isNaN(h) && h >= 0) {
          const rounded = Math.round(h);
          const now = Date.now();

          // Giảm tần suất sử dụng la bàn: tối thiểu 450ms giữa 2 lần cập nhật để tiết kiệm pin và tránh giật
          if (now - lastHeadingTimeRef.current < 450) {
            return;
          }

          // Tính khoảng cách góc ngắn nhất (shortest angular difference)
          let diff = Math.abs(rounded - lastSentHeadingRef.current);
          if (diff > 180) diff = 360 - diff;

          // Giảm độ nhạy: Chỉ cập nhật khi góc lệch >= 8 độ để triệt tiêu hoàn toàn rung lắc tự nhiên của tay
          if (diff >= 8) {
            lastSentHeadingRef.current = rounded;
            lastHeadingTimeRef.current = now;
            onHeadingUpdated?.(rounded);

            // Nếu người dùng đang kích hoạt chế độ La bàn xoay cả bản đồ:
            if (compassModeRef.current) {
              setBearing(rounded);
              onBearingUpdated?.(rounded, true);
            }
          }
        }
      });

      headingSubscriptionRef.current = sub;
    } catch (err) {
      // Thiết bị có thể không có cảm biến từ trường
    }
  }, [onHeadingUpdated, onBearingUpdated]);

  const stopCompassTracking = useCallback(() => {
    compassModeRef.current = false;
    setCompassMode(false);
  }, []);

  const stopHeadingTracking = useCallback(() => {
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
    }
    stopCompassTracking();
  }, [stopCompassTracking]);

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

  // Tự động khởi động / ngắt cảm biến khi tab đóng mở
  useFocusEffect(
    useCallback(() => {
      isTabFocusedRef.current = true;
      startHeadingTracking();
      return () => {
        isTabFocusedRef.current = false;
        setLocationLoading(false);
        setShowLocationPicker(false);
        stopHeadingTracking();
      };
    }, [startHeadingTracking, stopHeadingTracking])
  );

  return {
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
  };
}
