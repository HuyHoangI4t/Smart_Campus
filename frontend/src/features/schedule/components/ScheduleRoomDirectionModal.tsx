import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { ScheduleItem, RoomDirectionInfo } from "../types";

export interface ScheduleRoomDirectionModalProps {
  visible: boolean;
  item: ScheduleItem | null;
  direction: RoomDirectionInfo | null;
  onClose: () => void;
  onOpenCampusMap: () => void;
  onOpenGoogleMaps: (building: string) => void;
}

export const ScheduleRoomDirectionModal = React.memo(function ScheduleRoomDirectionModal({
  visible,
  item,
  direction,
  onClose,
  onOpenCampusMap,
  onOpenGoogleMaps,
}: ScheduleRoomDirectionModalProps) {
  if (!item || !direction) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdropTouch} />
        <View style={styles.sheetContainer}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconCircle}>
                <Feather name="navigation" size={18} color={AppColors.primary} />
              </View>
              <Text style={styles.headerTitle}>Chỉ đường phòng học</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={18} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 16 }}>
              {/* Card thông tin môn học & phòng */}
              <View style={styles.courseSummaryCard}>
                <Text style={styles.courseName}>{item.course}</Text>

                <View style={styles.tagWrapRow}>
                  <View style={styles.roomTag}>
                    <Text style={styles.roomTagText}>{direction.room}</Text>
                  </View>
                  <View style={styles.floorTag}>
                    <Text style={styles.floorTagText}>{direction.floor}</Text>
                  </View>
                  <View style={styles.buildingTag}>
                    <Text style={styles.buildingTagText}>{direction.buildingCode}</Text>
                  </View>
                </View>

                <View style={{ gap: 4 }}>
                  <View style={styles.metaRow}>
                    <Feather name="clock" size={12} color={AppColors.textMuted} />
                    <Text style={styles.metaText}>{item.time}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Feather name="user" size={12} color={AppColors.textMuted} />
                    <Text style={styles.metaText}>{item.lecturer}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Feather name="map" size={12} color={AppColors.primary} />
                    <Text style={[styles.metaText, { fontWeight: "600", color: AppColors.primary }]}>
                      {direction.building}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Lộ trình từng bước */}
              <View>
                <Text style={styles.stepsSectionTitle}>Lộ trình di chuyển chi tiết</Text>

                <View style={{ gap: 14 }}>
                  {direction.steps.map((step, idx) => (
                    <View key={step.step} style={styles.stepItemRow}>
                      {/* Timeline icon & vertical connector line */}
                      <View style={{ alignItems: "center" }}>
                        <View
                          style={[
                            styles.stepNumberBadge,
                            {
                              backgroundColor: idx === 0 ? AppColors.primary : "#EEF2FF",
                              borderColor: idx === 0 ? AppColors.primary : "#C7D2FE",
                            },
                          ]}
                        >
                          <Feather
                            name={step.icon}
                            size={14}
                            color={idx === 0 ? "#FFFFFF" : AppColors.primary}
                          />
                        </View>
                        {idx < direction.steps.length - 1 && (
                          <View style={styles.stepConnectorLine} />
                        )}
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1, paddingTop: 3 }}>
                        <Text style={styles.stepTitle}>
                          {step.step}. {step.title}
                        </Text>
                        <Text style={styles.stepDesc}>{step.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Lưu ý & tiện ích gần phòng */}
              <View style={styles.tipsBox}>
                <View style={styles.metaRow}>
                  <Feather name="check-circle" size={14} color="#16A34A" />
                  <Text style={styles.tipsTitle}>Tiện ích & Lưu ý</Text>
                </View>
                {direction.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItemRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* Nút hành động */}
              <View style={{ gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={onOpenCampusMap}
                  activeOpacity={0.8}
                  style={styles.mapPrimaryBtn}
                >
                  <Feather name="map" size={16} color="#FFFFFF" />
                  <Text style={styles.mapPrimaryBtnText}>Xem trên Bản đồ trường</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={styles.closeModalBtn}
                >
                  <Text style={styles.closeModalBtnText}>Đóng lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: AppColors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: "88%",
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
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  courseSummaryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  courseName: {
    fontSize: 15,
    fontWeight: "800",
    color: AppColors.text,
    marginBottom: 6,
  },
  tagWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  roomTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
  },
  roomTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  floorTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  floorTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.primary,
  },
  buildingTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: AppColors.muted,
  },
  buildingTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  stepsSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: AppColors.text,
    marginBottom: 12,
  },
  stepItemRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  stepConnectorLine: {
    width: 2,
    height: 38,
    backgroundColor: "#E2E8F0",
    marginTop: 4,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.text,
  },
  stepDesc: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  tipsBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },
  tipItemRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  tipBullet: {
    color: "#16A34A",
    fontSize: 12,
    lineHeight: 17,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: "#15803D",
    lineHeight: 17,
  },
  mapPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
  },
  mapPrimaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mapSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: AppColors.primary,
  },
  mapSecondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.primary,
  },
  closeModalBtn: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
});

