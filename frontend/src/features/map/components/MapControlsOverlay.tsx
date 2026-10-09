import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onRotateStep: (delta: number) => void;
  onClearRoute: () => void;
}

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
  onZoomIn,
  onZoomOut,
  onResetView,
  onRotateStep,
  onClearRoute,
}) => {
  return (
    <>
      {/* ── BANNER HIỂN THỊ THÔNG TIN TUYẾN ĐƯỜNG ĐI BỘ ĐANG VẼ (KHI KHÔNG Ở CHẾ ĐỘ DẪN ĐƯỜNG TỐI GIẢN) ── */}
      {activeRoute && !isRoutingActive && (
        <View
          style={{
            position: "absolute",
            top: 108,
            left: 12,
            right: 64,
            zIndex: 45,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#ECFDF5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="navigation" size={14} color="#059669" />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#0F172A" }}>
                Tuyến đường đi bộ
              </Text>
              <Text style={{ fontSize: 11, color: "#059669", fontWeight: "700" }}>
                {activeRoute.distanceMeters ? `~${activeRoute.distanceMeters}m` : ""}{" "}
                {activeRoute.durationMinutes ? `• ~${activeRoute.durationMinutes} phút` : ""}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClearRoute}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="x" size={13} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── CỤM NÚT ĐIỀU KHIỂN NỔI (GÓC PHẢI BẢN ĐỒ) ────────────────────── */}
      <View
        style={{
          position: "absolute",
          top: isRoutingActive ? 76 : 108,
          right: 12,
          zIndex: 45,
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Nút chuyển đổi Lớp bản đồ (2D vs Vệ tinh) - Luôn hiển thị kể cả khi chỉ đường */}
        <TouchableOpacity
          onPress={onToggleLayer}
          activeOpacity={0.8}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 5,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <Feather
            name={mapLayer === "osm" ? "layers" : "globe"}
            size={18}
            color={AppColors.primary}
          />
        </TouchableOpacity>

        {/* Nút La Bàn Chỉ Hướng Bắc (Compass Widget) */}
        <TouchableOpacity
          onPress={onCompassPress}
          activeOpacity={0.8}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: compassMode ? "#EFF6FF" : "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 5,
            borderWidth: compassMode ? 2 : 1,
            borderColor: compassMode ? "#2563EB" : "#E2E8F0",
            position: "relative",
          }}
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
              color={compassMode ? "#2563EB" : "#EF4444"}
            />
          </View>

          {compassMode && (
            <View
              style={{
                position: "absolute",
                top: 3,
                right: 3,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#10B981",
                borderWidth: 1.5,
                borderColor: "#FFFFFF",
              }}
            />
          )}
        </TouchableOpacity>

        {/* Nút Định vị GPS của tôi */}
        <TouchableOpacity
          onPress={onUserLocationPress}
          activeOpacity={0.8}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 5,
            borderWidth: 1,
            borderColor: hasUserLocation ? "#2563EB" : "#E2E8F0",
          }}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={AppColors.primary} />
          ) : (
            <MaterialIcons
              name={hasUserLocation ? "my-location" : "location-searching"}
              size={22}
              color={hasUserLocation ? "#2563EB" : "#475569"}
            />
          )}
        </TouchableOpacity>

        {/* Nút Đặt lại góc nhìn toàn cảnh trường */}
        {onResetView && (
          <TouchableOpacity
            onPress={onResetView}
            activeOpacity={0.8}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 5,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <Feather name="maximize-2" size={17} color="#475569" />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export const MapControlsOverlay = React.memo(MapControlsOverlayComponent);
