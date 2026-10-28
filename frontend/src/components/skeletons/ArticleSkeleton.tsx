import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe chuẩn 1:1 cho Danh sách Bài viết (AllArticlesScreen)
 * Khớp từng pixel theo thẻ tin tức có ảnh và thẻ thông báo chính khóa
 */
export function AllArticlesSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* 1. Thẻ tin tức có ảnh bìa tràn viền (160pt) */}
      <View style={[styles.articleCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <SkeletonBox width="100%" height={160} borderRadius={0} />
        <View style={styles.cardContent}>
          <View style={[styles.rowBetween, { marginBottom: 10 }]}>
            <SkeletonBox width={85} height={20} borderRadius={6} />
            <SkeletonBox width={65} height={12} borderRadius={3} />
          </View>
          <SkeletonBox width="96%" height={17} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width="80%" height={17} borderRadius={4} style={{ marginBottom: 10 }} />
          <SkeletonBox width="100%" height={13} borderRadius={3} style={{ marginBottom: 4 }} />
          <SkeletonBox width="90%" height={13} borderRadius={3} style={{ marginBottom: 12 }} />
          <View style={[styles.rowBetween, styles.cardFooter, { borderTopColor: colors.border }]}>
            <SkeletonBox width={120} height={12} borderRadius={3} />
            <SkeletonBox width={60} height={14} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* 2. Thẻ thông báo sinh viên (không có ảnh, đệm 14pt) */}
      <View style={[styles.announcementCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={[styles.rowBetween, { marginBottom: 10 }]}>
          <SkeletonBox width={95} height={20} borderRadius={6} />
          <SkeletonBox width={65} height={12} borderRadius={3} />
        </View>
        <SkeletonBox width="98%" height={17} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width="72%" height={17} borderRadius={4} style={{ marginBottom: 10 }} />
        <SkeletonBox width="100%" height={13} borderRadius={3} style={{ marginBottom: 4 }} />
        <SkeletonBox width="85%" height={13} borderRadius={3} style={{ marginBottom: 12 }} />
        <View style={[styles.rowBetween, styles.cardFooter, { borderTopColor: colors.border }]}>
          <SkeletonBox width={130} height={12} borderRadius={3} />
          <SkeletonBox width={50} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton Wireframe chuẩn cho Chi tiết bài viết (HomeDetailScreen)
 */
export function ArticleDetailSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.detailContainer}>
      {/* Nhãn thể loại & ngày đăng */}
      <View style={[styles.rowBetween, { marginBottom: 14 }]}>
        <SkeletonBox width={95} height={24} borderRadius={8} />
        <SkeletonBox width={90} height={14} borderRadius={4} />
      </View>

      {/* Tiêu đề bài viết */}
      <SkeletonBox width="100%" height={22} borderRadius={4} style={{ marginBottom: 8 }} />
      <SkeletonBox width="88%" height={22} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Ảnh bài viết */}
      <SkeletonBox width="100%" height={200} borderRadius={16} style={{ marginBottom: 20 }} />

      {/* Các đoạn văn mô tả */}
      <View style={{ gap: 10, marginBottom: 24 }}>
        <SkeletonBox width="100%" height={15} borderRadius={3} />
        <SkeletonBox width="96%" height={15} borderRadius={3} />
        <SkeletonBox width="98%" height={15} borderRadius={3} />
        <SkeletonBox width="90%" height={15} borderRadius={3} />
        <SkeletonBox width="100%" height={15} borderRadius={3} />
        <SkeletonBox width="75%" height={15} borderRadius={3} />
      </View>

      {/* Khung tệp đính kèm */}
      <View
        style={[
          styles.attachmentBox,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <SkeletonBox width={140} height={16} borderRadius={4} style={{ marginBottom: 10 }} />
        <SkeletonBox width="100%" height={48} borderRadius={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  detailContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  articleCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  announcementCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  cardContent: {
    padding: 14,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  attachmentBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
