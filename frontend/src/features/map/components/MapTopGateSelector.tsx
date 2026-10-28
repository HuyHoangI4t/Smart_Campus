import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
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
 * Tự động thích ứng Dark Mode OLED/Slate.
 */
export const MapTopGateSelector = React.memo(function MapTopGateSelector({
  currentGateId,
  currentGateName,
  onSelectGate,
}: MapTopGateSelectorProps) {
  const { colors, isDark } = useTheme();
  const activeId = currentGateId || "front_gate";

  const handleGatePress = (gateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectGate(gateId);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "rgba(30, 41, 59, 0.96)" : "rgba(255, 255, 255, 0.96)",
          borderColor: isDark ? "rgba(51, 65, 85, 0.95)" : "rgba(226, 232, 240, 0.95)",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(91, 97, 244, 0.2)" : `${colors.primary}12` }]}>
            <Feather name="log-in" size={13} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.labelTitle, { color: colors.textSecondary }]}>CỔNG VÀO TRƯỜNG</Text>
            <Text style={[styles.subTitle, { color: colors.text }]} numberOfLines={1}>
              {currentGateName ? `Đang qua: ${currentGateName}` : "Chọn cổng đón gần bạn"}
            </Text>
          </View>
        </View>

        <View style={[styles.badgeInfoPill, { backgroundColor: isDark ? "#0F172A" : AppColors.muted }]}>
          <Feather name="shuffle" size={11} color={colors.textSecondary} />
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>3 cổng</Text>
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
                isActive
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                pressed && styles.gatePillPressed,
              ]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`${shortName}${isActive ? ", đang chọn" : ""}`}
            >
              <Feather
                name={isActive ? "check-circle" : "map-pin"}
                size={13}
                color={isActive ? "#FFFFFF" : colors.primary}
              />
              <Text
                style={[
                  styles.gatePillText,
                  isActive ? styles.gatePillTextActive : { color: colors.text },
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
    borderRadius: 20, // Squircle bo góc lớn
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1, // Viền Hairline siêu mỏng
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
    alignItems: "center",
    justifyContent: "center",
  },
  labelTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  subTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 1,
  },
  badgeInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999, // Pill capsule
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
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
});
