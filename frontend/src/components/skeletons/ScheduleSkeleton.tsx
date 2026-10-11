import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";

/**
 * Skeleton Wireframe cho Màn hình Thời khóa biểu (ScheduleScreen)
 */
export function ScheduleSkeleton() {
  return (
    <View style={styles.container}>
      {/* 1. Thanh chọn thứ trong tuần (T2 -> CN) */}
      <View style={styles.weekSelector}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={styles.weekDayItem}>
            <SkeletonBox width={26} height={12} borderRadius={3} style={{ marginBottom: 6 }} />
            <SkeletonBox width={34} height={34} borderRadius={17} />
          </View>
        ))}
      </View>

      {/* 2. Banner tóm tắt ngày */}
      <View style={{ marginTop: 16, marginBottom: 16 }}>
        <SkeletonBox width={160} height={20} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width={100} height={14} borderRadius={4} />
      </View>

      {/* 3. Danh sách ca học */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.scheduleCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SkeletonBox width={90} height={22} borderRadius={6} backgroundColor="#CBD5E1" />
            <SkeletonBox width={65} height={22} borderRadius={6} />
          </View>
          <SkeletonBox width="90%" height={18} borderRadius={4} style={{ marginBottom: 10 }} />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <SkeletonBox width={80} height={16} borderRadius={4} />
            <SkeletonBox width={120} height={16} borderRadius={4} />
          </View>
          <SkeletonBox width={140} height={14} borderRadius={4} style={{ marginBottom: 14 }} />
          <View style={{ borderTopWidth: 1, borderTopColor: "#EEF2F6", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
            <SkeletonBox width={110} height={30} borderRadius={6} />
            <SkeletonBox width={90} height={30} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  weekSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  weekDayItem: {
    alignItems: "center",
  },
  scheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 12,
  },
});

