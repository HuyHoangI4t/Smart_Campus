import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
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
  const { colors, isDark } = useTheme();
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
        {
          bottom: bottomOffset,
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* ── THANH TAY CẦM KÉO NHẸ (SHEET HANDLE) ── */}
      <View style={[styles.sheetHandle, { backgroundColor: isDark ? "#475569" : "#CBD5E1" }]} />

      {/* ── HEADER ĐỊA ĐIỂM: HUY HIỆU & NÚT ĐÓNG ── */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          {isMatch && currentParsed ? (
            <>
              <View style={[styles.buildingBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.buildingBadgeText}>
                  {currentParsed.buildingCode.toUpperCase()}
                </Text>
              </View>
              {currentParsed.floor ? (
                <View style={[styles.floorBadge, { backgroundColor: isDark ? "rgba(91, 97, 244, 0.2)" : `${colors.primary}12` }]}>
                  <Text style={[styles.floorBadgeText, { color: colors.primary }]}>
                    {currentParsed.floor}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.roomBadge, { backgroundColor: isDark ? "#0F172A" : AppColors.muted }]}>
                <Text style={[styles.roomBadgeText, { color: colors.textSecondary }]}>
                  {currentParsed.roomNumber}
                </Text>
              </View>
            </>
          ) : (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: selectedLoc.color || colors.primary },
              ]}
            >
              <Text style={styles.categoryBadgeText}>
                {selectedLoc.category}
              </Text>
            </View>
          )}

          {displayDistance ? (
            <View style={styles.distanceBadge}>
              <Feather name="navigation" size={10} color={colors.success} />
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
            { backgroundColor: isDark ? "#334155" : AppColors.muted },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Đóng thẻ địa điểm"
        >
          <Feather name="x" size={15} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── TIÊU ĐỀ ĐỊA ĐIỂM ── */}
      <Text style={[styles.titleText, { color: colors.text }]}>
        {isMatch && targetSubject ? targetSubject : selectedLoc.name}
      </Text>

      {/* ── TÒA NHÀ & TẦNG ── */}
      <Text style={[styles.buildingText, { color: colors.primary }]}>
        {isMatch && currentParsed
          ? currentParsed.fullDisplay
          : `${selectedLoc.building}${selectedLoc.floor ? ` • ${selectedLoc.floor}` : ""}`}
      </Text>

      {/* ── HƯỚNG DẪN LỐI ĐI / MÔ TẢ ── */}
      {isMatch && currentParsed ? (
        <View style={[styles.routeGuideBox, { backgroundColor: isDark ? "#0F172A" : AppColors.muted, borderColor: colors.border }]}>
          <Feather name="compass" size={13} color={colors.info} />
          <Text style={[styles.routeGuideText, { color: colors.textSecondary }]}>
            {currentParsed.routeGuide}
          </Text>
        </View>
      ) : selectedLoc.description ? (
        <Text style={[styles.descText, { color: colors.textSecondary }]} numberOfLines={2}>
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
            { backgroundColor: colors.primary },
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
            {
              backgroundColor: isDark ? "#0F172A" : AppColors.muted,
              borderColor: colors.border,
            },
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Mở ứng dụng bản đồ bên ngoài"
        >
          <Feather name="external-link" size={14} color={colors.textSecondary} />
          <Text style={[styles.externalBtnText, { color: colors.textSecondary }]}>Mở App ngoài</Text>
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
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
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
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  floorBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  roomBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roomBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
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
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#10B981",
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  buildingText: {
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  routeGuideBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  routeGuideText: {
    fontSize: 11.5,
    fontWeight: "600",
    flex: 1,
  },
  descText: {
    fontSize: 12,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  externalBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
