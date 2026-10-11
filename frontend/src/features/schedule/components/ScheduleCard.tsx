import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { ScheduleItem } from "../types";

export interface ScheduleCardProps {
  item: ScheduleItem;
  currentViewDate?: string | Date;
  onSelectDirection: (item: ScheduleItem) => void;
  onEdit?: (item: ScheduleItem) => void;
  onDelete?: (item: ScheduleItem) => void;
}

/**
 * Chuyển đổi ngày tháng sang đối tượng Date chuẩn (00:00:00)
 */
function normalizeDate(d?: string | Date | null): Date | null {
  if (!d) return null;
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof d === "string") {
    // 1. Khớp chuỗi có dạng DD/MM/YYYY (ví dụ "05/10/2026", "Thứ 2, 05/10/2026")
    const dmy = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      return new Date(year, month, day);
    }
    // 2. Khớp chuỗi YYYY-MM-DD
    const ymd = d.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = parseInt(ymd[2], 10) - 1;
      const day = parseInt(ymd[3], 10);
      return new Date(year, month, day);
    }
    // 3. Khớp chuỗi DD/MM (lấy năm hiện tại)
    const dm = d.match(/(\d{1,2})\/(\d{1,2})/);
    if (dm) {
      const currentYear = new Date().getFullYear();
      const day = parseInt(dm[1], 10);
      const month = parseInt(dm[2], 10) - 1;
      return new Date(currentYear, month, day);
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }
  return null;
}

/**
 * Trích xuất phút bắt đầu và kết thúc của ca học theo quy chế đào tạo Đại học Tây Nguyên
 */
function parseClassMinutes(timeStr?: string): { startMinutes: number; endMinutes: number } | null {
  if (!timeStr) return null;

  // 1. Nếu có giờ cụ thể: "07:00 – 10:40" hoặc "06:45 - 10:30"
  const timeMatch = timeStr.match(/(\d{1,2})[:h](\d{2})\s*[-–—]\s*(\d{1,2})[:h](\d{2})/i);
  if (timeMatch) {
    const startH = parseInt(timeMatch[1], 10);
    const startM = parseInt(timeMatch[2], 10);
    const endH = parseInt(timeMatch[3], 10);
    const endM = parseInt(timeMatch[4], 10);
    return {
      startMinutes: startH * 60 + startM,
      endMinutes: endH * 60 + endM,
    };
  }

  // 2. Khung giờ tiết chuẩn trường Đại học Tây Nguyên:
  // Sáng: Tiết 1 (06:45 - 07:35), Tiết 2 (07:40 - 08:30), Tiết 3 (08:45 - 09:35),
  //       Tiết 4 (09:40 - 10:30), Tiết 5 (10:35 - 11:25), Tiết 6 (11:30 - 12:20)
  // Chiều: Tiết 7 (13:45 - 14:35), Tiết 8 (14:40 - 15:30), Tiết 9 (15:45 - 16:35),
  //        Tiết 10 (16:40 - 17:30), Tiết 11 (17:45 - 18:35), Tiết 12 (18:40 - 19:30)
  const periodStartTimes: Record<number, number> = {
    1: 6 * 60 + 45,
    2: 7 * 60 + 40,
    3: 8 * 60 + 45,
    4: 9 * 60 + 40,
    5: 10 * 60 + 35,
    6: 11 * 60 + 30,
    7: 13 * 60 + 45,
    8: 14 * 60 + 40,
    9: 15 * 60 + 45,
    10: 16 * 60 + 40,
    11: 17 * 60 + 45,
    12: 18 * 60 + 40,
  };

  const periodEndTimes: Record<number, number> = {
    1: 7 * 60 + 35,
    2: 8 * 60 + 30,
    3: 9 * 60 + 35,
    4: 10 * 60 + 30,
    5: 11 * 60 + 25,
    6: 12 * 60 + 20,
    7: 14 * 60 + 35,
    8: 15 * 60 + 30,
    9: 16 * 60 + 35,
    10: 17 * 60 + 30,
    11: 18 * 60 + 35,
    12: 19 * 60 + 30,
  };

  const rangeMatch = timeStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const startPeriod = parseInt(rangeMatch[1], 10);
    const endPeriod = parseInt(rangeMatch[2], 10);
    const startMinutes = periodStartTimes[startPeriod] ?? (7 * 60);
    const endMinutes = periodEndTimes[endPeriod] ?? (startMinutes + (endPeriod - startPeriod + 1) * 50);
    return { startMinutes, endMinutes };
  }

  const singleMatch = timeStr.match(/tiết\s*(\d+)/i);
  if (singleMatch) {
    const p = parseInt(singleMatch[1], 10);
    const startMinutes = periodStartTimes[p] ?? (7 * 60);
    const endMinutes = periodEndTimes[p] ?? (startMinutes + 50);
    return { startMinutes, endMinutes };
  }

  return null;
}

/**
 * Tính toán trạng thái thời gian thực dựa trên CẢ NGÀY VÀ GIỜ HIỆN TẠI:
 * - Nếu ngày học trong QUÁ KHỨ (< hôm nay) => "Đã xong"
 * - Nếu ngày học trong TƯƠNG LAI (> hôm nay) => "Sắp tới"
 * - Nếu ngày học CHÍNH LÀ HÔM NAY (=== hôm nay) => So sánh với giờ hiện tại:
 *     + Giờ hiện tại > giờ kết thúc: "Đã xong"
 *     + Giờ hiện tại trong khoảng [bắt đầu, kết thúc]: "Đang diễn ra"
 *     + Giờ hiện tại < giờ bắt đầu: "Sắp tới"
 */
function getScheduleStatusInfo(
  timeStr?: string,
  dateInput?: string | Date | null,
  dayNum?: number
): {
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: keyof typeof Feather.glyphMap;
} | null {
  const timeRange = parseClassMinutes(timeStr);
  if (!timeRange) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const classDate = normalizeDate(dateInput);

  if (classDate) {
    const classDateTime = classDate.getTime();

    // 1. Ngày của ca học trong QUÁ KHỨ (trước ngày hôm nay)
    if (classDateTime < today) {
      return {
        label: "Đã xong",
        bg: `${AppColors.textSecondary}1A`,
        border: `${AppColors.textSecondary}33`,
        text: AppColors.textSecondary,
        icon: "check-circle",
      };
    }

    // 2. Ngày của ca học trong TƯƠNG LAI (sau ngày hôm nay)
    if (classDateTime > today) {
      return {
        label: "Sắp tới",
        bg: `${AppColors.info}1A`,
        border: `${AppColors.info}4D`,
        text: AppColors.info,
        icon: "clock",
      };
    }

    // 3. Ngày của ca học chính là HÔM NAY (classDateTime === today)
    if (currentMinutes > timeRange.endMinutes) {
      return {
        label: "Đã xong",
        bg: `${AppColors.textSecondary}1A`,
        border: `${AppColors.textSecondary}33`,
        text: AppColors.textSecondary,
        icon: "check-circle",
      };
    } else if (currentMinutes >= timeRange.startMinutes && currentMinutes <= timeRange.endMinutes) {
      return {
        label: "Đang diễn ra",
        bg: `${AppColors.success}1A`,
        border: `${AppColors.success}4D`,
        text: AppColors.success,
        icon: "activity",
      };
    } else {
      return {
        label: "Sắp tới",
        bg: `${AppColors.info}1A`,
        border: `${AppColors.info}4D`,
        text: AppColors.info,
        icon: "clock",
      };
    }
  }

  // Trường hợp không có chuỗi ngày cụ thể nhưng có dayNum (2: Thứ 2 ... 7: Thứ 7, 1: CN)
  if (typeof dayNum === "number") {
    const jsDay = now.getDay();
    const todayDayNum = jsDay === 0 ? 1 : jsDay + 1;

    if (dayNum === todayDayNum) {
      if (currentMinutes > timeRange.endMinutes) {
        return {
          label: "Đã xong",
          bg: `${AppColors.textSecondary}1A`,
          border: `${AppColors.textSecondary}33`,
          text: AppColors.textSecondary,
          icon: "check-circle",
        };
      } else if (currentMinutes >= timeRange.startMinutes && currentMinutes <= timeRange.endMinutes) {
        return {
          label: "Đang diễn ra",
          bg: `${AppColors.success}1A`,
          border: `${AppColors.success}4D`,
          text: AppColors.success,
          icon: "activity",
        };
      } else {
        return {
          label: "Sắp tới",
          bg: `${AppColors.info}1A`,
          border: `${AppColors.info}4D`,
          text: AppColors.info,
          icon: "clock",
        };
      }
    }
  }

  return null;
}

/**
 * Thẻ Lịch học (ScheduleCard) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Bo góc Squircle 20pt, Grouped Inset layout, nhãn trạng thái bán trong suốt,
 * nút hành động dạng Pill Capsule và phản hồi xúc giác co giãn lò xo (Springy Press).
 */
export const ScheduleCard = React.memo(function ScheduleCard({
  item,
  currentViewDate,
  onSelectDirection,
  onEdit,
  onDelete,
}: ScheduleCardProps) {
  // Xác định ngày chính xác của ca học để tính toán trạng thái
  const effectiveDate = item.date || item.ngay_hoc || currentViewDate;
  const statusInfo = getScheduleStatusInfo(item.time, effectiveDate, item.dayNum);

  const handleDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectDirection(item);
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onEdit?.(item);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onDelete?.(item);
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: item.isCustom ? `${AppColors.warning}66` : AppColors.cardBorder,
        },
      ]}
    >
      {/* ── HEADER ROW: MÃ MÔN / LOẠI + CHIP TRẠNG THÁI + GIỜ HỌC ── */}
      <View style={styles.headerRow}>
        <View style={styles.tagGroup}>
          <View
            style={[
              styles.typeBadgePill,
              {
                backgroundColor: item.isCustom
                  ? item.type === "hoc_bu"
                    ? `${AppColors.info}1A`
                    : item.type === "kiem_tra"
                    ? `${AppColors.danger}1A`
                    : item.type === "khac"
                    ? `${AppColors.success}1A`
                    : `${AppColors.warning}1A`
                  : `${AppColors.primary}12`,
              },
            ]}
          >
            {item.isCustom ? (
              <>
                <Feather
                  name={
                    item.type === "hoc_bu"
                      ? "zap"
                      : item.type === "kiem_tra"
                      ? "file-text"
                      : item.type === "khac"
                      ? "bookmark"
                      : "activity"
                  }
                  size={12}
                  color={
                    item.type === "hoc_bu"
                      ? AppColors.info
                      : item.type === "kiem_tra"
                      ? AppColors.danger
                      : item.type === "khac"
                      ? AppColors.success
                      : AppColors.warning
                  }
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color:
                      item.type === "hoc_bu"
                        ? AppColors.info
                        : item.type === "kiem_tra"
                        ? AppColors.danger
                        : item.type === "khac"
                        ? AppColors.success
                        : AppColors.warning,
                  }}
                >
                  {item.type === "hoc_bu"
                    ? "Học bù"
                    : item.type === "kiem_tra"
                    ? "Kiểm tra"
                    : item.type === "khac"
                    ? "Lịch tự tạo"
                    : "Thực hành"}
                </Text>
              </>
            ) : (
              <Text style={styles.codeText}>{item.code}</Text>
            )}
          </View>

          {/* Status Chip bán trong suốt (Alpha Opacity) - Phụ thuộc CẢ NGÀY VÀ GIỜ */}
          {statusInfo && (
            <View
              style={[
                styles.statusChipPill,
                {
                  backgroundColor: statusInfo.bg,
                  borderColor: statusInfo.border,
                },
              ]}
            >
              <Feather name={statusInfo.icon} size={10} color={statusInfo.text} />
              <Text style={[styles.statusChipText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          )}

          {item.isCustom && (
            <View style={styles.customBadgePill}>
              <Text style={styles.customBadgeText}>Tự thêm</Text>
            </View>
          )}

          {(item.date || item.ngay_hoc) && (
            <View style={styles.dateBadgePill}>
              <Feather name="calendar" size={10} color={AppColors.primary} />
              <Text style={styles.dateBadgeText}>{item.date || item.ngay_hoc}</Text>
            </View>
          )}
        </View>

        <View style={styles.timeGroup}>
          <Feather name="clock" size={13} color={AppColors.textSecondary} />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>

      {/* ── COURSE TITLE ── */}
      <Text style={styles.courseTitle}>{item.course}</Text>

      {/* ── GHI CHÚ NẾU CÓ ── */}
      {item.note ? (
        <View style={styles.noteBox}>
          <Feather name="info" size={12} color={AppColors.textMuted} />
          <Text style={styles.noteText} numberOfLines={2}>
            {item.note}
          </Text>
        </View>
      ) : null}

      {/* ── BOTTOM ROW: ROOM & LECTURER + ACTION BUTTONS ── */}
      <View style={styles.bottomRow}>
        <View style={styles.infoCol}>
          <Pressable
            onPress={handleDirection}
            style={({ pressed }) => [
              styles.roomTouchable,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Vị trí phòng ${item.room}`}
          >
            <View style={styles.roomIconCircle}>
              <Feather name="map-pin" size={13} color={AppColors.primary} />
            </View>
            <Text style={styles.roomText}>{item.room}</Text>
            <Feather name="info" size={12} color={AppColors.primaryLight} />
          </Pressable>

          <View style={styles.lecturerRow}>
            <Feather name="user" size={12} color={AppColors.textMuted} />
            <Text style={styles.lecturerText} numberOfLines={1}>
              {item.lecturer}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {item.isCustom && (
            <>
              {onEdit && (
                <Pressable
                  onPress={handleEdit}
                  style={({ pressed }) => [
                    styles.circleActionButton,
                    pressed && styles.buttonPressed,
                  ]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Chỉnh sửa lịch tự tạo"
                >
                  <Feather name="edit-2" size={14} color="#475569" />
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.circleActionButton,
                    styles.deleteButtonBg,
                    pressed && styles.buttonPressed,
                  ]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Xóa lịch tự tạo"
                >
                  <Feather name="trash-2" size={14} color={AppColors.danger} />
                </Pressable>
              )}
            </>
          )}

          <Pressable
            onPress={handleDirection}
            style={({ pressed }) => [
              styles.directionCapsuleBtn,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Chỉ đường tới phòng ${item.room}`}
          >
            <Feather name="navigation" size={13} color={AppColors.primary} />
            <Text style={styles.directionCapsuleText}>Chỉ đường</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 20, // Squircle 20pt
    backgroundColor: AppColors.cardBg,
    borderWidth: 1, // Viền Hairline siêu mỏng
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tagGroup: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
    marginRight: 6,
  },
  typeBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999, // Pill capsule
  },
  codeText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: AppColors.primary,
  },
  statusChipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999, // Pill capsule
    borderWidth: 0.8,
  },
  statusChipText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  customBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: AppColors.muted,
  },
  customBadgeText: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: "700",
  },
  dateBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: `${AppColors.primary}12`,
  },
  dateBadgeText: {
    fontSize: 10,
    color: AppColors.primary,
    fontWeight: "700",
  },
  timeGroup: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  courseTitle: {
    fontSize: 16.5,
    fontWeight: "900",
    color: AppColors.text,
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    backgroundColor: AppColors.muted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: AppColors.border,
  },
  noteText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  infoCol: {
    flex: 1,
    gap: 5,
    marginRight: 8,
  },
  roomTouchable: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    minHeight: 28,
  },
  roomIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${AppColors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  roomText: {
    fontSize: 13.5,
    fontWeight: "900",
    color: AppColors.text,
  },
  lecturerRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  lecturerText: {
    fontSize: 12,
    color: AppColors.textMuted,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  circleActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.muted,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonBg: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  directionCapsuleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999, // Pill capsule
    backgroundColor: `${AppColors.primary}12`,
    borderWidth: 1,
    borderColor: `${AppColors.primary}33`,
    minHeight: 38,
  },
  directionCapsuleText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: AppColors.primary,
  },
});
