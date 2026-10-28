import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Hồ sơ cá nhân (ProfileScreen)
 * Khớp từng pixel theo đúng giao diện thực tế của Sinh viên hoặc Khách
 */
export function ProfileSkeleton({ isGuest = false }: { isGuest?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* 1. Thẻ Avatar & Header Card */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <SkeletonBox width={90} height={90} borderRadius={45} style={{ marginBottom: 12 }} />
        {!isGuest && (
          <SkeletonBox width={120} height={24} borderRadius={12} style={{ marginBottom: 12 }} />
        )}
        <SkeletonBox width={160} height={22} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width={110} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
        <SkeletonBox width={150} height={24} borderRadius={12} />
      </View>

      {/* 2. Thông tin học tập & liên hệ (Chỉ sinh viên) */}
      {!isGuest && (
        <>
          <SkeletonBox width={180} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            {[1, 2, 3, 4].map((i) => (
              <React.Fragment key={i}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowCenter}>
                    <SkeletonBox width={18} height={18} borderRadius={4} style={{ marginRight: 10 }} />
                    <SkeletonBox width={85} height={14} borderRadius={4} />
                  </View>
                  <SkeletonBox width={120} height={14} borderRadius={4} />
                </View>
                {i < 4 && <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />}
              </React.Fragment>
            ))}
          </View>
        </>
      )}

      {/* 3. Cài đặt & Tiện ích */}
      <SkeletonBox width={130} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
      <View
        style={[
          styles.actionCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginBottom: 24 },
        ]}
      >
        <View style={styles.rowCenter}>
          <SkeletonBox width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
          <View style={{ gap: 4 }}>
            <SkeletonBox width={130} height={15} borderRadius={4} />
            <SkeletonBox width={160} height={11} borderRadius={3} />
          </View>
        </View>
        <SkeletonBox width={45} height={16} borderRadius={4} />
      </View>

      {/* 4. Bảo mật tài khoản (Chỉ sinh viên) */}
      {!isGuest && (
        <>
          <SkeletonBox width={140} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={{ gap: 10, marginBottom: 24 }}>
            <View
              style={[
                styles.actionCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.rowCenter}>
                <SkeletonBox width={18} height={18} borderRadius={4} style={{ marginRight: 12 }} />
                <SkeletonBox width={150} height={15} borderRadius={4} />
              </View>
              <SkeletonBox width={16} height={16} borderRadius={8} />
            </View>

            <View
              style={[
                styles.actionCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.rowCenter}>
                <SkeletonBox width={18} height={18} borderRadius={4} style={{ marginRight: 12 }} />
                <SkeletonBox width={160} height={15} borderRadius={4} />
              </View>
              <SkeletonBox width={16} height={16} borderRadius={8} />
            </View>
          </View>
        </>
      )}

      {/* 5. Nút đăng xuất */}
      <SkeletonBox width="100%" height={48} borderRadius={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  headerCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    marginBottom: 24,
  },
  actionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    height: 1,
    width: "100%",
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
