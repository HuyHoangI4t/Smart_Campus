import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe chuẩn 1:1 cho Bản đồ trường (MapScreen)
 * Khớp từng pixel theo thanh tìm kiếm Pill-shape 999, các chip danh mục, cụm FAB 46pt và thẻ thông tin địa điểm bo góc 24pt
 */
export function MapSkeleton() {
  const { colors, isDark } = useTheme();

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Nền bản đồ với giả lập lưới giao lộ */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? "#0F172A" : "#F1F5F9" }]}>
        <View style={styles.centerWatermark}>
          <SkeletonBox
            width={110}
            height={110}
            borderRadius={55}
            backgroundColor={isDark ? "#1E293B" : "#E2E8F0"}
          />
          <SkeletonBox
            width={180}
            height={16}
            borderRadius={8}
            style={{ marginTop: 18 }}
            backgroundColor={isDark ? "#1E293B" : "#E2E8F0"}
          />
        </View>
      </View>

      {/* 1. Thanh tìm kiếm nổi dạng Pill (borderRadius 999) */}
      <View style={styles.searchOverlay}>
        <View
          style={[
            styles.searchPill,
            {
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.96)" : "rgba(255, 255, 255, 0.96)",
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <SkeletonBox width={18} height={18} borderRadius={9} style={{ marginRight: 10 }} />
          <SkeletonBox width="60%" height={16} borderRadius={4} />
          <SkeletonBox width={26} height={26} borderRadius={13} style={{ marginLeft: "auto" }} />
        </View>

        {/* 2. Dải chips danh mục con nhộng */}
        <View style={styles.chipsRow}>
          {[75, 95, 60, 90, 80].map((w, idx) => (
            <SkeletonBox
              key={idx}
              width={w}
              height={34}
              borderRadius={17}
              style={{ marginRight: 8 }}
              backgroundColor={isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)"}
            />
          ))}
        </View>
      </View>

      {/* 3. Cụm nút FAB điều khiển nổi bên phải (46x46pt chuẩn M3) */}
      <View style={styles.floatingControls}>
        <SkeletonBox
          width={46}
          height={46}
          borderRadius={23}
          style={{ marginBottom: 12 }}
          backgroundColor={isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)"}
        />
        <SkeletonBox
          width={46}
          height={46}
          borderRadius={23}
          style={{ marginBottom: 12 }}
          backgroundColor={isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)"}
        />
        <SkeletonBox
          width={46}
          height={46}
          borderRadius={23}
          backgroundColor={isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)"}
        />
      </View>

      {/* 4. Thẻ chi tiết địa điểm nổi bên dưới (Squircle bo 24pt chuẩn 1:1) */}
      <View
        style={[
          styles.bottomDetailCard,
          {
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.98)" : "#FFFFFF",
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.handleContainer}>
          <SkeletonBox width={38} height={4.5} borderRadius={3} />
        </View>

        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SkeletonBox width={95} height={22} borderRadius={8} />
            <SkeletonBox width={120} height={22} borderRadius={8} />
          </View>
          <SkeletonBox width={28} height={28} borderRadius={14} />
        </View>

        <SkeletonBox width="85%" height={20} borderRadius={4} style={{ marginTop: 12, marginBottom: 6 }} />
        <SkeletonBox width="55%" height={14} borderRadius={4} style={{ marginBottom: 14 }} />

        <View style={styles.actionRow}>
          <SkeletonBox width="58%" height={44} borderRadius={14} />
          <SkeletonBox width="38%" height={44} borderRadius={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWatermark: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchOverlay: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
  },
  searchPill: {
    borderRadius: 999,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  chipsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  floatingControls: {
    position: "absolute",
    right: 16,
    top: 116,
  },
  bottomDetailCard: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
