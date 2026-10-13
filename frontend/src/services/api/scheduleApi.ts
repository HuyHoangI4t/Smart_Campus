import {
  API_BASE_URL,
  fetchWithTimeout,
  handleResponse,
  getAuthHeaders,
  saveLocalCache,
  readLocalCache,
  getTtlCache,
  setTtlCache,
  clearTtlCache,
  deduplicateRequest,
} from './client';

export interface CustomSchedulePayload {
  ten_hp: string;
  thu: string;
  tiet: string;
  phong: string;
  giang_vien?: string;
  ghi_chu?: string;
  loai_lich?: string;
  ngay_hoc?: string;
  week_range?: string;
}

export async function apiGetSchedule(
  mssv?: string,
  reload = false,
  options?: { week?: string; weekOffset?: number; weekIndex?: number }
) {
  const cacheKey = `@offline_schedule_${mssv || 'current'}`;
  const ttlKey = `schedule_${mssv || 'current'}_${options?.week || ''}_${options?.weekIndex ?? ''}`;

  if (!reload && !options) {
    const memoryHit = getTtlCache<any>(ttlKey);
    if (memoryHit) return memoryHit;
  }

  return deduplicateRequest(ttlKey, async () => {
    try {
      const headers = await getAuthHeaders();
      const targetMssv = mssv || (headers['X-MSSV'] !== 'guest' ? headers['X-MSSV'] : undefined);
      const params = new URLSearchParams();
      if (reload) params.append('reload', 'true');
      if (options?.week !== undefined) params.append('week', options.week);
      if (options?.weekOffset !== undefined) params.append('weekOffset', String(options.weekOffset));
      if (options?.weekIndex !== undefined) params.append('weekIndex', String(options.weekIndex));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const url = targetMssv ? `${API_BASE_URL}/student/schedule/${targetMssv}${qs}` : `${API_BASE_URL}/student/schedule${qs}`;
      const response = await fetchWithTimeout(url, { headers });
      const result = await handleResponse(response);

      if (result && result.success) {
        const finalResult = { ...result, isOfflineCache: false };
        setTtlCache(ttlKey, finalResult, 30000); // 30s TTL
        await saveLocalCache(cacheKey, result);
        return finalResult;
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
  });
}

export async function apiCreateCustomSchedule(payload: CustomSchedulePayload) {
  try {
    clearTtlCache('schedule_');
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/student/schedule/custom`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (err: any) {
    return { success: false, message: 'Lỗi mạng khi thêm lịch học: ' + (err?.message || '') };
  }
}

export async function apiUpdateCustomSchedule(id: string | number, payload: Partial<CustomSchedulePayload>) {
  try {
    clearTtlCache('schedule_');
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/student/schedule/custom/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (err: any) {
    return { success: false, message: 'Lỗi mạng khi cập nhật lịch học: ' + (err?.message || '') };
  }
}

export async function apiDeleteCustomSchedule(id: string | number) {
  try {
    clearTtlCache('schedule_');
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API_BASE_URL}/student/schedule/custom/${id}`, {
      method: 'DELETE',
      headers,
    });
    return await handleResponse(response);
  } catch (err: any) {
    return { success: false, message: 'Lỗi mạng khi xóa lịch học: ' + (err?.message || '') };
  }
}

