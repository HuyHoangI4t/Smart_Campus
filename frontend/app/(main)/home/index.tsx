import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import {
  apiGetSchedule,
  apiGetDashboard,
  apiGetNews,
  NewsOrAnnouncementItem,
  getNewsImageUrl,
  CAMPUS_FALLBACK_IMAGES,
} from "../../../src/services/api";

interface StudentInfo {
  mssv?: string;
  ho_ten?: string;
  fullName?: string;
  email?: string;
  lop?: string;
  khoa?: string;
  avatar?: string;
}

interface NextClassInfo {
  subject: string;
  room: string;
  time: string;
  lecturer?: string;
  dayText: string;
  status: 'IN_PROGRESS' | 'UPCOMING_TODAY' | 'NEXT_DAY';
  statusLabel: string;
  statusBadgeColor: string;
}

const DEFAULT_SCHEDULE_FALLBACK = [
  { course: "Cấu trúc dữ liệu & Giải thuật", room: "ENG-B204", time: "Tiết 1-3 (07:00 – 09:30)", day: "Thứ 2", dayNum: 2, lecturer: "ThS. Nguyễn Văn A" },
  { course: "Lập trình thiết bị di động", room: "LAB-03", time: "Tiết 4-5 (09:40 – 11:15)", day: "Thứ 2", dayNum: 2, lecturer: "TS. Trần Thị B" },
  { course: "Hệ cơ sở dữ liệu", room: "ENG-A102", time: "Tiết 7-9 (13:30 – 15:30)", day: "Thứ 3", dayNum: 3, lecturer: "ThS. Lê Hoàng C" },
  { course: "Mạng máy tính & Truyền thông", room: "NET-LAB", time: "Tiết 1-3 (07:30 – 10:00)", day: "Thứ 4", dayNum: 4, lecturer: "TS. Phạm Văn D" },
  { course: "An toàn thông tin mạng", room: "ENG-B301", time: "Tiết 4-5 (10:15 – 11:45)", day: "Thứ 5", dayNum: 5, lecturer: "ThS. Vũ Thị E" },
  { course: "Đồ án chuyên ngành", room: "ENG-B101", time: "Tiết 1-5 (07:30 – 11:30)", day: "Thứ 6", dayNum: 6, lecturer: "Hội đồng bộ môn" },
];

function getPeriodMinutes(startPeriod: number, endPeriod: number) {
  const periodTimes: Record<number, { start: number; end: number }> = {
    1: { start: 7 * 60, end: 7 * 60 + 50 },
    2: { start: 7 * 60 + 50, end: 8 * 60 + 40 },
    3: { start: 8 * 60 + 50, end: 9 * 60 + 40 },
    4: { start: 9 * 60 + 50, end: 10 * 60 + 40 },
    5: { start: 10 * 60 + 40, end: 11 * 60 + 30 },
    6: { start: 13 * 60, end: 13 * 60 + 50 },
    7: { start: 13 * 60 + 50, end: 14 * 60 + 40 },
    8: { start: 14 * 60 + 50, end: 15 * 60 + 40 },
    9: { start: 15 * 60 + 50, end: 16 * 60 + 40 },
    10: { start: 16 * 60 + 40, end: 17 * 60 + 30 },
    11: { start: 17 * 60 + 45, end: 18 * 60 + 35 },
    12: { start: 18 * 60 + 35, end: 19 * 60 + 25 },
    13: { start: 19 * 60 + 35, end: 20 * 60 + 25 },
  };

  const start = periodTimes[startPeriod]?.start || 7 * 60;
  const end = periodTimes[endPeriod]?.end || (start + 90);
  return { startMinutes: start, endMinutes: end };
}

function parseClassTimeRange(timeStr: string): { startMinutes: number; endMinutes: number } {
  const timeMatch = (timeStr || "").match(/(\d{1,2})[:h](\d{2})\s*[-–—]\s*(\d{1,2})[:h](\d{2})/i);
  if (timeMatch) {
    const startH = parseInt(timeMatch[1], 10);
    const startM = parseInt(timeMatch[2], 10);
    const endH = parseInt(timeMatch[3], 10);
    const endM = parseInt(timeMatch[4], 10);
    return {
      startMinutes: startH * 60 + startM,
      endMinutes: endH * 60 + endM,
    };
  }

  const periodMatch = (timeStr || "").match(/(\d{1,2})\s*[-–—,]\s*(\d{1,2})/);
  if (periodMatch) {
    const startP = parseInt(periodMatch[1], 10);
    const endP = parseInt(periodMatch[2], 10);
    return getPeriodMinutes(startP, endP);
  }

  const singlePeriodMatch = (timeStr || "").match(/tiết\s*(\d{1,2})/i);
  if (singlePeriodMatch) {
    const p = parseInt(singlePeriodMatch[1], 10);
    return getPeriodMinutes(p, p);
  }

  if ((timeStr || "").toLowerCase().includes("chiều") || (timeStr || "").toLowerCase().includes("tối")) {
    return { startMinutes: 13 * 60, endMinutes: 17 * 60 };
  }
  return { startMinutes: 7 * 60, endMinutes: 11 * 60 + 30 };
}

function getDayNameFromNum(num: number): string {
  switch (num) {
    case 1: return "Chủ Nhật";
    case 2: return "Thứ Hai";
    case 3: return "Thứ Ba";
    case 4: return "Thứ Tư";
    case 5: return "Thứ Năm";
    case 6: return "Thứ Sáu";
    case 7: return "Thứ Bảy";
    default: return "Thứ Hai";
  }
}

function computeNextClass(rawSchedules: any[]): NextClassInfo | null {
  if (!rawSchedules || rawSchedules.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const jsDay = now.getDay();
  const todayNum = jsDay === 0 ? 1 : jsDay + 1; // 0 (CN) -> 1, 1 (T2) -> 2, ..., 6 (T7) -> 7

  const normalized = rawSchedules.map((item, idx) => {
    let dayNum = item.dayNum;
    if (!dayNum) {
      const lowerDay = (item.day || item.code || "").toLowerCase();
      if (lowerDay.includes("thứ 3") || lowerDay.includes("thứ ba")) dayNum = 3;
      else if (lowerDay.includes("thứ 4") || lowerDay.includes("thứ tư")) dayNum = 4;
      else if (lowerDay.includes("thứ 5") || lowerDay.includes("thứ năm")) dayNum = 5;
      else if (lowerDay.includes("thứ 6") || lowerDay.includes("thứ sáu")) dayNum = 6;
      else if (lowerDay.includes("thứ 7") || lowerDay.includes("thứ bảy")) dayNum = 7;
      else if (lowerDay.includes("chủ nhật") || lowerDay.includes("cn")) dayNum = 1;
      else if (lowerDay.includes("thứ 2") || lowerDay.includes("thứ hai")) dayNum = 2;
      else dayNum = 2;
    }

    const timeStr = item.time || "";
    const range = parseClassTimeRange(timeStr);

    return {
      id: item.id || idx,
      subject: item.course || item.subject || "Môn học",
      room: item.room || "Khu giảng đường",
      time: timeStr || "Ca học tiêu chuẩn",
      dayNum,
      day: item.day || item.code || `Thứ ${dayNum}`,
      startMinutes: range.startMinutes,
      endMinutes: range.endMinutes,
      lecturer: item.lecturer || "",
    };
  });

  // 1. Kiểm tra các môn của NGÀY HÔM NAY (todayNum)
  const todayClasses = normalized
    .filter((c) => c.dayNum === todayNum)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // 1A. Môn ĐANG TRONG GIỜ HỌC
  const inProgressClass = todayClasses.find(
    (c) => currentMinutes >= c.startMinutes && currentMinutes <= c.endMinutes
  );
  if (inProgressClass) {
    return {
      subject: inProgressClass.subject,
      room: inProgressClass.room,
      time: inProgressClass.time,
      lecturer: inProgressClass.lecturer,
      dayText: "Hôm nay",
      status: "IN_PROGRESS",
      statusLabel: "ĐANG TRONG GIỜ HỌC",
      statusBadgeColor: "#10B981", // Xanh lá
    };
  }

  // 1B. Hôm nay còn môn chưa học (Lớp kế tiếp hôm nay)
  const upcomingTodayClass = todayClasses.find(
    (c) => currentMinutes < c.startMinutes
  );
  if (upcomingTodayClass) {
    return {
      subject: upcomingTodayClass.subject,
      room: upcomingTodayClass.room,
      time: upcomingTodayClass.time,
      lecturer: upcomingTodayClass.lecturer,
      dayText: "Hôm nay",
      status: "UPCOMING_TODAY",
      statusLabel: "LỚP HỌC KẾ TIẾP",
      statusBadgeColor: "#3B82F6", // Xanh dương
    };
  }

  // 2. Nếu đã qua hết giờ học hôm nay (hoặc hôm nay không có lịch):
  // Lấy thời khóa biểu ngày hôm sau và môn học kế tiếp
  for (let offset = 1; offset <= 7; offset++) {
    const nextDayNum = ((todayNum - 1 + offset) % 7) + 1;
    const nextDayClasses = normalized
      .filter((c) => c.dayNum === nextDayNum)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    if (nextDayClasses.length > 0) {
      const firstClassNextDay = nextDayClasses[0];
      const isTomorrow = offset === 1;
      const dayName = getDayNameFromNum(nextDayNum);

      return {
        subject: firstClassNextDay.subject,
        room: firstClassNextDay.room,
        time: firstClassNextDay.time,
        lecturer: firstClassNextDay.lecturer,
        dayText: isTomorrow ? "Ngày mai" : dayName,
        status: "NEXT_DAY",
        statusLabel: isTomorrow ? "LỊCH HỌC NGÀY MAI" : `MÔN KẾ TIẾP • ${dayName.toUpperCase()}`,
        statusBadgeColor: "#C084FC", // Tím
      };
    }
  }

  // Fallback nếu không có ngày nào
  const fallback = normalized[0];
  return {
    subject: fallback.subject,
    room: fallback.room,
    time: fallback.time,
    lecturer: fallback.lecturer,
    dayText: fallback.day,
    status: "NEXT_DAY",
    statusLabel: "LỚP HỌC KẾ TIẾP",
    statusBadgeColor: "#C084FC",
  };
}

function NewsCardImage({ imageUrl, index }: { imageUrl?: string; index: number }) {
  const [currentUri, setCurrentUri] = useState(getNewsImageUrl(imageUrl, index));

  return (
    <Image
      source={{
        uri: currentUri,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }}
      style={{ width: "100%", height: 155, backgroundColor: "#E2E8F0" }}
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

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding =
    Platform.OS === "android"
      ? (StatusBar.currentHeight || 24) + 16
      : Math.max(insets.top + 12, 44);

  const [student, setStudent] = useState<StudentInfo>({
    ho_ten: "Đang tải...",
    mssv: "",
  });
  const [nextClass, setNextClass] = useState<NextClassInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 3 Thông báo (từ RSS thongbaosv) & 3 Tin tức (từ RSS tintuc)
  const [latestAnnouncements, setLatestAnnouncements] = useState<NewsOrAnnouncementItem[]>([]);
  const [latestNews, setLatestNews] = useState<NewsOrAnnouncementItem[]>([]);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("@auth_user");
      let currentUser: any = {};
      if (userStr) {
        currentUser = JSON.parse(userStr);
        setStudent({
          mssv: currentUser.mssv || "",
          ho_ten:
            currentUser.ho_ten ||
            currentUser.fullName ||
            currentUser.full_name ||
            "Sinh viên",
          fullName:
            currentUser.fullName ||
            currentUser.ho_ten ||
            currentUser.full_name ||
            "Sinh viên",
          email: currentUser.email,
          lop: currentUser.lop,
          khoa: currentUser.khoa,
          avatar: currentUser.avatar,
        });
      }

      const mssv = currentUser.mssv || currentUser.masv;
      const isRealAccount = mssv && mssv !== "guest";

      // 1. Tải thông tin Dashboard
      const dashRes = await apiGetDashboard();
      if (dashRes && dashRes.success && dashRes.student && isRealAccount) {
        setStudent((prev) => ({ ...prev, ...dashRes.student }));
      }

      // 2. Tải và tính toán Lớp học kế tiếp / Đang học / Ngày hôm sau
      const scheduleRes = await apiGetSchedule(isRealAccount ? mssv : undefined);
      let rawScheduleList: any[] = [];

      if (scheduleRes && scheduleRes.success) {
        if (Array.isArray(scheduleRes.schedules) && scheduleRes.schedules.length > 0) {
          rawScheduleList = scheduleRes.schedules;
        } else if (scheduleRes.tables && scheduleRes.tables.length > 0) {
          const rows = scheduleRes.tables[0]?.rows || [];
          if (rows.length > 1) {
            rows.slice(1).forEach((r: string[], idx: number) => {
              if (r.length >= 4) {
                rawScheduleList.push({
                  id: `sc-${idx}`,
                  course: r[1] || r[2] || "Môn học",
                  day: r[0] || "",
                  time: r[2] ? `Tiết ${r[2]}` : (r[3] || "Ca học tiêu chuẩn"),
                  room: r[3] || r[4] || "Khu giảng đường",
                  lecturer: r[4] || r[5] || "Giảng viên",
                });
              }
            });
          }
        }
      }

      if (rawScheduleList.length === 0) {
        rawScheduleList = DEFAULT_SCHEDULE_FALLBACK;
      }

      const computed = computeNextClass(rawScheduleList);
      if (computed) {
        setNextClass(computed);
      }

      // 3. Tải toàn bộ Thông báo (RSS thongbaosv) và Tin tức (RSS tintuc)
      // Hàm lọc bài viết trùng tiêu đề hoặc trùng link URL
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

          // Lọc nếu trùng tiêu đề hoặc trùng URL
          if (normTitle && seenTitles.has(normTitle)) continue;
          if (normUrl && seenUrls.has(normUrl)) continue;

          if (normTitle) seenTitles.add(normTitle);
          if (normUrl) seenUrls.add(normUrl);
          uniqueItems.push(item);
        }
        return uniqueItems;
      };

      const newsRes = await apiGetNews();
      if (newsRes && newsRes.success) {
        let rawAnnouncements: NewsOrAnnouncementItem[] = [];
        if (Array.isArray(newsRes.latestAnnouncements) && newsRes.latestAnnouncements.length > 0) {
          rawAnnouncements = newsRes.latestAnnouncements;
        } else if (Array.isArray(newsRes.announcements) && newsRes.announcements.length > 0) {
          rawAnnouncements = newsRes.announcements;
        } else if (Array.isArray(newsRes.data)) {
          rawAnnouncements = newsRes.data.filter((i: any) => i.type === "announcement");
        }
        setLatestAnnouncements(deduplicateArticles(rawAnnouncements).slice(0, 3));

        let rawNews: NewsOrAnnouncementItem[] = [];
        if (Array.isArray(newsRes.latestNews) && newsRes.latestNews.length > 0) {
          rawNews = newsRes.latestNews;
        } else if (Array.isArray(newsRes.news) && newsRes.news.length > 0) {
          rawNews = newsRes.news;
        } else if (Array.isArray(newsRes.data)) {
          rawNews = newsRes.data.filter((i: any) => i.type === "news");
        }
        setLatestNews(deduplicateArticles(rawNews).slice(0, 3));
      }

      const offline = Boolean(scheduleRes?.isOfflineCache || newsRes?.isOfflineCache || dashRes?.isOfflineCache);
      setIsOfflineData(offline);
      if (offline) {
        setCachedAt(scheduleRes?.cachedAt || newsRes?.cachedAt || dashRes?.cachedAt || null);
      }
    } catch {
      // Giữ dữ liệu hiện tại
      setIsOfflineData(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const onNavigate = (screen: string) => {
    if (screen === "home") router.push("/(main)/home");
    else router.push(`/(main)/${screen}` as any);
  };

  // Mở màn hình chi tiết bài viết / thông báo
  const openDetail = (item: NewsOrAnnouncementItem, idx = 0) => {
    const finalImgUrl = getNewsImageUrl(item.imageUrl, idx);
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

  const quickActions = [
    { icon: "navigation" as const, label: "Bản đồ", screen: "map", bg: "#EFF6FF", fg: "#2563EB" },
    { icon: "calendar" as const, label: "Lịch học", screen: "schedule", bg: "#ECFDF5", fg: "#059669" },
    { icon: "message-square" as const, label: "Phản hồi", screen: "feedback", bg: "#FEF3C7", fg: "#D97706" },
    { icon: "bar-chart-2" as const, label: "Kết quả", screen: "grades", bg: "#F3E8FF", fg: "#7C3AED" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} translucent={Platform.OS === "android"} />

      {/* ─── FIXED HEADER (BẢO VỆ VÙNG TAI THỎ & STATUS BAR KHÔNG BỊ TRÀN) ─── */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryLight]}
        style={{
          paddingTop: topPadding,
          paddingBottom: 14,
          paddingHorizontal: 20,
          zIndex: 10,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <View style={[s.row, s.between, { alignItems: "center" }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
              numberOfLines={1}
            >
              {student.mssv && student.mssv !== "guest"
                ? `SINH VIÊN • ${student.mssv}`
                : "KHÁCH THAM QUAN"}
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "900",
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {student.ho_ten || student.fullName || "Sinh viên"}
            </Text>
          </View>

          <View style={s.row}>
            <TouchableOpacity
              onPress={() => onNavigate("sos")}
              activeOpacity={0.8}
              style={[s.iconBtn, { backgroundColor: AppColors.danger, marginRight: 8 }]}
            >
              <Feather name="shield" size={17} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigate("profile")}
              activeOpacity={0.8}
              style={[
                s.iconBtn,
                {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  overflow: "hidden",
                  padding: student.avatar ? 0 : 8,
                },
              ]}
            >
              {student.avatar ? (
                <Image
                  source={{ uri: student.avatar }}
                  style={{ width: 38, height: 38, borderRadius: 19 }}
                />
              ) : (
                <Feather name="user" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* ─── CUỘN NỘI DUNG BÊN DƯỚI HEADER CỐ ĐỊNH ─────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
      >
        <View style={{ paddingHorizontal: 16 }}>
          {isOfflineData && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FEF3C7",
                borderWidth: 1,
                borderColor: "#FDE68A",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <Feather name="wifi-off" size={15} color="#D97706" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", flex: 1 }}>
                Đang xem bản lưu ngoại tuyến {cachedAt ? `(lưu lúc ${cachedAt})` : ""} • Vuốt xuống để cập nhật lại
              </Text>
            </View>
          )}

          {/* Lớp học tiếp theo Preview Card */}
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryLight]}
            style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={[s.row, s.between, { marginBottom: 6 }]}>
              <View style={s.row}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: nextClass?.statusBadgeColor || AppColors.success,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.95)",
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 0.4,
                  }}
                >
                  {nextClass?.statusLabel || "LỚP HỌC KẾ TIẾP"}
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600" }}>
                {nextClass?.dayText ? `${nextClass.dayText} • ` : ""}{nextClass?.time || "Hôm nay"}
              </Text>
            </View>

            <Text
              style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginBottom: 6 }}
              numberOfLines={1}
            >
              {nextClass?.subject || "Kiểm tra lịch học trong tuần"}
            </Text>

            <View style={[s.row, s.between, { alignItems: "center" }]}>
              <View style={s.row}>
                <Feather
                  name="map-pin"
                  size={12}
                  color="rgba(255,255,255,0.75)"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {nextClass?.room || "Khu giảng đường"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/(main)/map",
                    params: { search: nextClass?.room || "" },
                  });
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  gap: 4,
                }}
              >
                <Feather name="navigation" size={12} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>
                  Chỉ đường →
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
          {/* TÁC VỤ NHANH */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "900",
              color: "#1E293B",
              marginBottom: 12,
              paddingHorizontal: 4,
            }}
          >
            Tác vụ nhanh
          </Text>

          <View style={[s.row, s.between, { marginBottom: 20 }]}>
            {quickActions.map((qa) => (
              <TouchableOpacity
                key={qa.label}
                onPress={() => onNavigate(qa.screen)}
                activeOpacity={0.7}
                style={{ alignItems: "center", width: "22%" }}
              >
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    backgroundColor: qa.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <Feather name={qa.icon} size={22} color={qa.fg} />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  {qa.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── 1. PHẦN THÔNG BÁO TỪ NHÀ TRƯỜNG (3 THÔNG BÁO GẦN NHẤT - RSS THONGBAOSV) ─── */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              padding: 18,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
              marginBottom: 20,
            }}
          >
            <View style={[s.row, s.between, { alignItems: "center", marginBottom: 14 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#ECFDF5",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="bell" size={17} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#153242" }}>
                    Thông báo Sinh viên
                  </Text>
                </View>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: "#ECFDF5",
                  flexShrink: 0,
                }}
              >
              </View>
            </View>

            {/* 3 thông báo gần nhất, chạm vào mở home_detail */}
            <View style={{ gap: 10 }}>
              {latestAnnouncements.slice(0, 3).map((ann, idx) => (
                <TouchableOpacity
                  key={ann.id || idx}
                  onPress={() => openDetail(ann)}
                  activeOpacity={0.7}
                  style={{
                    padding: 13,
                    borderRadius: 12,
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <View style={[s.row, s.between, { marginBottom: 4 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "#FEF3C7" : "#ECFDF5",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "#D97706" : "#059669",
                          }}
                        >
                          {ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "⚠️ Dữ liệu mẫu" : `📢 ${ann.badge || "Thông báo SV"}`}
                        </Text>
                      </View>
                      {ann.attachments && ann.attachments.length > 0 ? (
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: "#F1F5F9",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Feather name="paperclip" size={9} color="#475569" />
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#475569" }}>
                            {ann.attachments.length} file
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "600" }}>
                      {ann.date}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#1E293B",
                      lineHeight: 19,
                      marginBottom: 4,
                    }}
                    numberOfLines={2}
                  >
                    {ann.title}
                  </Text>

                  <View style={[s.row, s.between, { alignItems: "center", marginTop: 4 }]}>
                    <Text style={{ fontSize: 11, color: AppColors.textMuted }} numberOfLines={1}>
                      🏛️ {ann.author || ann.sender || "Phòng Công tác SV"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: AppColors.primary,
                        }}
                      >
                        Chi tiết
                      </Text>
                      <Feather name="arrow-right" size={11} color={AppColors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── 2. PHẦN TIN TỨC & SỰ KIỆN (3 TIN TỨC GẦN NHẤT - RSS TINTUC CÓ ẢNH) ─── */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              padding: 18,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
              marginBottom: 24,
            }}
          >
            <View style={[s.row, s.between, { alignItems: "center", marginBottom: 14 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#EFF6FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="file-text" size={17} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#153242" }}>
                    Tin tức
                  </Text>
                </View>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: "#EFF6FF",
                  flexShrink: 0,
                }}
              >
              </View>
            </View>

            {/* Danh sách 3 tin tức có ảnh thật từ RSS tintuc */}
            <View style={{ gap: 12 }}>
              {latestNews.slice(0, 3).map((item, idx) => (
                <TouchableOpacity
                  key={item.id || idx}
                  onPress={() => openDetail(item, idx)}
                  activeOpacity={0.7}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    backgroundColor: "#F8FAFC",
                    overflow: "hidden",
                  }}
                >
                  <NewsCardImage imageUrl={item.imageUrl} index={idx} />

                  <View style={{ padding: 12 }}>
                    <View style={[s.row, s.between, { alignItems: "center", marginBottom: 6 }]}>
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "#FEF3C7" : "#EFF6FF",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "#D97706" : "#2563EB",
                          }}
                        >
                          {item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "⚠️ Dữ liệu mẫu" : `📰 ${item.badge || "Tin hoạt động"}`}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "600" }}>
                        {item.date}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "800",
                        color: "#0F172A",
                        lineHeight: 19,
                        marginBottom: 4,
                      }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>

                    {item.summary ? (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#64748B",
                          lineHeight: 16,
                          marginBottom: 8,
                        }}
                        numberOfLines={2}
                      >
                        {item.summary}
                      </Text>
                    ) : null}

                    <View
                      style={[
                        s.row,
                        s.between,
                        {
                          alignItems: "center",
                          borderTopWidth: 1,
                          borderTopColor: "#E2E8F0",
                          paddingTop: 8,
                          marginTop: 4,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 10, color: AppColors.textMuted }} numberOfLines={1}>
                        🏛️ {item.author || item.sourceName || "Ban Biên tập TTN"}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: AppColors.primary,
                          }}
                        >
                          Chi tiết bài viết
                        </Text>
                        <Feather name="arrow-right" size={11} color={AppColors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
