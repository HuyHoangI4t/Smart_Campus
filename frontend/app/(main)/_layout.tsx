import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomBottomNav } from '../../src/components/MainTabs';
import { useTheme } from '../../src/context/ThemeContext';
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
    </Tabs>
  );
}

