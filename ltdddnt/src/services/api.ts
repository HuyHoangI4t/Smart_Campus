import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  return Platform.OS === 'android' ? 'http://192.168.1.5:5000/api' : 'http://192.168.1.5:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

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
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ currentPassword, newPassword }),
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
  ngay_sinh?: string;
  gioi_tinh?: string;
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

export async function apiGetSchedule(mssv?: string) {
  try {
    const headers = await getAuthHeaders();
    const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
    const url = targetMssv ? `${API_BASE_URL}/student/schedule/${targetMssv}` : `${API_BASE_URL}/student/schedule`;
    const response = await fetchWithTimeout(url, { headers });
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Không thể kết nối lấy lịch học.', tables: [] };
  }
}

export async function apiGetGrades(mssv?: string) {
  try {
    const headers = await getAuthHeaders();
    const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
    const url = targetMssv ? `${API_BASE_URL}/student/grades/${targetMssv}` : `${API_BASE_URL}/student/grades`;
    const response = await fetchWithTimeout(url, { headers });
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Không thể kết nối lấy điểm số.', data: [] };
  }
}

export async function apiGetCourses(mssv?: string) {
  try {
    const headers = await getAuthHeaders();
    const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
    const url = targetMssv ? `${API_BASE_URL}/student/courses/${targetMssv}` : `${API_BASE_URL}/student/courses`;
    const response = await fetchWithTimeout(url, { headers });
    return await handleResponse(response);
  } catch {
    return { success: false, message: 'Lỗi lấy danh sách học phần.', courses: [] };
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

