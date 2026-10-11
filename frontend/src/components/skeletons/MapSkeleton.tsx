import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";

/**
 * Skeleton Wireframe cho Bản đồ Trường học (MapScreen)
 */
export function MapSkeleton() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Nền bản đồ với hiệu ứng sáng nhẹ */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#EBF1F6" }]}>
        {/* Lưới giả lập đường bản đồ */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <SkeletonBox width={120} height={120} borderRadius={60} backgroundColor="#DCE6EE" />
          <SkeletonBox width={180} height={16} borderRadius={8} style={{ marginTop: 20 }} backgroundColor="#DCE6EE" />
        </View>
      </View>

      {/* Thanh tìm kiếm vị trí phía trên */}
      <View style={styles.mapSearchOverlay}>
        <View style={styles.mapSearchBar}>
          <SkeletonBox width={20} height={20} borderRadius={10} style={{ marginRight: 10 }} />
          <SkeletonBox width="65%" height={16} borderRadius={4} />
          <SkeletonBox width={28} height={28} borderRadius={14} style={{ marginLeft: "auto" }} />
        </View>

        {/* Thanh cuộn chips danh mục */}
        <View style={styles.mapChipsRow}>
          {[90, 80, 100, 85].map((w, idx) => (
            <SkeletonBox key={idx} width={w} height={34} borderRadius={17} style={{ marginRight: 8 }} />
          ))}
        </View>
      </View>

      {/* Các nút bấm điều khiển nổi bên phải */}
      <View style={styles.mapControlsFloating}>
        <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginBottom: 12 }} />
        <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginBottom: 12 }} />
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>

      {/* Thẻ preview địa điểm phía dưới */}
      <View style={styles.mapBottomCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <SkeletonBox width={42} height={42} borderRadius={10} style={{ marginRight: 12 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="70%" height={16} borderRadius={4} />
            <SkeletonBox width="45%" height={12} borderRadius={4} />
          </View>
        </View>
        <SkeletonBox width="100%" height={38} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSearchOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
  },
  mapSearchBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  mapChipsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  mapControlsFloating: {
    position: "absolute",
    right: 16,
    bottom: 120,
  },
  mapBottomCard: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
});

