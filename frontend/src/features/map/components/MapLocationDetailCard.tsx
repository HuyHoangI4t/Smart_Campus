import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { LocationItem, ParsedCampusRoom } from "../types";
import { formatDistanceText, calculateDistanceKm } from "../utils";

interface MapLocationDetailCardProps {
  selectedLoc: LocationItem;
  userLocation: { latitude: number; longitude: number } | null;
  matchedTargetId: string | null;
  currentParsed: ParsedCampusRoom | null;
  targetSubject?: string;
  bottomOffset?: number;
  onClose: () => void;
  onStartDirections: () => void;
  onOpenGoogleMaps: () => void;
}

const MapLocationDetailCardComponent: React.FC<MapLocationDetailCardProps> = ({
  selectedLoc,
  userLocation,
  matchedTargetId,
  currentParsed,
  targetSubject,
  bottomOffset = 100,
  onClose,
  onStartDirections,
  onOpenGoogleMaps,
}) => {
  const isMatch = matchedTargetId && String(selectedLoc.id) === String(matchedTargetId);

  return (
    <View
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 12,
        right: 12,
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderRadius: 22,
        padding: 16,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
        borderColor: "rgba(226, 232, 240, 0.9)",
      }}
    >
      {/* ── THANH TAY CẦM KÉO NHẸ (SHEET HANDLE) ── */}
      <View
        style={{
          width: 38,
          height: 4,
          borderRadius: 2,
          backgroundColor: "#CBD5E1",
          alignSelf: "center",
          marginBottom: 12,
        }}
      />

      {/* ── HEADER ĐỊA ĐIỂM: HUY HIỆU & NÚT ĐÓNG ── */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, flex: 1, marginRight: 8 }}>
          {isMatch && currentParsed ? (
            <>
              <View style={{ backgroundColor: AppColors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 10.5, fontWeight: "900", color: "#FFFFFF" }}>
                  {currentParsed.buildingCode.toUpperCase()}
                </Text>
              </View>
              {currentParsed.floor ? (
                <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: "800", color: AppColors.primary }}>
                    {currentParsed.floor}
                  </Text>
                </View>
              ) : null}
              <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#334155" }}>
                  {currentParsed.roomNumber}
                </Text>
              </View>
            </>
          ) : (
            <View
              style={{
                backgroundColor: selectedLoc.color || AppColors.primary,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Feather name={(selectedLoc.icon as any) || "map-pin"} size={11} color="#FFFFFF" />
              <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#FFFFFF" }}>
                {selectedLoc.category?.toUpperCase() || "TÒA NHÀ KHUÔN VIÊN"}
              </Text>
            </View>
          )}

          {userLocation && (
            <View
              style={{
                backgroundColor: "#ECFDF5",
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Feather name="navigation" size={10} color="#059669" />
              <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#059669" }}>
                Cách bạn {formatDistanceText(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng)}
                {" • "}
                ~{Math.max(1, Math.ceil((calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng) * 1000) / 80))} phút đi bộ
              </Text>
            </View>
          )}
        </View>

        {/* Nút Đóng */}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="x" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* ── TIÊU ĐỀ ĐỊA ĐIỂM ── */}
      <Text style={{ fontSize: 16, fontWeight: "900", color: AppColors.text, marginBottom: 2 }}>
        {isMatch && targetSubject ? targetSubject : selectedLoc.name}
      </Text>

      {/* ── TÒA NHÀ & TẦNG ── */}
      <Text style={{ fontSize: 12, color: AppColors.primary, fontWeight: "700", marginBottom: 6 }}>
        {isMatch && currentParsed
          ? currentParsed.fullDisplay
          : `${selectedLoc.building}${selectedLoc.floor ? ` • ${selectedLoc.floor}` : ""}`}
      </Text>

      {/* ── HƯỚNG DẪN LỐI ĐI / MÔ TẢ ── */}
      {isMatch && currentParsed ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#F8FAFC",
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <Feather name="compass" size={13} color="#2563EB" />
          <Text style={{ fontSize: 11.5, color: "#334155", fontWeight: "600", flex: 1 }}>
            {currentParsed.routeGuide}
          </Text>
        </View>
      ) : selectedLoc.description ? (
        <Text style={{ fontSize: 11.5, color: AppColors.textSecondary, marginBottom: 12, lineHeight: 16 }} numberOfLines={2}>
          {selectedLoc.description}
        </Text>
      ) : (
        <View style={{ height: 6 }} />
      )}

      {/* ── CÁC NÚT HÀNH ĐỘNG ── */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {/* Nút chỉ đường đi bộ trực tiếp ngay trên bản đồ Leaflet */}
        <TouchableOpacity
          onPress={() => onStartDirections()}
          activeOpacity={0.8}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 12,
            backgroundColor: AppColors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            shadowColor: AppColors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Feather name="navigation" size={14} color="#FFFFFF" />
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>Chỉ đường đi bộ</Text>
        </TouchableOpacity>

        {/* Nút phụ: Mở Google Maps bên ngoài */}
        <TouchableOpacity
          onPress={() => onOpenGoogleMaps()}
          activeOpacity={0.7}
          style={{
            height: 42,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Feather name="external-link" size={13} color={AppColors.textSecondary} />
          <Text style={{ fontSize: 11.5, fontWeight: "700", color: AppColors.textSecondary }}>Mở App ngoài</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const MapLocationDetailCard = React.memo(MapLocationDetailCardComponent);
