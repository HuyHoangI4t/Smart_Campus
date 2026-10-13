import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { SCHEDULE_TYPE_OPTIONS, PERIOD_OPTIONS } from "../constants";
import { WeekDateItem, CustomScheduleType } from "../types";
import { parseDateVN, formatDateVN, getDayLabelFromDate } from "../utils/dateUtils";

export interface ScheduleCustomModalProps {
  visible: boolean;
  isEditing: boolean;
  submitting: boolean;
  formCourse: string;
  setFormCourse: (v: string) => void;
  formType: CustomScheduleType;
  setFormType: (v: CustomScheduleType) => void;
  formDate: string;
  formTime: string;
  setFormTime: (v: string) => void;
  formRoom: string;
  setFormRoom: (v: string) => void;
  formLecturer: string;
  setFormLecturer: (v: string) => void;
  formNote: string;
  setFormNote: (v: string) => void;
  periodDropdownOpen: boolean;
  setPeriodDropdownOpen: (v: boolean) => void;
  isCustomTime: boolean;
  setIsCustomTime: (v: boolean) => void;
  weekDates: WeekDateItem[];
  onSelectDate: (d: string) => void;
  onShiftDate: (offset: number) => void;
  onSave: () => void;
  onClose: () => void;
}

export const ScheduleCustomModal = React.memo(function ScheduleCustomModal({
  visible,
  isEditing,
  submitting,
  formCourse,
  setFormCourse,
  formType,
  setFormType,
  formDate,
  formTime,
  setFormTime,
  formRoom,
  setFormRoom,
  formLecturer,
  setFormLecturer,
  formNote,
  setFormNote,
  periodDropdownOpen,
  setPeriodDropdownOpen,
  isCustomTime,
  setIsCustomTime,
  weekDates,
  onSelectDate,
  onShiftDate,
  onSave,
  onClose,
}: ScheduleCustomModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const dynamicMaxHeight = keyboardHeight > 0
    ? Math.max(260, windowHeight - keyboardHeight - (Platform.OS === "ios" ? 40 : 65))
    : windowHeight * 0.9;

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent
      animationType="slide"
      onRequestClose={() => {
        if (!submitting) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[
          styles.keyboardAvoid,
          Platform.OS === "android" && keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : null,
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (!submitting) onClose();
          }}
          style={{ flex: 1 }}
        />

        <View style={[styles.sheetContainer, { maxHeight: dynamicMaxHeight }]}>
          {/* Header Modal */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconCircle}>
                <Feather name={isEditing ? "edit" : "plus-circle"} size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditing ? "Chỉnh sửa lịch học" : "Thêm lịch học / Thực hành"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditing ? "Cập nhật thông tin ca học" : "Lịch thực hành đột xuất, học bù, kiểm tra"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              style={styles.closeBtn}
            >
              <Feather name="x" size={16} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.formContent,
              { paddingBottom: keyboardHeight > 0 ? 50 : 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Tên môn học */}
            <View>
              <Text style={styles.fieldLabel}>
                Tên môn học<Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <TextInput
                value={formCourse}
                onChangeText={setFormCourse}
                placeholder=""
                placeholderTextColor={AppColors.textMuted}
                style={styles.textInput}
              />
            </View>

            {/* Phân loại lịch */}
            <View>
              <Text style={styles.fieldLabel}>Phân loại lịch</Text>
              <View style={styles.typeGrid}>
                {SCHEDULE_TYPE_OPTIONS.map((t) => {
                  const isSel = formType === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setFormType(t.key as any)}
                      activeOpacity={0.7}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: isSel ? t.lightBg : "#F8FAFC",
                          borderWidth: isSel ? 1.5 : 1,
                          borderColor: isSel ? t.color : "#E2E8F0",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.typeIconCircle,
                          { backgroundColor: isSel ? t.bg : "#EDF2F7" },
                        ]}
                      >
                        <Feather name={t.icon as any} size={15} color={isSel ? t.color : "#64748B"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: isSel ? "700" : "600",
                            color: isSel ? t.color : AppColors.text,
                          }}
                          numberOfLines={1}
                        >
                          {t.label}
                        </Text>
                      </View>
                      {isSel && <Feather name="check" size={14} color={t.color} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Chọn ngày học */}
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <View style={styles.dateHeaderLeft}>
                  <View style={styles.calendarIconCircle}>
                    <Feather name="calendar" size={16} color={AppColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>
                      Ngày học <Text style={{ color: "#EF4444" }}>*</Text>
                    </Text>
                    <Text style={styles.dateSubText} numberOfLines={1}>
                      {formDate ? (() => {
                        const p = parseDateVN(formDate);
                        return p ? `${getDayLabelFromDate(p)}, ngày ${formDate}` : formDate;
                      })() : "Chọn ngày diễn ra ca học"}
                    </Text>
                  </View>
                </View>

                {/* Nút lùi / hôm nay / tiến ngày */}
                <View style={styles.shiftButtonGroup}>
                  <TouchableOpacity
                    onPress={() => onShiftDate(-1)}
                    activeOpacity={0.7}
                    style={styles.shiftArrowBtn}
                  >
                    <Feather name="chevron-left" size={14} color={AppColors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onSelectDate(formatDateVN(new Date()))}
                    activeOpacity={0.7}
                    style={styles.todayBtn}
                  >
                    <Text style={styles.todayBtnText}>Hôm nay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onShiftDate(1)}
                    activeOpacity={0.7}
                    style={styles.shiftArrowBtn}
                  >
                    <Feather name="chevron-right" size={14} color={AppColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Chọn nhanh 7 ngày */}
              <View>
                <Text style={styles.quickDateLabel}>Chọn nhanh các ngày trong tuần:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {weekDates.map((w) => {
                    const isSel = formDate === w.dateStr;
                    return (
                      <TouchableOpacity
                        key={w.num}
                        onPress={() => onSelectDate(w.dateStr)}
                        activeOpacity={0.7}
                        style={[
                          styles.quickDateChip,
                          {
                            backgroundColor: isSel ? AppColors.primary : "#FFFFFF",
                            borderColor: isSel ? AppColors.primary : "#E2E8F0",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: isSel ? "#FFFFFF" : AppColors.text }}>
                          {w.label}
                        </Text>
                        <Text style={{ fontSize: 10, color: isSel ? "rgba(255,255,255,0.85)" : AppColors.textMuted }}>
                          {w.dateShort}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Ô nhập ngày */}
              <View style={styles.manualDateRow}>
                <Text style={styles.manualDateText}>Nhập ngày:</Text>
                <TextInput
                  value={formDate}
                  onChangeText={onSelectDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={AppColors.textMuted}
                  style={styles.manualDateInput}
                />
              </View>
            </View>

            {/* Tiết học - Dropdown */}
            <View style={{ position: "relative", zIndex: periodDropdownOpen ? 1000 : 1, elevation: periodDropdownOpen ? 20 : 1 }}>
              <Text style={styles.fieldLabel}>
                Tiết học <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={{ position: "relative", zIndex: periodDropdownOpen ? 1001 : 1 }}>
                <TouchableOpacity
                  onPress={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                  activeOpacity={0.7}
                  style={[
                    styles.periodSelector,
                    { borderColor: periodDropdownOpen ? AppColors.primary : AppColors.cardBorder },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                    <Feather name="clock" size={14} color={AppColors.primary} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: formTime ? AppColors.text : AppColors.textMuted,
                      }}
                      numberOfLines={1}
                    >
                      {formTime || "Chọn tiết"}
                    </Text>
                  </View>
                  <Feather
                    name={periodDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={AppColors.textSecondary}
                  />
                </TouchableOpacity>

                {periodDropdownOpen && (
                  <View style={styles.periodDropdownList}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                      {PERIOD_OPTIONS.map((p) => {
                        const isSel = formTime === p.label;
                        return (
                          <TouchableOpacity
                            key={p.label}
                            onPress={() => {
                              setFormTime(p.label);
                              setIsCustomTime(false);
                              setPeriodDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                              styles.periodOptionItem,
                              { backgroundColor: isSel ? "#EEF2FF" : "#FFFFFF" },
                            ]}
                          >
                            <View>
                              <Text
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: isSel ? "700" : "600",
                                  color: isSel ? AppColors.primary : AppColors.text,
                                }}
                              >
                                {p.label}
                              </Text>
                              <Text style={{ fontSize: 10, color: AppColors.textMuted, marginTop: 1 }}>
                                {p.desc}
                              </Text>
                            </View>
                            {isSel && <Feather name="check" size={13} color={AppColors.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        onPress={() => {
                          setIsCustomTime(true);
                          setPeriodDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                        style={[
                          styles.periodOptionItem,
                          { backgroundColor: isCustomTime ? "#EEF2FF" : "#FAFAFA" },
                        ]}
                      >
                        <Feather name="edit-2" size={12} color={AppColors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.primary }}>
                          Tự nhập khác...
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}

                {isCustomTime && (
                  <TextInput
                    value={formTime}
                    onChangeText={setFormTime}
                    placeholder="Ví dụ: 13:50 - 15:30"
                    placeholderTextColor={AppColors.textMuted}
                    autoFocus
                    style={styles.customTimeInput}
                  />
                )}
              </View>
            </View>

            {/* Phòng học */}
            <View>
              <Text style={styles.fieldLabel}>
                Phòng <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <TextInput
                value={formRoom}
                onChangeText={setFormRoom}
                placeholder="Phòng học"
                placeholderTextColor={AppColors.textMuted}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 320, animated: true });
                  }, 120);
                }}
                style={styles.textInput}
              />
            </View>

            {/* Giảng viên */}
            <View>
              <Text style={styles.fieldLabel}>Giảng viên</Text>
              <TextInput
                value={formLecturer}
                onChangeText={setFormLecturer}
                placeholder="Tên giảng viên"
                placeholderTextColor={AppColors.textMuted}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 390, animated: true });
                  }, 120);
                }}
                style={styles.textInput}
              />
            </View>

            {/* Ghi chú */}
            <View>
              <Text style={styles.fieldLabel}>Ghi chú cho ca học</Text>
              <TextInput
                value={formNote}
                onChangeText={setFormNote}
                placeholder=""
                placeholderTextColor={AppColors.textMuted}
                multiline
                numberOfLines={2}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
                style={[styles.textInput, { minHeight: 50 }]}
              />
            </View>

            {/* Buttons */}
            <View style={{ marginTop: 8, gap: 10 }}>
              <TouchableOpacity
                onPress={onSave}
                disabled={submitting}
                activeOpacity={0.8}
                style={styles.saveBtn}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>
                      {isEditing ? "Cập nhật lịch học" : "Lưu vào thời khóa biểu"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.7}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: AppColors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "90%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.text,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  typeCard: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 8,
  },
  typeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    gap: 10,
  },
  datePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  calendarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dateSubText: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  shiftButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shiftArrowBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#EDF2F7",
  },
  todayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#EDF2F7",
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  quickDateLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.textMuted,
    marginBottom: 6,
  },
  quickDateChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  manualDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  manualDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  manualDateInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.text,
  },
  periodSelector: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  periodDropdownList: {
    position: "absolute",
    top: "100%",
    marginTop: 4,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    maxHeight: 240,
    overflow: "hidden",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    zIndex: 9999,
  },
  periodOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  customTimeInput: {
    marginTop: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
    color: AppColors.text,
  },
  saveBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
});

