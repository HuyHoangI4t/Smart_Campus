import React from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Thẻ điểm học phần - Chuẩn 1:1 với giao diện Course Card thật trong GradesScreen
 */
export function CourseCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.courseCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        {/* Mã học phần • Số tín chỉ */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 5, alignItems: "center" }}>
          <SkeletonBox width={60} height={12} borderRadius={4} />
          <SkeletonBox width={50} height={12} borderRadius={4} />
        </View>

        {/* Tên học phần (2 dòng chuẩn thực tế) */}
        <SkeletonBox width="92%" height={16} borderRadius={4} style={{ marginTop: 2, marginBottom: 4 }} />
        <SkeletonBox width="65%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />

        {/* Hệ 10: ... • HK... */}
        <SkeletonBox width={140} height={12} borderRadius={4} />
      </View>

      {/* Badge điểm chữ: 48x48, borderRadius 14 */}
      <SkeletonBox width={48} height={48} borderRadius={14} />
    </View>
  );
}

/**
 * Skeleton Thẻ tổng kết GPA Hero - Chuẩn 1:1 với GPA Summary Card thật
 */
export function GpaSummarySkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.gpaHeroCard,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
      ]}
    >
      {/* Header: Tiêu đề & Xếp loại */}
      <View style={styles.rowBetween}>
        <Text style={styles.gpaHeaderLabel}>TỔNG KẾT ĐIỂM TÍCH LŨY</Text>
        <View style={styles.rankPill}>
          <SkeletonBox width={14} height={14} borderRadius={7} backgroundColor="rgba(255,255,255,0.4)" style={{ marginRight: 5 }} />
          <SkeletonBox width={46} height={13} borderRadius={4} backgroundColor="rgba(255,255,255,0.3)" />
        </View>
      </View>

      {/* 3 Cột điểm số: Thang 10, Thang 4, Tín chỉ tích lũy */}
      <View style={[styles.rowBetween, { marginTop: 14, alignItems: "flex-end" }]}>
        <View>
          <SkeletonBox width={78} height={38} borderRadius={6} backgroundColor="rgba(255,255,255,0.35)" />
          <Text style={styles.statSubText}>Thang điểm 10</Text>
        </View>

        <View style={{ alignItems: "center" }}>
          <SkeletonBox width={56} height={26} borderRadius={6} backgroundColor="rgba(255,255,255,0.3)" />
          <Text style={styles.statSubText}>Thang điểm 4</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <SkeletonBox width={52} height={26} borderRadius={6} backgroundColor="rgba(255,255,255,0.3)" />
          <Text style={styles.statSubText}>Tín chỉ tích lũy</Text>
        </View>
      </View>

      {/* Nút Xem chi tiết thành phần */}
      <View style={styles.detailButton}>
        <SkeletonBox width={210} height={16} borderRadius={4} backgroundColor="rgba(255,255,255,0.25)" />
      </View>
    </View>
  );
}

/**
 * Skeleton Thanh lọc học kỳ - Chuẩn 1:1 với ScrollView Chips thật
 */
export function SemesterFilterSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 16 }}
      contentContainerStyle={{ gap: 8 }}
    >
      {[
        { width: 55, active: true },
        { width: 115, active: false },
        { width: 110, active: false },
        { width: 110, active: false },
      ].map((item, idx) => (
        <View
          key={idx}
          style={[
            styles.semesterChip,
            {
              backgroundColor: item.active ? colors.primary : colors.cardBg,
              borderColor: item.active ? colors.primary : colors.cardBorder,
            },
          ]}
        >
          <SkeletonBox
            width={item.width}
            height={14}
            borderRadius={4}
            backgroundColor={item.active ? "rgba(255,255,255,0.4)" : undefined}
          />
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Bảng điểm (GradesScreen)
 * Không làm lệch kích thước giao diện thật
 */
export function GradesSkeleton({ cardsOnly = false }: { cardsOnly?: boolean } = {}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {!cardsOnly && (
        <>
          <GpaSummarySkeleton />
          <SemesterFilterSkeleton />

          {/* Tiêu đề danh sách môn học */}
          <View style={[styles.rowBetween, { marginBottom: 12 }]}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Học phần đã có điểm
            </Text>
            <SkeletonBox width={70} height={14} borderRadius={4} />
          </View>
        </>
      )}

      {/* Danh sách học phần chuẩn 1:1 */}
      <View style={{ gap: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Chi tiết bảng điểm (GradesDetailScreen)
 */
export function GradesDetailSkeleton({ showHeader = true }: { showHeader?: boolean } = {}) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {showHeader && (
        <>
          {/* Thanh tìm kiếm */}
          <View style={[styles.searchBarSkeleton, { backgroundColor: isDark ? "#0F172A" : colors.muted, borderColor: colors.cardBorder }]}>
            <SkeletonBox width={18} height={18} borderRadius={9} style={{ marginRight: 8 }} />
            <SkeletonBox width="60%" height={14} borderRadius={4} />
          </View>

          {/* Dải học kỳ */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 14 }}
          >
            {[50, 95, 90, 85].map((w, idx) => (
              <View
                key={idx}
                style={[
                  styles.detailSemChip,
                  {
                    backgroundColor: idx === 0 ? colors.primary : (isDark ? "#0F172A" : colors.muted),
                    borderColor: idx === 0 ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <SkeletonBox
                  width={w}
                  height={12}
                  borderRadius={4}
                  backgroundColor={idx === 0 ? "rgba(255,255,255,0.4)" : undefined}
                />
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Danh sách thẻ chi tiết môn học */}
      <View style={{ gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.detailCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            {/* Hàng trên: Mã môn • tín chỉ & Badge điểm chữ */}
            <View style={[styles.rowBetween, { marginBottom: 6 }]}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <SkeletonBox width={60} height={13} borderRadius={4} />
                <SkeletonBox width={50} height={13} borderRadius={4} />
              </View>
              <SkeletonBox width={38} height={24} borderRadius={8} />
            </View>

            {/* Tên học phần */}
            <SkeletonBox width="88%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />

            {/* Khung 5 cột điểm thành phần: ĐBP | Thi1 | Thi2 | Đ1 | Đ2 */}
            <View
              style={[
                styles.componentContainer,
                {
                  backgroundColor: isDark ? "#0F172A" : colors.muted,
                  borderColor: colors.cardBorder,
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              {[1, 2, 3, 4, 5].map((col, idx) => (
                <React.Fragment key={col}>
                  {idx > 0 && <View style={[styles.verticalDivider, { backgroundColor: colors.cardBorder }]} />}
                  <View style={styles.componentCol}>
                    <SkeletonBox width={26} height={10} borderRadius={2} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={30} height={14} borderRadius={3} />
                  </View>
                </React.Fragment>
              ))}
            </View>

            {/* Hàng học phí */}
            <View style={[styles.rowBetween, { marginTop: 10 }]}>
              <SkeletonBox width={100} height={12} borderRadius={3} />
              <SkeletonBox width={85} height={18} borderRadius={6} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  courseCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  gpaHeroCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  gpaHeaderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
  },
  rankPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
  },
  statSubText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },
  detailButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  semesterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  detailSemChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  detailCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  componentContainer: {
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  componentCol: {
    flex: 1,
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 24,
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
