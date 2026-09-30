import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiSubmitFeedback } from "../../../src/services/api";

const CATEGORIES = [
  "Cơ sở vật chất",
  "Chất lượng giảng dạy",
  "Căng tin & Dịch vụ",
  "An ninh & Gửi xe",
  "Thủ tục sinh viên",
  "Khác",
];

export default function FeedbackScreen() {
  const router = useRouter();
  const [category, setCategory] = useState("Cơ sở vật chất");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tiêu đề phản ánh.");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung chi tiết ý kiến của bạn.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiSubmitFeedback({
        title: title.trim(),
        content: content.trim(),
        category,
        rating,
      });

      if (res && res.success) {
        Alert.alert(
          "Thành công",
          res.message || "Ý kiến phản ánh của bạn đã được gửi thành công đến ban quản lý.",
          [{ text: "Đóng", onPress: () => router.push("/(main)/home") }]
        );
        setTitle("");
        setContent("");
      } else {
        Alert.alert("Lỗi", res?.message || "Không thể gửi ý kiến lúc này. Vui lòng thử lại sau.");
      }
    } catch {
      Alert.alert("Lỗi", "Đã xảy ra sự cố khi kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Góp ý & Phản ánh"
        subtitle="Ý kiến của bạn giúp nâng cao chất lượng môi trường học"
        showBack={true}
        onBack={() => router.push("/(main)/home")}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Danh mục */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 8 }}>
          Lĩnh vực góp ý
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {CATEGORIES.map((cat) => {
            const isSelected = cat === category;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: isSelected ? AppColors.primary : AppColors.muted,
                  borderWidth: 1,
                  borderColor: isSelected ? AppColors.primary : AppColors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : AppColors.textSecondary }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Đánh giá sao */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 8 }}>
          Mức độ hài lòng chung
        </Text>
        <View style={[s.row, { gap: 12, marginBottom: 20 }]}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Feather
                name="star"
                size={28}
                color={star <= rating ? "#F59E0B" : "#D1D5DB"}
              />
            </TouchableOpacity>
          ))}
          <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.textSecondary, marginLeft: 8 }}>
            {rating === 5 ? "Rất hài lòng" : rating === 4 ? "Hài lòng" : rating === 3 ? "Bình thường" : "Chưa hài lòng"}
          </Text>
        </View>

        {/* Tiêu đề */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 6 }}>
          Tiêu đề góp ý <Text style={{ color: AppColors.danger }}>*</Text>
        </Text>
        <TextInput
          placeholder="Ví dụ: Máy chiếu phòng B201 bị mờ, đèn hành lang hỏng..."
          placeholderTextColor={AppColors.textMuted}
          value={title}
          onChangeText={setTitle}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            paddingHorizontal: 14,
            fontSize: 14,
            color: AppColors.text,
            marginBottom: 16,
          }}
        />

        {/* Nội dung chi tiết */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 6 }}>
          Nội dung chi tiết <Text style={{ color: AppColors.danger }}>*</Text>
        </Text>
        <TextInput
          placeholder="Mô tả cụ thể vấn đề hoặc đề xuất giải pháp của bạn..."
          placeholderTextColor={AppColors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{
            height: 140,
            borderRadius: 14,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            padding: 14,
            fontSize: 14,
            color: AppColors.text,
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
            backgroundColor: AppColors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            shadowColor: AppColors.primary,
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
    </View>
  );
}

