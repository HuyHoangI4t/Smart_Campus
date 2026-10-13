import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, getCurrentIPv4 } from '../get_IPv4';

export const API_BASE_URL = getApiBaseUrl();
export const CURRENT_IPV4 = getCurrentIPv4();
export const REQUEST_TIMEOUT_MS = 6000;

let isDeviceOnline = true;
export function getDeviceOnlineStatus() {
  return isDeviceOnline;
}
export function setDeviceOnlineStatus(status: boolean) {
  isDeviceOnline = status;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    isDeviceOnline = true;
    return res;
  } catch (err) {
    clearTimeout(id);
    isDeviceOnline = false;
    throw err;
  }
}

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

export async function handleResponse(response: Response) {
  try {
    const data = await response.json();
    return data;
  } catch {
    return {
      success: response.ok,
      message: response.ok ? 'Thành công' : `Lỗi máy chủ (${response.status})`,
    };
  }
}

export async function clearAuthAndCache() {
  try {
    const keys = [
      '@auth_token',
      '@auth_user',
      '@student_profile',
      '@student_schedule',
      '@student_grades',
    ];
    await Promise.all(keys.map((k) => AsyncStorage.removeItem(k).catch(() => null)));
    inMemoryCache.clear();
    ttlCache.clear();
  } catch (err) {
    console.error('Error clearing cache:', err);
  }
}

// ─── OFFLINE CACHE HELPERS (RAM Cache + AsyncStorage song song) ───────────
const inMemoryCache = new Map<string, { data: any; savedAt: string }>();

export async function saveLocalCache(key: string, data: any) {
  try {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const payload = {
      timestamp: Date.now(),
      savedAt: timeStr,
      data,
    };
    inMemoryCache.set(key, { data, savedAt: timeStr });
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export async function readLocalCache<T = any>(key: string): Promise<{ data: T; savedAt?: string; timestamp?: number } | null> {
  // 1. Đọc ngay từ RAM (0.001ms)
  if (inMemoryCache.has(key)) {
    const item = inMemoryCache.get(key)!;
    return { data: item.data as T, savedAt: item.savedAt };
  }
  // 2. Nếu chưa có trên RAM, đọc từ AsyncStorage
  try {
    const str = await AsyncStorage.getItem(key);
    if (!str) return null;
    const parsed = JSON.parse(str);
    inMemoryCache.set(key, { data: parsed.data, savedAt: parsed.savedAt });
    return { data: parsed.data as T, savedAt: parsed.savedAt, timestamp: parsed.timestamp };
  } catch {
    return null;
  }
}

// ─── HIGH PERFORMANCE TTL IN-MEMORY CACHE (Requirement 2) ───────────────────
interface TtlEntry<T> {
  value: T;
  expiresAt: number;
}
const ttlCache = new Map<string, TtlEntry<any>>();

export function getTtlCache<T>(key: string): T | null {
  const entry = ttlCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    ttlCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setTtlCache<T>(key: string, value: T, ttlMs = 30000): void {
  ttlCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearTtlCache(keyPattern?: string): void {
  if (!keyPattern) {
    ttlCache.clear();
    return;
  }
  for (const key of ttlCache.keys()) {
    if (key.includes(keyPattern)) {
      ttlCache.delete(key);
    }
  }
}

// ─── IN-FLIGHT DEDUPLICATION TIER (Chống trùng lặp request đang chờ) ─────────
// Khi nhiều component cùng gọi API đồng thời, chỉ 1 request mạng thực sự được gửi,
// các luồng còn lại cùng chia sẻ Promise đang chờ kết quả, tiết kiệm Pin và Băng thông di động.
const inFlightRequests = new Map<string, Promise<any>>();

export function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = requestFn()
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
}

