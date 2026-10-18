import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { LocationItem, CampusPath } from "../types";
import { TAY_NGUYEN_CAMPUS_LOCATIONS } from "../constants";
import { DEFAULT_CAMPUS_PATHS } from "../campusPaths";
import { mapCache } from "../services/mapCache";
import { findLocationByRoomOrQuery, parseCampusRoom, calculateDistanceKm, findWalkwayDistanceMeters } from "../utils";

interface UseMapDataParams {
  search?: string;
  room?: string;
  subject?: string;
  building?: string;
  buildingCode?: string;
  t?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onFocusLocation?: (loc: LocationItem) => void;
}

export function useMapData(params: UseMapDataParams = {}) {
  const [locations, setLocations] = useState<LocationItem[]>(TAY_NGUYEN_CAMPUS_LOCATIONS);
  const [campusPaths, setCampusPaths] = useState<CampusPath[]>(DEFAULT_CAMPUS_PATHS);
  const [search, setSearch] = useState<string>(params.search ? String(params.search).trim() : "");
  const [targetRoom, setTargetRoom] = useState<string>(params.room ? String(params.room).trim() : "");
  const [targetSubject, setTargetSubject] = useState<string>(params.subject ? String(params.subject).trim() : "");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Chọn địa điểm ban đầu
  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(() => {
    const query = params.building || params.room || params.search || "";
    if (query) {
      const matched = findLocationByRoomOrQuery(String(query), TAY_NGUYEN_CAMPUS_LOCATIONS);
      if (matched) return matched;
    }
    return null;
  });

  // Tải dữ liệu siêu tốc qua Cache & AsyncStorage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [locs, paths] = await Promise.all([
        mapCache.getLocations(),
        mapCache.getPaths(),
      ]);
      if (isMounted) {
        if (locs && locs.length > 0) setLocations(locs);
        if (paths && paths.length > 0) setCampusPaths(paths);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ref lưu callback onFocusLocation tránh re-render liên tục gây rung bản đồ
  const onFocusLocationRef = useRef(params.onFocusLocation);
  onFocusLocationRef.current = params.onFocusLocation;

  // Ref lưu khóa nhận diện lượt chuyển hướng đã xử lý (chống loop và cho phép đóng card vị trí)
  const lastHandledParamsKeyRef = useRef<string>("");

  // Cập nhật khi params từ navigation thay đổi (ví dụ: bấm từ thời khóa biểu)
  const { room, subject, building, buildingCode, search: searchP, t } = params;
  useEffect(() => {
    const roomParam = room ? String(room).trim() : "";
    const subjectParam = subject ? String(subject).trim() : "";
    const buildingParam = building ? String(building).trim() : "";
    const buildingCodeParam = buildingCode ? String(buildingCode).trim() : "";
    const searchParam = searchP ? String(searchP).trim() : "";

    const query = buildingParam || buildingCodeParam || roomParam || searchParam;
    if (!query) return;

    const currentKey = `${buildingParam}__${buildingCodeParam}__${roomParam}__${searchParam}__${t || ""}`;
    // Nếu lượt chuyển hướng này đã được xử lý rồi, bỏ qua hoàn toàn để tránh lặp lại & cho phép đóng card
    if (lastHandledParamsKeyRef.current === currentKey) return;
    lastHandledParamsKeyRef.current = currentKey;

    if (roomParam) setTargetRoom(roomParam);
    if (subjectParam) setTargetSubject(subjectParam);
    if (searchParam) setSearch(searchParam);

    const matched =
      (buildingParam ? findLocationByRoomOrQuery(buildingParam, locations) : null) ||
      (buildingCodeParam ? findLocationByRoomOrQuery(buildingCodeParam, locations) : null) ||
      (roomParam ? findLocationByRoomOrQuery(roomParam, locations) : null) ||
      (searchParam ? findLocationByRoomOrQuery(searchParam, locations) : null);

    if (matched) {
      setSelectedLoc(matched);
      onFocusLocationRef.current?.(matched);
    }
  }, [room, subject, building, buildingCode, searchP, t, locations]);

  // Hàm chủ động đóng thông tin địa điểm (người dùng bấm nút đóng)
  const dismissSelectedLoc = () => {
    setSelectedLoc(null);
    setTargetRoom("");
    setTargetSubject("");
  };

  // Lọc kết quả tìm kiếm được memoized tối ưu CPU
  const searchResults = useMemo(() => {
    let list = locations;
    if (selectedCategory && selectedCategory !== "all") {
      const isWc = selectedCategory.toLowerCase() === "wc";
      list = list.filter((loc) => {
        if (isWc) {
          return (
            loc.category?.toLowerCase() === "wc" ||
            loc.name?.toLowerCase().includes("wc") ||
            (loc.description && loc.description.toLowerCase().includes("vệ sinh"))
          );
        }
        return loc.category?.toLowerCase() === selectedCategory.toLowerCase();
      });
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;

    const matchedByRoom = findLocationByRoomOrQuery(q, locations);
    const filtered = list.filter((loc) => {
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.building.toLowerCase().includes(q) ||
        loc.category.toLowerCase().includes(q) ||
        (loc.description && loc.description.toLowerCase().includes(q))
      );
    });

    if (matchedByRoom) {
      const rest = filtered.filter((l) => l.id !== matchedByRoom.id);
      return [matchedByRoom, ...rest];
    }

    return filtered;
  }, [search, selectedCategory, locations]);

  const currentParsed = useMemo(() => {
    return targetRoom ? parseCampusRoom(targetRoom) : null;
  }, [targetRoom]);

  const matchedTargetId = useMemo(() => {
    return targetRoom ? parseCampusRoom(targetRoom).buildingNumber : null;
  }, [targetRoom]);

  // Tọa độ người dùng làm tròn 4 chữ số thập phân (~11m) làm mốc phụ thuộc cho useMemo
  // Ngăn chặn hoàn toàn hiện tượng chip GPS rung/nhiễu vi mô (<5m) kích hoạt tính lại Dijkstra
  const userLatQuantized = params.userLocation ? Math.round(params.userLocation.latitude * 10000) / 10000 : null;
  const userLngQuantized = params.userLocation ? Math.round(params.userLocation.longitude * 10000) / 10000 : null;

  // Tính khoảng cách tới địa điểm đang chọn theo mạng lưới đường đi bộ nội bộ (Dijkstra)
  const computedDistanceKm = useMemo(() => {
    if (!selectedLoc || !params.userLocation) return null;

    // 1. Ưu tiên tính theo mạng lưới lối đi bộ nội bộ trường ĐH Tây Nguyên (Dijkstra)
    const walkwayMeters = findWalkwayDistanceMeters(
      params.userLocation.latitude,
      params.userLocation.longitude,
      selectedLoc.lat,
      selectedLoc.lng,
      campusPaths
    );
    if (walkwayMeters !== null && walkwayMeters > 0) {
      return walkwayMeters / 1000;
    }

    // 2. Dự phòng (Fallback): Đường thẳng chim bay
    return calculateDistanceKm(
      params.userLocation.latitude,
      params.userLocation.longitude,
      selectedLoc.lat,
      selectedLoc.lng
    );
  }, [selectedLoc?.id, userLatQuantized, userLngQuantized, campusPaths.length]);

  const computedDistanceText = useMemo(() => {
    if (computedDistanceKm === null) return "";
    return computedDistanceKm < 1
      ? `~${Math.round(computedDistanceKm * 1000)}m`
      : `~${computedDistanceKm.toFixed(1)}km`;
  }, [computedDistanceKm]);

  const computedWalkingMinutes = useMemo(() => {
    if (computedDistanceKm === null) return null;
    return Math.max(1, Math.ceil((computedDistanceKm * 1000) / 75)); // ~75m/phút đi bộ chuẩn
  }, [computedDistanceKm]);

  return {
    locations,
    campusPaths,
    search,
    setSearch,
    targetRoom,
    setTargetRoom,
    targetSubject,
    setTargetSubject,
    selectedCategory,
    setSelectedCategory,
    showSuggestions,
    setShowSuggestions,
    selectedLoc,
    setSelectedLoc,
    dismissSelectedLoc,
    searchResults,
    currentParsed,
    matchedTargetId,
    computedDistanceKm,
    computedDistanceText,
    computedWalkingMinutes,
  };
}
