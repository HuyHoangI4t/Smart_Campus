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
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
//import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import {
  apiGetSchedule,
  apiGetDashboard,
  apiGetNews,
  readLocalCache,
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
  const todayNum = jsDay === 0 ? 1 : jsDay + 1; // 1 (CN), 2 (T2), ..., 7 (T7)
  const tomorrowNum = (todayNum % 7) + 1; // Thứ ngày mai (1..7)

  const normalized = rawSchedules.map((item, idx) => {
    let dayNum = item.dayNum;
    if (!dayNum) {
      const lowerDay = (item.day || item.code || item.thu || "").toLowerCase();
      if (lowerDay.includes("thứ 3") || lowerDay.includes("thứ ba")) dayNum = 3;
      else if (lowerDay.includes("thứ 4") || lowerDay.includes("thứ tư")) dayNum = 4;
      else if (lowerDay.includes("thứ 5") || lowerDay.includes("thứ năm")) dayNum = 5;
      else if (lowerDay.includes("thứ 6") || lowerDay.includes("thứ sáu")) dayNum = 6;
      else if (lowerDay.includes("thứ 7") || lowerDay.includes("thứ bảy")) dayNum = 7;
      else if (lowerDay.includes("chủ nhật") || lowerDay.includes("cn")) dayNum = 1;
      else if (lowerDay.includes("thứ 2") || lowerDay.includes("thứ hai")) dayNum = 2;
      else dayNum = 2;
    }

    const timeStr = item.time || (item.tiet ? `Tiết ${item.tiet}` : "");
    const range = parseClassTimeRange(timeStr);

    const rawTiet = item.tiet || item.period || "";
    let periodText = "";
    if (rawTiet) {
      periodText = String(rawTiet).startsWith("Tiết") ? String(rawTiet) : `Tiết ${rawTiet}`;
    } else if (timeStr) {
      const match = timeStr.match(/tiết\s*([\d\s*–—-]+)/i);
      if (match) {
        periodText = `Tiết ${match[1].replace(/\s+/g, "")}`;
      } else {
        const rangeMatch = timeStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
        if (rangeMatch) {
          periodText = `Tiết ${rangeMatch[1]}-${rangeMatch[2]}`;
        } else {
          periodText = timeStr.startsWith("Tiết") ? timeStr : `Tiết ${timeStr}`;
        }
      }
    } else {
      periodText = "Tiết 1-4";
    }

    return {
      id: item.id || idx,
      subject: item.course || item.subject || item.ten_hp || "Môn học",
      room: item.room || item.phong || "Khu giảng đường",
      time: periodText,
      period: periodText,
      dayNum,
      day: item.day || item.code || item.thu || `Thứ ${dayNum}`,
      startMinutes: range.startMinutes,
      endMinutes: range.endMinutes,
      lecturer: item.lecturer || item.giang_vien || "",
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

  // 2. NẾU ĐÃ HẾT GIỜ HỌC HÔM NAY HOẶC HÔM NAY KHÔNG CÓ LỊCH:
  // ƯU TIÊN HIỂN THỊ NGÀY MAI
  const tomorrowClasses = normalized
    .filter((c) => c.dayNum === tomorrowNum)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (tomorrowClasses.length > 0) {
    const firstTomorrowClass = tomorrowClasses[0];
    const tomorrowDayName = getDayNameFromNum(tomorrowNum);
    return {
      subject: firstTomorrowClass.subject,
      room: firstTomorrowClass.room,
      time: firstTomorrowClass.time,
      lecturer: firstTomorrowClass.lecturer,
      dayText: "Ngày mai",
      status: "NEXT_DAY",
      statusLabel: `NGÀY MAI (${tomorrowDayName.toUpperCase()})`,
      statusBadgeColor: "#A855F7", // Tím
    };
  }

  // 3. Nếu ngày mai không có tiết, tìm ngày tiếp theo gần nhất
  for (let offset = 2; offset <= 7; offset++) {
    const nextDayNum = ((todayNum - 1 + offset) % 7) + 1;
    const nextDayClasses = normalized
      .filter((c) => c.dayNum === nextDayNum)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    if (nextDayClasses.length > 0) {
      const firstClassNextDay = nextDayClasses[0];
      const dayName = getDayNameFromNum(nextDayNum);

      return {
        subject: firstClassNextDay.subject,
        room: firstClassNextDay.room,
        time: firstClassNextDay.time,
        lecturer: firstClassNextDay.lecturer,
        dayText: dayName,
        status: "NEXT_DAY",
        statusLabel: `LỊCH HỌC ${dayName.toUpperCase()}`,
        statusBadgeColor: "#8B5CF6", // Tím
      };
    }
  }

  return null;
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

export interface NotificationAlertItem {
  id: string;
  type: "feedback" | "sos" | "school_notice";
  variant: "success" | "warning" | "info";
  icon: "check" | "alert-triangle" | "info";
  title: string;
  subtitle?: string;
  date: string;
  status: string;
  content: string;
  sender?: string;
  actionScreen?: string;
}


const DEFAULT_NOTIFICATION_ALERTS: NotificationAlertItem[] = [
  {
    id: "alert-1",
    type: "feedback",
    variant: "success",
    icon: "check",
    title: "Phản hồi CSVC đã được giải quyết",
    subtitle: "1 giờ trước • Cơ sở chính",
    date: "1 giờ trước • Cơ sở chính",
    status: "Đã giải quyết",
    content: "Phản hồi về thiết bị phòng học đã được bộ phận kỹ thuật xử lý hoàn tất.",
    actionScreen: "feedback",
  },
  {
    id: "alert-2",
    type: "sos",
    variant: "warning",
    icon: "alert-triangle",
    title: "Thay đổi phòng học môn Lập trình di động",
    subtitle: "Hôm nay • Phòng B204 -> C102",
    date: "Hôm nay • Phòng B204 -> C102",
    status: "Cảnh báo",
    content: "Học phần Lập trình thiết bị di động tiết 1-4 chuyển sang phòng C102.",
    actionScreen: "schedule",
  },
  {
    id: "alert-3",
    type: "school_notice",
    variant: "info",
    icon: "info",
    title: "Bảo trì hệ thống thư viện",
    subtitle: "Hôm qua • P. Quản trị TB",
    date: "Hôm qua • P. Quản trị TB",
    status: "Thông báo",
    content: "Hệ thống tra cứu số và phòng tự học thư viện tạm ngừng để nâng cấp máy chủ từ 22h00.",
  },
];

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

  // 3 mục Thông báo & Cảnh báo (Phản hồi CSVC, SOS/Đổi phòng, Thông báo trường)
  const [notificationAlerts, setNotificationAlerts] = useState<NotificationAlertItem[]>(DEFAULT_NOTIFICATION_ALERTS);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<NotificationAlertItem | null>(null);

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

      if (normTitle && seenTitles.has(normTitle)) continue;
      if (normUrl && seenUrls.has(normUrl)) continue;

      if (normTitle) seenTitles.add(normTitle);
      if (normUrl) seenUrls.add(normUrl);
      uniqueItems.push(item);
    }
    return sortByNewestDate(uniqueItems);
  };

  const applyData = (dashRes: any, scheduleRes: any, newsRes: any, isRealAccount = true) => {
    // 1. Dashboard & Thông báo/Cảnh báo
    if (dashRes && dashRes.success) {
      if (dashRes.student && isRealAccount) {
        setStudent((prev) => ({ ...prev, ...dashRes.student }));
      }
      if (Array.isArray(dashRes.notificationAlerts) && dashRes.notificationAlerts.length > 0) {
        setNotificationAlerts(dashRes.notificationAlerts);
      }
    }

    // 2. Lịch học
    if (scheduleRes && scheduleRes.success) {
      let rawScheduleList: any[] = [];
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

      if (rawScheduleList.length > 0) {
        const computed = computeNextClass(rawScheduleList);
        if (computed) {
          setNextClass(computed);
        }
      } else if (scheduleRes.nextClass) {
        const rawT = scheduleRes.nextClass.time || "";
        const periodStr = rawT.startsWith("Tiết") ? rawT : (rawT ? `Tiết ${rawT}` : "Tiết 1-4");
        setNextClass({
          subject: scheduleRes.nextClass.subject || "Môn học",
          room: scheduleRes.nextClass.room || "Khu giảng đường",
          time: periodStr,
          lecturer: scheduleRes.nextClass.lecturer,
          dayText: scheduleRes.nextClass.dayText || "Ngày mai",
          status: scheduleRes.nextClass.status || "NEXT_DAY",
          statusLabel: scheduleRes.nextClass.statusLabel || "NGÀY MAI",
          statusBadgeColor:
            scheduleRes.nextClass.status === "IN_PROGRESS"
              ? "#10B981"
              : scheduleRes.nextClass.status === "UPCOMING_TODAY"
              ? "#3B82F6"
              : "#A855F7",
        });
      }
    }

    // 3. Thông báo & Tin tức (Sắp xếp ngày mới nhất lên đầu tiên)
    if (newsRes && newsRes.success) {
      let rawAnnouncements: NewsOrAnnouncementItem[] = [];
      if (Array.isArray(newsRes.announcements) && newsRes.announcements.length > 0) {
        rawAnnouncements = newsRes.announcements;
      } else if (Array.isArray(newsRes.data)) {
        rawAnnouncements = newsRes.data.filter((i: any) => i.type === "announcement");
      } else if (Array.isArray(newsRes.latestAnnouncements) && newsRes.latestAnnouncements.length > 0) {
        rawAnnouncements = newsRes.latestAnnouncements;
      }
      setLatestAnnouncements(sortByNewestDate(deduplicateArticles(rawAnnouncements)).slice(0, 3));

      let rawNews: NewsOrAnnouncementItem[] = [];
      if (Array.isArray(newsRes.news) && newsRes.news.length > 0) {
        rawNews = newsRes.news;
      } else if (Array.isArray(newsRes.data)) {
        rawNews = newsRes.data.filter((i: any) => i.type === "news");
      } else if (Array.isArray(newsRes.latestNews) && newsRes.latestNews.length > 0) {
        rawNews = newsRes.latestNews;
      }
      setLatestNews(sortByNewestDate(deduplicateArticles(rawNews)).slice(0, 3));
    }

    const offline = Boolean(scheduleRes?.isOfflineCache || newsRes?.isOfflineCache || dashRes?.isOfflineCache);
    setIsOfflineData(offline);
    if (offline) {
      setCachedAt(scheduleRes?.cachedAt || newsRes?.cachedAt || dashRes?.cachedAt || null);
    }
  };

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
      const scheduleCacheKey = `@offline_schedule_${mssv || 'current'}`;

      // BƯỚC 1: Đọc tức thì từ Cache đã nạp trong lúc nhấn Đăng nhập (0ms render ngay)
      const [cachedDash, cachedSchedule, cachedNews] = await Promise.all([
        readLocalCache('@offline_dashboard'),
        readLocalCache(scheduleCacheKey),
        readLocalCache('@offline_news_all'),
      ]);
      if (cachedDash?.data || cachedSchedule?.data || cachedNews?.data) {
        applyData(cachedDash?.data, cachedSchedule?.data, cachedNews?.data, isRealAccount);
      }

      // BƯỚC 2: Đồng bộ song song cả 3 API từ server để cập nhật dữ liệu mới nhất
      const [dashRes, scheduleRes, newsRes] = await Promise.all([
        apiGetDashboard(),
        apiGetSchedule(isRealAccount ? mssv : undefined),
        apiGetNews(),
      ]);
      applyData(dashRes, scheduleRes, newsRes, isRealAccount);
    } catch {
      setIsOfflineData(true);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleOpenMapDirections = () => {
    const room = nextClass?.room || "";
    const subject = nextClass?.subject || "";
    router.push({
      pathname: "/(main)/map",
      params: {
        room,
        subject,
        search: room,
      },
    });
  };

  // Mở màn hình chi tiết bài viết / thông báo
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

  const quickActions = [
    { icon: "navigation" as const, label: "Bản đồ", screen: "map", bg: "#EEF2FF", border: "#E0E7FF", fg: "#6366F1" },
    { icon: "calendar" as const, label: "Lịch học", screen: "schedule", bg: "#E0F2FE", border: "#BAE6FD", fg: "#0284C7" },
    { icon: "message-square" as const, label: "Phản hồi", screen: "feedback", bg: "#FEF3C7", border: "#FDE68A", fg: "#D97706" },
    { icon: "bar-chart-2" as const, label: "Kết quả", screen: "grades", bg: "#DCFCE7", border: "#BBF7D0", fg: "#16A34A" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2964" translucent={Platform.OS === "android"} />

      {/* ─── HEADER NAVY BLUE CHỨA THÔNG TIN SINH VIÊN VÀ LỚP HỌC KẾ TIẾP ─── */}
      <View
        style={{
          backgroundColor: "#0F2964",
          paddingTop: topPadding,
          paddingBottom: 18,
          paddingHorizontal: 20,
          zIndex: 10,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* Top user row */}
        <View style={[s.row, s.between, { alignItems: "center", marginBottom: 14 }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.6,
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

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => onNavigate("sos")}
              activeOpacity={0.8}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#EF4444",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#EF4444",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Feather name="shield" size={17} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigate("profile")}
              activeOpacity={0.8}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.16)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
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

        {/* LỚP HỌC KẾ TIẾP / NGÀY MAI CARD LỒNG BÊN TRONG HEADER */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenMapDirections}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.14)",
            borderRadius: 16,
            padding: 14,
          }}
        >
          {/* Row 1: dot + statusLabel + Phòng & giờ */}
          <View style={[s.row, s.between, { alignItems: "center", marginBottom: 6 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: nextClass?.statusBadgeColor || "#A855F7",
                }}
              />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 0.5,
                }}
              >
                {nextClass?.statusLabel || "NGÀY MAI"}
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600" }}>
              {nextClass
                ? `${nextClass.room ? `${nextClass.room} ` : ""}`
                : "Bản đồ trường"}
            </Text>
          </View>

          {/* Row 2: Tên môn học + Badge tiết */}
          <View style={[s.row, s.between, { alignItems: "center", marginBottom: 8 }]}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15.5,
                fontWeight: "900",
                flex: 1,
                marginRight: 10,
              }}
              numberOfLines={1}
            >
              {nextClass?.subject || "Không có ca học nào trong ngày mai"}
            </Text>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>
                {nextClass ? (nextClass.time.startsWith("Tiết") ? nextClass.time : `Tiết ${nextClass.time}`) : "Nghỉ"}
              </Text>
            </View>
          </View>

          {/* Row 3: Giảng viên + Chỉ đường → */}
          <View style={[s.row, s.between, { alignItems: "center" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 }}>
              <Feather name="user" size={12} color="rgba(255,255,255,0.7)" />
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {nextClass?.lecturer ? nextClass.lecturer : (nextClass ? "Giảng viên bộ môn" : "Mở bản đồ trường")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenMapDirections}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.18)",
                paddingHorizontal: 9,
                paddingVertical: 3.5,
                borderRadius: 12,
              }}
            >
              <Feather name="navigation" size={11} color="#93C5FD" />
              <Text style={{ color: "#93C5FD", fontSize: 12, fontWeight: "800" }}>
                Chỉ đường →
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── CUỘN NỘI DUNG BÊN DƯỚI HEADER ─────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0F2964"
            colors={["#0F2964"]}
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
                Đang xem bản lưu ngoại tuyến {cachedAt ? `(lưu lúc ${cachedAt})` : ""}
              </Text>
            </View>
          )}

          {/* TÁC VỤ NHANH */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: "#0F172A",
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
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    backgroundColor: qa.bg,
                    borderWidth: 1,
                    borderColor: qa.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
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

          {/* ─── THÔNG BÁO & CẢNH BÁO (FEEDBACK, SOS, THÔNG BÁO PHÁT TỪ TRƯỜNG) ─── */}
          {notificationAlerts && notificationAlerts.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              <View style={[s.row, s.between, { alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }]}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>
                  Thông báo & Cảnh báo
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#2563EB" }}>
                  {notificationAlerts.length} tin mới
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {notificationAlerts.map((item) => {
                  let bg = "#F0FDF4";
                  let border = "#BBF7D0";
                  let iconColor = "#10B981";
                  let iconName: keyof typeof Feather.glyphMap = "check";

                  if (item.variant === "warning") {
                    bg = "#FFFBEB";
                    border = "#FDE68A";
                    iconColor = "#D97706";
                    iconName = "alert-triangle";
                  } else if (item.variant === "info") {
                    bg = "#EFF6FF";
                    border = "#BFDBFE";
                    iconColor = "#2563EB";
                    iconName = "info";
                  }

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedAlertForModal(item)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: bg,
                        borderWidth: 1,
                        borderColor: border,
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        gap: 12,
                      }}
                    >
                      <Feather name={iconName} size={18} color={iconColor} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13.5,
                            fontWeight: "700",
                            color: "#0F172A",
                            marginBottom: 3,
                          }}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "500" }}>
                          {item.date || item.subtitle || "Hôm nay"}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ─── THÔNG BÁO SINH VIÊN (RSS THONGBAOSV) ─── */}
          <View style={{ marginBottom: 20 }}>
            <View style={[s.row, s.between, { alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }]}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>
                Thông báo Sinh viên
              </Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(main)/home/all_articles", params: { tab: "announcement" } })}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#2563EB" }}>
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              {latestAnnouncements.slice(0, 3).map((ann, idx) => (
                <TouchableOpacity
                  key={ann.id || idx}
                  onPress={() => openDetail(ann, idx)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    padding: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <View style={[s.row, s.between, { alignItems: "center", marginBottom: 6 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "#FEF3C7" : "#ECFDF5",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Feather
                          name={ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "alert-triangle" : "bell"}
                          size={10}
                          color={ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "#D97706" : "#059669"}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "#D97706" : "#059669",
                          }}
                        >
                          {ann.isFallback || ann.badge?.toLowerCase().includes("mẫu") ? "Dữ liệu mẫu" : (ann.badge || "Thông báo SV")}
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
                    <Text style={{ fontSize: 10, color: "#64748B", fontWeight: "600" }}>
                      {ann.date}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: "800",
                      color: "#0F172A",
                      lineHeight: 19,
                      marginBottom: 8,
                    }}
                    numberOfLines={2}
                  >
                    {ann.title}
                  </Text>

                  <View style={[s.row, s.between, { alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 8 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, marginRight: 8 }}>
                      <Feather name="home" size={11} color="#64748B" />
                      <Text style={{ fontSize: 11, color: "#64748B" }} numberOfLines={1}>
                        {ann.author || ann.sender || "Phòng Công tác SV"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#2563EB" }}>
                        Chi tiết
                      </Text>
                      <Feather name="arrow-right" size={11} color="#2563EB" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── TIN TỨC & HOẠT ĐỘNG (RSS TINTUC CÓ ẢNH) ─── */}
          <View style={{ marginBottom: 20 }}>
            <View style={[s.row, s.between, { alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }]}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>
                Tin tức & Hoạt động
              </Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(main)/home/all_articles", params: { tab: "news" } })}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#2563EB" }}>
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              {latestNews.slice(0, 3).map((item, idx) => (
                <TouchableOpacity
                  key={item.id || idx}
                  onPress={() => openDetail(item, idx)}
                  activeOpacity={0.7}
                  style={{
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
                  }}
                >
                  <NewsCardImage imageUrl={item.imageUrl} index={idx} />

                  <View style={{ padding: 14 }}>
                    <View style={[s.row, s.between, { alignItems: "center", marginBottom: 6 }]}>
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "#FEF3C7" : "#EFF6FF",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Feather
                          name={item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "alert-triangle" : "book-open"}
                          size={10}
                          color={item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "#D97706" : "#2563EB"}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "#D97706" : "#2563EB",
                          }}
                        >
                          {item.isFallback || item.badge?.toLowerCase().includes("mẫu") ? "Dữ liệu mẫu" : (item.badge || "Tin hoạt động")}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: "#64748B", fontWeight: "600" }}>
                        {item.date}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 13.5,
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
                          borderTopColor: "#F1F5F9",
                          paddingTop: 8,
                          marginTop: 4,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, marginRight: 8 }}>
                        <Feather name="globe" size={11} color="#64748B" />
                        <Text style={{ fontSize: 11, color: "#64748B" }} numberOfLines={1}>
                          {item.author || item.sourceName || "Ban Biên tập TTN"}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#2563EB" }}>
                          Chi tiết bài viết
                        </Text>
                        <Feather name="arrow-right" size={11} color="#2563EB" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── MODAL CHI TIẾT THÔNG BÁO / PHẢN HỒI / CẢNH BÁO ─── */}
      <Modal
        visible={!!selectedAlertForModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAlertForModal(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 22,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Header Modal */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor:
                    selectedAlertForModal?.variant === "success"
                      ? "#ECFDF5"
                      : selectedAlertForModal?.variant === "warning"
                        ? "#FFFBEB"
                        : "#EFF6FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name={
                    selectedAlertForModal?.variant === "success"
                      ? "check-circle"
                      : selectedAlertForModal?.variant === "warning"
                        ? "alert-triangle"
                        : "info"
                  }
                  size={20}
                  color={
                    selectedAlertForModal?.variant === "success"
                      ? "#10B981"
                      : selectedAlertForModal?.variant === "warning"
                        ? "#D97706"
                        : "#2563EB"
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#1E293B" }}>
                  {selectedAlertForModal?.type === "feedback"
                    ? "Trạng thái phản hồi"
                    : selectedAlertForModal?.type === "sos"
                      ? "Cảnh báo khẩn cấp"
                      : "Thông báo từ trường"}
                </Text>
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  {selectedAlertForModal?.date || "30/9/2026"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedAlertForModal(null)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="x" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Trạng thái Badge */}
            <View
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor:
                  selectedAlertForModal?.variant === "success"
                    ? "#DCFCE7"
                    : selectedAlertForModal?.variant === "warning"
                      ? "#FEF3C7"
                      : "#DBEAFE",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color:
                    selectedAlertForModal?.variant === "success"
                      ? "#166534"
                      : selectedAlertForModal?.variant === "warning"
                        ? "#92400E"
                        : "#1E40AF",
                }}
              >
                {selectedAlertForModal?.status || "Đã tiếp nhận"}
              </Text>
            </View>

            {/* Tiêu đề & Nội dung */}
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: "#1E293B",
                lineHeight: 21,
                marginBottom: 8,
              }}
            >
              {selectedAlertForModal?.title}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 20,
                marginBottom: 20,
              }}
            >
              {selectedAlertForModal?.content}
            </Text>

            {/* Nút tác vụ */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              {selectedAlertForModal?.actionScreen ? (
                <TouchableOpacity
                  onPress={() => {
                    const screen = selectedAlertForModal.actionScreen;
                    setSelectedAlertForModal(null);
                    if (screen) onNavigate(screen);
                  }}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: AppColors.primary,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
                    {selectedAlertForModal.type === "feedback"
                      ? "Xem / Gửi phản hồi"
                      : selectedAlertForModal.type === "sos"
                        ? "Đến trang SOS"
                        : "Xem chi tiết"}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => setSelectedAlertForModal(null)}
                activeOpacity={0.8}
                style={{
                  flex: selectedAlertForModal?.actionScreen ? 0.6 : 1,
                  backgroundColor: "#F1F5F9",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>
                  Đóng
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
