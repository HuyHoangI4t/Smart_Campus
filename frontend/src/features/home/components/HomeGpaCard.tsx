import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../context/ThemeContext";
import { GpaSummary } from "../types";

export interface HomeGpaCardProps {
  gpaSummary: GpaSummary | null;
  onPress: () => void;
}

/**
 * Thẻ Kết quả học tập (HomeGpaCard) - Thiết kế Kính mờ (Frosted Glass) hoàn toàn
 * - Không có bất kỳ ô trắng hay hộp lồng nào bên trong
 * - Nền kính mờ bán trong suốt đồng bộ với toàn bộ ứng dụng
 */
export const HomeGpaCard = React.memo(function HomeGpaCard({
  gpaSummary,
  onPress,
}: HomeGpaCardProps) {
  const { colors, isDark } = useTheme();

  if (!gpaSummary) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const rankColor = gpaSummary.rankColor || colors.accent;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark
            ? "rgba(30, 41, 59, 0.65)"
            : "rgba(255, 255, 255, 0.68)",
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.14)"
            : "rgba(255, 255, 255, 0.85)",
        },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Kết quả học tập: GPA hệ 4 là ${gpaSummary.gpa4}, GPA hệ 10 là ${gpaSummary.gpa10}, tích lũy ${gpaSummary.totalCredits} tín chỉ. Xếp loại ${gpaSummary.rank}.`}
    >
      {/* ── HEADER: BIỂU TƯỢNG + TIÊU ĐỀ + PILL XẾP LOẠI + CHEVRON ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isDark
                  ? "rgba(91, 97, 244, 0.2)"
                  : `${colors.accent}14`,
              },
            ]}
          >
            <Feather name="award" size={17} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Kết quả học tập
            </Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              Tích lũy toàn khóa đào tạo
            </Text>
          </View>
        </View>

        <View style={styles.rankGroup}>
          <View
            style={[
              styles.rankPill,
              {
                backgroundColor: isDark ? `${rankColor}26` : `${rankColor}1A`,
                borderColor: isDark ? `${rankColor}66` : `${rankColor}40`,
              },
            ]}
          >
            <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
            <Text style={[styles.rankText, { color: rankColor }]}>
              {gpaSummary.rank}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.textSubtle} />
        </View>
      </View>

      {/* ── BẢNG ĐIỂM HOÀN TOÀN TRONG SUỐT (KHÔNG HỘP TRẮNG, KHÔNG KHUNG LỒNG) ── */}
      <View
        style={[
          styles.statsRow,
          {
            borderTopColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ]}
      >
        {/* GPA Hệ 4 */}
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            GPA HỆ 4
          </Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: colors.info }]}>
              {gpaSummary.gpa4}
            </Text>
            <Text style={[styles.scoreScale, { color: colors.textSubtle }]}>
              /4.0
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statDivider,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.06)",
            },
          ]}
        />

        {/* GPA Hệ 10 */}
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            GPA HỆ 10
          </Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: colors.accent }]}>
              {gpaSummary.gpa10}
            </Text>
            <Text style={[styles.scoreScale, { color: colors.textSubtle }]}>
              /10
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statDivider,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.06)",
            },
          ]}
        />

        {/* Tín chỉ tích lũy */}
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            TÍN CHỈ
          </Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: colors.success }]}>
              {gpaSummary.totalCredits}
            </Text>
            <Text style={[styles.scoreScale, { color: colors.textSubtle }]}>
              TC
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
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
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: "500",
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
    borderRadius: 999,
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
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
  },
  statCol: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: "800",
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
  },
  statDivider: {
    width: 1,
    height: 28,
  },
});
