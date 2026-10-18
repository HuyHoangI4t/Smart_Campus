import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { ScheduleSkeleton } from "../../../src/components/Skeleton";
import { useTabBarScrollHandler } from "../../../src/components/MainTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiGetSchedule,
  readLocalCache,
  apiCreateCustomSchedule,
  apiUpdateCustomSchedule,
  apiDeleteCustomSchedule,
  CustomSchedulePayload,
} from "../../../src/services/api";

import {
  ScheduleItem,
  AvailableWeekItem,
  WeekDateItem,
  CustomScheduleType,
  DAYS,
  PERIOD_OPTIONS,
  FALLBACK_SCHEDULE,
  getTodayDayNum,
  parseWeekRangeDates,
  formatDateVN,
  formatDateShort,
  parseDateVN,
  getDayNumFromDate,
  getWeekRangeFromDate,
  parseRoomDirections,
  ScheduleWeekBar,
  ScheduleDayBar,
  ScheduleCard,
  ScheduleCustomModal,
  ScheduleRoomDirectionModal,
} from "../../../src/features/schedule";

export default function ScheduleScreen() {
  const router = useRouter();
  const { onScroll: onTabBarScroll, bottomPadding } = useTabBarScrollHandler();
  const todayDayNum = getTodayDayNum();

  const [selectedDay, setSelectedDay] = useState(todayDayNum);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(FALLBACK_SCHEDULE);
  const [studentInfo, setStudentInfo] = useState<{ mssv: string; name: string }>({ mssv: "", name: "" });
  const [weekRangeText, setWeekRangeText] = useState("Từ ngày 28/09/2026 đến ngày 04/10/2026");
  const [availableWeeks, setAvailableWeeks] = useState<AvailableWeekItem[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [nextWeekIndex, setNextWeekIndex] = useState<number>(1);
  const [isSunday, setIsSunday] = useState<boolean>(new Date().getDay() === 0);
  const [selectedScheduleForDirection, setSelectedScheduleForDirection] = useState<ScheduleItem | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // States cho CRUD lịch học thủ công / thực hành đột xuất
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formCourse, setFormCourse] = useState("");
  const [formType, setFormType] = useState<CustomScheduleType>("dot_xuat");
  const [formDayNum, setFormDayNum] = useState<number>(todayDayNum);
  const [formDate, setFormDate] = useState("");
  const [formWeekRange, setFormWeekRange] = useState("");
  const [formTime, setFormTime] = useState("Tiết 7-10");
  const [formRoom, setFormRoom] = useState("");
  const [formLecturer, setFormLecturer] = useState("");
  const [formNote, setFormNote] = useState("");
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);

  // Danh sách các ngày trong tuần đang xem kèm ngày tháng cụ thể (DD/MM)
  const weekDates = useMemo<WeekDateItem[]>(() => {
    const { startDate } = parseWeekRangeDates(weekRangeText);
    if (!startDate) {
      const now = new Date();
      const jsDay = now.getDay();
      const distToMon = (jsDay + 6) % 7;
      const mon = new Date(now);
      mon.setDate(now.getDate() - distToMon);
      return [2, 3, 4, 5, 6, 7, 1].map((num, idx) => {
        const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + idx);
        return {
          num,
          label: num === 1 ? "CN" : `Thứ ${num}`,
          dateStr: formatDateVN(d),
          dateShort: formatDateShort(d),
          dateObj: d,
        };
      });
    }
    return [2, 3, 4, 5, 6, 7, 1].map((num, idx) => {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + idx);
      return {
        num,
        label: num === 1 ? "CN" : `Thứ ${num}`,
        dateStr: formatDateVN(d),
        dateShort: formatDateShort(d),
        dateObj: d,
      };
    });
  }, [weekRangeText]);

  const resetForm = useCallback((targetDay?: number) => {
    setIsEditing(false);
    setEditingId(null);
    setFormCourse("");
    setFormType("dot_xuat");
    const target = targetDay || selectedDay;
    setFormDayNum(target);
    const matchedDate = weekDates.find((w) => w.num === target);
    const initDate = matchedDate ? matchedDate.dateStr : formatDateVN(new Date());
    setFormDate(initDate);
    setFormWeekRange(weekRangeText);
    setFormTime("Tiết 7-10");
    setFormRoom("");
    setFormLecturer("");
    setFormNote("");
    setPeriodDropdownOpen(false);
    setIsCustomTime(false);
  }, [selectedDay, weekDates, weekRangeText]);

  const handleOpenAddModal = (targetDay?: number) => {
    resetForm(targetDay);
    setModalVisible(true);
  };

  const handleOpenEditModal = useCallback((item: ScheduleItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormCourse(item.course);
    setFormType((item.type as CustomScheduleType) || "dot_xuat");
    setFormDayNum(item.dayNum);
    const matchedDate = weekDates.find((w) => w.num === item.dayNum);
    setFormDate(item.date || item.ngay_hoc || (matchedDate ? matchedDate.dateStr : formatDateVN(new Date())));
    setFormWeekRange(item.week_range || weekRangeText);
    setFormTime(item.time || "Tiết 7-10");
    setFormRoom(item.room);
    setFormLecturer(item.lecturer || "");
    setFormNote(item.note || "");
    setPeriodDropdownOpen(false);
    const matchedPreset = PERIOD_OPTIONS.some((p) => p.label === item.time);
    setIsCustomTime(!matchedPreset && !!item.time);
    setModalVisible(true);
  }, [weekDates, weekRangeText]);

  const handleSelectDate = (dateStr: string) => {
    setFormDate(dateStr);
    const parsed = parseDateVN(dateStr);
    if (parsed) {
      const computedDayNum = getDayNumFromDate(parsed);
      setFormDayNum(computedDayNum);
      const computedWeek = getWeekRangeFromDate(parsed);
      setFormWeekRange(computedWeek);
    }
  };

  const handleShiftDate = (daysOffset: number) => {
    const cur = parseDateVN(formDate) || new Date();
    const next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + daysOffset);
    handleSelectDate(formatDateVN(next));
  };

  const handleSaveSchedule = async () => {
    if (!formCourse.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên môn học hoặc ca thực hành.");
      return;
    }
    if (!formRoom.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập phòng học.");
      return;
    }

    const dayObj = DAYS.find((d) => d.num === formDayNum) || DAYS[0];
    const thuStr = dayObj.num === 1 ? "CN" : dayObj.label;
    const cleanDate = formDate.trim();

    setSubmitting(true);
    try {
      const payload: CustomSchedulePayload = {
        ten_hp: formCourse.trim(),
        thu: thuStr,
        tiet: formTime.trim(),
        phong: formRoom.trim(),
        giang_vien: formLecturer.trim(),
        ghi_chu: formNote.trim(),
        loai_lich: formType,
        ngay_hoc: cleanDate || undefined,
        week_range: formWeekRange || undefined,
      };

      if (isEditing && editingId !== null) {
        await apiUpdateCustomSchedule(editingId, payload);
        const updatedList = scheduleList.map((item) => {
          if (item.id === editingId) {
            return {
              ...item,
              course: formCourse.trim(),
              code: thuStr,
              day: thuStr,
              dayNum: formDayNum,
              time: formTime.trim().startsWith("Tiết") ? formTime.trim() : (formTime.includes(":") ? formTime.trim() : `Tiết ${formTime.trim()}`),
              room: formRoom.trim(),
              lecturer: formLecturer.trim() || "Chưa có GV",
              note: formNote.trim(),
              type: formType,
              date: cleanDate,
              dateShort: cleanDate ? cleanDate.substring(0, 5) : undefined,
              ngay_hoc: cleanDate,
              week_range: formWeekRange,
              direction: parseRoomDirections(formRoom.trim()),
            };
          }
          return item;
        });
        setScheduleList(updatedList);
        setSelectedDay(formDayNum);
        Alert.alert("Thành công", `Đã cập nhật lịch học ngày ${cleanDate || thuStr}.`);
      } else {
        const res = await apiCreateCustomSchedule(payload);
        const newId = res?.data?.id || `custom-${Date.now()}`;
        const newItem: ScheduleItem = {
          id: newId,
          course: formCourse.trim(),
          code: thuStr,
          day: thuStr,
          dayNum: formDayNum,
          time: formTime.trim().startsWith("Tiết") ? formTime.trim() : (formTime.includes(":") ? formTime.trim() : `Tiết ${formTime.trim()}`),
          room: formRoom.trim(),
          lecturer: formLecturer.trim() || "Chưa có GV",
          isCustom: true,
          note: formNote.trim(),
          type: formType,
          date: cleanDate,
          dateShort: cleanDate ? cleanDate.substring(0, 5) : undefined,
          ngay_hoc: cleanDate,
          week_range: formWeekRange,
          direction: parseRoomDirections(formRoom.trim()),
        };

        const range = parseWeekRangeDates(weekRangeText);
        const targetD = parseDateVN(cleanDate);
        const isInsideCurrentWeek = targetD && range.startDate && range.endDate
          ? (targetD >= range.startDate && targetD <= range.endDate)
          : true;

        if (isInsideCurrentWeek) {
          const newList = [...scheduleList, newItem];
          setScheduleList(newList);
          setSelectedDay(formDayNum);
          Alert.alert("Thành công", `Đã thêm lịch vào ${thuStr}, ngày ${cleanDate}.`);
        } else {
          Alert.alert(
            "Đã thêm lịch học",
            `Lịch học đã được lưu thành công vào ngày ${cleanDate} (${formWeekRange}). Bạn có thể chuyển sang tuần tương ứng để theo dõi.`
          );
        }
      }

      setModalVisible(false);
      resetForm();
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể lưu lịch: " + (err?.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = useCallback((item: ScheduleItem) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa lịch "${item.course}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteCustomSchedule(item.id);
              setScheduleList((prev) => prev.filter((s) => s.id !== item.id));
              Alert.alert("Đã xóa", "Lịch học đã được xóa thành công.");
            } catch (err: any) {
              Alert.alert("Lỗi", "Không thể xóa lịch: " + (err?.message || ""));
            }
          },
        },
      ]
    );
  }, []);

  const fetchSchedule = async (forceReload = false, weekOpts?: { week?: string; weekOffset?: number; weekIndex?: number }) => {
    try {
      const userStr = await AsyncStorage.getItem("@auth_user");
      let mssv = "";
      let name = "";
      if (userStr) {
        const u = JSON.parse(userStr);
        mssv = u.mssv || u.masv || "";
        name = u.ho_ten || u.fullName || "";
        setStudentInfo({ mssv, name });
      }

      const isRealAccount = mssv && mssv !== "guest";
      const cacheKey = `@offline_schedule_${isRealAccount ? mssv : 'current'}`;

      if (!forceReload && !weekOpts) {
        const cached = await readLocalCache<any>(cacheKey);
        if (cached && cached.data) {
          if (cached.data.weekRange) setWeekRangeText(cached.data.weekRange);
          if (cached.data.availableWeeks && Array.isArray(cached.data.availableWeeks)) {
            setAvailableWeeks(cached.data.availableWeeks);
          }
          if (cached.data.selectedWeekIndex !== undefined) setSelectedWeekIndex(cached.data.selectedWeekIndex);
          if (cached.data.currentWeekIndex !== undefined) setCurrentWeekIndex(cached.data.currentWeekIndex);
          if (cached.data.nextWeekIndex !== undefined) setNextWeekIndex(cached.data.nextWeekIndex);
          if (cached.data.isSunday !== undefined) setIsSunday(cached.data.isSunday);
          if (cached.data.schedules && cached.data.schedules.length > 0) {
            setScheduleList(cached.data.schedules);
            setLoading(false);
          }
        }
      }

      const res = await apiGetSchedule(isRealAccount ? mssv : undefined, forceReload, weekOpts);

      if (res && res.isOfflineCache) {
        setIsOfflineData(true);
        setCachedAt(res.cachedAt || null);
      } else {
        setIsOfflineData(false);
      }

      if (res && res.success) {
        if (res.weekRange) {
          setWeekRangeText(res.weekRange);
        }
        if (res.isSunday !== undefined) setIsSunday(res.isSunday);
        if (res.currentWeekIndex !== undefined) setCurrentWeekIndex(res.currentWeekIndex);
        if (res.nextWeekIndex !== undefined) setNextWeekIndex(res.nextWeekIndex);
        if (res.selectedWeekIndex !== undefined) {
          setSelectedWeekIndex(res.selectedWeekIndex);
          if (res.isSunday && res.selectedWeekIndex === res.nextWeekIndex && selectedDay === 1) {
            const scheds = res.schedules || [];
            const hasSundayClass = scheds.some((s: any) => s.dayNum === 1);
            if (!hasSundayClass) {
              setSelectedDay(2);
            }
          }
        }
        if (res.availableWeeks && Array.isArray(res.availableWeeks)) {
          setAvailableWeeks(res.availableWeeks);
        }

        if (res.schedules && Array.isArray(res.schedules) && res.schedules.length > 0) {
          setScheduleList(res.schedules);
        }
      }
    } catch (error) {
      console.warn("Lỗi tải thời khóa biểu:", error);
      setIsOfflineData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectWeek = (w: AvailableWeekItem) => {
    setSelectedWeekIndex(w.index);
    setWeekRangeText(w.weekRange);
    if (w.schedules && Array.isArray(w.schedules) && w.schedules.length > 0) {
      setScheduleList(w.schedules);
      if (isSunday && w.isNext && selectedDay === 1) {
        const hasSundayClass = w.schedules.some((s) => s.dayNum === 1);
        if (!hasSundayClass) {
          setSelectedDay(2);
        }
      }
    } else {
      setLoading(true);
      fetchSchedule(false, { weekIndex: w.index });
    }
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule(true, { weekIndex: selectedWeekIndex });
  };

  const filtered = useMemo(() => {
    return scheduleList.filter((item) => item.dayNum === selectedDay);
  }, [scheduleList, selectedDay]);

  const subtitle =
    studentInfo.mssv && studentInfo.mssv !== "guest"
      ? `${weekRangeText}`
      : weekRangeText;

  const currentDirection = selectedScheduleForDirection
    ? ((selectedScheduleForDirection as any).direction || parseRoomDirections(selectedScheduleForDirection.room))
    : null;

  const handleOpenCampusMap = () => {
    const room = selectedScheduleForDirection?.room || "";
    const subject = selectedScheduleForDirection?.course || "";
    const building = currentDirection?.building || "";
    const buildingCode = currentDirection?.buildingCode || "";
    setSelectedScheduleForDirection(null);
    router.push({
      pathname: "/(main)/map",
      params: {
        room,
        subject,
        building,
        buildingCode,
        t: Date.now().toString(),
      },
    });
  };

  const handleOpenGoogleMaps = (building: string) => {
    const query = encodeURIComponent(`Trường Đại học ${building}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch((err) => {
      console.warn("Không thể mở Google Maps:", err);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Thời khóa biểu"
        subtitle={subtitle}
        rightElement={
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              handleOpenAddModal(selectedDay);
            }}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.35)",
              },
              pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Thêm lịch học mới"
          >
            <Feather name="plus-circle" size={15} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Thêm lịch</Text>
          </Pressable>
        }
      />

      {/* 1. THANH CHỌN TUẦN HỌC */}
      <ScheduleWeekBar
        availableWeeks={availableWeeks}
        selectedWeekIndex={selectedWeekIndex}
        currentWeekIndex={currentWeekIndex}
        nextWeekIndex={nextWeekIndex}
        isSunday={isSunday}
        onSelectWeek={handleSelectWeek}
      />

      {/* 2. THANH CHỌN THỨ TRONG TUẦN */}
      <ScheduleDayBar
        selectedDay={selectedDay}
        todayDayNum={todayDayNum}
        isViewingCurrentWeek={selectedWeekIndex === currentWeekIndex}
        weekDates={weekDates}
        onSelectDay={setSelectedDay}
      />

      {/* 3. DANH SÁCH LỊCH HỌC */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isOfflineData && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FEF3C7",
              borderWidth: 1,
              borderColor: "#FDE68A",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <Feather name="wifi-off" size={15} color="#D97706" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", flex: 1 }}>
              Đang xem lịch học lưu ngoại tuyến {cachedAt ? `(lưu lúc ${cachedAt})` : ""} • Vuốt xuống để cập nhật lại
            </Text>
          </View>
        )}

        {loading || refreshing ? (
          <ScheduleSkeleton />
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: "center" }}>
            <Feather name="calendar" size={48} color={AppColors.cardBorder} />
            <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: AppColors.text }}>Không có tiết học</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: AppColors.textMuted }}>Bạn được nghỉ trong ngày này!</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleOpenAddModal(selectedDay);
              }}
              style={({ pressed }) => [
                {
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: AppColors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  minHeight: 44, // Touch target >= 44pt
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Thêm lịch học cho ngày được chọn"
            >
              <Feather name="plus-circle" size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                Thêm lịch cho {DAYS.find((d) => d.num === selectedDay)?.label || "hôm nay"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((item) => {
              const matchedDate = weekDates.find((w) => w.num === selectedDay);
              return (
                <ScheduleCard
                  key={item.id}
                  item={item}
                  currentViewDate={item.date || item.ngay_hoc || matchedDate?.dateObj || matchedDate?.dateStr}
                  onSelectDirection={setSelectedScheduleForDirection}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteSchedule}
                />
              );
            })}
          </View>
        )}

        {/* Chú thích thông minh */}
        <View
          style={{
            marginTop: 20,
            padding: 14,
            backgroundColor: "#F8FAFC",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Feather name="info" size={14} color={AppColors.primary} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }}>Lưu ý tiết học</Text>
          </View>
          <Text style={{ fontSize: 12, color: AppColors.textSecondary, lineHeight: 18, marginBottom: 4 }}>
            • Buổi sáng: Tiết 1 bắt đầu từ 06:45, Tiết 4 kết thúc lúc 10:30.
          </Text>
          <Text style={{ fontSize: 12, color: AppColors.textSecondary, lineHeight: 18, marginBottom: 4 }}>
            • Buổi chiều: Tiết 7 bắt đầu từ 13:45, Tiết 10 kết thúc lúc 16:30.
          </Text>
          <Text style={{ fontSize: 12, color: AppColors.textSecondary, lineHeight: 18 }}>
            • Bấm &quot;Chỉ đường tới phòng&quot; để xem chỉ dẫn chi tiết và vị trí tòa nhà trên bản đồ trường.
          </Text>
        </View>
      </ScrollView>

      {/* 4. MODAL THÊM / SỬA LỊCH HỌC TÙY CHỈNH */}
      <ScheduleCustomModal
        visible={modalVisible}
        isEditing={isEditing}
        submitting={submitting}
        formCourse={formCourse}
        setFormCourse={setFormCourse}
        formType={formType}
        setFormType={setFormType}
        formDate={formDate}
        formTime={formTime}
        setFormTime={setFormTime}
        formRoom={formRoom}
        setFormRoom={setFormRoom}
        formLecturer={formLecturer}
        setFormLecturer={setFormLecturer}
        formNote={formNote}
        setFormNote={setFormNote}
        periodDropdownOpen={periodDropdownOpen}
        setPeriodDropdownOpen={setPeriodDropdownOpen}
        isCustomTime={isCustomTime}
        setIsCustomTime={setIsCustomTime}
        weekDates={weekDates}
        onSelectDate={handleSelectDate}
        onShiftDate={handleShiftDate}
        onSave={handleSaveSchedule}
        onClose={() => setModalVisible(false)}
      />

      {/* 5. MODAL HƯỚNG DẪN ĐƯỜNG ĐI CHI TIẾT */}
      <ScheduleRoomDirectionModal
        visible={!!selectedScheduleForDirection}
        item={selectedScheduleForDirection}
        direction={currentDirection}
        onClose={() => setSelectedScheduleForDirection(null)}
        onOpenCampusMap={handleOpenCampusMap}
        onOpenGoogleMaps={handleOpenGoogleMaps}
      />
    </View>
  );
}