import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Trang chủ (HomeScreen)
 * Khớp chuẩn cấu trúc thẻ NextClassCard, GpaCard, QuickActions 54x54 và bài viết
 */
export function HomeSkeleton({ isLoggedIn = true }: { isLoggedIn?: boolean; showHeader?: boolean }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* 1. LỚP HỌC TIẾP THEO (Chỉ hiện khi là Sinh viên) */}
      {isLoggedIn && (
        <View
          style={[
            styles.nextClassCard,
            {
              backgroundColor: isDark ? colors.cardBg : colors.primary,
              borderColor: isDark ? colors.cardBorder : "rgba(255, 255, 255, 0.16)",
            },
          ]}
        >
          <View style={[styles.leftPill, { backgroundColor: isDark ? colors.primary : "rgba(255, 255, 255, 0.4)" }]} />
          <View style={{ paddingLeft: 6 }}>
            <View style={styles.rowBetween}>
              <SkeletonBox width={110} height={24} borderRadius={12} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.25)"} />
              <SkeletonBox width={80} height={16} borderRadius={4} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.25)"} />
            </View>
            <View style={[styles.rowBetween, { marginTop: 12 }]}>
              <SkeletonBox width="65%" height={22} borderRadius={6} backgroundColor={isDark ? "#475569" : "rgba(255,255,255,0.45)"} />
              <SkeletonBox width={70} height={24} borderRadius={12} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.25)"} />
            </View>
            <View style={[styles.rowBetween, { marginTop: 14 }]}>
              <View style={styles.rowCenter}>
                <SkeletonBox width={26} height={26} borderRadius={13} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.25)"} style={{ marginRight: 8 }} />
                <SkeletonBox width={120} height={14} borderRadius={4} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.25)"} />
              </View>
              <SkeletonBox width={90} height={28} borderRadius={14} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.3)"} />
            </View>
          </View>
        </View>
      )}

      {/* 2. TỔNG KẾT GPA HỆ 4 & 10 (Chỉ hiện khi là Sinh viên) */}
      {isLoggedIn && (
        <View style={[styles.gpaCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <SkeletonBox width={34} height={34} borderRadius={11} style={{ marginRight: 10 }} />
              <View style={{ gap: 4 }}>
                <SkeletonBox width={120} height={15} borderRadius={4} />
                <SkeletonBox width={140} height={11} borderRadius={3} />
              </View>
            </View>
            <SkeletonBox width={70} height={24} borderRadius={12} />
          </View>

          <View style={[styles.statsRow, { borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}>
            <View style={styles.statCol}>
              <SkeletonBox width={50} height={10} borderRadius={3} style={{ marginBottom: 6 }} />
              <SkeletonBox width={55} height={24} borderRadius={4} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCol}>
              <SkeletonBox width={50} height={10} borderRadius={3} style={{ marginBottom: 6 }} />
              <SkeletonBox width={55} height={24} borderRadius={4} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCol}>
              <SkeletonBox width={55} height={10} borderRadius={3} style={{ marginBottom: 6 }} />
              <SkeletonBox width={45} height={24} borderRadius={4} />
            </View>
          </View>
        </View>
      )}

      {/* 3. TÁC VỤ NHANH (4 ô squircle 54x54 chuẩn) */}
      <View style={{ marginBottom: 24 }}>
        <SkeletonBox width={110} height={16} borderRadius={4} style={{ marginBottom: 14 }} />
        <View style={styles.quickActionsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.quickActionItem}>
              <SkeletonBox width={54} height={54} borderRadius={18} style={{ marginBottom: 8 }} />
              <SkeletonBox width={46} height={11} borderRadius={3} />
            </View>
          ))}
        </View>
      </View>

      {/* 4. THÔNG BÁO SINH VIÊN SECTION */}
      <View style={styles.sectionHeader}>
        <SkeletonBox width={160} height={18} borderRadius={4} />
        <SkeletonBox width={70} height={14} borderRadius={4} />
      </View>

      {[1, 2].map((i) => (
        <View
          key={i}
          style={[styles.announcementCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <View style={[styles.rowBetween, { marginBottom: 10 }]}>
            <SkeletonBox width={85} height={20} borderRadius={8} />
            <SkeletonBox width={70} height={12} borderRadius={4} />
          </View>
          <SkeletonBox width="95%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width="75%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={styles.rowBetween}>
            <SkeletonBox width={120} height={12} borderRadius={3} />
            <SkeletonBox width={16} height={16} borderRadius={8} />
          </View>
        </View>
      ))}

      {/* 5. TIN TỨC & HOẠT ĐỘNG SECTION */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <SkeletonBox width={150} height={18} borderRadius={4} />
        <SkeletonBox width={70} height={14} borderRadius={4} />
      </View>

      <View style={[styles.newsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <SkeletonBox width="100%" height={160} borderRadius={16} style={{ marginBottom: 14 }} />
        <View style={{ gap: 8, paddingHorizontal: 2 }}>
          <View style={styles.rowBetween}>
            <SkeletonBox width={90} height={20} borderRadius={8} />
            <SkeletonBox width={70} height={12} borderRadius={4} />
          </View>
          <SkeletonBox width="98%" height={17} borderRadius={4} />
          <SkeletonBox width="80%" height={17} borderRadius={4} />
          <SkeletonBox width="100%" height={13} borderRadius={3} style={{ marginTop: 2 }} />
          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <SkeletonBox width={110} height={12} borderRadius={3} />
            <SkeletonBox width={65} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  nextClassCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  leftPill: {
    position: "absolute",
    left: 0,
    top: 18,
    bottom: 18,
    width: 5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  gpaCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 14,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickActionItem: {
    alignItems: "center",
    width: "22%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  announcementCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  newsCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
});
