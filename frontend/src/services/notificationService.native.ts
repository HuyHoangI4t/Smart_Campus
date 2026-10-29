import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";

export const NOTIFICATION_CHANNELS = {
  SCHEDULE: "schedule_reminders",
  CAMPUS: "campus_announcements",
  SOS: "emergency_sos",
  GRADES: "grades_updates",
};

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;
// [KHI BUILD APK]: Đã nạp thư viện expo-notifications
try {
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
    Alert.alert(title, body);
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
      },
      trigger: Platform.OS === "android" ? { channelId } : null,
    });
  } catch (error) {
    console.warn("Lỗi gửi thông báo tức thì:", error);
    Alert.alert(title, body);
  }
}

/**
 * Gửi thông báo thử nghiệm để người dùng / ban giám khảo test ngay trên máy
 */
export async function triggerTestNotification(type: "schedule" | "grades" | "campus" | "sos" = "schedule") {
  await initNotifications();

  switch (type) {
    case "schedule":
      await sendInstantNotification(
        "⏰ Nhắc nhở Lịch học",
        "Tiết 1-3 hôm nay: Lập trình di động tại phòng B2.302 lúc 07:00",
        { screen: "schedule" },
        NOTIFICATION_CHANNELS.SCHEDULE
      );
      break;

    case "grades":
      await sendInstantNotification(
        "🎉 Cập nhật Điểm số mới",
        "Điểm học phần 'Lập trình thiết bị di động' đã có: 8.5 (Điểm A). Chúc mừng bạn!",
        { screen: "grades" },
        NOTIFICATION_CHANNELS.GRADES
      );
      break;

    case "sos":
      await sendInstantNotification(
        "🚨 Cảnh báo Cứu hộ SOS",
        "Tín hiệu khẩn cấp của bạn đã được gửi tới Ban Quản lý ký túc xá và Trạm Y tế TNU.",
        { screen: "sos" },
        NOTIFICATION_CHANNELS.SOS
      );
      break;

    case "campus":
    default:
      await sendInstantNotification(
        "📢 Thông báo Đào tạo Smart Campus",
        "Kế hoạch đăng ký môn học và lịch thi học kỳ mới đã được ban hành.",
        { screen: "home" },
        NOTIFICATION_CHANNELS.CAMPUS
      );
      break;
  }

  if (isExpoGo) {
    Alert.alert(
      "Đã gửi thông báo",
      "Đang chạy trong Expo Go. Khi xuất file APK độc lập cài vào điện thoại, thông báo sẽ hiển thị trực tiếp trên thanh trạng thái Notification Bar."
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
