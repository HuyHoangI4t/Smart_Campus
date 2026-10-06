import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { AppColors } from "../../../src/constants/appColors";
import {
  getNewsImageUrl,
  CAMPUS_FALLBACK_IMAGES,
  apiGetArticleDetail,
  getAttachmentDownloadUrl,
  ArticleContentBlock,
} from "../../../src/services/api";

interface ContentParagraph {
  type: "heading" | "bullet" | "text";
  text: string;
}

function parseArticleContent(rawText?: string): ContentParagraph[] {
  if (!rawText) return [];

  // Tách dòng thông minh theo số mục (1., 2.), gạch đầu dòng, tiêu đề
  const cleaned = rawText
    .replace(/THÔNG BÁO\s*V\/v/gi, "THÔNG BÁO\nV/v")
    .replace(/(\.|\s|\))(\d+\.\s+[A-ZÀ-Ỹ0-9])/g, (m, p1, p2) => p1 + "\n\n" + p2)
    .replace(/;\s*-\s*/g, ";\n• ")
    .replace(/:\s*-\s*/g, ":\n• ")
    .replace(/\.\s*-\s*/g, ".\n• ")
    .trim();

  const lines = cleaned.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  return lines.map((line) => {
    if (/^\d+\.\s+[A-ZÀ-Ỹ0-9]/.test(line)) {
      return { type: "heading", text: line };
    }
    if (/^[•\-\*]\s*/.test(line)) {
      return { type: "bullet", text: line.replace(/^[•\-\*]\s*/, "") };
    }
    if (/^THÔNG BÁO/i.test(line)) {
      return { type: "heading", text: line };
    }
    return { type: "text", text: line };
  });
}

export default function HomeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    summary?: string;
    content?: string;
    date?: string;
    sender?: string;
    author?: string;
    category?: string;
    source?: string;
    badge?: string;
    link?: string;
    type?: string;
    imageUrl?: string;
    isFallback?: string;
    attachments?: string;
  }>();

  // Chế độ cỡ chữ đọc bài (0: 15px, 1: 17px, 2: 19px)
  const [fontScale, setFontScale] = useState<number>(0);
  const baseFontSize = fontScale === 0 ? 15 : fontScale === 1 ? 17 : 19;
  const baseLineHeight = fontScale === 0 ? 25 : fontScale === 1 ? 28 : 31;

  const rawArticleText = params.content || params.summary || "";
  const parsedContent = parseArticleContent(rawArticleText);

  // Danh sách các khối nội dung theo thứ tự chính xác (văn bản & hình ảnh xen kẽ)
  const [contentBlocks, setContentBlocks] = useState<ArticleContentBlock[]>([]);
  const [articleImages, setArticleImages] = useState<string[]>([]);
  const [detailedParagraphs, setDetailedParagraphs] = useState<string[]>([]);
  const [scrapedAttachments, setScrapedAttachments] = useState<{ title: string; url: string; size?: string; isPdf?: boolean }[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Phân tích danh sách tài liệu đính kèm (nếu có từ RSS)
  let parsedAttachments: { title: string; url: string; size?: string; isPdf?: boolean }[] = [];
  if (params.attachments) {
    try {
      parsedAttachments = JSON.parse(params.attachments);
    } catch {
      // ignore
    }
  }

  const isNews = params.type === "news";
  const title =
    params.title ||
    (isNews
      ? "Tin tức hoạt động Trường Đại học Tây Nguyên"
      : "Thông báo từ Trường Đại học Tây Nguyên");
  const date = params.date || "Hôm nay";
  const author = params.author || params.sender || (isNews ? "Ban Biên tập TTN" : "Phòng Công tác Sinh viên");
  const category = params.category || (isNews ? "Tin tức hoạt động" : "Thông báo sinh viên");
  const badge = params.badge || (isNews ? "Tin hoạt động" : "Thông báo SV");
  const isFallback =
    params.isFallback === "true" ||
    badge.toLowerCase().includes("mẫu") ||
    title.includes("[Dữ liệu mẫu]");
  const link =
    params.link ||
    (isNews
      ? "https://www.ttn.edu.vn/index.php/mthongbao/tintuc"
      : "https://www.ttn.edu.vn/index.php/svthongbao");

  const initialImageUri = params.imageUrl ? getNewsImageUrl(params.imageUrl) : "";
  const [heroImageUri, setHeroImageUri] = useState<string>(initialImageUri);
  const scrollRef = useRef<ScrollView>(null);

  // Luôn cuộn ngay về đỉnh trang mỗi khi màn hình được kích hoạt / hiển thị
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Khi người dùng bấm vào bài viết khác, xóa sạch dữ liệu bài cũ và cuộn lên đỉnh ngay lập tức
  useEffect(() => {
    setContentBlocks([]);
    setArticleImages([]);
    setDetailedParagraphs([]);
    setScrapedAttachments([]);
    setHeroImageUri(params.imageUrl ? getNewsImageUrl(params.imageUrl) : "");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [params.id, params.link, params.title, params.imageUrl]);

  // Tự động cào toàn bộ ảnh và bài viết chi tiết từ website trường TTN
  useEffect(() => {
    let isMounted = true;
    if (params.link && params.link.startsWith("http") && !isFallback) {
      setLoadingDetail(true);
      apiGetArticleDetail(params.link)
        .then((res) => {
          if (!isMounted) return;
          if (res && res.success && res.data) {
            if (res.data.contentBlocks && res.data.contentBlocks.length > 0) {
              setContentBlocks(res.data.contentBlocks);
            }
            if (res.data.images && res.data.images.length > 0) {
              setArticleImages(res.data.images);
              // Luôn lấy ảnh thực tế cào được từ bài viết làm ảnh bìa chi tiết
              setHeroImageUri(getNewsImageUrl(res.data.images[0]));
            }
            if (res.data.paragraphs && res.data.paragraphs.length > 0) {
              setDetailedParagraphs(res.data.paragraphs);
            }
            if (res.data.attachments && res.data.attachments.length > 0) {
              setScrapedAttachments(res.data.attachments);
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingDetail(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [params.link, isFallback]);

  const hasImage = Boolean(heroImageUri && heroImageUri.trim() !== "") || Boolean(params.imageUrl && params.imageUrl.trim() !== "") || isNews || articleImages.length > 0;

  const contentToRender =
    detailedParagraphs.length > 0
      ? parseArticleContent(detailedParagraphs.join("\n\n"))
      : parsedContent;

  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  const handleDownloadAttachment = async (att: {
    title: string;
    url: string;
    size?: string;
    isPdf?: boolean;
  }) => {
    if (!att.url || downloadingUrl) return;

    setDownloadingUrl(att.url);
    const downloadEndpoint = getAttachmentDownloadUrl(att.url);

    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof document !== "undefined") {
          const dlLink = document.createElement("a");
          dlLink.href = downloadEndpoint;
          dlLink.download = att.title || "tailieu.pdf";
          document.body.appendChild(dlLink);
          dlLink.click();
          document.body.removeChild(dlLink);
        } else {
          Linking.openURL(downloadEndpoint);
        }
        setDownloadingUrl(null);
        return;
      }

      // Tạo tên tệp an toàn cho hệ thống tệp điện thoại
      let fileName = (att.title || "tailieu")
        .replace(/[/\\?%*:|"<>]/g, "_")
        .trim();
      if (att.isPdf && !fileName.toLowerCase().endsWith(".pdf")) {
        fileName += ".pdf";
      }

      const targetFile = new File(Paths.document, fileName);
      const downloaded = await File.downloadFileAsync(downloadEndpoint, targetFile, { idempotent: true });

      if (downloaded && downloaded.uri) {
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(downloaded.uri, {
            mimeType: att.isPdf ? "application/pdf" : "application/octet-stream",
            dialogTitle: `Tập tin đã tải về: ${fileName}`,
            UTI: att.isPdf ? "com.adobe.pdf" : undefined,
          });
        } else {
          Alert.alert(
            "Tải về thành công",
            `Tập tin đã được tải về máy của bạn: ${fileName}`
          );
        }
      } else {
        throw new Error("Không thể tải tệp");
      }
    } catch (err: any) {
      console.warn("Lỗi tải tệp trực tiếp:", err.message);
      Alert.alert(
        "Không thể tải trực tiếp",
        "Máy chủ trường không phản hồi tệp hoặc mạng yếu. Bạn có muốn mở trực tiếp bằng trình duyệt không?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Mở trình duyệt",
            onPress: () => Linking.openURL(att.url),
          },
        ]
      );
    } finally {
      setDownloadingUrl(null);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: title,
        message: `${title}\n\nXem chi tiết tại: ${link}`,
        url: link,
      });
    } catch {
      // ignore
    }
  };

  const handleOpenOriginal = () => {
    if (link) {
      Linking.openURL(link);
    }
  };

  const toggleFontSize = () => {
    setFontScale((prev) => (prev + 1) % 3);
  };



  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar
        barStyle={hasImage ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* ─── NẾU CÓ ẢNH BÌA HERO (BÀI VIẾT TIN TỨC) ───────────────────── */}
      {hasImage ? (
        <View style={{ width: "100%", height: 280, position: "relative" }}>
          <Image
            source={{
              uri: heroImageUri || CAMPUS_FALLBACK_IMAGES[0],
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            }}
            style={{ width: "100%", height: "100%", backgroundColor: "#0F172A" }}
            resizeMode="cover"
            onError={() => {
              if (articleImages.length > 1 && heroImageUri !== getNewsImageUrl(articleImages[1])) {
                setHeroImageUri(getNewsImageUrl(articleImages[1]));
              } else {
                setHeroImageUri(CAMPUS_FALLBACK_IMAGES[0]);
              }
            }}
          />
          {/* Lớp phủ gradient làm nổi bật nút điều hướng trên ảnh */}
          <LinearGradient
            colors={["rgba(0,0,0,0.65)", "transparent", "rgba(15,23,42,0.85)"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Thanh Header nổi phía trên ảnh */}
          <View
            style={{
              position: "absolute",
              top: Math.max(insets.top, 16) + 8,
              left: 16,
              right: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={toggleFontSize}
                activeOpacity={0.8}
                style={{
                  height: 40,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 4,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.25)",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>
                  Aa {fontScale > 0 ? `+${fontScale}` : ""}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.8}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.25)",
                }}
              >
                <Feather name="share-2" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badge phân loại nằm đè lên góc dưới ảnh */}
          <View
            style={{
              position: "absolute",
              bottom: 16,
              left: 20,
              right: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                backgroundColor: isFallback ? "#D97706" : AppColors.primary,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              {isFallback ? (
                <Feather name="alert-triangle" size={11} color="#FFFFFF" />
              ) : (
                <Feather name={isNews ? "book-open" : "bell"} size={11} color="#FFFFFF" />
              )}
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>
                {isFallback ? "Dữ liệu mẫu" : badge}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Feather name="calendar" size={11} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>
                {date}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* ─── NẾU KHÔNG CÓ ẢNH (HEADER TIÊU CHUẨN) ──────────────────────── */
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: 14,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="arrow-left" size={20} color="#1E293B" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#153242" }}>
              {isNews ? "Bản tin Trường" : "Văn bản Thông báo"}
            </Text>
            <Text style={{ fontSize: 10, color: AppColors.textMuted }}>
              Đại học Tây Nguyên
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={toggleFontSize}
              activeOpacity={0.7}
              style={{
                height: 38,
                paddingHorizontal: 10,
                borderRadius: 19,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#1E293B" }}>
                Aa {fontScale > 0 ? `+${fontScale}` : ""}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="share-2" size={17} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── PHẦN CUỘN NỘI DUNG CHI TIẾT ───────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: hasImage ? 16 : 20,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Phân loại và ngày (khi không có ảnh bìa) */}
        {!hasImage ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: isFallback ? "#FEF3C7" : isNews ? "#EFF6FF" : "#ECFDF5",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              {isFallback ? (
                <Feather name="alert-triangle" size={11} color="#D97706" />
              ) : isNews ? (
                <Feather name="book-open" size={11} color="#2563EB" />
              ) : (
                <Feather name="bell" size={11} color="#059669" />
              )}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: isFallback ? "#D97706" : isNews ? "#2563EB" : "#059669",
                }}
              >
                {isFallback ? "Dữ liệu mẫu" : badge}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Feather name="calendar" size={12} color={AppColors.textMuted} />
              <Text style={{ fontSize: 11, color: AppColors.textMuted, fontWeight: "600" }}>
                {date}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Banner cảnh báo nếu là dữ liệu mẫu dự phòng */}
        {isFallback ? (
          <View
            style={{
              backgroundColor: "#FFFBEB",
              borderColor: "#FCD34D",
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Feather name="alert-triangle" size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#92400E" }}>
                Chế độ dự phòng: Dữ liệu mẫu
              </Text>
              <Text style={{ fontSize: 11, color: "#B45309", marginTop: 2, lineHeight: 16 }}>
                Bài viết này là dữ liệu mẫu dự phòng hiển thị khi mất kết nối mạng hoặc không thể tải RSS từ cổng TTN.edu.vn.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Tiêu đề bài viết */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#0F172A",
            lineHeight: 28,
            marginBottom: 14,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>

        {/* Thẻ cơ quan ban hành / Nguồn tin */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isNews ? "#EFF6FF" : "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name={isNews ? "book-open" : "user-check"}
              size={18}
              color={isNews ? "#2563EB" : "#0F172A"}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }}>
              {author}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Text style={{ fontSize: 11, color: AppColors.textMuted }}>
                {category}
              </Text>
              <Text style={{ fontSize: 10, color: "#94A3B8" }}>•</Text>
              <Text style={{ fontSize: 11, color: AppColors.textMuted }}>
                {date}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── NỘI DUNG CHÍNH CỦA BÀI VIẾT (TỪ WEBSITE / RSS) ─── */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            padding: 18,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: isNews ? "#2563EB" : "#0F172A",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          {/* Tiêu đề phân mục nội dung */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 12,
              marginBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather
                name={isNews ? "file-text" : "clipboard"}
                size={16}
                color={isNews ? "#2563EB" : "#0F172A"}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: isNews ? "#1E40AF" : "#0F172A",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {isNews ? "Nội dung bài viết" : "Nội dung chi tiết thông báo"}
              </Text>
            </View>

            {loadingDetail ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <ActivityIndicator size="small" color={AppColors.primary} />
                <Text style={{ fontSize: 11, color: AppColors.textMuted }}>Đang tải ảnh & bài viết...</Text>
              </View>
            ) : null}
          </View>

          {/* Các đoạn nội dung và hình ảnh bài viết theo đúng vị trí gốc */}
          <View style={{ gap: 14 }}>
            {contentBlocks.length > 0 ? (
              contentBlocks.map((block, idx) => {
                if (block.type === "image" && block.url) {
                  return (
                    <View key={idx} style={{ marginVertical: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          if (block.url) Linking.openURL(block.url);
                        }}
                        style={{
                          borderRadius: 14,
                          overflow: "hidden",
                          backgroundColor: "#0F172A",
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }}
                      >
                        <Image
                          source={{
                            uri: getNewsImageUrl(block.url),
                            headers: {
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            },
                          }}
                          style={{ width: "100%", height: 230 }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      {block.caption ? (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#64748B",
                            fontStyle: "italic",
                            textAlign: "center",
                            marginTop: 6,
                            lineHeight: 18,
                            paddingHorizontal: 8,
                          }}
                        >
                          {block.caption}
                        </Text>
                      ) : null}
                    </View>
                  );
                }

                if (block.type === "text" && block.text) {
                  // Bỏ qua nếu là tiêu đề lặp lại
                  if (block.text.trim().toLowerCase() === title.trim().toLowerCase()) {
                    return null;
                  }

                  const paras = parseArticleContent(block.text);
                  return (
                    <View key={idx} style={{ gap: 8 }}>
                      {paras.map((p, pIdx) => {
                        if (p.type === "heading") {
                          return (
                            <Text
                              key={pIdx}
                              style={{
                                fontSize: baseFontSize + 1,
                                fontWeight: "800",
                                color: isNews ? "#1E40AF" : "#0F172A",
                                lineHeight: baseLineHeight + 3,
                                marginTop: 4,
                              }}
                            >
                              {p.text}
                            </Text>
                          );
                        }
                        if (p.type === "bullet") {
                          return (
                            <View
                              key={pIdx}
                              style={{
                                flexDirection: "row",
                                alignItems: "flex-start",
                                paddingLeft: 4,
                                gap: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: baseFontSize,
                                  color: isNews ? "#2563EB" : "#0F172A",
                                  fontWeight: "900",
                                  lineHeight: baseLineHeight,
                                }}
                              >
                                •
                              </Text>
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: baseFontSize,
                                  color: "#1E293B",
                                  lineHeight: baseLineHeight,
                                  fontWeight: "500",
                                }}
                              >
                                {p.text}
                              </Text>
                            </View>
                          );
                        }
                        return (
                          <Text
                            key={pIdx}
                            style={{
                              fontSize: baseFontSize,
                              color: "#1E293B",
                              lineHeight: baseLineHeight,
                              fontWeight: "400",
                            }}
                          >
                            {p.text}
                          </Text>
                        );
                      })}
                    </View>
                  );
                }

                return null;
              })
            ) : contentToRender.length > 0 ? (
              contentToRender.map((item, idx) => {
                if (item.type === "heading") {
                  return (
                    <Text
                      key={idx}
                      style={{
                        fontSize: baseFontSize + 1,
                        fontWeight: "800",
                        color: isNews ? "#1E40AF" : "#0F172A",
                        lineHeight: baseLineHeight + 3,
                        marginTop: idx > 0 ? 6 : 0,
                      }}
                    >
                      {item.text}
                    </Text>
                  );
                }
                if (item.type === "bullet") {
                  return (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        paddingLeft: 4,
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: baseFontSize,
                          color: isNews ? "#2563EB" : "#0F172A",
                          fontWeight: "900",
                          lineHeight: baseLineHeight,
                        }}
                      >
                        •
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: baseFontSize,
                          color: "#1E293B",
                          lineHeight: baseLineHeight,
                          fontWeight: "500",
                        }}
                      >
                        {item.text}
                      </Text>
                    </View>
                  );
                }
                return (
                  <Text
                    key={idx}
                    style={{
                      fontSize: baseFontSize,
                      color: "#1E293B",
                      lineHeight: baseLineHeight,
                      fontWeight: "400",
                    }}
                  >
                    {item.text}
                  </Text>
                );
              })
            ) : (
              <Text
                style={{
                  fontSize: baseFontSize,
                  color: "#64748B",
                  lineHeight: baseLineHeight,
                }}
              >
                Vui lòng mở liên kết bài viết gốc bên dưới để xem toàn văn và tài liệu đính kèm.
              </Text>
            )}
          </View>
        </View>

        {/* Khối tài liệu & biểu mẫu đính kèm (từ website hoặc RSS) */}
        {(() => {
          const finalAttachments = scrapedAttachments.length > 0 ? scrapedAttachments : parsedAttachments;
          if (finalAttachments.length === 0) return null;

          return (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingBottom: 10,
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F1F5F9",
                }}
              >
                <Feather name="paperclip" size={16} color="#0F172A" />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: "#0F172A",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Tài liệu & Biểu mẫu đính kèm ({finalAttachments.length})
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {finalAttachments.map((att, idx) => {
                  const isDownloading = downloadingUrl === att.url;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleDownloadAttachment(att)}
                      disabled={isDownloading}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: "#F8FAFC",
                        borderWidth: 1,
                        borderColor: isDownloading ? AppColors.primary : "#E2E8F0",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 10 }}>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            backgroundColor: att.isPdf ? "#FEE2E2" : "#EFF6FF",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isDownloading ? (
                            <ActivityIndicator size="small" color={att.isPdf ? "#DC2626" : "#2563EB"} />
                          ) : (
                            <Feather
                              name={att.isPdf ? "file-text" : "download"}
                              size={18}
                              color={att.isPdf ? "#DC2626" : "#2563EB"}
                            />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "700",
                              color: "#1E293B",
                            }}
                            numberOfLines={1}
                          >
                            {att.title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: isDownloading ? AppColors.primary : AppColors.textMuted,
                              marginTop: 2,
                              fontWeight: isDownloading ? "600" : "400",
                            }}
                            numberOfLines={1}
                          >
                            {isDownloading
                              ? "Đang tải tệp về máy..."
                              : `${att.size ? `${att.size} • ` : ""}Nhấn để tải trực tiếp`}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: isDownloading ? "#E2E8F0" : "#EFF6FF",
                        }}
                      >
                        {isDownloading ? (
                          <ActivityIndicator size="small" color="#2563EB" />
                        ) : (
                          <Feather name="download" size={13} color="#2563EB" />
                        )}
                        <Text style={{ fontSize: 11, fontWeight: "800", color: "#2563EB" }}>
                          {isDownloading ? "Đang tải" : "Tải về"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Hộp chỉ dẫn sinh viên */}
        <View
          style={{
            backgroundColor: "#F0F7FF",
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: "#BFDBFE",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Feather name="info" size={15} color="#1D4ED8" />
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#1D4ED8" }}>
              HƯỚNG DẪN DÀNH CHO SINH VIÊN
            </Text>
          </View>

          <Text style={{ fontSize: 12, color: "#1E3A8A", lineHeight: 19 }}>
            • Kiểm tra thông tin cá nhân và đối chiếu học phần trên Cổng thông tin đào
            tạo của nhà trường.{"\n"}
            • Mọi vướng mắc liên hệ trực tiếp văn phòng Khoa hoặc Phòng Công tác Sinh
            viên tại Tòa Nhà Điều Hành - 567 Lê Duẩn.{"\n"}
            • Nhấn nút bên dưới để mở liên kết bài viết gốc và tải tài liệu văn bản đính
            kèm.
          </Text>
        </View>

        {/* ─── CÁC NÚT THAO TÁC ────────────────────────────────────────── */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={handleOpenOriginal}
            activeOpacity={0.8}
            style={{
              backgroundColor: AppColors.primary,
              borderRadius: 14,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: AppColors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Feather name="external-link" size={16} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>
              Xem bài viết gốc trên Website trường
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Feather name="share-2" size={15} color="#334155" />
              <Text style={{ color: "#334155", fontWeight: "700", fontSize: 13 }}>
                Chia sẻ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: "#F1F5F9",
                borderRadius: 14,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Feather name="arrow-left" size={14} color="#475569" />
              <Text style={{ color: "#475569", fontWeight: "700", fontSize: 13 }}>
                Quay lại
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

