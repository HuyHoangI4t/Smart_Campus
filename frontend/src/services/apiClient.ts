import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  return 'http://192.168.1.12:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = 10000;

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    const userStr = await AsyncStorage.getItem('@auth_user');
    let mssv = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        mssv = user.mssv || user.masv || '';
      } catch {
        // ignore
      }
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (mssv) {
      headers['X-MSSV'] = mssv;
    }
    return headers;
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

export const apiClient = {
  async get<T = any>(endpoint: string, customHeaders: Record<string, string> = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...authHeaders, ...customHeaders },
        signal: controller.signal,
      });
      clearTimeout(timer);
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  },

  async post<T = any>(endpoint: string, body: any, customHeaders: Record<string, string> = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...authHeaders, ...customHeaders },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }
};
