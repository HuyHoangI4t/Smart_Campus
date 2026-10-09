import { useState, useEffect, useMemo, useCallback } from "react";
import { LocationItem, CampusPath } from "../types";
import { TAY_NGUYEN_CAMPUS_LOCATIONS } from "../constants";
import { mapCache } from "../services/mapCache";
import { findLocationByRoomOrQuery, parseCampusRoom, HOUSE_NUM_TO_ID, calculateDistanceKm } from "../utils";

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
  const [campusPaths, setCampusPaths] = useState<CampusPath[]>([]);
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

  // Cập nhật khi params từ navigation thay đổi (ví dụ: bấm từ thời khóa biểu)
  useEffect(() => {
    const roomParam = params.room ? String(params.room).trim() : "";
    const subjectParam = params.subject ? String(params.subject).trim() : "";
    const buildingParam = params.building ? String(params.building).trim() : "";
    const buildingCodeParam = params.buildingCode ? String(params.buildingCode).trim() : "";
    const searchParam = params.search ? String(params.search).trim() : "";

    const query = buildingParam || buildingCodeParam || roomParam || searchParam;
    if (!query) return;

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
      params.onFocusLocation?.(matched);
    }
  }, [params.room, params.subject, params.building, params.buildingCode, params.search, params.t, locations]);

  // Lọc kết quả tìm kiếm được memoized tối ưu CPU
  const searchResults = useMemo(() => {
    let list = locations;
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((loc) => loc.category.toLowerCase() === selectedCategory.toLowerCase());
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

  // Tính khoảng cách tới địa điểm đang chọn
  const computedDistanceKm = useMemo(() => {
    if (!selectedLoc || !params.userLocation) return null;
    return calculateDistanceKm(
      params.userLocation.latitude,
      params.userLocation.longitude,
      selectedLoc.lat,
      selectedLoc.lng
    );
  }, [selectedLoc, params.userLocation]);

  const computedDistanceText = useMemo(() => {
    if (computedDistanceKm === null) return "";
    return computedDistanceKm < 1
      ? `~${Math.round(computedDistanceKm * 1000)}m`
      : `~${computedDistanceKm.toFixed(1)}km`;
  }, [computedDistanceKm]);

  const computedWalkingMinutes = useMemo(() => {
    if (computedDistanceKm === null) return null;
    return Math.max(1, Math.ceil((computedDistanceKm * 1000) / 80));
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
    searchResults,
    currentParsed,
    matchedTargetId,
    computedDistanceKm,
    computedDistanceText,
    computedWalkingMinutes,
  };
}
