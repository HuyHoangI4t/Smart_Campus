import React from "react";
import { View } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";

/**
 * Skeleton Wireframe cho Màn hình Hồ sơ cá nhân (ProfileScreen)
 */
export function ProfileSkeleton() {
  return (
    <View style={{ padding: 20 }}>
      {/* 1. Thẻ Avatar & Họ tên */}
      <View
        style={{
          padding: 24,
          borderRadius: 24,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#EEF2F6",
          marginBottom: 20,
        }}
      >
        <SkeletonBox width={90} height={90} borderRadius={45} style={{ marginBottom: 12 }} />
        <SkeletonBox width={110} height={24} borderRadius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width={170} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonBox width={110} height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <SkeletonBox width={150} height={22} borderRadius={11} />
      </View>

      {/* 2. Tiêu đề mục thông tin */}
      <SkeletonBox width={190} height={18} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* 3. Khối 4 dòng thông tin chi tiết */}
      <View
        style={{
          padding: 16,
          borderRadius: 20,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#EEF2F6",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SkeletonBox width={16} height={16} borderRadius={4} />
              <SkeletonBox width={85} height={14} borderRadius={4} />
            </View>
            <SkeletonBox width={130} height={14} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* 4. Tiêu đề bảo mật */}
      <SkeletonBox width={140} height={18} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* 5. Hai nút hành động */}
      <View style={{ gap: 10 }}>
        <SkeletonBox width="100%" height={54} borderRadius={16} />
        <SkeletonBox width="100%" height={54} borderRadius={16} />
      </View>
    </View>
  );
}

