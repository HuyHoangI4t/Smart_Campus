import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationItem, CampusPath } from "../types";
import { TAY_NGUYEN_CAMPUS_LOCATIONS } from "../constants";
import { apiGetMapLocations, apiGetCampusPaths } from "../../../services/api";

const LOCATIONS_CACHE_KEY = "@offline_map_locations";
const PATHS_CACHE_KEY = "@offline_campus_paths";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class MapDataCache {
  private memLocations: CacheItem<LocationItem[]> | null = null;
  private memPaths: CacheItem<CampusPath[]> | null = null;
  private inflightLocationsPromise: Promise<LocationItem[]> | null = null;
  private inflightPathsPromise: Promise<CampusPath[]> | null = null;

  /**
   * Lấy danh sách địa điểm (Ưu tiên Memory Cache -> AsyncStorage -> API)
   * Tốc độ: 0ms nếu có trong memory cache
   */
  async getLocations(forceRefresh = false): Promise<LocationItem[]> {
    const now = Date.now();
    if (!forceRefresh && this.memLocations && now - this.memLocations.timestamp < CACHE_TTL_MS) {
      return this.memLocations.data;
    }

    if (this.inflightLocationsPromise) {
      return this.inflightLocationsPromise;
    }

    this.inflightLocationsPromise = (async () => {
      // 1. Thử đọc nhanh từ AsyncStorage nếu chưa có trong RAM
      if (!this.memLocations) {
        try {
          const stored = await AsyncStorage.getItem(LOCATIONS_CACHE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.memLocations = { data: parsed, timestamp: now };
              // Nếu không bị forceRefresh, trả về ngay lập tức để render tức thì
              if (!forceRefresh) {
                this.revalidateLocationsInBackground();
                return parsed;
              }
            }
          }
        } catch {
          // Bỏ qua lỗi đọc cache
        }
      }

      // 2. Tải từ API Backend
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

          this.memLocations = { data: normalized, timestamp: Date.now() };
          AsyncStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify(normalized)).catch(() => {});
          return normalized;
        }
      } catch {
        // Dự phòng: nếu API lỗi và chưa có gì, trả về 37 địa điểm mặc định
      }

      const fallback = this.memLocations ? this.memLocations.data : TAY_NGUYEN_CAMPUS_LOCATIONS;
      this.memLocations = { data: fallback, timestamp: Date.now() };
      return fallback;
    })().finally(() => {
      this.inflightLocationsPromise = null;
    });

    return this.inflightLocationsPromise;
  }

  /**
   * Lấy mạng lưới đường đi nội bộ khuôn viên
   */
  async getPaths(forceRefresh = false): Promise<CampusPath[]> {
    const now = Date.now();
    if (!forceRefresh && this.memPaths && now - this.memPaths.timestamp < CACHE_TTL_MS) {
      return this.memPaths.data;
    }

    if (this.inflightPathsPromise) {
      return this.inflightPathsPromise;
    }

    this.inflightPathsPromise = (async () => {
      if (!this.memPaths) {
        try {
          const stored = await AsyncStorage.getItem(PATHS_CACHE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.memPaths = { data: parsed, timestamp: now };
              if (!forceRefresh) {
                this.revalidatePathsInBackground();
                return parsed;
              }
            }
          }
        } catch {
          // Bỏ qua lỗi
        }
      }

      try {
        const pathsRes = await apiGetCampusPaths();
        if (pathsRes && pathsRes.paths && Array.isArray(pathsRes.paths)) {
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

          this.memPaths = { data: normalized, timestamp: Date.now() };
          AsyncStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(normalized)).catch(() => {});
          return normalized;
        }
      } catch {
        // Bỏ qua lỗi mạng
      }

      return this.memPaths ? this.memPaths.data : [];
    })().finally(() => {
      this.inflightPathsPromise = null;
    });

    return this.inflightPathsPromise;
  }

  private revalidateLocationsInBackground() {
    setTimeout(async () => {
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
          this.memLocations = { data: normalized, timestamp: Date.now() };
          AsyncStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify(normalized)).catch(() => {});
        }
      } catch {
        // Im lặng khi chạy ngầm
      }
    }, 1000);
  }

  private revalidatePathsInBackground() {
    setTimeout(async () => {
      try {
        const pathsRes = await apiGetCampusPaths();
        if (pathsRes && pathsRes.paths && Array.isArray(pathsRes.paths)) {
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
          this.memPaths = { data: normalized, timestamp: Date.now() };
          AsyncStorage.setItem(PATHS_CACHE_KEY, JSON.stringify(normalized)).catch(() => {});
        }
      } catch {
        // Im lặng khi chạy ngầm
      }
    }, 1500);
  }
}

export const mapCache = new MapDataCache();

