import React, { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { LoginRequiredCard } from "../../../components/LoginRequiredCard";
import { NewsOrAnnouncementItem, getNewsImageUrl, CAMPUS_FALLBACK_IMAGES } from "../../../services/api";

export function NewsCardImage({ imageUrl, index }: { imageUrl?: string; index: number }) {
  const [currentUri, setCurrentUri] = useState(getNewsImageUrl(imageUrl, index));

  return (
    <Image
      source={{
        uri: currentUri,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }}
      style={styles.newsImage}
      resizeMode="cover"
      onError={() => {
        const fallback = CAMPUS_FALLBACK_IMAGES[index % CAMPUS_FALLBACK_IMAGES.length];
        if (currentUri !== fallback) {
          setCurrentUri(fallback);
        }
      }}
    />
  );
}

export interface HomeNewsSectionProps {
  isLoggedIn: boolean;
  news: NewsOrAnnouncementItem[];
  onViewAll: () => void;
  onOpenDetail: (item: NewsOrAnnouncementItem, index: number) => void;
}

export const HomeNewsSection = React.memo(function HomeNewsSection({
  isLoggedIn,
  news,
  onViewAll,
  onOpenDetail,
}: HomeNewsSectionProps) {
  const handleItemPress = (item: NewsOrAnnouncementItem, idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpenDetail(item, idx);
  };

  const handleViewAllPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onViewAll();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tin tức & Hoạt động</Text>
        {isLoggedIn && news.length > 0 ? (
          <Pressable
            onPress={handleViewAllPress}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllButtonPressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Xem tất cả tin tức"
          >
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Feather name="chevron-right" size={14} color={AppColors.accentLight} />
          </Pressable>
        ) : null}
      </View>

      {!isLoggedIn ? (
        <LoginRequiredCard
          mode="card"
          icon="globe"
          title="Vui lòng đăng nhập để xem tin tức"
          message="Đăng nhập tài khoản sinh viên để theo dõi các sự kiện, tin tức hoạt động Đoàn - Hội và Nhà trường."
        />
      ) : news.length === 0 ? (
        /* Empty State chỉn chu */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={24} color={AppColors.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có tin tức mới</Text>
          <Text style={styles.emptySubtitle}>
            Các bài viết mới nhất từ cổng thông tin trường sẽ hiển thị tại đây khi có cập nhật.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {news.slice(0, 3).map((item, idx) => (
            <Pressable
              key={item.id || idx}
              onPress={() => handleItemPress(item, idx)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Tin tức: ${item.title}`}
            >
              <NewsCardImage imageUrl={item.imageUrl} index={idx} />

              <View style={styles.cardBody}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                            ? "#FEF3C7"
                            : `${AppColors.info}15`,
                      },
                    ]}
                  >
                    <Feather
                      name={
                        item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                          ? "alert-triangle"
                          : "book-open"
                      }
                      size={10}
                      color={
                        item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                          ? AppColors.warning
                          : AppColors.info
                      }
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                              ? AppColors.warning
                              : AppColors.info,
                        },
                      ]}
                    >
                      {item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                        ? "Dữ liệu mẫu"
                        : item.badge || "Tin hoạt động"}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {item.summary ? (
                  <Text style={styles.summaryText} numberOfLines={2}>
                    {item.summary}
                  </Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.authorRow}>
                    <Feather name="globe" size={11} color={AppColors.textMuted} />
                    <Text style={styles.authorText} numberOfLines={1}>
                      {item.author || item.sourceName || "Ban Biên tập TTN"}
                    </Text>
                  </View>
                  <View style={styles.detailBtn}>
                    <Text style={styles.detailText}>Chi tiết bài viết</Text>
                    <Feather name="arrow-right" size={11} color={AppColors.accentLight} />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24, // Hệ số 8pt
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: AppColors.text,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 44,
    justifyContent: "center",
  },
  viewAllButtonPressed: {
    opacity: 0.7,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.accentLight,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: AppColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  newsImage: {
    width: "100%",
    height: 155,
    backgroundColor: AppColors.muted,
  },
  cardBody: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  dateText: {
    fontSize: 10.5,
    color: AppColors.textMuted,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: AppColors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 11.5,
    color: AppColors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: AppColors.muted,
    paddingTop: 8,
    marginTop: 4,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  authorText: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.accentLight,
  },
  emptyContainer: {
    backgroundColor: AppColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
