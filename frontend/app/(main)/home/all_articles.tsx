import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
//import { AppColors } from "../../../src/constants/appColors";
import {
  apiGetNews,
  readLocalCache,
  NewsOrAnnouncementItem,
  getNewsImageUrl,
  CAMPUS_FALLBACK_IMAGES,
} from "../../../src/services/api";

type TabFilter = "all" | "announcement" | "news";

function ArticleCardImage({ imageUrl, index }: { imageUrl?: string; index: number }) {
  const [currentUri, setCurrentUri] = useState(getNewsImageUrl(imageUrl, index));

  return (
    <Image
      source={{
        uri: currentUri,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }}
      style={{ width: "100%", height: 160, backgroundColor: "#E2E8F0" }}
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

export default function AllArticlesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams<{ tab?: string }>();

  const initialTab: TabFilter =
    searchParams.tab === "announcements" || searchParams.tab === "announcement"
      ? "announcement"
      : searchParams.tab === "news"
      ? "news"
      : "all";

  const [activeTab, setActiveTab] = useState<TabFilter>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState<NewsOrAnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const topPadding =
    Platform.OS === "android"
      ? (StatusBar.currentHeight || 24) + 12
      : Math.max(insets.top + 8, 44);

  // Chuyển ngày tháng thành timestamp mili-giây để sắp xếp
  const parseArticleTimestamp = (item: any): number => {
    if (!item) return 0;
    if (item.rawDate) {
      const t = new Date(item.rawDate).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.pubDate) {
      const t = new Date(item.pubDate).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.pub_date) {
      const t = new Date(item.pub_date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.date && typeof item.date === "string") {
      const dmy = item.date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmy) {
        return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)).getTime();
      }
      const t = new Date(item.date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    return 0;
  };

  // Sắp xếp bài viết ngày mới nhất lên đầu tiên
  const sortByNewestDate = (items: NewsOrAnnouncementItem[]): NewsOrAnnouncementItem[] => {
    return [...items].sort((a, b) => {
      const tA = parseArticleTimestamp(a);
      const tB = parseArticleTimestamp(b);
      return tB - tA;
    });
  };

  // Lọc bài viết trùng
  const deduplicateArticles = (items: NewsOrAnnouncementItem[]) => {
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueItems: NewsOrAnnouncementItem[] = [];

    for (const item of items) {
      if (!item) continue;
      const normTitle = (item.title || "")
        .toLowerCase()
        .replace(/[“"”'’`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const normUrl = (item.link || "")
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "")
        .trim();

      if (normTitle && seenTitles.has(normTitle)) continue;
      if (normUrl && seenUrls.has(normUrl)) continue;

      if (normTitle) seenTitles.add(normTitle);
      if (normUrl) seenUrls.add(normUrl);
      uniqueItems.push(item);
    }
    return sortByNewestDate(uniqueItems);
  };

  const loadAllData = async (forceReload = false) => {
    try {
      if (!forceReload) {
        // Nạp nhanh từ local cache nếu có
        const cached = await readLocalCache("@offline_news_all");
        if (cached?.data?.data && Array.isArray(cached.data.data) && cached.data.data.length > 0) {
          setArticles(sortByNewestDate(deduplicateArticles(cached.data.data)));
          setIsLoading(false);
        }
      }

      const res = await apiGetNews("all", undefined, forceReload);
      if (res && res.success) {
        let combined: NewsOrAnnouncementItem[] = [];
        if (Array.isArray(res.data) && res.data.length > 0) {
          combined = res.data;
        } else {
          const ann = Array.isArray(res.announcements) ? res.announcements : [];
          const nw = Array.isArray(res.news) ? res.news : [];
          combined = [...ann, ...nw];
        }
        setArticles(sortByNewestDate(deduplicateArticles(combined)));
      }
    } catch (err) {
      console.warn("Lỗi tải toàn bộ tin tức:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.tab === "announcements" || searchParams.tab === "announcement") {
      setActiveTab("announcement");
    } else if (searchParams.tab === "news") {
      setActiveTab("news");
    } else if (searchParams.tab === "all") {
      setActiveTab("all");
    }
  }, [searchParams.tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData(true);
  };

  // Mở màn hình chi tiết bài viết
  const openDetail = (item: NewsOrAnnouncementItem, idx = 0) => {
    const finalImgUrl = item.imageUrl ? getNewsImageUrl(item.imageUrl, idx) : "";
    router.push({
      pathname: "/(main)/home/home_detail",
      params: {
        id: String(item.id || ""),
        title: item.title,
        summary: item.summary || "",
        date: item.date || "",
        sender: item.sender || "Trường Đại học Tây Nguyên",
        author: item.author || item.sender || "Phòng Công tác Sinh viên",
        category: item.category || (item.type === "news" ? "Tin hoạt động" : "Thông báo sinh viên"),
        content: item.content || item.summary || "",
        source:
          item.sourceName ||
          (item.type === "news"
            ? "Cổng Tin tức TTN.edu.vn"
            : "Cổng Thông báo sinh viên TTN.edu.vn"),
        badge: item.badge || (item.type === "news" ? "Tin hoạt động" : "Thông báo SV"),
        link: item.link || "",
        type: item.type || "announcement",
        imageUrl: finalImgUrl,
        isFallback: item.isFallback ? "true" : "false",
        attachments: item.attachments && item.attachments.length > 0 ? JSON.stringify(item.attachments) : "",
      },
    });
  };

  // Lọc theo Tab và Search
  const filteredArticles = useMemo(() => {
    let list = articles;

    // Filter theo Tab
    if (activeTab === "announcement") {
      list = list.filter((a) => a.type === "announcement");
    } else if (activeTab === "news") {
      list = list.filter((a) => a.type === "news");
    }

    // Filter theo Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          (a.author && a.author.toLowerCase().includes(q)) ||
          (a.badge && a.badge.toLowerCase().includes(q))
      );
    }

    return list;
  }, [articles, activeTab, searchQuery]);

  // Đếm số lượng cho từng tab
  const counts = useMemo(() => {
    const annCount = articles.filter((a) => a.type === "announcement").length;
    const newsCount = articles.filter((a) => a.type === "news").length;
    return {
      all: articles.length,
      announcement: annCount,
      news: newsCount,
    };
  }, [articles]);

  const renderItem = ({ item, index }: { item: NewsOrAnnouncementItem; index: number }) => {
    const isNews = item.type === "news";

    return (
      <TouchableOpacity
        key={item.id || index}
        onPress={() => openDetail(item, index)}
        activeOpacity={0.7}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          marginBottom: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Nếu là Tin tức và có hình ảnh */}
        {isNews && item.imageUrl ? (
          <ArticleCardImage imageUrl={item.imageUrl} index={index} />
        ) : null}

        <View style={{ padding: 14 }}>
          {/* Hàng 1: Badge + Ngày tháng */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor:
                    item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                      ? "#FEF3C7"
                      : isNews
                      ? "#EFF6FF"
                      : "#ECFDF5",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Feather
                  name={
                    item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                      ? "alert-triangle"
                      : isNews
                      ? "book-open"
                      : "bell"
                  }
                  size={11}
                  color={
                    item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                      ? "#D97706"
                      : isNews
                      ? "#2563EB"
                      : "#059669"
                  }
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color:
                      item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                        ? "#D97706"
                        : isNews
                        ? "#2563EB"
                        : "#059669",
                  }}
                >
                  {item.isFallback || item.badge?.toLowerCase().includes("mẫu")
                    ? "Dữ liệu mẫu"
                    : item.badge || (isNews ? "Tin hoạt động" : "Thông báo SV")}
                </Text>
              </View>

              {/* Tệp đính kèm nếu có */}
              {item.attachments && item.attachments.length > 0 ? (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: "#F1F5F9",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Feather name="paperclip" size={10} color="#475569" />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#475569" }}>
                    {item.attachments.length} file
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>
              {item.date}
            </Text>
          </View>

          {/* Hàng 2: Tiêu đề */}
          <Text
            style={{
              fontSize: 14.5,
              fontWeight: "800",
              color: "#0F172A",
              lineHeight: 21,
              marginBottom: 6,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Hàng 3: Tóm tắt nếu có */}
          {item.summary ? (
            <Text
              style={{
                fontSize: 12,
                color: "#64748B",
                lineHeight: 18,
                marginBottom: 10,
              }}
              numberOfLines={2}
            >
              {item.summary}
            </Text>
          ) : null}

          {/* Hàng 4: Tác giả & Xem chi tiết */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: "#F1F5F9",
              paddingTop: 10,
              marginTop: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1, marginRight: 8 }}>
              <Feather
                name={isNews ? "globe" : "home"}
                size={12}
                color="#64748B"
              />
              <Text style={{ fontSize: 11, color: "#64748B", flex: 1 }} numberOfLines={1}>
                {item.author || item.sender || "Phòng Công tác SV"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>
                {isNews ? "Chi tiết bài viết" : "Chi tiết"}
              </Text>
              <Feather name="arrow-right" size={12} color="#2563EB" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2964" translucent={Platform.OS === "android"} />

      {/* ─── HEADER NAVY BLUE ─── */}
      <View
        style={{
          backgroundColor: "#0F2964",
          paddingTop: topPadding,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              CỔNG THÔNG TIN ĐẠI HỌC TÂY NGUYÊN
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 19,
                fontWeight: "900",
                marginTop: 2,
              }}
            >
              Tin tức & Thông báo
            </Text>
          </View>
        </View>

        {/* Ô tìm kiếm */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 42,
          }}
        >
          <Feather name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm theo tiêu đề, nội dung, đơn vị..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: 13,
              color: "#0F172A",
              paddingVertical: 0,
            }}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7} style={{ padding: 4 }}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ─── BỘ LỌC TABS (TẤT CẢ / THÔNG BÁO SV / TIN TỨC) ─── */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
          backgroundColor: "#F8FAFC",
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("all")}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 9,
            borderRadius: 12,
            backgroundColor: activeTab === "all" ? "#0F2964" : "#FFFFFF",
            borderWidth: 1,
            borderColor: activeTab === "all" ? "#0F2964" : "#E2E8F0",
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: "800",
              color: activeTab === "all" ? "#FFFFFF" : "#475569",
            }}
          >
            Tất cả
          </Text>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1.5,
              borderRadius: 10,
              backgroundColor: activeTab === "all" ? "rgba(255,255,255,0.22)" : "#F1F5F9",
            }}
          >
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: "700",
                color: activeTab === "all" ? "#FFFFFF" : "#64748B",
              }}
            >
              {counts.all}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("announcement")}
          activeOpacity={0.8}
          style={{
            flex: 1.2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 9,
            borderRadius: 12,
            backgroundColor: activeTab === "announcement" ? "#0F2964" : "#FFFFFF",
            borderWidth: 1,
            borderColor: activeTab === "announcement" ? "#0F2964" : "#E2E8F0",
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: "800",
              color: activeTab === "announcement" ? "#FFFFFF" : "#475569",
            }}
          >
            Thông báo SV
          </Text>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1.5,
              borderRadius: 10,
              backgroundColor: activeTab === "announcement" ? "rgba(255,255,255,0.22)" : "#ECFDF5",
            }}
          >
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: "700",
                color: activeTab === "announcement" ? "#FFFFFF" : "#059669",
              }}
            >
              {counts.announcement}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("news")}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 9,
            borderRadius: 12,
            backgroundColor: activeTab === "news" ? "#0F2964" : "#FFFFFF",
            borderWidth: 1,
            borderColor: activeTab === "news" ? "#0F2964" : "#E2E8F0",
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: "800",
              color: activeTab === "news" ? "#FFFFFF" : "#475569",
            }}
          >
            Tin tức
          </Text>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1.5,
              borderRadius: 10,
              backgroundColor: activeTab === "news" ? "rgba(255,255,255,0.22)" : "#EFF6FF",
            }}
          >
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: "700",
                color: activeTab === "news" ? "#FFFFFF" : "#2563EB",
              }}
            >
              {counts.news}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── DANH SÁCH TOÀN BỘ BÀI VIẾT (FLATLIST) ─── */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0F2964"
            colors={["#0F2964"]}
          />
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
              paddingHorizontal: 20,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Feather name="file-text" size={26} color="#94A3B8" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#1E293B", marginBottom: 6 }}>
              {isLoading ? "Đang tải dữ liệu..." : "Không tìm thấy bài viết nào"}
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 18 }}>
              {searchQuery
                ? `Không có kết quả nào phù hợp với từ khóa "${searchQuery}". Hãy thử tìm kiếm từ khóa khác.`
                : "Hiện tại chưa có bài viết nào trong danh mục này."}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.8}
                style={{
                  marginTop: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: "#0F2964",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>
                  Xóa bộ lọc tìm kiếm
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

