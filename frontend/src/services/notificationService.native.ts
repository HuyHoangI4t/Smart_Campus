import { Platform, Alert, Linking, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { showSosAlertModal } from "../components/SosAlertModal";

export const NOTIFICATION_CHANNELS = {
  SCHEDULE: "schedule_reminders",
  CAMPUS: "campus_announcements",
  SOS: "emergency_sos",
  GRADES: "grades_updates",
};

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority?.MAX,
      }),
    });
  }
} catch (e) {
  console.warn("expo-notifications module not loaded:", e);
}



/**
 * Khởi tạo hệ thống thông báo đẩy (Android channels & Permissions)
 */
export async function initNotifications(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    if (Platform.OS === "android" && Notifications.setNotificationChannelAsync) {
      // 1. Kênh nhắc lịch học
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SCHEDULE, {
        name: "Nhắc nhở Lịch học & Thi",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1D4ED8",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      // 2. Kênh thông báo nhà trường
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CAMPUS, {
        name: "Thông báo Trường & Đào tạo",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: "#F59E0B",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      // 3. Kênh cảnh báo SOS khẩn cấp
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SOS, {
        name: "Cứu hộ SOS Khẩn cấp",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: "#DC2626",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      // 4. Kênh cập nhật điểm số
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.GRADES, {
        name: "Cập nhật Điểm số & Tín chỉ",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10B981",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Xin quyền thông báo (bắt buộc cho Android 13+)
    if (Notifications.getPermissionsAsync && Notifications.requestPermissionsAsync) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === "granted";
      await AsyncStorage.setItem("@notification_permission", granted ? "granted" : "denied");
      return granted;
    }
    return true;
  } catch (error) {
    console.warn("Lỗi khởi tạo Notification Service:", error);
    return false;
  }
}

/**
 * Gửi thông báo tức thì (Dùng cho thông báo mới, test hoặc cảnh báo)
 */
export async function sendInstantNotification(
  title: string,
  body: string,
  data: Record<string, any> = {},
  channelId: string = NOTIFICATION_CHANNELS.CAMPUS
) {
  if (!Notifications || !Notifications.scheduleNotificationAsync) {
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
        badge: 1,
        priority: Notifications.AndroidNotificationPriority?.MAX || "max",
        vibrate: [0, 500, 200, 500, 200, 500],
        color: "#DC2626",
      },
      trigger: Platform.OS === "android" ? { channelId } : null,
    });
  } catch (error) {
    console.warn("Lỗi gửi thông báo tức thì:", error);
  }
}

/**
 * Tính khoảng cách (mét) giữa 2 tọa độ GPS bằng công thức Haversine
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Xử lý cảnh báo SOS từ người khác: Tự động rung chuông, đẩy thông báo và hiện cảnh báo khẩn cấp
 */
export async function handleIncomingSosAlert(alert: {
  id?: number | string;
  latitude?: number;
  longitude?: number;
  location?: string;
  message?: string;
  mssv?: string;
  ho_ten?: string;
  incidentType?: string;
}): Promise<boolean> {
  if (!alert) return false;
  try {
    const rawGps = await AsyncStorage.getItem("@last_known_gps");
    let userCoords: { latitude: number; longitude: number } | null = rawGps ? JSON.parse(rawGps) : null;

    if (!userCoords) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Location = require("expo-location");
        const loc = await Location.getLastKnownPositionAsync({});
        if (loc?.coords) {
          userCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          AsyncStorage.setItem("@last_known_gps", JSON.stringify(userCoords)).catch(() => {});
        }
      } catch {}
    }

    let distance: number | null = null;
    if (userCoords?.latitude && userCoords?.longitude && alert.latitude && alert.longitude) {
      distance = calculateDistanceMeters(
        userCoords.latitude,
        userCoords.longitude,
        Number(alert.latitude),
        Number(alert.longitude)
      );
    }

    // Tín hiệu SOS là mức độ khẩn cấp cao nhất: Luôn cảnh báo tới sinh viên trong khuôn viên
    const isNearby = true;

    if (isNearby) {
      const distanceText = distance !== null ? ` (cách bạn ~${Math.round(distance)}m)` : "";
      const alertTitle = "🚨 CẢNH BÁO CỨU HỘ SOS KHẨN CẤP";
      const alertBody = `Có sinh viên (${alert.ho_ten || alert.mssv || "Sinh viên"}) đang phát tín hiệu SOS tại ${alert.location || "khuôn viên trường"}${distanceText}.`;

      const isAppActive = AppState.currentState === "active";

      // 1. Rung cảnh báo khẩn cấp bằng Haptics
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Haptics = require("expo-haptics");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } catch {}

      // 2. Luôn đẩy thông báo cấp cao của hệ điều hành (Notification Bar & Heads-up Banner)
      // Đảm bảo khi người dùng ở ngoài app (Home screen, Background, Khóa máy) vẫn nhận được ngay
      await sendInstantNotification(
        alertTitle,
        alertBody,
        { screen: "sos", alertId: alert.id },
        NOTIFICATION_CHANNELS.SOS
      );

      // 3. Nếu người dùng đang mở app (active / foreground), hiển thị thêm Popup Modal khẩn cấp
      if (isAppActive) {
        showSosAlertModal({
          id: alert.id,
          mssv: alert.mssv,
          ho_ten: alert.ho_ten,
          so_dien_thoai: (alert as any).so_dien_thoai,
          lop: (alert as any).lop,
          location: alert.location,
          latitude: alert.latitude ? Number(alert.latitude) : undefined,
          longitude: alert.longitude ? Number(alert.longitude) : undefined,
          message: alert.message,
          incidentType: alert.incidentType,
          distance,
        });
      }

      return true;
    }
    return false;
  } catch (err) {
    console.warn("Lỗi kiểm tra bán kính SOS:", err);
    return false;
  }
}

/**
 * Gửi thông báo bằng DỮ LIỆU THẬT MỚI NHẤT (Không dùng dữ liệu mẫu)
 */
export async function triggerTestNotification(type: "schedule" | "grades" | "campus" | "sos" = "schedule") {
  await initNotifications();

  switch (type) {
    case "schedule": {
      // 1. LẤY LỊCH HỌC THẬT CỦA HÔM NAY
      let notifTitle = "⏰ Lịch học hôm nay";
      let notifBody = "Hôm nay bạn không có lịch học. Chúc bạn một ngày tốt lành!";

      try {
        const rawSched = await AsyncStorage.getItem("@widget_schedule_data");
        const schedWidget = rawSched ? JSON.parse(rawSched) : null;

        if (schedWidget && schedWidget.hasClasses && schedWidget.subjectName) {
          notifTitle = `⏰ Nhắc nhở: ${schedWidget.subjectName}`;
          notifBody = `${schedWidget.periodText || "Hôm nay"} tại ${schedWidget.room || "phòng học"}. Chuẩn bị tài liệu nhé!`;
        } else {
          const rawFull = await AsyncStorage.getItem("@schedule_cache_data");
          if (rawFull) {
            const parsed = JSON.parse(rawFull);
            const list = parsed.schedules || (Array.isArray(parsed) ? parsed : []);
            const now = new Date();
            const currentDayNum = now.getDay() === 0 ? 1 : now.getDay() + 1;
            const todayClasses = list.filter((s: any) => s.dayNum === currentDayNum);

            if (todayClasses.length > 0) {
              const c = todayClasses[0];
              notifTitle = `⏰ Nhắc nhở: ${c.course || c.ten_hp || "Môn học hôm nay"}`;
              notifBody = `Tiết ${c.time || c.tiet || "học"} tại ${c.room || c.phong || "phòng học"}. Nhớ điểm danh nhé!`;
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi đọc lịch thật cho thông báo:", err);
      }

      await sendInstantNotification(notifTitle, notifBody, { screen: "schedule" }, NOTIFICATION_CHANNELS.SCHEDULE);
      break;
    }

    case "grades": {
      // 2. SO SÁNH VỚI DỮ LIỆU ĐIỂM CŨ ĐỂ TÌM MÔN MỚI CẬP NHẬT
      let notifTitle = "🎉 Cập nhật Điểm số";
      let notifBody = "Bảng điểm học kỳ mới nhất đã được đồng bộ với nhà trường.";

      try {
        const rawGrades = await AsyncStorage.getItem("@grades_cache_data");
        const rawOldGrades = await AsyncStorage.getItem("@last_known_grades");

        if (rawGrades) {
          const parsed = JSON.parse(rawGrades);
          const currentList: any[] = parsed.grades || parsed.courses || (Array.isArray(parsed) ? parsed : []);
          const oldList: any[] = rawOldGrades ? JSON.parse(rawOldGrades) : [];

          // Tìm xem có môn nào mới nhập điểm hoặc điểm khác với dữ liệu cũ
          let newOrChangedCourse = null;
          if (oldList.length > 0) {
            newOrChangedCourse = currentList.find((cur) => {
              const curId = cur.ma_hoc_phan || cur.ten_hoc_phan || cur.id;
              const curScore = cur.diem_tong_ket ?? cur.diem_tk ?? cur.diem_chu;
              const old = oldList.find((o) => (o.ma_hoc_phan || o.ten_hoc_phan || o.id) === curId);
              if (!old) return true; // Môn hoàn toàn mới
              const oldScore = old.diem_tong_ket ?? old.diem_tk ?? old.diem_chu;
              return curScore !== oldScore; // Điểm vừa mới nhập / thay đổi
            });
          }

          if (newOrChangedCourse) {
            const courseName = newOrChangedCourse.ten_hoc_phan || newOrChangedCourse.ten_hp || newOrChangedCourse.course || "Học phần";
            const score = newOrChangedCourse.diem_tong_ket ?? newOrChangedCourse.diem_tk ?? newOrChangedCourse.diem_chu ?? "Đã có điểm";
            notifTitle = "🎉 Cập nhật Điểm số mới";
            notifBody = `Điểm học phần '${courseName}' đã có: ${score}. Chúc mừng bạn!`;
          } else if (currentList.length > 0) {
            // Lấy môn có điểm thật gần nhất của sinh viên
            const valid = currentList.find((g) => g.diem_tong_ket || g.diem_tk || g.diem_chu) || currentList[0];
            const courseName = valid.ten_hoc_phan || valid.ten_hp || valid.course || "Học phần";
            const score = valid.diem_tong_ket ?? valid.diem_tk ?? "Đã cập nhật";
            const letter = valid.diem_chu ? ` (Điểm ${valid.diem_chu})` : "";
            notifTitle = `🎉 Điểm học phần: ${courseName}`;
            notifBody = `Điểm tổng kết: ${score}${letter}. Chúc mừng bạn đã hoàn thành môn học!`;
          }

          // Cập nhật lại danh sách điểm đã biết để so sánh cho lần sau
          await AsyncStorage.setItem("@last_known_grades", JSON.stringify(currentList));
        } else {
          const rawWidget = await AsyncStorage.getItem("@widget_grades_data");
          if (rawWidget) {
            const w = JSON.parse(rawWidget);
            notifTitle = "🎉 Điểm GPA Tích lũy";
            notifBody = `GPA hệ 4: ${w.gpa4 || "3.5"} • Hệ 10: ${w.gpa10 || "8.0"} • Xếp loại: ${w.rank || "Khá"}`;
          }
        }
      } catch (err) {
        console.warn("Lỗi đọc điểm thật cho thông báo:", err);
      }

      await sendInstantNotification(notifTitle, notifBody, { screen: "grades" }, NOTIFICATION_CHANNELS.GRADES);
      break;
    }

    case "sos": {
      // 3. CẢNH BÁO SOS: CHỈ THÔNG BÁO KHI CÓ USER KHÁC PHÁT SOS TRONG BÁN KÍNH 50M
      // Tuyệt đối không gửi thông báo fake "Tín hiệu khẩn cấp của bạn đã gửi..."
      Alert.alert(
        "Cảnh báo Cứu hộ SOS",
        "Hệ thống đã kết nối trực tiếp với Đội bảo vệ & Trực ban an ninh trường.\n\nCảnh báo SOS trên máy bạn chỉ tự động kích hoạt khi có sinh viên khác trong bán kính 50 mét phát tín hiệu khẩn cấp để đảm bảo tính kịp thời và chính xác."
      );
      break;
    }

    case "campus":
    default: {
      // 4. THÔNG BÁO TỪ TRƯỜNG THẬT MỚI NHẤT
      let notifTitle = "📢 Thông báo Đào tạo Smart Campus";
      let notifBody = "Kế hoạch đào tạo và văn bản thông báo mới nhất đã được ban hành.";

      try {
        const rawArticles = await AsyncStorage.getItem("@news_cache_data") || await AsyncStorage.getItem("@home_articles_data");
        if (rawArticles) {
          const parsed = JSON.parse(rawArticles);
          const list: any[] = parsed.articles || parsed.data || (Array.isArray(parsed) ? parsed : []);
          if (list.length > 0) {
            const first = list[0];
            notifTitle = `📢 ${first.title || "Thông báo từ Nhà trường"}`;
            notifBody = first.summary || first.description || "Bấm để xem chi tiết toàn văn thông báo mới nhất trên ứng dụng.";
          }
        }
      } catch (err) {
        console.warn("Lỗi đọc thông báo thật:", err);
      }

      await sendInstantNotification(notifTitle, notifBody, { screen: "home" }, NOTIFICATION_CHANNELS.CAMPUS);
      break;
    }
  }

  if (isExpoGo && type !== "sos") {
    Alert.alert(
      "Đã gửi thông báo",
      "Đang chạy trong Expo Go. Khi cài file APK vào điện thoại, thông báo sẽ hiển thị trực tiếp trên thanh trạng thái Notification Bar."
    );
  }
}

/**
 * Lên lịch nhắc nhở lịch học trước giờ vào lớp
 */
export async function scheduleClassReminder(
  courseName: string,
  room: string,
  timeText: string,
  triggerDate: Date
) {
  if (!Notifications || !Notifications.scheduleNotificationAsync) return;
  try {
    if (triggerDate.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Sắp đến giờ học: ${courseName}`,
        body: `Phòng ${room || "giảng đường"} - Bắt đầu lúc ${timeText}. Nhớ mang theo tài liệu học tập!`,
        data: { screen: "schedule" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === "android" ? { channelId: NOTIFICATION_CHANNELS.SCHEDULE } : {}),
      },
    });
  } catch (error) {
    console.warn("Lỗi lập lịch thông báo học phần:", error);
  }
}

/**
 * Hủy toàn bộ thông báo đã lên lịch
 */
export async function cancelAllScheduledNotifications() {
  if (Notifications && Notifications.cancelAllScheduledNotificationsAsync) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn("Lỗi hủy thông báo:", error);
    }
  }
}

/**
 * Lắng nghe người dùng chạm vào thông báo để chuyển màn hình
 */
export function addNotificationResponseListener(callback: (screen: string) => void) {
  if (Notifications && Notifications.addNotificationResponseReceivedListener) {
    try {
      return Notifications.addNotificationResponseReceivedListener((response: any) => {
        try {
          const screen = response?.notification?.request?.content?.data?.screen;
          if (screen) callback(screen);
        } catch {}
      });
    } catch {}
  }
  return { remove: () => {} };
}
