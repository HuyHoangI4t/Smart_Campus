import {
  API_BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getAuthHeaders,
  saveLocalCache,
  readLocalCache,
  getTtlCache,
  setTtlCache,
  deduplicateRequest,
} from './client';

export async function apiGetProfile(mssv?: string) {
  const targetMssv = mssv || 'self';
  const ttlKey = `profile_${targetMssv}`;
  const cacheKey = `@offline_profile_${targetMssv}`;

  const cached = getTtlCache<any>(ttlKey);
  if (cached) return cached;

  return deduplicateRequest(ttlKey, async () => {
    try {
      const headers = await getAuthHeaders();
      const actualMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
      const url = actualMssv ? `${API_BASE_URL}/student/profile/${actualMssv}` : `${API_BASE_URL}/student/profile`;
      const response = await fetchWithTimeout(url, { headers });
      const result = await handleResponse(response);

      if (result && result.success) {
        const payload = { ...result, isOfflineCache: false };
        setTtlCache(ttlKey, payload, 60000); // 1 minute TTL
        await saveLocalCache(cacheKey, result);
        return payload;
      }
      const local = await readLocalCache(cacheKey);
      if (local && local.data) {
        return { ...local.data, isOfflineCache: true, cachedAt: local.savedAt };
      }
      return result;
    } catch {
      const local = await readLocalCache(cacheKey);
      if (local && local.data) {
        return { ...local.data, isOfflineCache: true, cachedAt: local.savedAt };
      }
      return { success: false, message: 'Lỗi tải thông tin sinh viên.', isOfflineCache: true };
    }
  });
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

export async function apiGetGrades(mssv?: string, reload = false) {
  const cacheKey = `@offline_grades_${mssv || 'current'}`;
  const ttlKey = `grades_${mssv || 'current'}`;

  if (!reload) {
    const memoryHit = getTtlCache<any>(ttlKey);
    if (memoryHit) return memoryHit;
  }

  return deduplicateRequest(ttlKey, async () => {
    try {
      const headers = await getAuthHeaders();
      const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
      const qs = reload ? '?reload=true' : '';
      const url = targetMssv ? `${API_BASE_URL}/student/grades/${targetMssv}${qs}` : `${API_BASE_URL}/student/grades${qs}`;
      const response = await fetchWithTimeout(url, { headers });
      const result = await handleResponse(response);

      if (result && result.success) {
        setTtlCache(ttlKey, { ...result, isOfflineCache: false }, 60000);
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
  });
}

