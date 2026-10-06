import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl,getCurrentIPv4 } from './get_IPv4';
export const API_BASE_URL = getApiBaseUrl();
export const CURRENT_IPV4 = getCurrentIPv4();
const REQUEST_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
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

async function handleResponse(response: Response) {
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

// ─── CACHE & CLEANUP ──────────────────────────────────────────────────────
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
  } catch (err) {
    console.error('Error clearing cache:', err);
  }
}

// ─── AUTH APIS ─────────────────────────────────────────────────────────────
export async function apiLogin(mssv: string, mat_khau: string) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mssv, mat_khau, password: mat_khau }),
    });
    return await handleResponse(response);
  } catch (err: any) {
    return {
      success: false,
      message: err.name === 'AbortError'
        ? 'Kết nối quá thời gian chờ (timeout).'
        : `Không thể kết nối đến server (${API_BASE_URL}).`,
    };
  }
}

export async function apiLogout() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
    });
    return await handleResponse(response);
  } catch{
    return {
      success: true,
      message: 'Đăng xuất hoàn tất.',
    };
  }
}

export async function apiRegister(userData: {
  mssv: string;
  ho_ten?: string;
  fullName?: string;
  email: string;
  mat_khau?: string;
  password?: string;
  lop?: string;
  khoa?: string;
  so_dien_thoai?: string;
}) {
  const payload = {
    ...userData,
    ho_ten: userData.ho_ten || userData.fullName || '',
    mat_khau: userData.mat_khau || userData.password || '',
  };
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: `Không thể kết nối đến server (${API_BASE_URL}).` };
  }
}

export async function apiForgotPassword(email: string) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: `Không thể kết nối đến server (${API_BASE_URL}).` };
  }
}

export async function apiVerifyOtp(mssv: string, otpCode: string) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mssv, otpCode }),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: `Không thể kết nối đến server (${API_BASE_URL}).` };
  }
}

export async function apiVerifyRegisterOtp(mssv: string, otpCode: string) {
  return apiVerifyOtp(mssv, otpCode);
}

export async function apiResetPassword(payload: { mssv: string; token?: string; otpCode?: string; newPassword: string }) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: `Không thể kết nối đến server (${API_BASE_URL}).` };
  }
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  try {
    const headers = await getAuthHeaders();
    let mssv = headers['X-MSSV'] || '';
    if (!mssv) {
      const userStr = await AsyncStorage.getItem('@auth_user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          mssv = u.mssv || u.masv || '';
        } catch {
          // ignore
        }
      }
    }
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ mssv: mssv || undefined, currentPassword, newPassword }),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: `Không thể kết nối đến server (${API_BASE_URL}).` };
  }
}

// ─── STUDENT APIS ──────────────────────────────────────────────────────────
export async function apiGetProfile(mssv?: string) {
  try {
    const headers = await getAuthHeaders();
    const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
    const url = targetMssv ? `${API_BASE_URL}/student/profile/${targetMssv}` : `${API_BASE_URL}/student/profile`;
    const response = await fetchWithTimeout(url, { headers });
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Lỗi tải thông tin sinh viên.' };
  }
}

export async function apiUpdateProfile(payload: {
  ho_ten?: string;
  fullName?: string;
  email?: string;
  so_dien_thoai?: string;
  phone?: string;
  lop?: string;
  khoa?: string;
  avatar?: string;
}) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/student/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Lỗi cập nhật thông tin sinh viên.' };
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

export async function readLocalCache<T = any>(key: string): Promise<{ data: T; savedAt?: string } | null> {
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
    return { data: parsed.data as T, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export async function apiGetSchedule(mssv?: string, reload = false) {
  const cacheKey = `@offline_schedule_${mssv || 'current'}`;
  try {
    const headers = await getAuthHeaders();
    const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
    const qs = reload ? '?reload=true' : '';
    const url = targetMssv ? `${API_BASE_URL}/student/schedule/${targetMssv}${qs}` : `${API_BASE_URL}/student/schedule${qs}`;
    const response = await fetchWithTimeout(url, { headers });
    const result = await handleResponse(response);

    if (result && result.success) {
      await saveLocalCache(cacheKey, result);
      return { ...result, isOfflineCache: false };
    }

    // Nếu server trả về lỗi, thử đọc từ cache offline
    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return {
        ...cached.data,
        isOfflineCache: true,
        cachedAt: cached.savedAt,
      };
    }

    return result;
  } catch {
    // Khi thiết bị hoàn toàn không có mạng hoặc server không phản hồi
    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return {
        ...cached.data,
        isOfflineCache: true,
        cachedAt: cached.savedAt,
      };
    }
    return { success: false, message: 'Không thể kết nối lấy lịch học.', tables: [], isOfflineCache: true };
  }
}

export async function apiGetGrades(mssv?: string, reload = false) {
  const cacheKey = `@offline_grades_${mssv || 'current'}`;
  try {
    const headers = await getAuthHeaders();
    const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
    const qs = reload ? '?reload=true' : '';
    const url = targetMssv ? `${API_BASE_URL}/student/grades/${targetMssv}${qs}` : `${API_BASE_URL}/student/grades${qs}`;
    const response = await fetchWithTimeout(url, { headers });
    const result = await handleResponse(response);

    if (result && result.success) {
      await saveLocalCache(cacheKey, result);
      return { ...result, isOfflineCache: false };
    }

    // Nếu server trả về lỗi, thử đọc từ cache offline
    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return {
        ...cached.data,
        isOfflineCache: true,
        cachedAt: cached.savedAt,
      };
    }

    return result;
  } catch {
    // Khi thiết bị hoàn toàn không có mạng hoặc server không phản hồi
    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return {
        ...cached.data,
        isOfflineCache: true,
        cachedAt: cached.savedAt,
      };
    }
    return { success: false, message: 'Không thể kết nối lấy điểm số.', data: [], isOfflineCache: true };
  }
}

// ─── CAMPUS / UTILITY APIS ──────────────────────────────────────────────────
export async function apiGetMapLocations() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/map`);
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Lỗi tải danh sách địa điểm bản đồ.', locations: [] };
  }
}

export async function apiSubmitFeedback(payload: {
  title: string;
  content: string;
  category?: string;
  rating?: number;
}) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/campus/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Không thể gửi phản ánh vào lúc này.' };
  }
}

export async function apiSubmitSos(payload: {
  location?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  incidentType?: string;
}) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/campus/sos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Không thể phát tín hiệu SOS khẩn cấp.' };
  }
}

export async function apiGetNotifications() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/general/notifications`, { headers });
    return await handleResponse(response);
  } catch {
    return { success: false, notifications: [] };
  }
}

export async function apiGetDashboard() {
  const cacheKey = '@offline_dashboard';
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/campus/dashboard`, { headers });
    const result = await handleResponse(response);
    if (result && result.success) {
      await saveLocalCache(cacheKey, result);
      return { ...result, isOfflineCache: false };
    }
    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return { ...cached.data, isOfflineCache: true, cachedAt: cached.savedAt };
    }
    return result;
  } catch {
    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return { ...cached.data, isOfflineCache: true, cachedAt: cached.savedAt };
    }
    return { success: false, isOfflineCache: true };
  }
}

export async function apiGetFeedbackConfig() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/campus/feedback/config`);
    return await handleResponse(response);
  } catch {
    return { success: false };
  }
}

export async function apiGetSosConfig() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/campus/sos/config`);
    return await handleResponse(response);
  } catch {
    return { success: false };
  }
}

export const CAMPUS_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
];

export function getNewsImageUrl(imageUrl?: string | null, fallbackIndex = 0): string {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return CAMPUS_FALLBACK_IMAGES[Math.abs(fallbackIndex) % CAMPUS_FALLBACK_IMAGES.length];
  }

  // Nếu là ảnh từ ttn.edu.vn, điều hướng qua proxy của backend để vượt tường lửa (tránh lỗi 502 & SSL trên điện thoại thật)
  if (imageUrl.includes('ttn.edu.vn')) {
    return `${API_BASE_URL}/news/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  return imageUrl;
}

export interface NewsOrAnnouncementItem {
  id: string | number;
  type: 'news' | 'announcement';
  source: string;
  sourceName: string;
  badge: string;
  badgeColor?: string;
  title: string;
  summary?: string;
  content?: string;
  date: string;
  timeAgo?: string;
  link: string;
  imageUrl?: string;
  sender?: string;
  author?: string;
  category?: string;
  attachments?: {
    title: string;
    url: string;
    isPdf?: boolean;
  }[];
  likes?: number;
  comments?: number;
  shares?: number;
  tags?: string[];
  isFallback?: boolean;
}

export async function apiGetNews(type?: 'all' | 'news' | 'announcement', limit?: number, reload = false) {
  const cacheKey = `@offline_news_${type || 'all'}`;
  try {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (limit) params.append('limit', String(limit));
    if (reload) params.append('reload', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchWithTimeout(`${API_BASE_URL}/news${qs}`);
    const result = await handleResponse(response);

    if (result && result.success) {
      await saveLocalCache(cacheKey, result);
      return { ...result, isOfflineCache: false };
    }

    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return { ...cached.data, isOfflineCache: true, cachedAt: cached.savedAt };
    }
    return result;
  } catch {
    const cached = await readLocalCache(cacheKey);
    if (cached && cached.data) {
      return { ...cached.data, isOfflineCache: true, cachedAt: cached.savedAt };
    }
    return { success: false, data: [], isOfflineCache: true };
  }
}




