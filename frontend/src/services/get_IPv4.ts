import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend Production Public URL (Render)
export const PUBLIC_BACKEND_URL = 'https://smart-campus-f012.onrender.com';
export const PRODUCTION_API_URL = `${PUBLIC_BACKEND_URL}/api`;

const PORT = '5000';
const LOCAL_IPV4_FALLBACK = '192.168.1.20';

export const getApiBaseUrl = (): string => {
  // 1. Ưu tiên biến môi trường EXPO_PUBLIC_API_URL (nạp qua .env hoặc eas.json)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Cấu hình qua app.json extra
  const extraApiUrl = (Constants.expoConfig?.extra as any)?.apiUrl;
  if (extraApiUrl && typeof extraApiUrl === 'string' && extraApiUrl.trim() !== '') {
    return extraApiUrl.trim().replace(/\/+$/, '');
  }

  // 3. Khi build APK / Production (không phải môi trường dev) -> Luôn dùng Public Render URL
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  // 4. Nếu chạy trên Web ở môi trường Dev
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }

  // 5. Lấy tự động qua Expo Metro bundler khi dev kết nối cùng mạng Wi-Fi
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:${PORT}/api`;
    }
  }

  // 6. Fallback an toàn cuối cùng
  return PRODUCTION_API_URL;
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
