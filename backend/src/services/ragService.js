const axios = require("axios");
const db = require("../config/db");
const vectorDbService = require("./vectorDbService");
const gradeService = require("./gradeService");

const DEFAULT_SUGGESTED_QUESTIONS = [
  { id: "q1", text: "Hôm nay mình có tiết học gì không?", icon: "calendar" },
  { id: "q2", text: "Phân tích kết quả học tập & điểm GPA của mình", icon: "bar-chart-2" },
  { id: "q3", text: "Quy chế xét học bổng khuyến khích học tập?", icon: "award" },
  { id: "q4", text: "Chỉ đường đến Nhà học số 9 (Khoa CNTT)", icon: "map-pin" },
  { id: "q5", text: "Điều kiện để không bị cảnh báo học vụ?", icon: "alert-triangle" },
  { id: "q6", text: "Số điện thoại khẩn cấp của bảo vệ và trạm y tế?", icon: "phone-call" },
];

function buildUnifiedPrompt(studentData, ragContext, currentTime) {
  return `
# VAI TRÒ & NGUYÊN TẮC CỐT LÕI (NGẮN GỌN & ĐI THẲNG TRỌNG TÂM)
Bạn là "TTN Smart Bot" — Trợ lý AI trên app Smart Campus Trường Đại học Tây Nguyên (TTN).
Phong cách: Thân thiện, xưng "mình" và gọi "bạn".

QUY TẮC BẮT BUỘC VỀ ĐỘ DÀI:
- BẮT BUỘC TRẢ LỜI NGẮN GỌN, SÚC TÍCH, ĐI THẲNG VÀO CÂU HỎI.
- Tối đa 2-4 dòng hoặc 3-5 gạch đầu dòng ngắn.
- KHÔNG chào hỏi rườm rà, KHÔNG cảm ơn hay kết bài lan man ("Hy vọng thông tin này hữu ích...").
- In đậm (**text**) từ khóa, số liệu quan trọng nhất (điểm, giờ, phòng, hạn chót).

# DỮ LIỆU ĐƯỢC TRUY XUẤT TỪ CƠ SỞ DỮ LIỆU (DATABASE & VECTOR SEARCH)
- Thời gian thực tế: ${currentTime}
- Dữ liệu cá nhân sinh viên (từ MySQL student_schedules & student_grades): 
${JSON.stringify(studentData || "Chưa đăng nhập")}

- Dữ liệu tri thức trích xuất qua Vector Similarity Search từ MySQL (campus_knowledge & map_locations):
"""
${ragContext || "Không tìm thấy đoạn trích phù hợp."}
"""

# NHIỆM VỤ CỦA AI:
1. Đọc kỹ dữ liệu database ở trên và TỰ ĐỘNG TỔNG HỢP câu trả lời ngắn gọn nhất có thể.
2. TUYỆT ĐỐI KHÔNG dùng câu trả lời mẫu có sẵn hoặc giải thích dài dòng.

# LƯU Ý ĐẶC BIỆT PHÂN BIỆT NHÀ 9 VÀ PHÒNG 7.4.25:
- Khoa Khoa học Tự nhiên và Công nghệ (Khoa KHTN & CN / CNTT):
  + Nhà học số 9: Trụ sở Khoa, gồm Văn phòng Khoa, khu giảng đường học tập và 8 phòng máy tính thực hành (Tầng 2 & 3).
  + Phòng 7.4.25 (Nhà học số 7, Tầng 4, Phòng 25): ĐÂY LÀ VĂN PHÒNG BỘ MÔN (VP BỘ MÔN CNTT / KHTN&CN), KHÔNG PHẢI VĂN PHÒNG KHOA. Nơi sinh viên gặp giảng viên bộ môn, hướng dẫn đồ án, tiểu luận, chuyên môn.
  + Khi sinh viên hỏi về "VP Bộ môn", "Văn phòng bộ môn", "7.4.25": Trả lời chính xác phòng 7.4.25 Nhà 7 là Văn phòng Bộ môn (VP Bộ môn); action: {"type": "OPEN_MAP_3D", "target_id": "Nhà học số 7"}.

# NGUYÊN TẮC PHÂN BIỆT Ý ĐỊNH BẮT BUỘC:
- Khi sinh viên hỏi điểm số, kết quả cá nhân ("của mình", "của tôi", "phân tích kết quả", "gpa của mình"):
  + Nếu [Dữ liệu cá nhân sinh viên] CÓ số liệu GPA: BẮT BUỘC trả lời phân tích kết quả học tập cá nhân của sinh viên đó (GPA hệ 4, hệ 10, xếp loại, tín chỉ tích lũy) và đặt intent "PERSONAL_GRADE", action "OPEN_TUITION".
  + Nếu sinh viên chưa đăng nhập hoặc không có dữ liệu GPA: BẮT BUỘC thông báo: "Để xem và phân tích kết quả học tập, điểm GPA cá nhân, bạn vui lòng **đăng nhập tài khoản sinh viên** trên ứng dụng nhé!" và đặt action: {"type": "OPEN_TUITION", "target_id": null}. TUYỆT ĐỐI KHÔNG chép ra tài liệu quy chế chung!
- Khi người dùng hỏi quy chế chung ("quy chế", "thang điểm 4 tính thế nào", "tiêu chuẩn học bổng"):
  + Tóm tắt quy chế chung từ [Dữ liệu tri thức Vector].

# NGUYÊN TẮC BẮT BUỘC CHO CÂU HỎI GỢI Ý (SUGGESTED_QUESTIONS):
- Chỉ đưa ra tối đa 2 gợi ý câu hỏi tiếp theo và BẮT BUỘC PHẢI BÁM SÁT NGAY CHỦ ĐỀ VỪA TRẢ LỜI.
- Gợi ý phải là bước đi tiếp theo hợp logic tự nhiên của người dùng, TUYỆT ĐỐI KHÔNG nhảy sang chủ đề khác không liên quan.
- Quy tắc gợi ý theo từng chủ đề:
  + Về Điểm GPA cá nhân: gợi ý liên quan điểm số, cải thiện điểm, học bổng mức GPA này (VD: "Cách cải thiện điểm", "Mức học bổng đạt được"). KHÔNG gợi ý lịch học, bản đồ hay bảo vệ.
  + Về Lịch học: gợi ý về phòng học, môn kế tiếp, lịch ngày mai (VD: "Chỉ đường đến phòng học", "Lịch học ngày mai"). KHÔNG gợi ý học phí hay điểm.
  + Về Bản đồ / Địa điểm: gợi ý về đường đi, phòng trong tòa nhà đó (VD: "Chỉ đường đến đây", "Phòng nằm ở tầng mấy"). KHÔNG gợi ý điểm thi.
  + Về Quy chế thang điểm: gợi ý liên quan trực tiếp đến mốc điểm hoặc môn học lại (VD: "Điểm F học lại thế nào", "Môn tính điểm P").
  + Khi chưa đăng nhập / Khách: gợi ý ("Cách đăng nhập tài khoản", "Tìm hiểu trường").
- Độ dài mỗi câu gợi ý: Cực kỳ ngắn gọn, từ 3 đến 6 từ.

# ĐỊNH DẠNG ĐẦU RA (STRICT JSON ONLY)
BẮT BUỘC chỉ trả về một chuỗi JSON hợp lệ duy nhất theo đúng cấu trúc dưới đây (không bọc trong \`\`\`json):

{
  "intent": "PERSONAL_SCHEDULE | PERSONAL_GRADE | PERSONAL_TUITION | CAMPUS_MAP | GENERAL_INFO | CHITCHAT",
  "reply": "Câu trả lời ngắn gọn, súc tích (hỗ trợ in đậm **text**, danh sách ngắn)...",
  "action": {
    "type": "NONE | OPEN_MAP_3D | OPEN_SCHEDULE | OPEN_TUITION | CONTACT_SUPPORT",
    "target_id": "Mã phòng/tòa nhà nếu OPEN_MAP_3D, ngược lại null"
  },
  "suggested_questions": [
    "Gợi ý sát ngữ cảnh 1 (dưới 6 từ)",
    "Gợi ý sát ngữ cảnh 2 (dưới 6 từ)"
  ]
}
`;
}

async function getStudentSummaryFromMySQL(mssv) {
  if (!mssv || mssv === "guest") return null;

  try {
    const summary = {
      mssv,
      ho_ten: "Sinh viên",
      lop: "",
      khoa: "",
      todaySchedule: [],
      gpaSummary: null,
      tuition: "Đã hoàn thành học phí",
    };

    const [users] = await db.query(
      "SELECT mssv, ho_ten, email, lop, khoa FROM users WHERE mssv = ? LIMIT 1",
      [mssv]
    );
    if (users.length > 0) {
      summary.ho_ten = users[0].ho_ten || summary.ho_ten;
      summary.lop = users[0].lop || "";
      summary.khoa = users[0].khoa || "";
    }

    const dayOfWeek = new Date().getDay() + 1;
    const thuTarget = dayOfWeek === 1 ? "Chủ nhật" : `Thứ ${dayOfWeek}`;
    const [schedules] = await db.query(
      "SELECT ten_hp as course, tiet as time, phong as room, giang_vien as lecturer, thu FROM student_schedules WHERE mssv = ? AND (thu = ? OR thu = ? OR thu = ?) LIMIT 10",
      [mssv, thuTarget, thuTarget.toLowerCase(), dayOfWeek === 1 ? "Chủ Nhật" : thuTarget]
    );
    if (schedules.length > 0) {
      summary.todaySchedule = schedules;
    }

    const [grades] = await db.query(
      "SELECT ten_hp, so_tin_chi, diem_dbp, diem_thi1, diem_thi2, diem_1, diem_2, diem_hp, diem_chu, hoc_ky, hoc_phi FROM student_grades WHERE mssv = ?",
      [mssv]
    );
    if (grades.length > 0) {
      const processed = gradeService.processGradesPayload(grades);
      if (processed && processed.summary && Number(processed.summary.gradedCredits) > 0) {
        summary.gpaSummary = {
          gpa10: processed.summary.gpa10,
          gpa4: processed.summary.gpa4,
          totalCredits: processed.summary.accumulatedCredits || processed.summary.totalCredits,
          rank: processed.summary.academicRank?.label || "Khá",
          passedCourses: processed.summary.passedCourses,
          failedCourses: processed.summary.failedCourses,
        };
      }
    }

    return summary;
  } catch (err) {
    console.warn("⚠️ [getStudentSummaryFromMySQL Error]:", err.message);
    return null;
  }
}

class RagService {
  /**
   * Truy xuất tài liệu tri thức liên quan thông qua Vector Similarity Search từ MySQL Database
   */
  async searchRAG(query, topK = 4) {
    if (!query || typeof query !== "string") return "";
    try {
      const matches = await vectorDbService.searchVector(query, topK);
      return matches.map((m) => `[${m.title}]\n${m.content}`).join("\n\n");
    } catch (err) {
      console.warn("[Vector Search Error]:", err.message);
      return "";
    }
  }

  /**
   * Động cơ suy luận Fallback RAG tự sinh câu trả lời trực tiếp từ Vector Matches
   * KHÔNG dùng câu trả lời mẫu có sẵn
   */
  generateFallbackJSON(query, vectorMatches, studentData) {
    const lq = query.toLowerCase().trim();

    // 1. Nếu hỏi dữ liệu sinh viên cá nhân (Lịch học hôm nay)
    if (lq.includes("lịch học") || lq.includes("thời khóa biểu") || lq.includes("hôm nay có tiết")) {
      if (studentData && Array.isArray(studentData.todaySchedule) && studentData.todaySchedule.length > 0) {
        let reply = `Chào bạn **${studentData.ho_ten || studentData.name || "sinh viên"}**! Dưới đây là lịch học hôm nay của bạn từ cơ sở dữ liệu:\n\n`;
        studentData.todaySchedule.forEach((s, idx) => {
          reply += `- **Tiết ${idx + 1}: ${s.course || s.subject}**\n`;
          reply += `  • Giờ học: **${s.time || "Theo ca"}**\n`;
          reply += `  • Phòng: **${s.room || "Chưa xếp phòng"}**\n`;
          if (s.lecturer) reply += `  • Giảng viên: ${s.lecturer}\n`;
        });
        const firstRoom = studentData.todaySchedule[0]?.room || "";
        return {
          intent: "PERSONAL_SCHEDULE",
          reply,
          action: {
            type: firstRoom ? "OPEN_MAP_3D" : "OPEN_SCHEDULE",
            target_id: firstRoom || null,
          },
          suggested_questions: ["Chỉ đường đến phòng học", "Lịch học ngày mai"],
        };
      }
      return {
        intent: "PERSONAL_SCHEDULE",
        reply: `Chào bạn! Theo dữ liệu từ cơ sở dữ liệu trường, hôm nay bạn **không có tiết học nào**. Bạn có thể đến tự học tại **Trung tâm Thư viện** nhé! 📚`,
        action: { type: "OPEN_SCHEDULE", target_id: null },
        suggested_questions: ["Lịch học ngày mai", "Lịch học tuần này"],
      };
    }

    // 2. Nếu hỏi điểm số cá nhân của bản thân
    if (
      (lq.includes("điểm") || lq.includes("gpa") || lq.includes("kết quả")) &&
      (lq.includes("của mình") || lq.includes("của tôi") || lq.includes("tôi được") || lq.includes("kết quả học tập") || lq.includes("phân tích"))
    ) {
      const gpa = studentData?.gpaSummary;
      if (gpa) {
        return {
          intent: "PERSONAL_GRADE",
          reply:
            `📊 **Kết quả học tập cá nhân (${studentData.ho_ten || "Sinh viên"} - ${studentData.mssv || ""}):**\n` +
            `- Điểm GPA: **${gpa.gpa4}/4.0** (${gpa.gpa10}/10)\n` +
            `- Xếp loại: **${gpa.rank}**\n` +
            `- Tích lũy: **${gpa.totalCredits} tín chỉ**\n` +
            (gpa.passedCourses !== undefined ? `- Môn đã đạt: **${gpa.passedCourses} môn**\n` : "") +
            `Bạn có thể bấm nút bên dưới để xem bảng điểm chi tiết!`,
          action: { type: "OPEN_TUITION", target_id: null },
          suggested_questions: ["Cách cải thiện điểm", "Mức học bổng đạt được"],
        };
      }

      return {
        intent: "PERSONAL_GRADE",
        reply: "Để xem và phân tích kết quả học tập, điểm GPA cá nhân, bạn vui lòng **đăng nhập tài khoản sinh viên** trên ứng dụng nhé!",
        action: { type: "OPEN_TUITION", target_id: null },
        suggested_questions: ["Cách đăng nhập", "Tìm hiểu trường"],
      };
    }

    // 2.5. Nếu hỏi về Văn phòng Bộ môn / 7.4.25 / Khoa KHTN & CN
    if (lq.includes("vp bộ môn") || lq.includes("văn phòng bộ môn") || lq.includes("7.4.25") || (lq.includes("bộ môn") && (lq.includes("cntt") || lq.includes("khtn")))) {
      return {
        intent: "CAMPUS_MAP",
        reply: "Về vị trí **Văn phòng Bộ môn (VP Bộ môn CNTT / KHTN & CN)**:\n- **Văn phòng Bộ môn**: Đặt tại **phòng 7.4.25** (Nhà học số 7, Tầng 4, Phòng 25). Đây là nơi sinh viên gặp giảng viên bộ môn để trao đổi đồ án, tiểu luận và chuyên môn học tập.\n- **Khoa KHTN & CN & Phòng máy tính**: Đặt tại **Nhà học số 9** (gồm các giảng đường và 8 phòng máy thực hành Tầng 2 & 3).\n\n📌 **Lưu ý**: Phòng 7.4.25 Nhà 7 là **Văn phòng Bộ môn**, còn cơ sở học tập và thực hành của Khoa nằm ở **Nhà học số 9** bạn nhé!",
        action: { type: "OPEN_MAP_3D", target_id: "Nhà học số 7" },
        suggested_questions: ["Chỉ đường đến Nhà 7", "Chỉ đường đến Nhà 9"],
      };
    }

    if (lq.includes("khoa kh cn ở đâu") || lq.includes("khoa khtn ở đâu") || lq.includes("khoa cntt ở đâu")) {
      return {
        intent: "CAMPUS_MAP",
        reply: "Về vị trí của **Khoa Khoa học Tự nhiên và Công nghệ (KHTN & CN / CNTT)**:\n- **Trụ sở Khoa & Phòng máy thực hành**: Đặt tại **Nhà học số 9** (gồm 8 phòng máy thực hành Tầng 2 & 3 và các giảng đường lý thuyết).\n- **Văn phòng Bộ môn**: Đặt tại **phòng 7.4.25** (Nhà học số 7, Tầng 4, Phòng 25).",
        action: { type: "OPEN_MAP_3D", target_id: "Nhà học số 9" },
        suggested_questions: ["Chỉ đường đến Nhà 9", "Văn phòng Bộ môn ở đâu"],
      };
    }

    // 3. Tự sinh câu trả lời trực tiếp từ kết quả Vector Search trong Database
    if (Array.isArray(vectorMatches) && vectorMatches.length > 0 && vectorMatches[0].score > 0.35) {
      const top = vectorMatches[0];
      let contextualSuggestions = ["Chi tiết quy định này", "Hỏi nội dung khác"];

      if (top.category === "map") {
        contextualSuggestions = ["Chỉ đường đến đây", "Tòa nhà này có gì"];
      } else if (top.title.includes("Điểm") || top.title.includes("tính điểm") || top.category === "academic") {
        contextualSuggestions = ["Điểm F học lại thế nào", "Môn tính điểm P"];
      } else if (top.title.includes("Học bổng") || top.category === "policy") {
        contextualSuggestions = ["Điều kiện xét học bổng", "Mức tiền thưởng học bổng"];
      } else if (top.category === "safety") {
        contextualSuggestions = ["Hotline an ninh bảo vệ", "Vị trí trạm y tế"];
      }

      return {
        intent: top.category === "map" ? "CAMPUS_MAP" : "GENERAL_INFO",
        reply: `Dưới đây là thông tin về **${top.title}** được trích xuất từ cơ sở dữ liệu Đại học Tây Nguyên:\n\n${top.content}`,
        action: top.category === "map" ? { type: "OPEN_MAP_3D", target_id: top.title } : { type: "NONE", target_id: null },
        suggested_questions: contextualSuggestions,
      };
    }

    // 4. Mặc định
    return {
      intent: "CHITCHAT",
      reply: `Chào bạn! Mình là TTN Smart Bot. Bạn có thể hỏi mình về **quy chế thang điểm 4, học bổng, lịch học, điểm số cá nhân** hoặc **vị trí giảng đường** trong trường nhé!`,
      action: { type: "NONE", target_id: null },
      suggested_questions: ["Quy chế thang điểm 4", "Tiêu chuẩn xét học bổng", "Lịch học hôm nay"],
    };
  }

  /**
   * Xử lý câu hỏi và trả về chuẩn JSON 100% bằng Gemini AI kết hợp Vector RAG Database
   */
  async answerQuestionUnified(userMessage, studentIdOrMssv = null, clientContext = null, history = []) {
    const currentTime = new Date().toLocaleString("vi-VN");

    // 1. Chạy song song: vừa truy xuất dữ liệu cá nhân từ MySQL, vừa chạy Vector Search trên MySQL
    const [dbStudentData, vectorMatches] = await Promise.all([
      getStudentSummaryFromMySQL(studentIdOrMssv || clientContext?.mssv),
      vectorDbService.searchVector(userMessage, 4),
    ]);

    // Trích xuất ngữ cảnh RAG từ các vector match trong DB
    const ragContext = vectorMatches
      .map((item) => `[${item.title}]\n${item.content}`)
      .join("\n\n");

    // Hợp nhất dữ liệu sinh viên
    const studentData = {
      ...(dbStudentData || {}),
      ...(clientContext || {}),
    };

    // 2. Tạo Prompt RAG chuẩn
    const systemInstruction = buildUnifiedPrompt(studentData, ragContext, currentTime);

    // Chuẩn bị lịch sử trò chuyện nhiều lượt (multi-turn conversation)
    const formattedHistory = Array.isArray(history)
      ? history
          .slice(-4)
          .filter((h) => h && h.content && h.content.trim())
          .map((h) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content.trim() }],
          }))
      : [];

    const contents = [
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    // 3. Gọi Gemini LLM (gemini-2.5-flash) tự động sinh câu trả lời theo ngữ cảnh DB
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey.trim()) {
      const modelsToTry = [
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-flash-latest",
      ];

      for (const modelName of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey.trim()}`;

          const response = await axios.post(
            geminiUrl,
            {
              system_instruction: {
                parts: [{ text: systemInstruction }],
              },
              contents,
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                maxOutputTokens: 450,
              },
            },
            {
              timeout: 12000,
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiKey.trim(),
              },
            }
          );

          const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            const parsed = JSON.parse(rawText.trim());
            if (parsed && parsed.reply) {
              return {
                ...parsed,
                engine: `${modelName} (Vector RAG Database)`,
              };
            }
          }
        } catch (geminiError) {
          console.warn(`⚠️ [Gemini ${modelName} Notice]:`, geminiError.response?.data?.error?.message || geminiError.message);
        }
      }
    }

    // 4. Fallback: Tự sinh câu trả lời từ Vector Matches trong Database
    const fallback = this.generateFallbackJSON(userMessage, vectorMatches, studentData);
    return {
      ...fallback,
      engine: "database-vector-rag-engine",
    };
  }

  getSuggestedQuestions() {
    return DEFAULT_SUGGESTED_QUESTIONS;
  }
}

module.exports = new RagService();
