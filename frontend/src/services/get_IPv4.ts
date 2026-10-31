import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend Production Public URL (Render) - CHỈ DÙNG KHI BUILD APK / PRODUCTION
export const PUBLIC_BACKEND_URL = 'https://smart-campus-f012.onrender.com';
export const PRODUCTION_API_URL = `${PUBLIC_BACKEND_URL}/api`;

const PORT = '5000';
const LOCAL_IPV4_FALLBACK = '192.168.1.17';

export const getApiBaseUrl = (): string => {
  // 1. Khi build APK / Standalone Production (không phải môi trường dev Expo) -> Dùng Cloud Render URL
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  // 2. Nếu chạy trên Web ở môi trường Dev
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }

  // 3. Tự động lấy IP của máy tính qua Expo Metro bundler khi dev kết nối cùng mạng Wi-Fi
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:${PORT}/api`;
    }
  }

  // 4. Fallback IP LAN Wi-Fi nội bộ máy tính
  return `http://${LOCAL_IPV4_FALLBACK}:${PORT}/api`;
};

// Hàm phụ trợ nếu bạn muốn in ra kiểm tra IP hiện tại trong console
export const getCurrentIPv4 = (): string => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return LOCAL_IPV4_FALLBACK;
};
