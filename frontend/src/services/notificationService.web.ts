import { Alert } from 'react-native';
import { showSosAlertModal } from '../components/SosAlertModal';

export const NOTIFICATION_CHANNELS = {
  SCHEDULE: "schedule_reminders",
  CAMPUS: "campus_announcements",
  SOS: "emergency_sos",
  GRADES: "grades_updates",
};

export async function initNotifications(): Promise<boolean> {
  return true;
}

export async function sendInstantNotification(
  title: string,
  body: string,
  data: Record<string, any> = {},
  channelId: string = NOTIFICATION_CHANNELS.CAMPUS
) {
  console.log(`[Web Notification] ${title}: ${body}`, data);
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {}
  }
}

export async function triggerTestNotification(type: "schedule" | "grades" | "campus" | "sos" = "schedule") {
  const titles = {
    schedule: "⏰ Nhắc lịch học (Expo Mode)",
    grades: "🎉 Cập nhật Điểm số (Expo Mode)",
    campus: "📢 Thông báo trường (Expo Mode)",
    sos: "🚨 Cứu hộ SOS (Expo Mode)",
  };
  const bodies = {
    schedule: "Tiết 1-3 hôm nay: Lập trình di động tại phòng B2.302 lúc 07:00.",
    grades: "Điểm học phần 'Lập trình thiết bị di động' đã có: 8.5 (Điểm A). Chúc mừng bạn!",
    campus: "Kế hoạch đăng ký môn học và lịch thi học kỳ mới đã được ban hành.",
    sos: "Tín hiệu cứu hộ SOS của bạn đã được ghi nhận thành công.",
  };
  Alert.alert(
    titles[type],
    bodies[type] + "\n\n💡 Ghi chú: Đang chạy trong môi trường Expo. Khi xuất file APK cài vào máy Android, thông báo sẽ hiển thị trực tiếp trên khay Notification Bar của điện thoại."
  );
}

export async function scheduleClassReminder(
  courseName: string,
  room: string,
  timeText: string,
  triggerDate: Date
) {
  console.log(`[Expo Schedule] ${courseName} at ${timeText}`);
}

export async function cancelAllScheduledNotifications() {}

export function addNotificationResponseListener(callback: (screen: string) => void) {
  return { remove: () => {} };
}

export async function handleIncomingSosAlert(alert: any): Promise<boolean> {
  if (!alert) return false;
  showSosAlertModal(alert);
  return true;
}
