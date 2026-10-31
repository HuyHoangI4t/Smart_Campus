import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomBottomNav } from '../../src/components/MainTabs';
import { useTheme } from '../../src/context/ThemeContext';
import { FloatingChatBot } from '../../src/features/chat';
import { initSocket, onNewSos } from '../../src/services/socketService';
import { handleIncomingSosAlert } from '../../src/services/notificationService';
import {
  apiGetDashboard,
  apiGetSchedule,
  apiGetNews,
  apiGetGrades,
  apiGetNotifications,
  apiGetMapLocations,
} from '../../src/services/api';

export default function MainLayout() {
  const { colors } = useTheme();

  // Lắng nghe tín hiệu SOS khẩn cấp từ các sinh viên khác qua Socket.IO Realtime
  useEffect(() => {
    initSocket();
    const unsub = onNewSos(async (alertData) => {
      try {
        const userStr = await AsyncStorage.getItem('@auth_user');
        let myMssv = '';
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            myMssv = u.mssv || u.masv || '';
          } catch {}
        }
        // Không cảnh báo chính bản thân người gửi tín hiệu
        if (myMssv && alertData?.mssv && String(myMssv) === String(alertData.mssv)) {
          return;
        }
        await handleIncomingSosAlert(alertData);
      } catch (err) {
        console.warn('Lỗi xử lý SOS realtime:', err);
      }
    });

    return () => unsub();
  }, []);

  // Nạp dữ liệu ngầm sau khi màn hình đầu tiên đã mount mượt mà
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const userStr = await AsyncStorage.getItem('@auth_user');
        let mssv: string | undefined = undefined;
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.mssv && u.mssv !== 'guest') mssv = u.mssv;
        }

        // Kích hoạt nạp đồng thời dữ liệu nền
        Promise.allSettled([
          apiGetDashboard(),
          apiGetSchedule(mssv),
          apiGetNews('all'),
          apiGetNews('announcement'),
          apiGetNews('news'),
          apiGetGrades(mssv),
          apiGetNotifications(),
          apiGetMapLocations(),
        ]);
      } catch {}
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: true,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
          sceneStyle: { backgroundColor: colors.background },
        }}
        tabBar={(props) => <CustomBottomNav {...props} />}
      >
        <Tabs.Screen name="home/index" options={{ title: 'Trang chủ' }} />
        <Tabs.Screen name="schedule/index" options={{ title: 'Lịch học' }} />
        <Tabs.Screen name="map/index" options={{ title: 'Bản đồ' }} />
        <Tabs.Screen name="grades/index" options={{ title: 'Điểm' }} />
        <Tabs.Screen name="profile/index" options={{ title: 'Hồ sơ' }} />
        <Tabs.Screen name="feedback/index" options={{ href: null }} />
        <Tabs.Screen name="sos/index" options={{ href: null }} />
        <Tabs.Screen name="grades/grades_detail" options={{ href: null }} />
        <Tabs.Screen name="profile/change_password" options={{ href: null }} />
        <Tabs.Screen name="profile/settings" options={{ href: null }} />
        <Tabs.Screen name="home/home_detail" options={{ href: null }} />
        <Tabs.Screen name="home/all_articles" options={{ href: null }} />
        <Tabs.Screen name="chat/index" options={{ href: null }} />
      </Tabs>

      {/* Bóng chat nổi hiển thị trên toàn bộ các trang (trừ bản đồ & cài đặt), có thể thu gọn vào cạnh */}
      <FloatingChatBot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
