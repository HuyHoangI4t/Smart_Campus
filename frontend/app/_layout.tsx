import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
// [KHI BUILD APK]: Đã bật Thông báo đẩy & Widget Android
import * as Notifications from 'expo-notifications';
import { initNotifications } from '../src/services/notificationService';
import { syncAllWidgets } from '../src/services/widgetService';
import '../src/widgets/registerWidgets';

function RootStack() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // [KHI BUILD APK]: Đã kích hoạt Thông báo đẩy & Widget
    // 1. Khởi tạo Notification channels & xin quyền thông báo
    initNotifications().catch((err) => console.warn('Lỗi init notifications:', err));

    // 2. Đồng bộ các Widget màn hình chính khi khởi động app
    syncAllWidgets().catch((err) => console.warn('Lỗi sync widgets:', err));

    // 3. Lắng nghe sự kiện người dùng bấm vào thanh thông báo đẩy an toàn
    let responseSubscription: any = null;
    try {
      if (Notifications && typeof Notifications.addNotificationResponseReceivedListener === 'function') {
        responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
          try {
            const data = response?.notification?.request?.content?.data;
            if (data && data.screen) {
              switch (data.screen) {
                case 'grades':
                  router.push('/(main)/grades');
                  break;
                case 'schedule':
                  router.push('/(main)/schedule');
                  break;
                case 'sos':
                  router.push('/(main)/sos');
                  break;
                case 'home':
                default:
                  router.push('/(main)/home');
                  break;
              }
            }
          } catch (err) {
            console.warn('Lỗi xử lý navigation từ thông báo:', err);
          }
        });
      }
    } catch (subErr) {
      console.warn('Lỗi đăng ký addNotificationResponseReceivedListener:', subErr);
    }

    return () => {
      if (responseSubscription && typeof responseSubscription.remove === 'function') {
        try {
          responseSubscription.remove();
        } catch {}
      }
    };
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <RootStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}