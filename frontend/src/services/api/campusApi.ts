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

export async function syncPendingCampusReports(): Promise<void> {
  try {
    const fbList = await readLocalCache<any[]>('@offline_pending_feedback');
    if (fbList && Array.isArray(fbList.data) && fbList.data.length > 0) {
      const headers = await getAuthHeaders();
      const remaining: any[] = [];
      for (const item of fbList.data) {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/campus/feedback`, {
            method: 'POST',
            headers,
            body: JSON.stringify(item.payload),
          }, 5000);
          if (!res.ok) remaining.push(item);
        } catch {
          remaining.push(item);
        }
      }
      await saveLocalCache('@offline_pending_feedback', remaining);
    }

    const sosList = await readLocalCache<any[]>('@offline_pending_sos');
    if (sosList && Array.isArray(sosList.data) && sosList.data.length > 0) {
      const headers = await getAuthHeaders();
      const remainingSos: any[] = [];
      for (const item of sosList.data) {
        try {
          const res = await fetchWithTimeout(`${API_BASE_URL}/campus/sos`, {
            method: 'POST',
            headers,
            body: JSON.stringify(item.payload),
          }, 5000);
          if (!res.ok) remainingSos.push(item);
        } catch {
          remainingSos.push(item);
        }
      }
      await saveLocalCache('@offline_pending_sos', remainingSos);
    }
  } catch {}
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
    }, 6000);
    const result = await handleResponse(response);
    if (result && result.success) return result;
    throw new Error(result?.message || 'Lỗi gửi phản hồi');
  } catch {
    const fbCache = await readLocalCache<any[]>('@offline_pending_feedback');
    const queue = Array.isArray(fbCache?.data) ? fbCache.data : [];
    queue.push({ payload, createdAt: Date.now() });
    await saveLocalCache('@offline_pending_feedback', queue);

    return {
      success: true,
      isOfflineQueued: true,
      message: 'Thiết bị đang ngoại tuyến. Ý kiến của bạn đã được lưu và sẽ tự động gửi đi khi có mạng.',
    };
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
    }, 5000);
    const result = await handleResponse(response);
    if (result && result.success) return result;
    throw new Error(result?.message || 'Lỗi gửi tín hiệu SOS');
  } catch {
    const sosCache = await readLocalCache<any[]>('@offline_pending_sos');
    const queue = Array.isArray(sosCache?.data) ? sosCache.data : [];
    queue.push({ payload, createdAt: Date.now() });
    await saveLocalCache('@offline_pending_sos', queue);

    return {
      success: true,
      isOfflineQueued: true,
      message: 'Thiết bị đang ngoại tuyến. Tín hiệu SOS đã được ghi nhận và sẽ tự động gửi đến ban an ninh khi có mạng.',
    };
  }
}

export async function apiGetNotifications() {
  const cacheKey = '@offline_notifications';
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/general/notifications`, { headers }, 5000);
    const result = await handleResponse(response);
    if (result && result.notifications) {
      await saveLocalCache(cacheKey, result);
      return { ...result, isOfflineCache: false };
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
    return { success: false, notifications: [], isOfflineCache: true };
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
        // Automatically sync queued feedback & SOS when dashboard succeeds online
        syncPendingCampusReports().catch(() => {});
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

