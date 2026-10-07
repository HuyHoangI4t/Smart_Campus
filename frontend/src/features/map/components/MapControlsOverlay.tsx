import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";

interface MapControlsOverlayProps {
  mapLayer: "osm" | "satellite";
  bearing: number;
  compassMode: boolean;
  locationLoading: boolean;
  hasUserLocation: boolean;
  activeRoute: {
    distanceMeters?: number;
    durationMinutes?: number;
  } | null;
  onToggleLayer: () => void;
  onCompassPress: () => void;
  onResetBearing: () => void;
  onUserLocationPress: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onRotateStep: (delta: number) => void;
  onClearRoute: () => void;
}

export const MapControlsOverlay: React.FC<MapControlsOverlayProps> = ({
  mapLayer,
  bearing,
  compassMode,
  locationLoading,
  hasUserLocation,
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
      {/* ── CỤM NÚT ĐIỀU KHIỂN NỔI (GÓC TRÊN BÊN PHẢI) ────────────────────── */}
      <View
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 30,
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Nút chuyển Bản đồ / Vệ tinh */}
        {/* <TouchableOpacity
          onPress={onToggleLayer}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 14,
            backgroundColor: "#FFFFFF",
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <Feather
            name={mapLayer === "osm" ? "layers" : "globe"}
            size={14}
            color={AppColors.primary}
          />
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#1E293B" }}>
            {mapLayer === "osm" ? "Vệ tinh" : "Bản đồ"}
          </Text>
        </TouchableOpacity> */}

        {/* Nút La Bàn Chỉ Hướng Bắc (Compass Widget) */}
        <TouchableOpacity
          onPress={onCompassPress}
          activeOpacity={0.8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: compassMode ? "#EFF6FF" : "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 4,
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
                top: 2,
                right: 2,
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
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 1,
            borderColor: hasUserLocation ? "#10B981" : "#E2E8F0",
          }}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={AppColors.primary} />
          ) : (
            <Feather
              name="navigation"
              size={17}
              color={hasUserLocation ? "#10B981" : AppColors.primary}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          )}
        </TouchableOpacity>

        {/* Cụm Zoom (+ / Reset / -) */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            overflow: "hidden",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={onZoomIn}
            activeOpacity={0.7}
            style={{ width: 40, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="plus" size={17} color="#1E293B" />
          </TouchableOpacity>

          <View style={{ width: 24, height: 1, backgroundColor: "#E2E8F0" }} />

          <TouchableOpacity
            onPress={onResetView}
            activeOpacity={0.7}
            style={{ width: 40, height: 30, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="maximize-2" size={13} color="#64748B" />
          </TouchableOpacity>

          <View style={{ width: 24, height: 1, backgroundColor: "#E2E8F0" }} />

          <TouchableOpacity
            onPress={onZoomOut}
            activeOpacity={0.7}
            style={{ width: 40, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="minus" size={17} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Cặp nút xoay nhanh trái/phải
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => onRotateStep(-30)}
            activeOpacity={0.7}
            style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="rotate-ccw" size={12} color="#475569" />
          </TouchableOpacity>
          <View style={{ width: 1, height: 26, backgroundColor: "#E2E8F0" }} />
          <TouchableOpacity
            onPress={() => onRotateStep(30)}
            activeOpacity={0.7}
            style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="rotate-cw" size={12} color="#475569" />
          </TouchableOpacity>
        </View> */}
      </View>

      {/* ── THẺ THÔNG BÁO LA BÀN ĐANG HOẠT ĐỘNG HOẶC ĐỘ LỆCH XOAY ────────────
      {bearing !== 0 && (
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 30,
            backgroundColor: compassMode ? "rgba(15, 41, 100, 0.92)" : "rgba(30, 41, 59, 0.88)",
            borderRadius: 14,
            paddingHorizontal: 10,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <MaterialCommunityIcons
            name={compassMode ? "compass" : "rotate-3d-variant"}
            size={15}
            color={compassMode ? "#60A5FA" : "#F8FAFC"}
          />
          <TouchableOpacity
            onPress={onResetBearing}
            style={{
              marginLeft: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: "rgba(255,255,255,0.22)",
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: "800", color: "#FFFFFF" }}>Đặt lại</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* ── THẺ THÔNG BÁO ĐANG CHỈ ĐƯỜNG TRỰC TIẾP TRÊN BẢN ĐỒ ────────────── */}
      {activeRoute && (
        <View
          style={{
            position: "absolute",
            top: bearing !== 0 ? 52 : 12,
            left: 12,
            zIndex: 30,
            backgroundColor: "#0F2964",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <Feather name="compass" size={16} color="#60A5FA" />
          <View>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
              Đang chỉ đường đi bộ
            </Text>
            <Text style={{ fontSize: 10, color: "#93C5FD" }}>
              {activeRoute.distanceMeters ? `~${activeRoute.distanceMeters}m` : "Trong khuôn viên"}{" "}
              {activeRoute.durationMinutes ? `• ~${activeRoute.durationMinutes} phút` : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClearRoute}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={{
              marginLeft: 4,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="x" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

