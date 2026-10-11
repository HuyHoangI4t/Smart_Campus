import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";

interface MapControlsOverlayProps {
  mapLayer: "osm" | "satellite";
  bearing: number;
  compassMode: boolean;
  locationLoading: boolean;
  hasUserLocation: boolean;
  isRoutingActive?: boolean;
  activeRoute: {
    distanceMeters?: number;
    durationMinutes?: number;
  } | null;
  onToggleLayer: () => void;
  onCompassPress: () => void;
  onResetBearing: () => void;
  onUserLocationPress: () => void;
  onUserLocationLongPress?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onRotateStep: (delta: number) => void;
  onClearRoute: () => void;
}

/**
 * Cụm nút điều khiển bản đồ nổi (MapControlsOverlay) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Phong cách Material 3 Expressive Floating Action Buttons (FABs) với kích thước 46x46pt,
 * nền kính mờ nhẹ (Glassmorphic Tint), viền Hairline sắc nét và bóng đổ khuếch tán mềm.
 */
const MapControlsOverlayComponent: React.FC<MapControlsOverlayProps> = ({
  mapLayer,
  bearing,
  compassMode,
  locationLoading,
  hasUserLocation,
  isRoutingActive = false,
  activeRoute,
  onToggleLayer,
  onCompassPress,
  onResetBearing,
  onUserLocationPress,
  onUserLocationLongPress,
  onResetView,
  onClearRoute,
}) => {
  const handleToggleLayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleLayer();
  };

  const handleCompass = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onCompassPress();
  };

  const handleLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onUserLocationPress();
  };

  const handleLocationLong = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onUserLocationLongPress) {
      onUserLocationLongPress();
    } else {
      onUserLocationPress();
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onResetView?.();
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClearRoute();
  };

  return (
    <>
      {/* ── BANNER HIỂN THỊ THÔNG TIN TUYẾN ĐƯỜNG ĐI BỘ ĐANG VẼ (KHI KHÔNG Ở CHẾ ĐỘ DẪN ĐƯỜNG TỐI GIẢN) ── */}
      {activeRoute && !isRoutingActive && (
        <View style={styles.routeBanner}>
          <View style={styles.routeBannerLeft}>
            <View style={styles.routeBannerIcon}>
              <Feather name="navigation" size={14} color={AppColors.success} />
            </View>
            <View>
              <Text style={styles.routeBannerTitle}>
                Tuyến đường đi bộ
              </Text>
              <Text style={styles.routeBannerSubtitle}>
                {activeRoute.distanceMeters ? `~${activeRoute.distanceMeters}m` : ""}{" "}
                {activeRoute.durationMinutes ? `• ~${activeRoute.durationMinutes} phút` : ""}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearRouteBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Hủy tuyến đường"
          >
            <Feather name="x" size={14} color={AppColors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* ── CỤM NÚT ĐIỀU KHIỂN NỔI (GÓC PHẢI BẢN ĐỒ) ────────────────────── */}
      <View
        style={[
          styles.controlsContainer,
          { top: isRoutingActive ? 80 : 116 },
        ]}
      >
        {/* Nút chuyển đổi Lớp bản đồ (2D vs Vệ tinh) */}
        <Pressable
          onPress={handleToggleLayer}
          style={({ pressed }) => [
            styles.fabControl,
            pressed && styles.fabControlPressed,
          ]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Chuyển đổi lớp bản đồ vệ tinh hoặc 2D"
        >
          <Feather
            name={mapLayer === "osm" ? "layers" : "globe"}
            size={19}
            color={AppColors.primary}
          />
        </Pressable>

        {/* Nút La Bàn Chỉ Hướng Bắc (Compass Widget) */}
        <Pressable
          onPress={handleCompass}
          style={({ pressed }) => [
            styles.fabControl,
            compassMode && styles.compassBtnActive,
            pressed && styles.fabControlPressed,
          ]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Bật hoặc tắt la bàn xoay bản đồ"
        >
          <View
            style={{
              transform: [{ rotate: `${-bearing}deg` }],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name="compass-outline"
              size={24}
              color={compassMode ? AppColors.info : AppColors.danger}
            />
          </View>

          {compassMode && (
            <View style={styles.compassActiveDot} />
          )}
        </Pressable>

        {/* Nút Định vị GPS của tôi */}
        <Pressable
          onPress={handleLocation}
          onLongPress={handleLocationLong}
          style={({ pressed }) => [
            styles.fabControl,
            hasUserLocation && styles.locationBtnActive,
            pressed && styles.fabControlPressed,
          ]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Định vị vị trí hiện tại"
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={AppColors.primary} />
          ) : (
            <MaterialIcons
              name={hasUserLocation ? "my-location" : "location-searching"}
              size={22}
              color={hasUserLocation ? AppColors.info : AppColors.textSecondary}
            />
          )}
        </Pressable>

        {/* Nút Đặt lại góc nhìn toàn cảnh trường */}
        {onResetView && (
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.fabControl,
              pressed && styles.fabControlPressed,
            ]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Xem toàn cảnh khuôn viên trường"
          >
            <Feather name="maximize-2" size={17} color={AppColors.textSecondary} />
          </Pressable>
        )}
      </View>
    </>
  );
};

export const MapControlsOverlay = React.memo(MapControlsOverlayComponent);

const styles = StyleSheet.create({
  routeBanner: {
    position: "absolute",
    top: 108,
    left: 12,
    right: 70,
    zIndex: 45,
    backgroundColor: "rgba(255, 255, 255, 0.96)", // Glassmorphic translucent surface
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  routeBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  routeBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${AppColors.success}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  routeBannerTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: AppColors.text,
  },
  routeBannerSubtitle: {
    fontSize: 11,
    color: AppColors.success,
    fontWeight: "800",
  },
  clearRouteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  controlsContainer: {
    position: "absolute",
    right: 12,
    zIndex: 45,
    alignItems: "center",
    gap: 10,
  },
  fabControl: {
    width: 46, // Kích thước FAB chuẩn Material 3 Expressive
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Glassmorphic background
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1, // Viền Hairline siêu mỏng
    borderColor: AppColors.cardBorder,
  },
  fabControlPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.94 }], // Co giãn lò xo mượt mà
  },
  compassBtnActive: {
    backgroundColor: `${AppColors.info}16`,
    borderWidth: 1.5,
    borderColor: AppColors.info,
  },
  compassActiveDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: AppColors.success,
    borderWidth: 1.2,
    borderColor: AppColors.cardBg,
  },
  locationBtnActive: {
    borderColor: AppColors.info,
  },
});
