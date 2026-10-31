import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { initNotifications, addNotificationResponseListener, handleIncomingSosAlert } from '../src/services/notificationService';
import { initSocket, onNewSos, isSelfSentSos } from '../src/services/socketService';
import { syncAllWidgets } from '../src/services/widgetService';
import { SosAlertModal } from '../src/components/SosAlertModal';
import '../src/widgets/registerWidgets';

function RootStack() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // 1. Khởi tạo Notification channels & xin quyền thông báo
    initNotifications().catch((err) => console.warn('Lỗi init notifications:', err));

    // 2. Đồng bộ các Widget màn hình chính khi khởi động app
    syncAllWidgets().catch((err) => console.warn('Lỗi sync widgets:', err));

    // 2.5 Lắng nghe tín hiệu SOS khẩn cấp realtime toàn cầu (Root Level)
    initSocket();
    const sosUnsub = onNewSos(async (alertData) => {
      try {
        
        if (isSelfSentSos(alertData)) {
          return;
        }
        await handleIncomingSosAlert(alertData);
      } catch (err) {
        console.warn('Lỗi xử lý SOS realtime tại Root:', err);
      }
    });

    // 3. Lắng nghe sự kiện người dùng bấm vào thanh thông báo đẩy an toàn
    const responseSubscription = addNotificationResponseListener((screen: string) => {
      switch (screen) {
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
    });

    return () => {
      if (sosUnsub && typeof sosUnsub === 'function') {
        try {
          sosUnsub();
        } catch {}
      }
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
        <SosAlertModal />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}