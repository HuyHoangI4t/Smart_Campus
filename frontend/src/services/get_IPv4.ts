import { Platform } from 'react-native';
import Constants from 'expo-constants';

// IP tĩnh hiện tại của máy bạn làm fallback dự phòng
const CURRENT_IPV4 = '192.168.1.22';
const PORT = '5000';

export const getApiBaseUrl = (): string => {
  // 1. Nếu chạy trên Web
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }
  
  // 2. Lấy tự động qua Expo Metro bundler (giúp bắt đúng IP khi đổi mạng Wi-Fi)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:${PORT}/api`;
    }
  }

  // 3. Fallback dùng trực tiếp IPv4 hiện tại của bạn
  return `http://${CURRENT_IPV4}:${PORT}/api`;
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
  return CURRENT_IPV4;
};