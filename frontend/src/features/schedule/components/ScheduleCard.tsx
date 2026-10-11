import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { ScheduleItem } from "../types";

export interface ScheduleCardProps {
  item: ScheduleItem;
  onSelectDirection: (item: ScheduleItem) => void;
  onEdit?: (item: ScheduleItem) => void;
  onDelete?: (item: ScheduleItem) => void;
}

export const ScheduleCard = React.memo(function ScheduleCard({
  item,
  onSelectDirection,
  onEdit,
  onDelete,
}: ScheduleCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: item.isCustom ? "#FDE68A" : AppColors.cardBorder,
        },
      ]}
    >
      {/* Header row: Code & Time & Custom badge */}
      <View style={styles.headerRow}>
        <View style={styles.tagGroup}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: item.isCustom
                  ? item.type === "hoc_bu"
                    ? "#EFF6FF"
                    : item.type === "kiem_tra"
                    ? "#FEE2E2"
                    : item.type === "khac"
                    ? "#D1FAE5"
                    : "#FEF3C7"
                  : "#EEF2FF",
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
                      ? "#2563EB"
                      : item.type === "kiem_tra"
                      ? "#DC2626"
                      : item.type === "khac"
                      ? "#059669"
                      : "#D97706"
                  }
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color:
                      item.type === "hoc_bu"
                        ? "#2563EB"
                        : item.type === "kiem_tra"
                        ? "#DC2626"
                        : item.type === "khac"
                        ? "#059669"
                        : "#D97706",
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
          {item.isCustom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Tự thêm</Text>
            </View>
          )}
          {(item.date || item.ngay_hoc) && (
            <View style={styles.dateBadge}>
              <Feather name="calendar" size={10} color={AppColors.primary} />
              <Text style={styles.dateBadgeText}>{item.date || item.ngay_hoc}</Text>
            </View>
          )}
        </View>

        <View style={styles.timeGroup}>
          <Feather name="clock" size={13} color={AppColors.textMuted} />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>

      {/* Course Title */}
      <Text style={styles.courseTitle}>{item.course}</Text>

      {/* Ghi chú nếu có */}
      {item.note ? (
        <View style={styles.noteBox}>
          <Feather name="info" size={12} color="#64748B" />
          <Text style={styles.noteText} numberOfLines={2}>
            {item.note}
          </Text>
        </View>
      ) : null}

      {/* Bottom Row: Room & Lecturer info + Action buttons */}
      <View style={styles.bottomRow}>
        <View style={styles.infoCol}>
          <TouchableOpacity
            onPress={() => onSelectDirection(item)}
            activeOpacity={0.7}
            style={styles.roomTouchable}
          >
            <Feather name="map-pin" size={14} color={AppColors.primary} />
            <Text style={styles.roomText}>{item.room}</Text>
            <Feather name="info" size={12} color={AppColors.primaryLight} />
          </TouchableOpacity>

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
                <TouchableOpacity
                  onPress={() => onEdit(item)}
                  activeOpacity={0.7}
                  style={styles.editButton}
                >
                  <Feather name="edit-2" size={14} color="#475569" />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={() => onDelete(item)}
                  activeOpacity={0.7}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            onPress={() => onSelectDirection(item)}
            activeOpacity={0.7}
            style={styles.directionButton}
          >
            <Feather name="navigation" size={13} color={AppColors.primary} />
            <Text style={styles.directionButtonText}>Chỉ đường</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: AppColors.cardBg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tagGroup: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.primary,
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  customBadgeText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
  },
  dateBadgeText: {
    fontSize: 10,
    color: AppColors.primary,
    fontWeight: "600",
  },
  timeGroup: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.text,
    marginBottom: 6,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: "#475569",
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  infoCol: {
    flex: 1,
    gap: 4,
    marginRight: 8,
  },
  roomTouchable: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  roomText: {
    fontSize: 13,
    fontWeight: "700",
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
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
  },
  directionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  directionButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.primary,
  },
});

