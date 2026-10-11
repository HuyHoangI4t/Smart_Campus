import { API_BASE_URL, fetchWithTimeout, handleResponse, getAuthHeaders } from './client';

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
  } catch {
    return { success: true };
  }
}

export async function apiRegister(userData: {
  mssv: string;
  mat_khau?: string;
  password?: string;
  ho_ten?: string;
  fullName?: string;
  email: string;
  so_dien_thoai?: string;
  phone?: string;
  lop?: string;
  khoa?: string;
}) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userData,
        password: userData.mat_khau || userData.password,
        mat_khau: userData.mat_khau || userData.password,
        fullName: userData.ho_ten || userData.fullName,
        ho_ten: userData.ho_ten || userData.fullName,
        phone: userData.so_dien_thoai || userData.phone,
      }),
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
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mssv, otpCode }),
    });
    return await handleResponse(response);
  } catch {
    return { success: false, message: `Không thể kết nối đến server (${API_BASE_URL}).` };
  }
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
    const mssv = headers['X-MSSV'];
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

