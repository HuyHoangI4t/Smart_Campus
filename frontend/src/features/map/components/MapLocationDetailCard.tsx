import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { LocationItem, ParsedCampusRoom } from "../types";
import { formatDistanceText, calculateDistanceKm } from "../utils";

interface MapLocationDetailCardProps {
  selectedLoc: LocationItem;
  userLocation: { latitude: number; longitude: number } | null;
  matchedTargetId: string | null;
  currentParsed: ParsedCampusRoom | null;
  targetSubject?: string;
  distanceText?: string;
  walkingMinutes?: number | null;
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
  distanceText,
  walkingMinutes,
  bottomOffset = 100,
  onClose,
  onStartDirections,
  onOpenGoogleMaps,
}) => {
  const isMatch = matchedTargetId && String(selectedLoc.id) === String(matchedTargetId);

  const displayDistance = distanceText || (userLocation ? formatDistanceText(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng) : "");
  const displayMinutes = walkingMinutes !== undefined && walkingMinutes !== null
    ? walkingMinutes
    : (userLocation ? Math.max(1, Math.ceil((calculateDistanceKm(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng) * 1000) / 75)) : null);

  const handleStartDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onStartDirections();
  };

  const handleOpenGoogleMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpenGoogleMaps();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  };

  return (
    <View
      style={[
        styles.container,
        { bottom: bottomOffset },
      ]}
    >
      {/* ── THANH TAY CẦM KÉO NHẸ (SHEET HANDLE) ── */}
      <View style={styles.sheetHandle} />

      {/* ── HEADER ĐỊA ĐIỂM: HUY HIỆU & NÚT ĐÓNG ── */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          {isMatch && currentParsed ? (
            <>
              <View style={styles.buildingBadge}>
                <Text style={styles.buildingBadgeText}>
                  {currentParsed.buildingCode.toUpperCase()}
                </Text>
              </View>
              {currentParsed.floor ? (
                <View style={styles.floorBadge}>
                  <Text style={styles.floorBadgeText}>
                    {currentParsed.floor}
                  </Text>
                </View>
              ) : null}
              <View style={styles.roomBadge}>
                <Text style={styles.roomBadgeText}>
                  {currentParsed.roomNumber}
                </Text>
              </View>
            </>
          ) : (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: selectedLoc.color || AppColors.primary },
              ]}
            >
              <Text style={styles.categoryBadgeText}>
                {selectedLoc.category}
              </Text>
            </View>
          )}

          {displayDistance ? (
            <View style={styles.distanceBadge}>
              <Feather name="navigation" size={10} color={AppColors.success} />
              <Text style={styles.distanceBadgeText}>
                {displayDistance}
                {displayMinutes ? ` • ~${displayMinutes} phút đi bộ` : ""}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={handleClose}
          hitSlop={8}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Đóng thẻ địa điểm"
        >
          <Feather name="x" size={15} color={AppColors.textMuted} />
        </Pressable>
      </View>

      {/* ── TIÊU ĐỀ ĐỊA ĐIỂM ── */}
      <Text style={styles.titleText}>
        {isMatch && targetSubject ? targetSubject : selectedLoc.name}
      </Text>

      {/* ── TÒA NHÀ & TẦNG ── */}
      <Text style={styles.buildingText}>
        {isMatch && currentParsed
          ? currentParsed.fullDisplay
          : `${selectedLoc.building}${selectedLoc.floor ? ` • ${selectedLoc.floor}` : ""}`}
      </Text>

      {/* ── HƯỚNG DẪN LỐI ĐI / MÔ TẢ ── */}
      {isMatch && currentParsed ? (
        <View style={styles.routeGuideBox}>
          <Feather name="compass" size={13} color={AppColors.info} />
          <Text style={styles.routeGuideText}>
            {currentParsed.routeGuide}
          </Text>
        </View>
      ) : selectedLoc.description ? (
        <Text style={styles.descText} numberOfLines={2}>
          {selectedLoc.description}
        </Text>
      ) : (
        <View style={{ height: 6 }} />
      )}

      {/* ── CÁC NÚT HÀNH ĐỘNG (Touch Target >= 44pt) ── */}
      <View style={styles.actionRow}>
        {/* Nút chỉ đường đi bộ trực tiếp ngay trên bản đồ Leaflet */}
        <Pressable
          onPress={handleStartDirections}
          style={({ pressed }) => [
            styles.directionsBtn,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Bắt đầu chỉ đường đi bộ"
        >
          <Feather name="navigation" size={15} color="#FFFFFF" />
          <Text style={styles.directionsBtnText}>Chỉ đường đi bộ</Text>
        </Pressable>

        {/* Nút phụ: Mở Google Maps bên ngoài */}
        <Pressable
          onPress={handleOpenGoogleMaps}
          style={({ pressed }) => [
            styles.externalBtn,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Mở ứng dụng bản đồ bên ngoài"
        >
          <Feather name="external-link" size={14} color={AppColors.textSecondary} />
          <Text style={styles.externalBtnText}>Mở App ngoài</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const MapLocationDetailCard = React.memo(MapLocationDetailCardComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 50,
    backgroundColor: AppColors.cardBg,
    borderRadius: 22,
    padding: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  buildingBadge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  buildingBadgeText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  floorBadge: {
    backgroundColor: `${AppColors.primary}12`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  floorBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: AppColors.primary,
  },
  roomBadge: {
    backgroundColor: AppColors.muted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roomBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: AppColors.textSecondary,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: `${AppColors.success}14`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: AppColors.success,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16.5,
    fontWeight: "900",
    color: AppColors.text,
    marginBottom: 2,
  },
  buildingText: {
    fontSize: 12.5,
    color: AppColors.primary,
    fontWeight: "700",
    marginBottom: 6,
  },
  routeGuideBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AppColors.muted,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  routeGuideText: {
    fontSize: 11.5,
    color: AppColors.textSecondary,
    fontWeight: "600",
    flex: 1,
  },
  descText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 12,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  directionsBtn: {
    flex: 1,
    minHeight: 44, // Touch target >= 44pt
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  externalBtn: {
    minHeight: 44, // Touch target >= 44pt
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: AppColors.muted,
    borderWidth: 1,
    borderColor: AppColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  externalBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
