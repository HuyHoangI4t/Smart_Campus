import 'expo-router/entry';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

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

