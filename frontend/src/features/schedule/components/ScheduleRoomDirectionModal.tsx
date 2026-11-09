import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
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
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      setCopied(false);
    }
  }, [visible]);

  if (!item || !direction) return null;

  const isOnline = Boolean(
    direction.isOnline ||
    direction.buildingCode === "Online" ||
    (item.room || "").toUpperCase().includes("ONLINE") ||
    (item.room || "").toUpperCase().includes("TRỰC TUYẾN")
  );

  const combinedInfo = `${direction.meetingInfo || ""} ${item.note || ""} ${item.room || ""}`.trim();
  const meetCodeMatch = combinedInfo.match(/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  const genericCodeMatch = combinedInfo.match(/(?:mã|code|id)[:\s]+([^\s,;]+)/i);
  const onlineCode = meetCodeMatch ? meetCodeMatch[1].toLowerCase() : (genericCodeMatch ? genericCodeMatch[1] : "");

  let onlineUrl = direction.meetingUrl;
  if (!onlineUrl) {
    if (meetCodeMatch) {
      onlineUrl = `https://meet.google.com/${meetCodeMatch[1].toLowerCase()}`;
    } else {
      const urlMatch = combinedInfo.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) onlineUrl = urlMatch[0];
    }
  }

  const handleCopyCode = async () => {
    const textToCopy = onlineCode || combinedInfo || "Online";
    try {
      await Clipboard.setStringAsync(textToCopy);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("Lỗi sao chép mã phòng:", e);
    }
  };

  const handleOpenMeet = () => {
    if (onlineUrl) {
      Linking.openURL(onlineUrl).catch((err) => {
        console.warn("Không thể mở link phòng học:", err);
      });
    }
  };

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
        <View style={[styles.sheetContainer, { backgroundColor: colors.cardBg }]}>
          {/* Modal Header */}
          <View style={[styles.headerRow, { borderColor: colors.cardBorder }]}>
            <View style={styles.headerTitleGroup}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isOnline
                      ? isDark
                        ? "rgba(37, 99, 235, 0.2)"
                        : "#EFF6FF"
                      : isDark
                      ? "rgba(99, 102, 241, 0.2)"
                      : "#EEF2FF",
                  },
                ]}
              >
                <Feather
                  name={isOnline ? "video" : "navigation"}
                  size={18}
                  color={isOnline ? "#2563EB" : colors.primary}
                />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isOnline ? "Lớp học trực tuyến (Online)" : "Chỉ đường phòng học"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 16 }}>
              {/* Card thông tin môn học & phòng */}
              <View
                style={[
                  styles.courseSummaryCard,
                  {
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    borderColor: isOnline
                      ? isDark
                        ? "rgba(59, 130, 246, 0.3)"
                        : "#BFDBFE"
                      : colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.courseName, { color: colors.text }]}>{item.course}</Text>

                <View style={styles.tagWrapRow}>
                  <View
                    style={[
                      styles.roomTag,
                      { backgroundColor: isOnline ? "#2563EB" : colors.primary },
                    ]}
                  >
                    <Text style={styles.roomTagText}>{item.room || "Online"}</Text>
                  </View>
                  <View
                    style={[
                      styles.floorTag,
                      {
                        backgroundColor: isOnline
                          ? isDark
                            ? "rgba(37, 99, 235, 0.2)"
                            : "#EFF6FF"
                          : isDark
                          ? "rgba(99, 102, 241, 0.2)"
                          : "#EEF2FF",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.floorTagText,
                        { color: isOnline ? "#2563EB" : colors.primary },
                      ]}
                    >
                      {isOnline ? "Học từ xa" : direction.floor || "Tầng 1"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.buildingTag,
                      {
                        backgroundColor: isOnline
                          ? isDark
                            ? "rgba(37, 99, 235, 0.25)"
                            : "#DBEAFE"
                          : colors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.buildingTagText,
                        { color: isOnline ? (isDark ? "#93C5FD" : "#1D4ED8") : colors.textSecondary },
                      ]}
                    >
                      {isOnline ? "Google Meet / Trực tuyến" : direction.buildingCode}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <View style={styles.metaRow}>
                    <Feather name="clock" size={13} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.time}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Feather name="user" size={13} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.lecturer}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Feather
                      name={isOnline ? "monitor" : "map"}
                      size={13}
                      color={isOnline ? "#2563EB" : colors.primary}
                    />
                    <Text
                      style={[
                        styles.metaText,
                        {
                          fontWeight: "600",
                          color: isOnline ? (isDark ? "#60A5FA" : "#1D4ED8") : colors.primary,
                        },
                      ]}
                    >
                      {isOnline ? "Không gian số (Học Online qua mạng)" : direction.building}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── NẾU LÀ ONLINE: ĐƯA MÃ ĐỂ COPY THAY VÌ CHỈ ĐƯỜNG ── */}
              {isOnline ? (
                <View
                  style={[
                    styles.onlineCodeCard,
                    {
                      backgroundColor: isDark ? "#1E293B" : "#F0F9FF",
                      borderColor: isDark ? "#3B82F6" : "#BAE6FD",
                    },
                  ]}
                >
                  <View style={styles.onlineCodeHeader}>
                    <View
                      style={[
                        styles.onlineIconCircle,
                        { backgroundColor: isDark ? "rgba(59, 130, 246, 0.25)" : "#DBEAFE" },
                      ]}
                    >
                      <Feather name="video" size={18} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.onlineSectionTitle, { color: isDark ? "#93C5FD" : "#0369A1" }]}>
                        Mã tham gia phòng học
                      </Text>
                      <Text style={[styles.onlineSectionDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {direction.meetingInfo || item.note || "Google Meet phòng học"}
                      </Text>
                    </View>
                  </View>

                  {/* Hộp hiển thị mã phòng nổi bật */}
                  {onlineCode ? (
                    <View
                      style={[
                        styles.codeBoxRow,
                        {
                          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                          borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "#E0F2FE",
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.codeLabel, { color: colors.textMuted }]}>MÃ PHÒNG (MEET CODE)</Text>
                        <Text
                          style={[
                            styles.codeValue,
                            { color: isDark ? "#60A5FA" : "#0284C7" },
                          ]}
                          selectable
                        >
                          {onlineCode}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleCopyCode}
                        activeOpacity={0.7}
                        style={[
                          styles.copyActionBtn,
                          {
                            backgroundColor: copied ? "#10B981" : "#2563EB",
                          },
                        ]}
                      >
                        <Feather name={copied ? "check" : "copy"} size={14} color="#FFFFFF" />
                        <Text style={styles.copyActionBtnText}>{copied ? "Đã chép" : "Sao chép"}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {copied && (
                    <View style={styles.toastSuccessRow}>
                      <Feather name="check-circle" size={13} color="#10B981" />
                      <Text style={styles.toastSuccessText}>Đã sao chép mã phòng vào bộ nhớ tạm!</Text>
                    </View>
                  )}
                </View>
              ) : (
                /* ── NẾU LÀ PHÒNG TRỰC TIẾP: LỘ TRÌNH DI CHUYỂN TỪNG BƯỚC ── */
                <View>
                  <Text style={[styles.stepsSectionTitle, { color: colors.text }]}>Lộ trình di chuyển chi tiết</Text>

                  <View style={{ gap: 14 }}>
                    {direction.steps.map((step, idx) => (
                      <View key={step.step} style={styles.stepItemRow}>
                        <View style={{ alignItems: "center" }}>
                          <View
                            style={[
                              styles.stepNumberBadge,
                              {
                                backgroundColor: idx === 0 ? colors.primary : (isDark ? "#1E293B" : "#EEF2FF"),
                                borderColor: idx === 0 ? colors.primary : (isDark ? colors.cardBorder : "#C7D2FE"),
                              },
                            ]}
                          >
                            <Feather
                              name={step.icon}
                              size={14}
                              color={idx === 0 ? "#FFFFFF" : colors.primary}
                            />
                          </View>
                          {idx < direction.steps.length - 1 && (
                            <View style={[styles.stepConnectorLine, { backgroundColor: colors.cardBorder }]} />
                          )}
                        </View>

                        <View style={{ flex: 1, paddingTop: 3 }}>
                          <Text style={[styles.stepTitle, { color: colors.text }]}>
                            {step.step}. {step.title}
                          </Text>
                          <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{step.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Lưu ý & tiện ích */}
              <View
                style={[
                  styles.tipsBox,
                  {
                    backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#F0FDF4",
                    borderColor: isDark ? "rgba(16, 185, 129, 0.25)" : "#BBF7D0",
                  },
                ]}
              >
                <View style={styles.metaRow}>
                  <Feather name="check-circle" size={14} color={isDark ? "#34D399" : "#16A34A"} />
                  <Text style={[styles.tipsTitle, { color: isDark ? "#34D399" : "#16A34A" }]}>
                    {isOnline ? "Lưu ý khi tham gia học Online" : "Tiện ích & Lưu ý"}
                  </Text>
                </View>
                {direction.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItemRow}>
                    <Text style={[styles.tipBullet, { color: isDark ? "#34D399" : "#16A34A" }]}>•</Text>
                    <Text style={[styles.tipText, { color: isDark ? "#A7F3D0" : "#15803D" }]}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* ── NÚT HÀNH ĐỘNG ĐÁY SHEET ── */}
              <View style={{ gap: 10, marginTop: 4 }}>
                {isOnline ? (
                  <>
                    {onlineUrl ? (
                      <TouchableOpacity
                        onPress={handleOpenMeet}
                        activeOpacity={0.8}
                        style={[styles.mapPrimaryBtn, { backgroundColor: "#2563EB" }]}
                      >
                        <Feather name="external-link" size={16} color="#FFFFFF" />
                        <Text style={styles.mapPrimaryBtnText}>Tham gia Google Meet ngay</Text>
                      </TouchableOpacity>
                    ) : null}

                    {onlineCode ? (
                      <TouchableOpacity
                        onPress={handleCopyCode}
                        activeOpacity={0.8}
                        style={[
                          styles.copyPrimaryBtn,
                          {
                            backgroundColor: copied
                              ? "#10B981"
                              : isDark
                              ? "rgba(37, 99, 235, 0.2)"
                              : "#EFF6FF",
                            borderColor: copied ? "#10B981" : isDark ? "#2563EB" : "#93C5FD",
                          },
                        ]}
                      >
                        <Feather name={copied ? "check" : "copy"} size={16} color={copied ? "#FFFFFF" : "#2563EB"} />
                        <Text style={[styles.copyPrimaryBtnText, { color: copied ? "#FFFFFF" : "#2563EB" }]}>
                          {copied ? "Đã sao chép mã phòng" : `Sao chép mã phòng (${onlineCode})`}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      onPress={onClose}
                      activeOpacity={0.7}
                      style={styles.closeModalBtn}
                    >
                      <Text style={[styles.closeModalBtnText, { color: colors.textSecondary }]}>Đóng lại</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={onOpenCampusMap}
                      activeOpacity={0.8}
                      style={[styles.mapPrimaryBtn, { backgroundColor: colors.primary }]}
                    >
                      <Feather name="map" size={16} color="#FFFFFF" />
                      <Text style={styles.mapPrimaryBtnText}>Xem trên Bản đồ trường</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onClose}
                      activeOpacity={0.7}
                      style={styles.closeModalBtn}
                    >
                      <Text style={[styles.closeModalBtnText, { color: colors.textSecondary }]}>Đóng lại</Text>
                    </TouchableOpacity>
                  </>
                )}
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
  onlineCodeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  onlineCodeHeader: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  onlineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  onlineSectionDesc: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  codeBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
    fontFamily: "monospace",
    marginTop: 2,
  },
  copyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  toastSuccessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
  },
  toastSuccessText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  copyPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  copyPrimaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
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
