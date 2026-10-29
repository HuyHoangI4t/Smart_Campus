import { API_BASE_URL, fetchWithTimeout, getAuthHeaders } from "./client";
import {
  ChatSuggestion,
  StudentChatContext,
  ChatbotResponse,
} from "../../features/chat/types";

export * from "../../features/chat/types";


/**
 * Gửi câu hỏi đến TTN Smart Bot RAG AI
 */
export async function apiAskChatbot(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  studentContext?: StudentChatContext
): Promise<ChatbotResponse> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/chat/ask`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          history,
          studentContext,
        }),
      },
      15000 // Chờ tối đa 15s cho LLM Generation
    );

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return {
        success: true,
        intent: json.data.intent,
        reply: json.data.reply,
        action: json.data.action,
        suggested_questions: json.data.suggested_questions,
        engine: json.data.engine,
      };
    }

    return {
      success: false,
      reply: json.message || "Không nhận được phản hồi từ trợ lý ảo.",
      error: json.message,
    };
  } catch (error: any) {
    return {
      success: false,
      reply:
        "Hiện tại hệ thống AI đang bận hoặc thiết bị mất kết nối máy chủ. Bạn vui lòng thử lại sau giây lát nhé!",
      error: error?.message || "Lỗi mạng",
    };
  }
}

/**
 * Lấy danh sách câu hỏi gợi ý thông minh
 */
export async function apiGetChatSuggestions(): Promise<ChatSuggestion[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/chat/suggestions`,
      {
        method: "GET",
        headers,
      },
      5000
    );

    const json = await res.json();
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch {
    // Return default fallbacks
  }

  return [
    { id: "q1", text: "Lịch học hôm nay của mình", icon: "calendar" },
    { id: "q2", text: "Điểm GPA của mình thế nào", icon: "bar-chart-2" },
    { id: "q3", text: "Quy chế xét học bổng", icon: "award" },
    { id: "q4", text: "Chỉ đường đến Nhà học số 9", icon: "map-pin" },
    { id: "q5", text: "Hotline bảo vệ và y tế trường", icon: "phone-call" },
  ];
}
