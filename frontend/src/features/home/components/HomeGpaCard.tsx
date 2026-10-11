import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { GpaSummary } from "../types";

export interface HomeGpaCardProps {
  gpaSummary: GpaSummary | null;
  onPress: () => void;
}

export const HomeGpaCard = React.memo(function HomeGpaCard({
  gpaSummary,
  onPress,
}: HomeGpaCardProps) {
  if (!gpaSummary) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* Header: Title + Rank Badge + Link */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconBox}>
            <Feather name="award" size={17} color="#4F46E5" />
          </View>
          <View>
            <Text style={styles.titleText}>Kết quả học tập</Text>
            <Text style={styles.subtitleText}>Tích lũy toàn khóa</Text>
          </View>
        </View>

        <View style={styles.rankGroup}>
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor: `${gpaSummary.rankColor}15`,
                borderColor: `${gpaSummary.rankColor}40`,
              },
            ]}
          >
            <Text style={[styles.rankText, { color: gpaSummary.rankColor }]}>
              {gpaSummary.rank}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#94A3B8" />
        </View>
      </View>

      {/* Stats Row: GPA Hệ 4 | GPA Hệ 10 | Tín chỉ */}
      <View style={styles.statsRow}>
        {/* GPA Hệ 4 */}
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>GPA Hệ 4</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: "#0284C7" }]}>
              {gpaSummary.gpa4}
            </Text>
            <Text style={styles.scoreScale}>/4.0</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* GPA Hệ 10 */}
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>GPA Hệ 10</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: "#4F46E5" }]}>
              {gpaSummary.gpa10}
            </Text>
            <Text style={styles.scoreScale}>/10</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Tín chỉ tích lũy */}
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Tín chỉ tích lũy</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: "#10B981" }]}>
              {gpaSummary.totalCredits}
            </Text>
            <Text style={styles.scoreScale}>TC</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  rankGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  rankText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 3,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  scoreValue: {
    fontSize: 19,
    fontWeight: "900",
  },
  scoreScale: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: "#E2E8F0",
  },
});

