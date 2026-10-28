import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Bảng điểm (GradesScreen)
 * Khớp hoàn hảo với thẻ GPA tổng kết bo góc 24pt, chips học kỳ và thẻ học phần
 */
export function GradesSkeleton() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* 1. Thẻ tổng kết điểm trung bình GPA (Squircle 24pt chuẩn 1:1) */}
      <View
        style={[
          styles.gpaHeroCard,
          {
            backgroundColor: isDark ? colors.cardBg : colors.primary,
            borderColor: isDark ? colors.cardBorder : "rgba(255, 255, 255, 0.16)",
          },
        ]}
      >
        <View style={styles.rowBetween}>
          <SkeletonBox width={160} height={16} borderRadius={4} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.35)"} />
          <SkeletonBox width={75} height={24} borderRadius={10} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.25)"} />
        </View>

        <View style={[styles.rowBetween, { marginTop: 16, alignItems: "flex-end" }]}>
          <View>
            <SkeletonBox width={75} height={38} borderRadius={6} backgroundColor={isDark ? "#475569" : "rgba(255,255,255,0.5)"} style={{ marginBottom: 4 }} />
            <SkeletonBox width={85} height={13} borderRadius={3} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.3)"} />
          </View>
          <View style={{ alignItems: "center" }}>
            <SkeletonBox width={55} height={28} borderRadius={6} backgroundColor={isDark ? "#475569" : "rgba(255,255,255,0.4)"} style={{ marginBottom: 4 }} />
            <SkeletonBox width={75} height={13} borderRadius={3} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.3)"} />
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <SkeletonBox width={48} height={28} borderRadius={6} backgroundColor={isDark ? "#475569" : "rgba(255,255,255,0.4)"} style={{ marginBottom: 4 }} />
            <SkeletonBox width={90} height={13} borderRadius={3} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.3)"} />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <SkeletonBox width="100%" height={44} borderRadius={14} backgroundColor={isDark ? "#334155" : "rgba(255,255,255,0.2)"} />
        </View>
      </View>

      {/* 2. Thanh lọc học kỳ (Chips con nhộng) */}
      <View style={styles.semesterChipsRow}>
        <SkeletonBox width={70} height={38} borderRadius={19} style={{ marginRight: 8 }} />
        <SkeletonBox width={105} height={38} borderRadius={19} style={{ marginRight: 8 }} />
        <SkeletonBox width={105} height={38} borderRadius={19} />
      </View>

      {/* 3. Tiêu đề danh sách môn học */}
      <View style={[styles.rowBetween, { marginBottom: 12, marginTop: 4 }]}>
        <SkeletonBox width={170} height={18} borderRadius={4} />
        <SkeletonBox width={100} height={13} borderRadius={3} />
      </View>

      {/* 4. Danh sách học phần (Thẻ ngang chuẩn 1:1) */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.courseCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
              <SkeletonBox width={55} height={13} borderRadius={3} />
              <SkeletonBox width={85} height={13} borderRadius={3} />
            </View>
            <SkeletonBox width="92%" height={17} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonBox width="60%" height={13} borderRadius={3} />
          </View>
          <View style={{ alignItems: "center" }}>
            <SkeletonBox width={44} height={32} borderRadius={10} style={{ marginBottom: 4 }} />
            <SkeletonBox width={50} height={12} borderRadius={3} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton Wireframe chuẩn cho Màn hình Chi tiết bảng điểm (GradesDetailScreen)
 */
export function GradesDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.detailCard,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.rowBetween, { marginBottom: 8 }]}>
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <SkeletonBox width={60} height={14} borderRadius={4} />
              <SkeletonBox width={70} height={14} borderRadius={4} />
            </View>
            <SkeletonBox width={40} height={26} borderRadius={8} />
          </View>

          <SkeletonBox width="85%" height={17} borderRadius={4} style={{ marginBottom: 12 }} />

          {/* Hàng 4 cột điểm thành phần: ĐBP | Thi1 | Thi2 | Đ1 */}
          <View style={[styles.componentRow, { borderColor: colors.cardBorder }]}>
            {[1, 2, 3, 4].map((col) => (
              <View key={col} style={styles.componentCol}>
                <SkeletonBox width={26} height={11} borderRadius={2} style={{ marginBottom: 4 }} />
                <SkeletonBox width={34} height={15} borderRadius={3} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  gpaHeroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  semesterChipsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  courseCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  componentRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
    justifyContent: "space-around",
  },
  componentCol: {
    alignItems: "center",
    flex: 1,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
