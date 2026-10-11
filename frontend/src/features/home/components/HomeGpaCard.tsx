import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { GpaSummary } from "../types";

export interface HomeGpaCardProps {
  gpaSummary: GpaSummary | null;
  onPress: () => void;
}

/**
 * Thẻ Tổng kết GPA (HomeGpaCard) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Kết hợp cấu trúc Grouped Inset Card, nền Tonal Surface Container,
 * xếp loại dạng viên con nhộng (Pill capsule) và viền hairline siêu mỏng.
 */
export const HomeGpaCard = React.memo(function HomeGpaCard({
  gpaSummary,
  onPress,
}: HomeGpaCardProps) {
  if (!gpaSummary) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const rankColor = gpaSummary.rankColor || AppColors.accent;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Kết quả học tập: GPA hệ 4 là ${gpaSummary.gpa4}, GPA hệ 10 là ${gpaSummary.gpa10}, tích lũy ${gpaSummary.totalCredits} tín chỉ. Xếp loại ${gpaSummary.rank}.`}
    >
      {/* ── HEADER: BIỂU TƯỢNG + TIÊU ĐỀ + PILL XẾP LOẠI + CHEVRON ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconBox}>
            <Feather name="award" size={17} color={AppColors.accent} />
          </View>
          <View>
            <Text style={styles.titleText}>Kết quả học tập</Text>
            <Text style={styles.subtitleText}>Tích lũy toàn khóa đào tạo</Text>
          </View>
        </View>

        <View style={styles.rankGroup}>
          <View
            style={[
              styles.rankPill,
              {
                backgroundColor: `${rankColor}1A`, // 10% alpha tonal tint
                borderColor: `${rankColor}40`,     // 25% alpha border
              },
            ]}
          >
            <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
            <Text style={[styles.rankText, { color: rankColor }]}>
              {gpaSummary.rank}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={AppColors.textSubtle} />
        </View>
      </View>

      {/* ── BẢNG THỐNG KÊ TONAL SURFACE (TONAL CONTAINER) ── */}
      <View style={styles.tonalContainer}>
        {/* GPA Hệ 4 */}
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>GPA HỆ 4</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: AppColors.info }]}>
              {gpaSummary.gpa4}
            </Text>
            <Text style={styles.scoreScale}>/4.0</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* GPA Hệ 10 */}
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>GPA HỆ 10</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: AppColors.accent }]}>
              {gpaSummary.gpa10}
            </Text>
            <Text style={styles.scoreScale}>/10</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Tín chỉ tích lũy */}
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>TÍN CHỈ</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: AppColors.success }]}>
              {gpaSummary.totalCredits}
            </Text>
            <Text style={styles.scoreScale}>TC</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.cardBg,
    borderRadius: 22, // Squircle bo góc lớn
    padding: 16,
    marginBottom: 16, // Hệ số 8pt
    borderWidth: 1, // Viền Hairline siêu mỏng
    borderColor: AppColors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.975 }], // Co giãn lò xo mượt mà
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14, // Squircle nhỏ
    backgroundColor: `${AppColors.accent}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 15.5,
    fontWeight: "900",
    color: AppColors.text,
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: "500",
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  rankGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rankPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999, // Pill capsule
    borderWidth: 1,
  },
  rankDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  tonalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.muted, // Tonal Surface Container
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 0.8,
    borderColor: AppColors.border,
  },
  statCol: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: AppColors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  scoreScale: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textSubtle,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: AppColors.border,
  },
});
