import AsyncStorage from '@react-native-async-storage/async-storage';
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
        // Tự động xả hàng đợi đồng bộ các thay đổi lịch đã tạo ngoại tuyến trước đó
        syncPendingScheduleMutations().catch(() => {});
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

// ─── OFFLINE MUTATION QUEUE & SYNC ENGINE ─────────────────────────────────────
export interface PendingScheduleMutation {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  tempId?: string;
  id?: string | number;
  payload?: any;
  createdAt: number;
}

const MUTATIONS_STORAGE_KEY = '@offline_schedule_mutations';

export async function getPendingScheduleMutations(): Promise<PendingScheduleMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(MUTATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addPendingScheduleMutation(mutation: PendingScheduleMutation): Promise<void> {
  try {
    const list = await getPendingScheduleMutations();
    list.push(mutation);
    await AsyncStorage.setItem(MUTATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export async function clearPendingScheduleMutations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MUTATIONS_STORAGE_KEY);
  } catch {}
}

export async function syncPendingScheduleMutations(): Promise<number> {
  const mutations = await getPendingScheduleMutations();
  if (mutations.length === 0) return 0;

  let syncedCount = 0;
  const remaining: PendingScheduleMutation[] = [];

  for (const item of mutations) {
    try {
      const headers = await getAuthHeaders();
      if (item.action === 'CREATE' && item.payload) {
        const res = await fetchWithTimeout(
          `${API_BASE_URL}/student/schedule/custom`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          },
          5000
        );
        if (res.ok) syncedCount++;
        else remaining.push(item);
      } else if (item.action === 'UPDATE' && item.id && item.payload) {
        const res = await fetchWithTimeout(
          `${API_BASE_URL}/student/schedule/custom/${item.id}`,
          {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          },
          5000
        );
        if (res.ok) syncedCount++;
        else remaining.push(item);
      } else if (item.action === 'DELETE' && item.id) {
        const res = await fetchWithTimeout(
          `${API_BASE_URL}/student/schedule/custom/${item.id}`,
          {
            method: 'DELETE',
            headers,
          },
          5000
        );
        if (res.ok) syncedCount++;
        else remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    await AsyncStorage.setItem(MUTATIONS_STORAGE_KEY, JSON.stringify(remaining));
  } else {
    await clearPendingScheduleMutations();
  }

  return syncedCount;
}

export async function apiCreateCustomSchedule(payload: CustomSchedulePayload) {
  try {
    clearTtlCache('schedule_');
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/student/schedule/custom`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      5000
    );
    const result = await handleResponse(response);
    if (result && result.success) return result;
    throw new Error(result?.message || 'Lỗi server');
  } catch (err: any) {
    // Lưu vào hàng đợi ngoại tuyến để tự động đồng bộ khi có mạng
    const tempId = `offline_${Date.now()}`;
    await addPendingScheduleMutation({
      action: 'CREATE',
      tempId,
      payload,
      createdAt: Date.now(),
    });
    return {
      success: true,
      isOfflineQueued: true,
      message: 'Đã lưu lịch học ngoại tuyến (sẽ tự động đồng bộ lên hệ thống khi có mạng).',
      data: { id: tempId, ...payload },
    };
  }
}

export async function apiUpdateCustomSchedule(id: string | number, payload: Partial<CustomSchedulePayload>) {
  try {
    clearTtlCache('schedule_');
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/student/schedule/custom/${id}`,
      {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      5000
    );
    const result = await handleResponse(response);
    if (result && result.success) return result;
    throw new Error(result?.message || 'Lỗi server');
  } catch (err: any) {
    await addPendingScheduleMutation({
      action: 'UPDATE',
      id,
      payload,
      createdAt: Date.now(),
    });
    return {
      success: true,
      isOfflineQueued: true,
      message: 'Đã cập nhật lịch học ngoại tuyến (sẽ tự động đồng bộ khi có mạng).',
    };
  }
}

export async function apiDeleteCustomSchedule(id: string | number) {
  try {
    clearTtlCache('schedule_');
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/student/schedule/custom/${id}`,
      {
        method: 'DELETE',
        headers,
      },
      5000
    );
    const result = await handleResponse(response);
    if (result && result.success) return result;
    throw new Error(result?.message || 'Lỗi server');
  } catch (err: any) {
    await addPendingScheduleMutation({
      action: 'DELETE',
      id,
      createdAt: Date.now(),
    });
    return {
      success: true,
      isOfflineQueued: true,
      message: 'Đã xóa lịch học ngoại tuyến.',
    };
  }
}

