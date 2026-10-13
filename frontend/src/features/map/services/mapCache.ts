import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationItem, CampusPath } from "../types";
import { TAY_NGUYEN_CAMPUS_LOCATIONS } from "../constants";
import { DEFAULT_CAMPUS_PATHS } from "../campusPaths";
import { apiGetMapLocations, apiGetCampusPaths } from "../../../services/api";

const LOCATIONS_CACHE_KEY = "@offline_map_locations_v2";
const PATHS_CACHE_KEY = "@offline_campus_paths_v2";
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút TTL

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

class MapDataCache {
  private memLocations: CacheEnvelope<LocationItem[]> | null = null;
  private memPaths: CacheEnvelope<CampusPath[]> | null = null;
  private inflightLocationsPromise: Promise<LocationItem[]> | null = null;
  private inflightPathsPromise: Promise<CampusPath[]> | null = null;
  private ttlMs: number = DEFAULT_CACHE_TTL_MS;

  constructor(ttlMs: number = DEFAULT_CACHE_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /**
   * Kiểm tra xem Memory Cache có còn hợp lệ trong khoảng TTL không
   */
  isLocationsCacheFresh(): boolean {
    if (!this.memLocations) return false;
    return Date.now() - this.memLocations.timestamp < this.ttlMs;
  }

  isPathsCacheFresh(): boolean {
    if (!this.memPaths) return false;
    return Date.now() - this.memPaths.timestamp < this.ttlMs;
  }

  /**
   * Lấy danh sách 37+ địa điểm trường:
   * 1. RAM Cache (0ms) nếu còn trong TTL
   * 2. AsyncStorage nếu còn trong TTL (tránh network call khi đổi tab)
   * 3. API Backend nếu cache đã hết hạn hoặc chưa có
   * 4. Fallback hằng số nếu offline hoàn toàn
   */
  async getLocations(forceRefresh = false): Promise<LocationItem[]> {
    const now = Date.now();

    // 1. Kiểm tra RAM Cache
    if (!forceRefresh && this.memLocations && now - this.memLocations.timestamp < this.ttlMs) {
      return this.memLocations.data;
    }

    // 2. Chống request bão hòa trùng lặp (Inflight deduplication)
    if (this.inflightLocationsPromise) {
      return this.inflightLocationsPromise;
    }

    this.inflightLocationsPromise = (async () => {
      let diskEnvelope: CacheEnvelope<LocationItem[]> | null = null;
      // 3. Đọc từ AsyncStorage nếu chưa có trong RAM
      try {
        const stored = await AsyncStorage.getItem(LOCATIONS_CACHE_KEY);
        if (stored) {
          diskEnvelope = JSON.parse(stored);
          if (
            !forceRefresh &&
            diskEnvelope &&
            Array.isArray(diskEnvelope.data) &&
            diskEnvelope.data.length > 0 &&
            now - diskEnvelope.timestamp < this.ttlMs
          ) {
            this.memLocations = diskEnvelope;
            return diskEnvelope.data;
          }
        }
      } catch {
        // Bỏ qua lỗi đọc AsyncStorage
      }

      // 4. Tải từ API Backend
      try {
        const res = await apiGetMapLocations();
        if (res && res.locations && Array.isArray(res.locations) && res.locations.length > 0) {
          const normalized: LocationItem[] = res.locations.map((l: any) => ({
            id: Number(l.id),
            name: String(l.name || ""),
            category: String(l.category || "Địa điểm"),
            building: String(l.building || l.name || ""),
            floor: String(l.floor || ""),
            description: String(l.description || ""),
            lat: Number(l.lat || 12.65067),
            lng: Number(l.lng || 108.02621),
            icon: String(l.icon || "map-pin"),
            x: Number(l.x ?? 50),
            y: Number(l.y ?? 50),
            color: String(l.color || "#2563EB"),
          }));

          const envelope: CacheEnvelope<LocationItem[]> = {
            data: normalized,
            timestamp: Date.now(),
          };
          this.memLocations = envelope;
          AsyncStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify(envelope)).catch(() => {});
          return normalized;
        }
      } catch {
        // Dự phòng khi mạng mất
      }

      // 5. Fallback dữ liệu: Ưu tiên RAM Cache -> Disk Cache (kể cả quá TTL) -> Hằng số tĩnh
      const fallback =
        this.memLocations?.data ||
        (diskEnvelope && Array.isArray(diskEnvelope.data) && diskEnvelope.data.length > 0 ? diskEnvelope.data : null) ||
        TAY_NGUYEN_CAMPUS_LOCATIONS;
      this.memLocations = { data: fallback, timestamp: Date.now() };
      return fallback;
    })().finally(() => {
      this.inflightLocationsPromise = null;
    });

    return this.inflightLocationsPromise;
  }

  /**
   * Lấy mạng lưới đường đi nội bộ khuôn viên trường:
   * Có TTL & AsyncStorage caching, tránh re-fetch trên mỗi lượt mở tab
   */
  async getPaths(forceRefresh = false): Promise<CampusPath[]> {
    const now = Date.now();

    if (!forceRefresh && this.memPaths && now - this.memPaths.timestamp < this.ttlMs) {
      return this.memPaths.data;
    }

    if (this.inflightPathsPromise) {
      return this.inflightPathsPromise;
    }

    this.inflightPathsPromise = (async () => {
      let diskEnvelope: CacheEnvelope<CampusPath[]> | null = null;
      try {
        const stored = await AsyncStorage.getItem(PATHS_CACHE_KEY);
        if (stored) {
          diskEnvelope = JSON.parse(stored);
          if (
            !forceRefresh &&
            diskEnvelope &&
            Array.isArray(diskEnvelope.data) &&
            diskEnvelope.data.length > 0 &&
            now - diskEnvelope.timestamp < this.ttlMs
          ) {
            this.memPaths = diskEnvelope;
            return diskEnvelope.data;
          }
        }
      } catch {
        // Bỏ qua lỗi
      }

      try {
        const pathsRes = await apiGetCampusPaths();
        if (pathsRes && pathsRes.paths && Array.isArray(pathsRes.paths) && pathsRes.paths.length > 0) {
          const normalized: CampusPath[] = pathsRes.paths.map((p: any) => ({
            id: Number(p.id),
            name: String(p.name || ""),
            path_type: String(p.path_type || "walkway"),
            coordinates: Array.isArray(p.coordinates)
              ? p.coordinates
              : typeof p.coordinates === "string"
              ? JSON.parse(p.coordinates)
              : [],
          }));

          const envelope: CacheEnvelope<CampusPath[]> = {
            data: normalized,
            timestamp: Date.now(),
          };
          this.memPaths = envelope;
          AsyncStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(envelope)).catch(() => {});
          return normalized;
        }
      } catch {
        // Bỏ qua lỗi mạng
      }

      // 5. Fallback dữ liệu tuyến đường nội bộ: RAM -> Disk -> Mặc định
      const fallbackPaths =
        this.memPaths?.data ||
        (diskEnvelope && Array.isArray(diskEnvelope.data) && diskEnvelope.data.length > 0 ? diskEnvelope.data : null) ||
        DEFAULT_CAMPUS_PATHS;
      this.memPaths = { data: fallbackPaths, timestamp: Date.now() };
      return fallbackPaths;
    })().finally(() => {
      this.inflightPathsPromise = null;
    });

    return this.inflightPathsPromise;
  }

  /**
   * Xóa sạch cache trong bộ nhớ và AsyncStorage khi cần làm mới dữ liệu
   */
  async clearCache(): Promise<void> {
    this.memLocations = null;
    this.memPaths = null;
    await Promise.all([
      AsyncStorage.removeItem(LOCATIONS_CACHE_KEY).catch(() => {}),
      AsyncStorage.removeItem(PATHS_CACHE_KEY).catch(() => {}),
    ]);
  }
}

export const mapCache = new MapDataCache();
