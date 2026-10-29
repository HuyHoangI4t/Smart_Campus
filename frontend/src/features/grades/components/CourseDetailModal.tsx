import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

export interface CourseDetailItem {
  code: string;
  name: string;
  credits: number;
  grade10: number;
  gradeLetter: string;
  semester: string;
  dbp?: number | null;
  thi1?: number | null;
  thi2?: number | null;
  d1?: number | null;
  d2?: number | null;
  namHoc?: string;
  ky?: string;
  hocPhi?: string;
}

interface CourseDetailModalProps {
  course: CourseDetailItem | null;
  onClose: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = React.memo(
  function CourseDetailModal({ course, onClose }) {
    const { colors, isDark } = useTheme();

    if (!course) return null;

    const letter = (course.gradeLetter || "").toUpperCase().trim();
    const isStudying = letter === "X" || (!course.gradeLetter && course.grade10 === 0);
    const isPassed = letter === "P" || (!isStudying && letter !== "F" && course.grade10 >= 4.0);
    const isFailed = letter === "F" || (!isStudying && !isPassed && course.grade10 < 4.0);

    const getGrade4 = () => {
      if (isStudying) return "—";
      if (letter === "A") return "4.0";
      if (letter === "B") return "3.0";
      if (letter === "C") return "2.0";
      if (letter === "D") return "1.0";
      if (letter === "F") return "0.0";
      if (course.grade10 >= 8.5) return "4.0";
      if (course.grade10 >= 7.0) return "3.0";
      if (course.grade10 >= 5.5) return "2.0";
      if (course.grade10 >= 4.0) return "1.0";
      return "0.0";
    };

    const getStatusTheme = () => {
      if (isStudying) {
        return {
          bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB",
          border: isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A",
          text: isDark ? "#FBBF24" : "#D97706",
          label: "Đang học",
          icon: "book-open" as const,
        };
      }
      if (isPassed) {
        return {
          bg: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
          border: isDark ? "rgba(16, 185, 129, 0.35)" : "#A7F3D0",
          text: isDark ? "#34D399" : "#059669",
          label: letter === "P" ? "Đạt môn điều kiện" : "Đạt học phần",
          icon: "check-circle" as const,
        };
      }
      if (isFailed) {
        return {
          bg: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
          border: isDark ? "rgba(239, 68, 68, 0.35)" : "#FECACA",
          text: isDark ? "#F87171" : "#DC2626",
          label: "Chưa đạt",
          icon: "alert-circle" as const,
        };
      }
      return {
        bg: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF",
        border: isDark ? "rgba(59, 130, 246, 0.35)" : "#BFDBFE",
        text: isDark ? "#60A5FA" : "#2563EB",
        label: "Đã có điểm",
        icon: "info" as const,
      };
    };

    const st = getStatusTheme();

    return (
      <Modal
        visible={!!course}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng chi tiết học phần" />

          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.cardBg,
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
              },
            ]}
          >
            {/* Header: Mã môn, số tín chỉ & Học kỳ */}
            <View style={styles.headerTags}>
              {course.code ? (
                <View style={[styles.tagPill, { backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#EFF6FF", borderColor: isDark ? "rgba(59, 130, 246, 0.35)" : "#DBEAFE" }]}>
                  <Text style={[styles.tagPillText, { color: colors.primary }]}>{course.code}</Text>
                </View>
              ) : null}

              <View style={[styles.tagPill, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", borderColor: isDark ? "#334155" : "#E2E8F0" }]}>
                <Feather name="layers" size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.tagPillText, { color: colors.textSecondary }]}>{course.credits} tín chỉ</Text>
              </View>

              <View style={[styles.tagPill, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", borderColor: isDark ? "#334155" : "#E2E8F0" }]}>
                <Feather name="calendar" size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.tagPillText, { color: colors.textSecondary }]}>{course.semester}</Text>
              </View>
            </View>

            {/* Tên học phần */}
            <Text style={[styles.courseName, { color: colors.text }]}>{course.name}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Thẻ Banner Tổng kết Kết quả */}
              <View style={[styles.statusBanner, { backgroundColor: st.bg, borderColor: st.border }]}>
                <View style={styles.statusBannerTop}>
                  <Feather name={st.icon} size={16} color={st.text} />
                  <Text style={[styles.statusBannerLabel, { color: st.text }]}>{st.label}</Text>
                </View>

                <View style={styles.scoreRow}>
                  {/* Điểm Chữ */}
                  <View style={styles.scoreCol}>
                    <Text style={[styles.scoreNumber, { color: st.text }]}>
                      {isStudying ? "—" : letter}
                    </Text>
                    <Text style={[styles.scoreCaption, { color: colors.textSecondary }]}>Điểm chữ</Text>
                  </View>

                  <View style={[styles.scoreDivider, { backgroundColor: st.border }]} />

                  {/* Thang điểm 10 */}
                  <View style={styles.scoreCol}>
                    <Text style={[styles.scoreNumber, { color: colors.text }]}>
                      {isStudying ? "—" : course.grade10.toFixed(1)}
                    </Text>
                    <Text style={[styles.scoreCaption, { color: colors.textSecondary }]}>Thang điểm 10</Text>
                  </View>

                  <View style={[styles.scoreDivider, { backgroundColor: st.border }]} />

                  {/* Thang điểm 4 */}
                  <View style={styles.scoreCol}>
                    <Text style={[styles.scoreNumber, { color: colors.text }]}>
                      {getGrade4()}
                    </Text>
                    <Text style={[styles.scoreCaption, { color: colors.textSecondary }]}>Thang điểm 4</Text>
                  </View>
                </View>
              </View>

              {/* Bảng Chi tiết 5 Cột Điểm Thành phần Chuẩn trường ĐH Tây Nguyên */}
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Điểm thành phần chi tiết
                </Text>

                <View
                  style={[
                    styles.componentGrid,
                    {
                      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  {/* Cột 1: ĐBP */}
                  <View style={styles.componentCell}>
                    <Text style={[styles.componentHeader, { color: colors.textMuted }]}>ĐBP</Text>
                    <Text style={[styles.componentValue, { color: colors.text }]}>
                      {course.dbp !== null && course.dbp !== undefined ? course.dbp : "—"}
                    </Text>
                    <Text style={[styles.componentSub, { color: colors.textMuted }]}>Bộ phận</Text>
                  </View>

                  <View style={[styles.vLine, { backgroundColor: colors.cardBorder }]} />

                  {/* Cột 2: Thi 1 */}
                  <View style={styles.componentCell}>
                    <Text style={[styles.componentHeader, { color: colors.textMuted }]}>Thi 1</Text>
                    <Text style={[styles.componentValue, { color: colors.text }]}>
                      {course.thi1 !== null && course.thi1 !== undefined ? course.thi1 : "—"}
                    </Text>
                    <Text style={[styles.componentSub, { color: colors.textMuted }]}>Lần 1</Text>
                  </View>

                  <View style={[styles.vLine, { backgroundColor: colors.cardBorder }]} />

                  {/* Cột 3: Thi 2 */}
                  <View style={styles.componentCell}>
                    <Text style={[styles.componentHeader, { color: colors.textMuted }]}>Thi 2</Text>
                    <Text style={[styles.componentValue, { color: colors.text }]}>
                      {course.thi2 !== null && course.thi2 !== undefined ? course.thi2 : "—"}
                    </Text>
                    <Text style={[styles.componentSub, { color: colors.textMuted }]}>Lần 2</Text>
                  </View>

                  <View style={[styles.vLine, { backgroundColor: colors.cardBorder }]} />

                  {/* Cột 4: Đ1 */}
                  <View style={styles.componentCell}>
                    <Text style={[styles.componentHeader, { color: colors.primary }]}>Đ1</Text>
                    <Text style={[styles.componentValue, { color: colors.primary, fontWeight: "900" }]}>
                      {course.d1 !== null && course.d1 !== undefined ? course.d1 : "—"}
                    </Text>
                    <Text style={[styles.componentSub, { color: colors.textMuted }]}>Tổng 1</Text>
                  </View>

                  <View style={[styles.vLine, { backgroundColor: colors.cardBorder }]} />

                  {/* Cột 5: Đ2 */}
                  <View style={styles.componentCell}>
                    <Text style={[styles.componentHeader, { color: colors.textMuted }]}>Đ2</Text>
                    <Text style={[styles.componentValue, { color: colors.text }]}>
                      {course.d2 !== null && course.d2 !== undefined ? course.d2 : "—"}
                    </Text>
                    <Text style={[styles.componentSub, { color: colors.textMuted }]}>Tổng 2</Text>
                  </View>
                </View>
              </View>

              {/* Thông tin học phí nếu có */}
              {course.hocPhi ? (
                <View
                  style={[
                    styles.hocPhiBox,
                    {
                      backgroundColor: course.hocPhi.includes("Nợ")
                        ? (isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2")
                        : (isDark ? "rgba(16, 185, 129, 0.12)" : "#F0FDF4"),
                      borderColor: course.hocPhi.includes("Nợ")
                        ? (isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA")
                        : (isDark ? "rgba(16, 185, 129, 0.3)" : "#BBF7D0"),
                    },
                  ]}
                >
                  <Feather
                    name={course.hocPhi.includes("Nợ") ? "alert-circle" : "check-circle"}
                    size={14}
                    color={course.hocPhi.includes("Nợ") ? "#EF4444" : "#10B981"}
                  />
                  <Text
                    style={[
                      styles.hocPhiText,
                      { color: course.hocPhi.includes("Nợ") ? (isDark ? "#F87171" : "#DC2626") : (isDark ? "#34D399" : "#16A34A") },
                    ]}
                  >
                    Tình trạng học phí: {course.hocPhi}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Nút Đóng modal */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: isDark ? "#334155" : "#F1F5F9",
                  borderColor: isDark ? "#475569" : "#E2E8F0",
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Đóng bảng chi tiết môn học"
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalBox: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  headerTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  courseName: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
    marginBottom: 16,
  },
  statusBanner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  statusBannerLabel: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  scoreCol: {
    alignItems: "center",
    flex: 1,
  },
  scoreDivider: {
    width: 1,
    height: 32,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: "900",
  },
  scoreCaption: {
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
  },
  detailSection: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  componentGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  componentCell: {
    alignItems: "center",
    flex: 1,
  },
  vLine: {
    width: 1,
    height: 36,
  },
  componentHeader: {
    fontSize: 10.5,
    fontWeight: "800",
    marginBottom: 3,
  },
  componentValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  componentSub: {
    fontSize: 9,
    marginTop: 2,
  },
  hocPhiBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  hocPhiText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  closeButton: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    minHeight: 46,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
});

