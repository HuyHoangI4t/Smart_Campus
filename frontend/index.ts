import 'expo-router/entry';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { LogBox, Platform } from 'react-native';

// Ẩn cảnh báo & RedBox error nội bộ của Expo Go đối với expo-notifications (do Expo SDK 53+ gỡ FCM khỏi Expo Go)
const _originalConsoleError = console.error;
const _originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Android Push notifications') ||
    msg.includes('expo-notifications: Android Push notifications') ||
    msg.includes('warnOfExpoGoPushUsage')
  ) {
    return;
  }
  _originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('expo-notifications') ||
    msg.includes('expo.fyi/dev-client')
  ) {
    return;
  }
  _originalConsoleWarn.apply(console, args);
};

LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'expo-notifications: Android Push notifications',
]);

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Đăng ký Widget Task Handler tại điểm khởi động gốc (Entry Point) của app
// Bắt buộc đối với Android Widgets để Headless JS Task có thể vẽ giao diện khi kéo Widget ra màn hình chính
if (Platform.OS === 'android' && !isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
    if (typeof registerWidgetTaskHandler === 'function') {
      registerWidgetTaskHandler(widgetTaskHandler);
      console.log('⚡ [Widget] Đã đăng ký registerWidgetTaskHandler thành công tại index.ts');
    }
  } catch (err) {
    console.warn('Lỗi đăng ký Widget Task Handler tại index.ts:', err);
  }
}
