import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from "react-native";

interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

/**
 * Thành phần Skeleton cơ bản với hiệu ứng nhịp thở (pulse animation)
 * Tối ưu hiệu năng 60 FPS bằng Animated.loop với useNativeDriver: true
 */
export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
  backgroundColor = "#E2E8F0",
}: SkeletonBoxProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton Wireframe cho Màn hình Trang chủ (HomeScreen)
 */
export function HomeSkeleton({ showHeader = false }: { showHeader?: boolean }) {
  return (
    <View style={skeletonStyles.container}>
      {/* Profile Header Wireframe nếu cần */}
      {showHeader && (
        <View style={skeletonStyles.headerRow}>
          <SkeletonBox width={50} height={50} borderRadius={25} />
          <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
            <SkeletonBox width="60%" height={18} borderRadius={4} />
            <SkeletonBox width="40%" height={12} borderRadius={4} />
          </View>
          <SkeletonBox width={38} height={38} borderRadius={19} />
        </View>
      )}

      {/* 1. Tiết học tiếp theo / Ca học Card */}
      <View style={skeletonStyles.card}>
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
      <View style={[skeletonStyles.card, { paddingVertical: 14, marginBottom: 20 }]}>
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
      <View style={skeletonStyles.gridRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={skeletonStyles.gridItem}>
            <SkeletonBox width={46} height={46} borderRadius={12} style={{ marginBottom: 8 }} />
            <SkeletonBox width={50} height={10} borderRadius={3} />
          </View>
        ))}
      </View>

      {/* 3. Tiêu đề mục Tin tức & Danh sách 3 bài viết */}
      <View style={{ marginTop: 24, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBox width={140} height={20} borderRadius={4} />
        <SkeletonBox width={70} height={14} borderRadius={4} />
      </View>

      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.newsCard}>
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

/**
 * Skeleton Wireframe cho Màn hình Thời khóa biểu (ScheduleScreen)
 */
export function ScheduleSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* 1. Thanh chọn thứ trong tuần (T2 -> CN) */}
      <View style={skeletonStyles.weekSelector}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={skeletonStyles.weekDayItem}>
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
        <View key={i} style={skeletonStyles.scheduleCard}>
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

/**
 * Skeleton Wireframe cho Màn hình Bảng điểm (GradesScreen)
 */
export function GradesSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* 1. Chọn học kỳ */}
      <SkeletonBox width="100%" height={44} borderRadius={10} style={{ marginBottom: 16 }} />

      {/* 2. Banner tổng kết điểm trung bình (GPA Box) */}
      <View style={skeletonStyles.gpaCard}>
        <View style={{ gap: 8, flex: 1 }}>
          <SkeletonBox width={130} height={16} borderRadius={4} />
          <SkeletonBox width={80} height={32} borderRadius={6} />
          <SkeletonBox width={110} height={14} borderRadius={4} />
        </View>
        <SkeletonBox width={72} height={72} borderRadius={36} />
      </View>

      {/* 3. Thống kê tích lũy (2 ô nhỏ) */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <View style={[skeletonStyles.statBox, { flex: 1 }]}>
          <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width={50} height={22} borderRadius={4} />
        </View>
        <View style={[skeletonStyles.statBox, { flex: 1 }]}>
          <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width={50} height={22} borderRadius={4} />
        </View>
      </View>

      {/* 4. Danh sách các môn học */}
      <SkeletonBox width={140} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={skeletonStyles.courseCard}>
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
  return (
    <View style={skeletonStyles.container}>
      {/* Header môn học */}
      <View style={[skeletonStyles.card, { marginBottom: 16 }]}>
        <SkeletonBox width={90} height={20} borderRadius={6} style={{ marginBottom: 10 }} />
        <SkeletonBox width="90%" height={22} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonBox width="60%" height={14} borderRadius={4} />
      </View>

      {/* Bảng điểm thành phần */}
      <View style={skeletonStyles.card}>
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
              borderBottomColor: "#F1F5F9",
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
      <View style={skeletonStyles.mapSearchOverlay}>
        <View style={skeletonStyles.mapSearchBar}>
          <SkeletonBox width={20} height={20} borderRadius={10} style={{ marginRight: 10 }} />
          <SkeletonBox width="65%" height={16} borderRadius={4} />
          <SkeletonBox width={28} height={28} borderRadius={14} style={{ marginLeft: "auto" }} />
        </View>

        {/* Thanh cuộn chips danh mục */}
        <View style={skeletonStyles.mapChipsRow}>
          {[90, 80, 100, 85].map((w, idx) => (
            <SkeletonBox key={idx} width={w} height={34} borderRadius={17} style={{ marginRight: 8 }} />
          ))}
        </View>
      </View>

      {/* Các nút bấm điều khiển nổi bên phải */}
      <View style={skeletonStyles.mapControlsFloating}>
        <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginBottom: 12 }} />
        <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginBottom: 12 }} />
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>

      {/* Thẻ preview địa điểm phía dưới */}
      <View style={skeletonStyles.mapBottomCard}>
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

/**
 * Skeleton Wireframe cho Danh sách Tất cả bài viết (AllArticlesScreen)
 */
export function AllArticlesSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.articleCard}>
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

const skeletonStyles = StyleSheet.create({
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
  gpaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  statBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
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
  articleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    marginBottom: 14,
  },
});
