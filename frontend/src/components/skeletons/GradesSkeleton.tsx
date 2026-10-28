import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe cho Màn hình Bảng điểm (GradesScreen)
 * Tương thích trọn vẹn Dark Mode OLED/Slate
 */
export function GradesSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* 1. Chọn học kỳ */}
      <SkeletonBox width="100%" height={44} borderRadius={10} style={{ marginBottom: 16 }} />

      {/* 2. Banner tổng kết điểm trung bình (GPA Box) */}
      <View style={[styles.gpaCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={{ gap: 8, flex: 1 }}>
          <SkeletonBox width={130} height={16} borderRadius={4} />
          <SkeletonBox width={80} height={32} borderRadius={6} />
          <SkeletonBox width={110} height={14} borderRadius={4} />
        </View>
        <SkeletonBox width={72} height={72} borderRadius={36} />
      </View>

      {/* 3. Thống kê tích lũy (2 ô nhỏ) */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <View style={[styles.statBox, { flex: 1, backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width={50} height={22} borderRadius={4} />
        </View>
        <View style={[styles.statBox, { flex: 1, backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width={50} height={22} borderRadius={4} />
        </View>
      </View>

      {/* 4. Danh sách các môn học */}
      <SkeletonBox width={140} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.courseCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={{ flex: 1, gap: 6, marginRight: 12 }}>
            <SkeletonBox width="85%" height={16} borderRadius={4} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SkeletonBox width={60} height={14} borderRadius={4} />
              <SkeletonBox width={70} height={14} borderRadius={4} />
            </View>
          </View>
          <SkeletonBox width={46} height={34} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton Wireframe cho Màn hình Chi tiết bảng điểm môn học (GradesDetail)
 */
export function GradesDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header môn học */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginBottom: 16 }]}>
        <SkeletonBox width={90} height={20} borderRadius={6} style={{ marginBottom: 10 }} />
        <SkeletonBox width="90%" height={22} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonBox width="60%" height={14} borderRadius={4} />
      </View>

      {/* Bảng điểm thành phần */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <SkeletonBox width={150} height={18} borderRadius={4} style={{ marginBottom: 14 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <View style={{ gap: 4 }}>
              <SkeletonBox width={120} height={14} borderRadius={4} />
              <SkeletonBox width={60} height={12} borderRadius={3} />
            </View>
            <SkeletonBox width={40} height={20} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  gpaCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  statBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  courseCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});
