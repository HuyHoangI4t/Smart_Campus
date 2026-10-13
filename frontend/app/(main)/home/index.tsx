import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTabBarScrollHandler } from "../../../src/components/MainTabs";
import { AppColors } from "../../../src/constants/appColors";
import { HomeSkeleton } from "../../../src/components/Skeleton";
import { getHeaderTopPadding } from "../../../src/utils/safeArea";
import {
  apiGetSchedule,
  apiGetDashboard,
  apiGetNews,
  apiGetGrades,
  readLocalCache,
  NewsOrAnnouncementItem,
  getNewsImageUrl,
} from "../../../src/services/api";

import {
  StudentInfo,
  NextClassInfo,
  GpaSummary,
  NotificationAlertItem,
  parseGpaSummary,
  computeNextClass,
  HomeHeader,
  HomeNextClassCard,
  HomeGpaCard,
  HomeQuickActions,
  HomeAlertsSection,
  HomeAnnouncementsSection,
  HomeNewsSection,
  HomeNoticeModal,
} from "../../../src/features/home";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScroll: onTabBarScroll, bottomPadding } = useTabBarScrollHandler();
  const topPadding = getHeaderTopPadding(insets.top, 14);

  const [student, setStudent] = useState<StudentInfo>({
    ho_ten: "Đang tải...",
    mssv: "",
  });
  const [nextClass, setNextClass] = useState<NextClassInfo | null>(null);
  const [gpaSummary, setGpaSummary] = useState<GpaSummary>({
    gpa4: "3.46",
    gpa10: "8.18",
    totalCredits: 13,
    rank: "Giỏi",
    rankColor: "#3B82F6",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 3 Thông báo (từ RSS thongbaosv) & 3 Tin tức (từ RSS tintuc)
  const [latestAnnouncements, setLatestAnnouncements] = useState<NewsOrAnnouncementItem[]>([]);
  const [latestNews, setLatestNews] = useState<NewsOrAnnouncementItem[]>([]);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // Thông báo & Cảnh báo từ nhà trường
  const [notificationAlerts, setNotificationAlerts] = useState<NotificationAlertItem[]>([]);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<NotificationAlertItem | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const dismissedAlertIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem("@dismissed_home_alerts").then((stored) => {
      if (stored) {
        try {
          const list: string[] = JSON.parse(stored);
          dismissedAlertIdsRef.current = new Set(list.map(String));
        } catch {}
      }
    });
  }, []);

  const handleDismissAlert = useCallback(async (alertId: string | number) => {
    const idStr = String(alertId);
    dismissedAlertIdsRef.current.add(idStr);
    setNotificationAlerts((prev) => prev.filter((item) => String(item.id) !== idStr));
    try {
      const stored = await AsyncStorage.getItem("@dismissed_home_alerts");
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(idStr)) {
        list.push(idStr);
        await AsyncStorage.setItem("@dismissed_home_alerts", JSON.stringify(list));
      }
    } catch (e) {
      console.warn("Lỗi lưu trạng thái xoá thông báo:", e);
    }
  }, []);

  const handleDismissAllAlerts = useCallback(async () => {
    const allIds = notificationAlerts.map((item) => String(item.id));
    allIds.forEach((id) => dismissedAlertIdsRef.current.add(id));
    setNotificationAlerts([]);
    try {
      const stored = await AsyncStorage.getItem("@dismissed_home_alerts");
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = Array.from(new Set([...list, ...allIds]));
      await AsyncStorage.setItem("@dismissed_home_alerts", JSON.stringify(updated));
    } catch (e) {
      console.warn("Lỗi lưu trạng thái xoá tất cả thông báo:", e);
    }
  }, [notificationAlerts]);

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
      let rawAlerts: NotificationAlertItem[] = [];
      if (Array.isArray(dashRes.notificationAlerts)) {
        rawAlerts = dashRes.notificationAlerts;
      } else if (Array.isArray(dashRes.alerts)) {
        rawAlerts = dashRes.alerts;
      }
      const filtered = rawAlerts.filter(
        (item) => !dismissedAlertIdsRef.current.has(String(item.id))
      );
      setNotificationAlerts(filtered);
    } else {
      setNotificationAlerts([]);
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

    // 3. Thông báo & Tin tức
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
      const isRealAccount = Boolean(mssv && mssv !== "guest");
      setIsLoggedIn(isRealAccount);
      const scheduleCacheKey = `@offline_schedule_${mssv || 'current'}`;
      const gradesCacheKey = `@offline_grades_${isRealAccount ? mssv : 'current'}`;

      // BƯỚC 1: Đọc tức thì từ Cache
      const [cachedDash, cachedSchedule, cachedNews, cachedGrades] = await Promise.all([
        readLocalCache('@offline_dashboard'),
        readLocalCache(scheduleCacheKey),
        readLocalCache('@offline_news_all'),
        readLocalCache<any>(gradesCacheKey),
      ]);
      if (cachedGrades?.data) {
        const rawGrades = Array.isArray(cachedGrades.data.data)
          ? cachedGrades.data.data
          : Array.isArray(cachedGrades.data)
          ? cachedGrades.data
          : [];
        const parsedSummary = parseGpaSummary(rawGrades);
        if (parsedSummary) {
          setGpaSummary(parsedSummary);
        }
      }
      if (cachedDash?.data || cachedSchedule?.data || cachedNews?.data) {
        applyData(cachedDash?.data, cachedSchedule?.data, cachedNews?.data, isRealAccount);
        setIsInitialLoading(false);
      }

      // BƯỚC 2: Đồng bộ song song cả 4 API từ server
      const [dashRes, scheduleRes, newsRes, gradesRes] = await Promise.all([
        apiGetDashboard(),
        apiGetSchedule(isRealAccount ? mssv : undefined),
        apiGetNews(),
        apiGetGrades(isRealAccount ? mssv : undefined),
      ]);
      applyData(dashRes, scheduleRes, newsRes, isRealAccount);
      if (gradesRes?.success && Array.isArray(gradesRes.data) && gradesRes.data.length > 0) {
        const parsedSummary = parseGpaSummary(gradesRes.data);
        if (parsedSummary) {
          setGpaSummary(parsedSummary);
        }
      }
    } catch {
      setIsOfflineData(true);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

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
    const rawRoom = nextClass?.room || "";
    router.push({
      pathname: "/(main)/map",
      params: {
        room: rawRoom,
        subject: nextClass?.subject || "",
      },
    });
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} translucent={Platform.OS === "android"} />

      {/* ─── 1. HEADER NAVY BLUE ─── */}
      <HomeHeader
        student={student}
        topPadding={topPadding}
        onNavigate={onNavigate}
      />

      {/* ─── 2. CUỘN NỘI DUNG BÊN DƯỚI HEADER ─── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
      >
        {(isInitialLoading && latestNews.length === 0) || refreshing ? (
          <HomeSkeleton />
        ) : (
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
                  marginBottom: 16,
                }}
              >
                <Feather name="wifi-off" size={15} color="#D97706" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", flex: 1 }}>
                  Đang xem dữ liệu ngoại tuyến {cachedAt ? `(lưu lúc ${cachedAt})` : ""} • Vuốt xuống để làm mới
                </Text>
              </View>
            )}

            {/* 3. LỚP HỌC TIẾP THEO HOẶC ĐANG DIỄN RA */}
            <HomeNextClassCard
              nextClass={nextClass}
              onPress={handleOpenMapDirections}
            />

            {/* 4. TỔNG KẾT GPA HỆ 4 & HỆ 10 */}
            <HomeGpaCard
              gpaSummary={gpaSummary}
              onPress={() => router.push("/(main)/grades")}
            />

            {/* 5. TÁC VỤ NHANH */}
            <HomeQuickActions
              onNavigate={onNavigate}
            />

            {/* 6. THÔNG BÁO & CẢNH BÁO */}
            <HomeAlertsSection
              isLoggedIn={isLoggedIn}
              notificationAlerts={notificationAlerts}
              onSelectAlert={setSelectedAlertForModal}
              onDismissAlert={handleDismissAlert}
              onDismissAll={handleDismissAllAlerts}
            />

            {/* 7. THÔNG BÁO SINH VIÊN (RSS THONGBAOSV) */}
            <HomeAnnouncementsSection
              isLoggedIn={isLoggedIn}
              announcements={latestAnnouncements}
              onViewAll={() => router.push({ pathname: "/(main)/home/all_articles", params: { tab: "announcement" } })}
              onOpenDetail={openDetail}
            />

            {/* 8. TIN TỨC & HOẠT ĐỘNG (RSS TINTUC CÓ ẢNH) */}
            <HomeNewsSection
              isLoggedIn={isLoggedIn}
              news={latestNews}
              onViewAll={() => router.push({ pathname: "/(main)/home/all_articles", params: { tab: "news" } })}
              onOpenDetail={openDetail}
            />
          </View>
        )}
      </ScrollView>

      {/* ─── 9. MODAL CHI TIẾT THÔNG BÁO / PHẢN HỒI / CẢNH BÁO ─── */}
      <HomeNoticeModal
        alert={selectedAlertForModal}
        onClose={() => setSelectedAlertForModal(null)}
        onNavigate={onNavigate}
        onDismiss={handleDismissAlert}
      />
    </View>
  );
}
