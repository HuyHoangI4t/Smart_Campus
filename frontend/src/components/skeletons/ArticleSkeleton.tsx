import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";

/**
 * Skeleton Wireframe cho Danh sách Tất cả bài viết (AllArticlesScreen)
 */
export function AllArticlesSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.articleCard}>
          <SkeletonBox width="100%" height={160} borderRadius={12} style={{ marginBottom: 12 }} />
          <View style={{ gap: 8, paddingHorizontal: 2 }}>
            <SkeletonBox width={90} height={18} borderRadius={9} />
            <SkeletonBox width="96%" height={16} borderRadius={4} />
            <SkeletonBox width="80%" height={16} borderRadius={4} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <SkeletonBox width={90} height={12} borderRadius={3} />
              <SkeletonBox width={70} height={12} borderRadius={3} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton Wireframe cho Chi tiết bài viết / tin tức (HomeDetailScreen)
 */
export function ArticleDetailSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      {/* Nhãn thể loại & ngày đăng */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <SkeletonBox width={85} height={20} borderRadius={10} />
        <SkeletonBox width={110} height={14} borderRadius={4} />
      </View>

      {/* Tiêu đề bài viết */}
      <SkeletonBox width="100%" height={22} borderRadius={4} style={{ marginBottom: 8 }} />
      <SkeletonBox width="85%" height={22} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Ảnh bài viết */}
      <SkeletonBox width="100%" height={190} borderRadius={12} style={{ marginBottom: 20 }} />

      {/* Các đoạn văn mô tả */}
      <View style={{ gap: 10, marginBottom: 24 }}>
        <SkeletonBox width="100%" height={14} borderRadius={3} />
        <SkeletonBox width="94%" height={14} borderRadius={3} />
        <SkeletonBox width="98%" height={14} borderRadius={3} />
        <SkeletonBox width="85%" height={14} borderRadius={3} />
        <SkeletonBox width="100%" height={14} borderRadius={3} />
        <SkeletonBox width="70%" height={14} borderRadius={3} />
      </View>

      {/* Tệp đính kèm giả lập */}
      <SkeletonBox width={130} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
      <SkeletonBox width="100%" height={56} borderRadius={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  articleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 14,
  },
});

