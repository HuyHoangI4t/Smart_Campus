import { Tabs } from 'expo-router';
import { CustomBottomNav } from '../../src/components/MainTabs';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomBottomNav {...props} />}
    >
      <Tabs.Screen name="home/index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="map/index" options={{ title: 'Bản đồ' }} />
      <Tabs.Screen name="schedule/index" options={{ title: 'Lịch học' }} />
      <Tabs.Screen name="grades/index" options={{ title: 'Kết quả' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Hồ sơ' }} />
      <Tabs.Screen name="feedback/index" options={{ href: null }} />
      <Tabs.Screen name="sos/index" options={{ href: null }} />
      <Tabs.Screen name="grades/grades_detail" options={{ href: null }} />
      <Tabs.Screen name="profile/change_password" options={{ href: null }} />
    </Tabs>
  );
}

