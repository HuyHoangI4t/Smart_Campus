import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
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
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tin tức & Hoạt động</Text>
        {isLoggedIn ? (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!isLoggedIn ? (
        <LoginRequiredCard
          mode="card"
          icon="globe"
          title="Vui lòng đăng nhập để xem tin tức"
          message="Đăng nhập tài khoản sinh viên để theo dõi các sự kiện, tin tức hoạt động Đoàn - Hội và Nhà trường."
        />
      ) : (
        <View style={styles.list}>
          {news.slice(0, 3).map((item, idx) => (
            <TouchableOpacity
              key={item.id || idx}
              onPress={() => onOpenDetail(item, idx)}
              activeOpacity={0.7}
              style={styles.card}
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
                            : "#EFF6FF",
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
                          ? "#D97706"
                          : "#2563EB"
                      }
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                              ? "#D97706"
                              : "#2563EB",
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
                    <Feather name="globe" size={11} color="#64748B" />
                    <Text style={styles.authorText} numberOfLines={1}>
                      {item.author || item.sourceName || "Ban Biên tập TTN"}
                    </Text>
                  </View>
                  <View style={styles.detailBtn}>
                    <Text style={styles.detailText}>Chi tiết bài viết</Text>
                    <Feather name="arrow-right" size={11} color="#2563EB" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  newsImage: {
    width: "100%",
    height: 155,
    backgroundColor: "#E2E8F0",
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
    paddingHorizontal: 7,
    paddingVertical: 2,
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
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 19,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
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
    color: "#64748B",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
});

