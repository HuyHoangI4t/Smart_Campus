import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { TNU_CAMPUS_GATES } from "../constants";

export interface MapTopGateSelectorProps {
  currentGateId: string | null;
  currentGateName?: string | null;
  onSelectGate: (gateId: string) => void;
}

/**
 * Thanh chuyển đổi cổng trường nổi phía trên (MapTopGateSelector) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Nền kính mờ Glassmorphism, bo góc Squircle 20pt, các chip chọn cổng dạng viên con nhộng (Pill capsule: borderRadius 999),
 * kèm rung xúc giác (Light Haptics) và hiệu ứng co giãn lò xo (Springy Press).
 */
export const MapTopGateSelector = React.memo(function MapTopGateSelector({
  currentGateId,
  currentGateName,
  onSelectGate,
}: MapTopGateSelectorProps) {
  const activeId = currentGateId || "front_gate";

  const handleGatePress = (gateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectGate(gateId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Feather name="log-in" size={13} color={AppColors.primary} />
          </View>
          <View>
            <Text style={styles.labelTitle}>CỔNG VÀO TRƯỜNG</Text>
            <Text style={styles.subTitle} numberOfLines={1}>
              {currentGateName ? `Đang qua: ${currentGateName}` : "Chọn cổng đón gần bạn"}
            </Text>
          </View>
        </View>

        <View style={styles.badgeInfoPill}>
          <Feather name="shuffle" size={11} color={AppColors.textSecondary} />
          <Text style={styles.badgeText}>3 cổng</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gateListContainer}
      >
        {TNU_CAMPUS_GATES.map((gate) => {
          const isActive = gate.id === activeId;
          const shortName =
            gate.id === "front_gate"
              ? "Cổng trước"
              : gate.id === "back_gate"
              ? "Cổng sau"
              : "Cổng BV trường";

          return (
            <Pressable
              key={gate.id}
              onPress={() => handleGatePress(gate.id)}
              style={({ pressed }) => [
                styles.gatePill,
                isActive ? styles.gatePillActive : styles.gatePillInactive,
                pressed && styles.gatePillPressed,
              ]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`${shortName}${isActive ? ", đang chọn" : ""}`}
            >
              <Feather
                name={isActive ? "check-circle" : "map-pin"}
                size={13}
                color={isActive ? "#FFFFFF" : AppColors.primary}
              />
              <Text
                style={[
                  styles.gatePillText,
                  isActive ? styles.gatePillTextActive : styles.gatePillTextInactive,
                ]}
                numberOfLines={1}
              >
                {shortName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 90,
    backgroundColor: "rgba(255, 255, 255, 0.96)", // Glassmorphic surface
    borderRadius: 20, // Squircle bo góc lớn
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1, // Viền Hairline siêu mỏng
    borderColor: "rgba(226, 232, 240, 0.95)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${AppColors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  labelTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: AppColors.textSecondary,
    letterSpacing: 0.6,
  },
  subTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: AppColors.text,
    marginTop: 1,
  },
  badgeInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: AppColors.muted,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999, // Pill capsule
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  gateListContainer: {
    gap: 8,
    alignItems: "center",
    paddingVertical: 2,
  },
  gatePill: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999, // Pill capsule hoàn hảo
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    justifyContent: "center",
  },
  gatePillActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  gatePillInactive: {
    backgroundColor: AppColors.cardBg,
    borderColor: AppColors.cardBorder,
  },
  gatePillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }], // Co giãn lò xo mượt mà
  },
  gatePillText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  gatePillTextActive: {
    color: "#FFFFFF",
  },
  gatePillTextInactive: {
    color: AppColors.text,
  },
});
