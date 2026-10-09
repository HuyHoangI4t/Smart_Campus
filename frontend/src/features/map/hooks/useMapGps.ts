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
}

export function useMapGps(options: UseMapGpsOptions = {}) {
  const { onLocationUpdated, onBearingUpdated } = options;

  const [userLocation, setUserLocation] = useState<UserCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>("GPS của bạn");

  const [bearing, setBearing] = useState<number>(0);
  const [compassMode, setCompassMode] = useState<boolean>(false);

  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isTabFocusedRef = useRef<boolean>(true);
  const lastSentBearingRef = useRef<number>(0);
  const lastHeadingTimeRef = useRef<number>(0);

  // Lấy vị trí GPS thật (tối ưu hóa pin và phản hồi tức thời)
  const fetchRealGpsLocation = useCallback(
    async (centerOnUser = true) => {
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

        if (Platform.OS === "android" && (permission as any).android?.accuracy === "coarse") {
          Alert.alert(
            "Đang dùng vị trí ước lượng",
            "Thiết bị đang cấp quyền vị trí tương đối. Để chỉ đường chính xác, vui lòng bật 'Dùng vị trí chính xác' trong Cài đặt máy."
          );
        }

        // Bước 1: Thử lấy vị trí cache gần nhất để phản hồi ngay 0ms
        try {
          const lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 45000 });
          if (isTabFocusedRef.current && lastLoc && lastLoc.coords) {
            const cached = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
            setUserLocation(cached);
            setCurrentLocationName("GPS thực tế");
            onLocationUpdated?.(cached, lastLoc.coords.accuracy || 15, centerOnUser);
          }
        } catch {
          // Bỏ qua nếu chưa có cache
        }

        // Bước 2: Quét GPS vệ tinh tươi mới với timeout bảo vệ 7s tránh treo CPU
        const positionPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: true,
        });

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 7000));
        const freshLoc = (await Promise.race([positionPromise, timeoutPromise])) as Location.LocationObject | null;

        if (!isTabFocusedRef.current) return;

        if (freshLoc && freshLoc.coords) {
          const freshCoords = { latitude: freshLoc.coords.latitude, longitude: freshLoc.coords.longitude };
          setUserLocation(freshCoords);
          setCurrentLocationName("GPS thực tế");
          onLocationUpdated?.(freshCoords, freshLoc.coords.accuracy || 10, centerOnUser);

          const distKm = calculateDistanceKm(
            freshCoords.latitude,
            freshCoords.longitude,
            TNU_CAMPUS_CENTER.lat,
            TNU_CAMPUS_CENTER.lng
          );
          if (distKm > 2.5) {
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

  // Theo dõi La bàn (Đã tiết giảm tần suất để triệt tiêu tải CPU)
  const startCompassTracking = useCallback(async () => {
    if (!isTabFocusedRef.current) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isTabFocusedRef.current || status !== "granted") return;

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
          // Giới hạn: chỉ cập nhật khi góc lệch >= 4 độ và cách lần trước ít nhất 150ms
          if ((diff >= 4 || diff >= 356) && now - lastHeadingTimeRef.current >= 150) {
            lastSentBearingRef.current = rounded;
            lastHeadingTimeRef.current = now;
            setBearing(rounded);
            onBearingUpdated?.(rounded, true);
          }
        }
      });

      headingSubscriptionRef.current = sub;
      setCompassMode(true);
    } catch (err) {
      console.warn("Lỗi cảm biến la bàn:", err);
    }
  }, [onBearingUpdated]);

  const stopCompassTracking = useCallback(() => {
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
      headingSubscriptionRef.current = null;
    }
    setCompassMode(false);
  }, []);

  const toggleCompassMode = useCallback(() => {
    if (compassMode) {
      stopCompassTracking();
    } else {
      startCompassTracking();
    }
  }, [compassMode, startCompassTracking, stopCompassTracking]);

  const resetBearing = useCallback(() => {
    stopCompassTracking();
    setBearing(0);
    onBearingUpdated?.(0, true);
  }, [stopCompassTracking, onBearingUpdated]);

  const rotateStep = useCallback(
    (delta: number) => {
      stopCompassTracking();
      setBearing((prev) => {
        const next = (((prev + delta) % 360) + 360) % 360;
        onBearingUpdated?.(next, true);
        return next;
      });
    },
    [stopCompassTracking, onBearingUpdated]
  );

  // Tự động ngắt toàn bộ GPS / Cảm biến khi tab rời khỏi màn hình
  useFocusEffect(
    useCallback(() => {
      isTabFocusedRef.current = true;
      return () => {
        isTabFocusedRef.current = false;
        setLocationLoading(false);
        setShowLocationPicker(false);
        stopCompassTracking();
      };
    }, [stopCompassTracking])
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
