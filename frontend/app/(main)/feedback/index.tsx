import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, BackHandler } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useFocusEffect } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiSubmitFeedback, apiGetFeedbackConfig } from "../../../src/services/api";

const DEFAULT_CATEGORIES = [
  "Cơ sở vật chất",
  "Chất lượng giảng dạy",
  "Căng tin & Dịch vụ",
  "An ninh & Gửi xe",
  "Thủ tục sinh viên",
  "Khác",
];

export default function FeedbackScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState("Cơ sở vật chất");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiGetFeedbackConfig();
        if (res && res.success && res.categories && Array.isArray(res.categories)) {
          setCategories(res.categories);
        }
      } catch {}
    };
    fetchConfig();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/(main)/home");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [router])
  );


  const handleSubmit = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setPopupState({
        visible: true,
        type: "error",
        title: "Thiếu thông tin",
        message: "Vui lòng nhập tiêu đề ý kiến đóng góp của bạn.",
      });
      return;
    }
    if (!content.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setPopupState({
        visible: true,
        type: "error",
        title: "Thiếu thông tin",
        message: "Vui lòng nhập nội dung chi tiết ý kiến phản hồi của bạn.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSubmitting(true);
    try {
      const res = await apiSubmitFeedback({
        title: title.trim(),
        content: content.trim(),
        category,
        rating,
      });

      if (res && res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setPopupState({
          visible: true,
          type: "success",
          title: "Gửi thành công!",
          message: res.message || "Ý kiến phản ánh của bạn đã được gửi thành công đến ban quản lý nhà trường.",
        });
        setTitle("");
        setContent("");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setPopupState({
          visible: true,
          type: "error",
          title: "Gửi thất bại (Fail)",
          message: res?.message || "Không thể gửi ý kiến lúc này. Vui lòng kiểm tra lại kết nối và thử lại sau.",
        });
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setPopupState({
        visible: true,
        type: "error",
        title: "Gửi thất bại (Fail)",
        message: "Đã xảy ra sự cố khi kết nối đến máy chủ. Vui lòng thử lại sau.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavHeader
        title="Góp ý & Phản ánh"
        subtitle="Ý kiến của bạn giúp nâng cao chất lượng môi trường học"
        showBack={true}
        onBack={() => router.push("/(main)/home")}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        {/* Danh mục */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
          Lĩnh vực góp ý
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {categories.map((cat) => {
            const isSelected = cat === category;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: isSelected ? colors.primary : (isDark ? "#0F172A" : colors.muted),
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : colors.textSecondary }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Đánh giá sao */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
          Mức độ hài lòng chung
        </Text>
        <View style={[s.row, { gap: 12, marginBottom: 20 }]}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Feather
                name="star"
                size={28}
                color={star <= rating ? "#F59E0B" : (isDark ? "#475569" : "#D1D5DB")}
              />
            </TouchableOpacity>
          ))}
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginLeft: 8 }}>
            {rating === 5 ? "Rất hài lòng" : rating === 4 ? "Hài lòng" : rating === 3 ? "Bình thường" : "Chưa hài lòng"}
          </Text>
        </View>

        {/* Tiêu đề */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
          Tiêu đề góp ý <Text style={{ color: AppColors.danger }}>*</Text>
        </Text>
        <TextInput
          placeholder="Ví dụ: Máy chiếu phòng B201 bị mờ, đèn hành lang hỏng..."
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: isDark ? "#0F172A" : colors.cardBg,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 14,
            fontSize: 14,
            color: colors.text,
            marginBottom: 16,
          }}
        />

        {/* Nội dung chi tiết */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
          Nội dung chi tiết <Text style={{ color: AppColors.danger }}>*</Text>
        </Text>
        <TextInput
          placeholder="Mô tả cụ thể vấn đề hoặc đề xuất giải pháp của bạn..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{
            height: 140,
            borderRadius: 14,
            backgroundColor: isDark ? "#0F172A" : colors.cardBg,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 14,
            fontSize: 14,
            color: colors.text,
            marginBottom: 24,
          }}
        />

        {/* Submit button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="send" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>Gửi ý kiến phản hồi</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ─── MODAL POPUP THÔNG BÁO KẾT QUẢ (THÀNH CÔNG / THẤT BẠI) ─── */}
      <Modal
        visible={popupState.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupState((prev) => ({ ...prev, visible: false }))}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 24,
              paddingVertical: 26,
              paddingHorizontal: 22,
              width: "100%",
              maxWidth: 340,
              alignItems: "center",
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Icon biểu tượng */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: popupState.type === "success"
                  ? (isDark ? "rgba(16, 185, 129, 0.18)" : "#DCFCE7")
                  : (isDark ? "rgba(239, 68, 68, 0.18)" : "#FEE2E2"),
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 3,
                borderColor: popupState.type === "success"
                  ? (isDark ? "rgba(16, 185, 129, 0.35)" : "#BBF7D0")
                  : (isDark ? "rgba(239, 68, 68, 0.35)" : "#FECACA"),
              }}
            >
              <Feather
                name={popupState.type === "success" ? "check" : "alert-circle"}
                size={32}
                color={popupState.type === "success" ? (isDark ? "#34D399" : "#16A34A") : (isDark ? "#F87171" : "#DC2626")}
              />
            </View>

            {/* Tiêu đề popup */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: colors.text,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {popupState.title}
            </Text>

            {/* Nội dung thông báo */}
            <Text
              style={{
                fontSize: 13.5,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 22,
              }}
            >
              {popupState.message}
            </Text>

            {/* Các nút bấm hành động */}
            {popupState.type === "success" ? (
              <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
                <TouchableOpacity
                  onPress={() => {
                    setPopupState((prev) => ({ ...prev, visible: false }));
                    router.push("/(main)/home");
                  }}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                    Về trang chủ
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPopupState((prev) => ({ ...prev, visible: false }))}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 16,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: isDark ? "#334155" : "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: isDark ? "#F8FAFC" : "#475569" }}>
                    Ở lại
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setPopupState((prev) => ({ ...prev, visible: false }))}
                activeOpacity={0.8}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: "#DC2626",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                  Đóng / Thử lại
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

