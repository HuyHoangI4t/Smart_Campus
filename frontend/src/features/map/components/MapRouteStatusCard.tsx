import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { LocationItem, ParsedCampusRoom } from "../types";

export interface MapRouteStatusCardProps {
  bottomOffset: number;
  activeRoute: {
    distanceMeters?: number;
    durationMinutes?: number;
    gateId?: string;
    gateName?: string;
    arrived?: boolean;
  } | null;
  targetRoom: string;
  currentParsed: ParsedCampusRoom | null;
  selectedLoc: LocationItem | null;
  onSwitchGate?: () => void;
  onClearRoute: () => void;
}

/**
 * Thẻ trạng thái chỉ dẫn đường bộ nội bộ (MapRouteStatusCard) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Bo góc Squircle 22pt, nền kính mờ Glassmorphism, các huy hiệu và nút bấm dạng Pill Capsule (borderRadius 999),
 * cùng phản hồi xúc giác co giãn lò xo mượt mà.
 */
export const MapRouteStatusCard = React.memo(function MapRouteStatusCard({
  bottomOffset,
  activeRoute,
  targetRoom,
  currentParsed,
  selectedLoc,
  onClearRoute,
}: MapRouteStatusCardProps) {
  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onClearRoute();
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftInfoGroup}>
          <View style={styles.iconCircle}>
            <Feather name="navigation" size={20} color={AppColors.primary} />
          </View>
          <View style={styles.textGroup}>
            <View style={styles.gateTagRow}>
              {activeRoute?.gateName ? (
                <View style={styles.gatePillBadge}>
                  <Feather name="log-in" size={10} color={AppColors.success} />
                  <Text style={styles.gateNameText} numberOfLines={1}>
                    {`CỔNG: ${activeRoute.gateName.toUpperCase()}`}
                  </Text>
                </View>
              ) : (
                <View style={styles.gateWireframePlaceholder} />
              )}
            </View>

            {activeRoute?.distanceMeters === undefined || activeRoute?.distanceMeters === null ? (
              <View style={styles.loadingWireframeContainer}>
                <View style={styles.wireframeBarLarge} />
                <View style={styles.wireframeBarSmall} />
              </View>
            ) : (
              <>
                <Text style={styles.destinationTitle} numberOfLines={1}>
                  {targetRoom && currentParsed ? currentParsed.fullDisplay : selectedLoc?.name || "Điểm đến"}
                </Text>
                <Text style={styles.distanceDurationText}>
                  {activeRoute.distanceMeters <= 8 || activeRoute.arrived
                    ? "Đã đến nơi!"
                    : `~${activeRoute.distanceMeters}m • ~${activeRoute.durationMinutes || 1} phút đi bộ`}
                </Text>
              </>
            )}
          </View>
        </View>

        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [
            styles.stopPillButton,
            pressed && styles.stopButtonPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dừng chỉ đường"
        >
          <Feather name="x-circle" size={17} color={AppColors.danger} />
          <Text style={styles.stopButtonText}>Dừng</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 999,
    backgroundColor: "rgba(255, 255, 255, 0.96)", // Glassmorphic surface
    borderRadius: 22, // Squircle bo góc lớn
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1, // Viền Hairline siêu mỏng
    borderColor: "rgba(226, 232, 240, 0.95)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftInfoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 44, // Touch target chuẩn
    height: 44,
    borderRadius: 22,
    backgroundColor: `${AppColors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: `${AppColors.primary}26`,
  },
  textGroup: {
    flex: 1,
  },
  gateTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  gatePillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${AppColors.success}1A`, // Tonal Surface Tint
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999, // Pill capsule
    borderWidth: 0.8,
    borderColor: `${AppColors.success}33`,
  },
  gateNameText: {
    fontSize: 10,
    fontWeight: "900",
    color: AppColors.success,
    letterSpacing: 0.4,
  },
  gateWireframePlaceholder: {
    width: 75,
    height: 10,
    backgroundColor: AppColors.muted,
    borderRadius: 999,
    marginVertical: 2,
  },
  loadingWireframeContainer: {
    gap: 6,
    marginTop: 4,
  },
  wireframeBarLarge: {
    width: "75%",
    height: 14,
    backgroundColor: "#CBD5E1",
    borderRadius: 6,
  },
  wireframeBarSmall: {
    width: "48%",
    height: 11,
    backgroundColor: AppColors.muted,
    borderRadius: 5,
  },
  destinationTitle: {
    fontSize: 15.5,
    fontWeight: "900",
    color: AppColors.text,
    marginTop: 1,
    letterSpacing: -0.2,
  },
  distanceDurationText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: AppColors.success,
    marginTop: 2,
  },
  stopPillButton: {
    minWidth: 44,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999, // Pill capsule
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  stopButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }], // Co giãn lò xo mượt mà
  },
  stopButtonText: {
    color: AppColors.danger,
    fontSize: 13,
    fontWeight: "900",
  },
});
