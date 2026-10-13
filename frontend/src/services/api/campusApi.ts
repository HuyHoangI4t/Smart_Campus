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

export async function apiGetMapLocations() {
  const ttlKey = 'campus_map_locations';
  const cached = getTtlCache<any>(ttlKey);
  if (cached) return cached;

  return deduplicateRequest(ttlKey, async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/map`);
      const result = await handleResponse(response);
      if (result && result.locations) {
        setTtlCache(ttlKey, result, 60000); // 1 min
      }
      return result;
    } catch {
      return { success: false, message: 'Lỗi tải danh sách địa điểm bản đồ.', locations: [] };
    }
  });
}

export async function apiGetCampusPaths() {
  const ttlKey = 'campus_paths';
  const cached = getTtlCache<any>(ttlKey);
  if (cached) return cached;

  return deduplicateRequest(ttlKey, async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/paths`);
      const result = await handleResponse(response);
      if (result && result.paths) {
        setTtlCache(ttlKey, result, 120000); // 2 mins
      }
      return result;
    } catch {
      return { success: false, message: 'Lỗi tải mạng lưới lối đi nội bộ.', paths: [] };
    }
  });
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
  const ttlKey = 'campus_dashboard';

  const memoryHit = getTtlCache<any>(ttlKey);
  if (memoryHit) return memoryHit;

  return deduplicateRequest(ttlKey, async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}/campus/dashboard`, { headers });
      const result = await handleResponse(response);
      if (result && result.success) {
        const payload = { ...result, isOfflineCache: false };
        setTtlCache(ttlKey, payload, 30000); // 30s TTL
        await saveLocalCache(cacheKey, result);
        return payload;
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
  });
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

