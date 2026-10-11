import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";

/**
 * Skeleton Wireframe cho Màn hình Trang chủ (HomeScreen)
 */
export function HomeSkeleton({ showHeader = false }: { showHeader?: boolean }) {
  return (
    <View style={styles.container}>
      {/* Profile Header Wireframe nếu cần */}
      {showHeader && (
        <View style={styles.headerRow}>
          <SkeletonBox width={50} height={50} borderRadius={25} />
          <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
            <SkeletonBox width="60%" height={18} borderRadius={4} />
            <SkeletonBox width="40%" height={12} borderRadius={4} />
          </View>
          <SkeletonBox width={38} height={38} borderRadius={19} />
        </View>
      )}

      {/* 1. Tiết học tiếp theo / Ca học Card */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <SkeletonBox width={110} height={20} borderRadius={10} backgroundColor="#CBD5E1" />
          <SkeletonBox width={70} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width="85%" height={18} borderRadius={4} style={{ marginBottom: 10 }} />
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <SkeletonBox width={90} height={24} borderRadius={6} />
          <SkeletonBox width={100} height={24} borderRadius={6} />
        </View>
        <SkeletonBox width="100%" height={40} borderRadius={8} />
      </View>

      {/* 2. Tổng kết GPA Hệ 4 & Hệ 10 Card */}
      <View style={[styles.card, { paddingVertical: 14, marginBottom: 20 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <SkeletonBox width={32} height={32} borderRadius={10} />
            <View style={{ gap: 4 }}>
              <SkeletonBox width={120} height={14} borderRadius={4} />
              <SkeletonBox width={90} height={10} borderRadius={3} />
            </View>
          </View>
          <SkeletonBox width={60} height={22} borderRadius={10} />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            paddingVertical: 10,
            backgroundColor: "#F8FAFC",
            borderRadius: 14,
          }}
        >
          <View style={{ alignItems: "center", gap: 6 }}>
            <SkeletonBox width={60} height={10} borderRadius={3} />
            <SkeletonBox width={50} height={20} borderRadius={4} />
          </View>
          <SkeletonBox width={1} height={26} borderRadius={0} backgroundColor="#E2E8F0" />
          <View style={{ alignItems: "center", gap: 6 }}>
            <SkeletonBox width={60} height={10} borderRadius={3} />
            <SkeletonBox width={50} height={20} borderRadius={4} />
          </View>
          <SkeletonBox width={1} height={26} borderRadius={0} backgroundColor="#E2E8F0" />
          <View style={{ alignItems: "center", gap: 6 }}>
            <SkeletonBox width={60} height={10} borderRadius={3} />
            <SkeletonBox width={40} height={20} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* 3. Phím tắt tiện ích (Utilities Grid 4 ô) */}
      <View style={styles.gridRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.gridItem}>
            <SkeletonBox width={46} height={46} borderRadius={12} style={{ marginBottom: 8 }} />
            <SkeletonBox width={50} height={10} borderRadius={3} />
          </View>
        ))}
      </View>

      {/* 4. Tiêu đề mục Tin tức & Danh sách 3 bài viết */}
      <View style={{ marginTop: 24, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBox width={140} height={20} borderRadius={4} />
        <SkeletonBox width={70} height={14} borderRadius={4} />
      </View>

      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.newsCard}>
          <SkeletonBox width="100%" height={140} borderRadius={12} style={{ marginBottom: 12 }} />
          <View style={{ paddingHorizontal: 4, gap: 8 }}>
            <SkeletonBox width={80} height={16} borderRadius={8} />
            <SkeletonBox width="95%" height={16} borderRadius={4} />
            <SkeletonBox width="70%" height={14} borderRadius={4} />
            <SkeletonBox width={90} height={12} borderRadius={4} style={{ marginTop: 4 }} />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  gridItem: {
    alignItems: "center",
    width: "22%",
  },
  newsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 14,
  },
});

