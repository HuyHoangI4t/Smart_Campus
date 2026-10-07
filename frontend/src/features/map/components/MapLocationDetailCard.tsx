import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { LocationItem, ParsedCampusRoom } from "../types";
import { formatDistanceText } from "../utils";

interface MapLocationDetailCardProps {
  selectedLoc: LocationItem;
  userLocation: { latitude: number; longitude: number } | null;
  matchedTargetId: string | null;
  currentParsed: ParsedCampusRoom | null;
  targetSubject?: string;
  onClose: () => void;
  onStartDirections: () => void;
  onOpenGoogleMaps: () => void;
}

export const MapLocationDetailCard: React.FC<MapLocationDetailCardProps> = ({
  selectedLoc,
  userLocation,
  matchedTargetId,
  currentParsed,
  targetSubject,
  onClose,
  onStartDirections,
  onOpenGoogleMaps,
}) => {
  const isMatch = matchedTargetId && String(selectedLoc.id) === String(matchedTargetId);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        right: 10,
        zIndex: 30,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderRadius: 18,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          {/* Huy hiệu danh mục hoặc phòng học */}
          {isMatch && currentParsed ? (
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
              <View style={{ backgroundColor: "#2563EB", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "900", color: "#FFFFFF" }}>
                  {currentParsed.buildingCode.toUpperCase()}
                </Text>
              </View>
              {currentParsed.floor ? (
                <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#2563EB" }}>
                    {currentParsed.floor}
                  </Text>
                </View>
              ) : null}
              <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#334155" }}>
                  {currentParsed.roomNumber}
                </Text>
              </View>
              {userLocation && (
                <View style={{ backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Feather name="navigation" size={9} color="#059669" />
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669" }}>
                    Cách bạn {formatDistanceText(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 2 }}>
              <View
                style={{
                  backgroundColor: selectedLoc.color || AppColors.primary,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Feather name={(selectedLoc.icon as any) || "map-pin"} size={11} color="#FFFFFF" />
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF" }}>
                  {selectedLoc.category?.toUpperCase() || "TÒA NHÀ KHUÔN VIÊN"}
                </Text>
              </View>
              {userLocation && (
                <View style={{ backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Feather name="navigation" size={9} color="#059669" />
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669" }}>
                    Cách bạn {formatDistanceText(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tiêu đề địa điểm */}
          <Text style={{ fontSize: 15, fontWeight: "900", color: AppColors.text }}>
            {isMatch && targetSubject ? targetSubject : selectedLoc.name}
          </Text>

          {/* Tòa nhà & Tầng */}
          <Text style={{ fontSize: 12, color: AppColors.primary, fontWeight: "700", marginTop: 2 }}>
            {isMatch && currentParsed
              ? currentParsed.fullDisplay
              : `${selectedLoc.building}${selectedLoc.floor ? ` • ${selectedLoc.floor}` : ""}`}
          </Text>

          {/* Hướng dẫn lối đi hoặc mô tả */}
          {isMatch && currentParsed ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#F8FAFC",
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 8,
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Feather name="compass" size={12} color="#2563EB" />
              <Text style={{ fontSize: 11, color: "#475569", fontWeight: "600", flex: 1 }}>
                {currentParsed.routeGuide}
              </Text>
            </View>
          ) : selectedLoc.description ? (
            <Text style={{ fontSize: 11, color: AppColors.textSecondary, marginTop: 4 }} numberOfLines={2}>
              {selectedLoc.description}
            </Text>
          ) : null}
        </View>

        {/* Nút Đóng và Các nút Chỉ đường */}
        <View style={{ gap: 6, alignItems: "flex-end" }}>
          <TouchableOpacity
            onPress={onClose}
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

          {/* Nút chỉ đường trực tiếp ngay trên bản đồ Leaflet */}
          <TouchableOpacity
            onPress={onStartDirections}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: AppColors.primary,
            }}
          >
            <Feather name="navigation" size={12} color="#FFFFFF" />
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>Chỉ đường</Text>
          </TouchableOpacity>

          {/* Nút phụ: Mở Google Maps bên ngoài */}
          <TouchableOpacity
            onPress={onOpenGoogleMaps}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: "#F1F5F9",
            }}
          >
            <Feather name="external-link" size={10} color="#64748B" />
            <Text style={{ fontSize: 10, fontWeight: "600", color: "#64748B" }}>Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

