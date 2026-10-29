const axios = require("axios");
const db = require("../config/db");
const vectorDbService = require("./vectorDbService");
const gradeService = require("./gradeService");

const DEFAULT_SUGGESTED_QUESTIONS = [
  { id: "q1", text: "Lịch học hôm nay của mình", icon: "calendar" },
  { id: "q2", text: "Điểm GPA của mình thế nào", icon: "bar-chart-2" },
  { id: "q3", text: "Chỉ đường đến Nhà học số 9 (Khoa CNTT)", icon: "map-pin" },
  { id: "q4", text: "App Smart Campus có những tính năng gì?", icon: "grid" },
  { id: "q5", text: "Hotline cứu hộ SOS và bảo vệ trường?", icon: "phone-call" },
  { id: "q6", text: "Quy chế xét học bổng khuyến khích?", icon: "award" },
];

function buildUnifiedPrompt(studentData, ragContext, currentTime) {
  return `
# VAI TRÒ & PHONG CÁCH
Bạn là "TTN Smart Bot" — Trợ lý AI trên ứng dụng Smart Campus Trường Đại học Tây Nguyên (TTN).
Phong cách: Thân thiện, thông minh, tinh gọn, xưng "mình" và gọi "bạn".

# NGUYÊN TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ 100%):
1. **TRẢ LỜI ĐÚNG TRỌNG TÂM - CẤM LỆCH ĐỀ**:
   - Người dùng hỏi gì -> CHỈ TRẢ LỜI ĐÚNG NỘI DUNG ĐÓ! Tuyệt đối không lôi các chủ đề khác vào.
   - [Dữ liệu tri thức RAG]: CHỈ sử dụng khi người dùng HỎI ĐÚNG VỀ nội dung đó (VD: hỏi quy chế tính điểm, điều kiện học bổng, cảnh báo học vụ, thông tin phòng ban).
   - NẾU người dùng hỏi về:
     + **Tính năng app / Cách dùng app** (xem lịch, xem điểm, đổi mật khẩu, bản đồ, SOS, phản ánh, widgets...): Hướng dẫn ngay các bước thực hiện trên ứng dụng (vào Tab nào, bấm nút nào). KHÔNG chép quy chế học bổng, điểm số ra!
     + **Chào hỏi / Xã giao** ("chào bạn", "hello", "bạn là ai", "bạn giúp được gì"): Chào lại ngắn gọn 1-2 câu, giới thiệu ngắn gọn các việc bạn có thể hỗ trợ (tra cứu lịch học, xem điểm GPA, chỉ đường 3D, cứu hộ SOS, giải đáp quy chế TTN). KHÔNG chép tài liệu quy chế nếu người dùng chưa hỏi!
2. **CỰC KỲ NGẮN GỌN & SÚC TÍCH**:
   - Độ dài: Tối đa 2 đến 4 câu hoặc 3 đến 4 gạch đầu dòng ngắn.
   - CẤM dài dòng, CẤM văn mẫu sáo rỗng, CẤM câu kết lan man ("Hy vọng thông tin này giúp ích cho bạn...").
   - In đậm (**text**) từ khóa chính: tên Tab, số phòng, điểm số, thời gian, hotline.

# TOÀN BỘ CẤU TRÚC & TÍNH NĂNG ỨNG DỤNG SMART CAMPUS (BẠN PHẢI NẮM RÕ TỪNG CHI TIẾT):

1. **Phân quyền & Tài khoản**:
   - **Chế độ Khách (Guest)**: Dành cho người chưa có tài khoản hoặc chưa đăng nhập. Xem được Trang chủ (tin tức), Bản đồ số 3D, đọc thông báo trường và dùng nút SOS khẩn cấp.
   - **Đăng nhập sinh viên**: Đăng nhập bằng MSSV/Email và mật khẩu để mở khóa toàn bộ Lịch học cá nhân, Bảng điểm chi tiết và tính năng Gửi phản ánh.
   - **Đăng ký tài khoản**: Nhập Họ tên, MSSV, mật khẩu -> Nhận mã xác thực OTP 6 số gửi qua email sinh viên.
   - **Quên mật khẩu**: Nhập email sinh viên -> Nhận OTP 6 số để đặt lại mật khẩu mới an toàn.

2. **Trang chủ (Home - /(main)/home)**:
   - Tin tức & Thông báo mới nhất cập nhật tự động từ cổng thông tin Đại học Tây Nguyên (ttn.edu.vn), có hỗ trợ đọc chi tiết và tải file đính kèm.
   - Thẻ điểm GPA nhanh: Xem ngay điểm GPA hệ 4, hệ 10 và xếp loại học lực.
   - Thẻ Lịch học hôm nay: Hiển thị môn học kế tiếp, tiết học và phòng học.
   - Thanh lối tắt tiện ích nhanh (Quick Actions): Mở Bản đồ, Lịch học, Điểm, Phản ánh, SOS.
   - Trợ lý AI nổi (Floating ChatBot) luôn hiển thị ở góc màn hình để mở chat nhanh.

3. **Thời khóa biểu / Lịch học (Schedule - /(main)/schedule) -> Action: "OPEN_SCHEDULE"**:
   - Xem thời khóa biểu theo Ngày hoặc theo Tuần (chuyển tuần linh hoạt bằng nút mũi tên).
   - Thông tin từng môn: Tên học phần, số tín chỉ, tiết bắt đầu - kết thúc, phòng học, giảng viên phụ trách.
   - Lịch học tùy chỉnh (Custom Schedule): Sinh viên có thể tự thêm/sửa/xóa lịch học phụ, lịch thi, lịch cá nhân.
   - Nút "Tìm đường": Mở modal hướng dẫn vị trí phòng và liên kết thẳng sang Bản đồ số để dẫn đường.

4. **Điểm số & Học phí (Grades - /(main)/grades) -> Action: "OPEN_GRADES"**:
   - Bảng điểm tổng quan: Điểm trung bình tích lũy hệ 4 (GPA 4.0), hệ 10 (GPA 10.0), tổng tín chỉ tích lũy, xếp loại học lực (Xuất sắc >= 3.6, Giỏi 3.2-3.59, Khá 2.5-3.19, Trung bình 2.0-2.49, Yếu < 2.0).
   - Tình trạng học phí: Báo rõ Đã hoàn thành hoặc Còn nợ học phí.
   - Bảng điểm chi tiết từng học kỳ: Điểm bộ phận/quá trình (ĐBP 40%), điểm thi lần 1, thi lần 2 (60%), điểm tổng kết môn, điểm chữ (A, B, C, D, F). Bấm từng môn để xem popup chi tiết.

5. **Bản đồ số 2D/3D & Dẫn đường (Map - /(main)/map) -> Action: "OPEN_MAP_3D"**:
   - Bản đồ khuôn viên trường Đại học Tây Nguyên (567 Lê Duẩn, TP. Buôn Ma Thuột).
   - Chuyển đổi linh hoạt giữa Bản đồ đường phố và Bản đồ vệ tinh (Google Satellite).
   - Định vị vị trí GPS thời gian thực của sinh viên trong trường.
   - Tìm kiếm mọi địa điểm: Nhà học số 1 đến 12, Nhà 7, Nhà 9 (Khoa CNTT / KHTN&CN), Tòa Nhà Điều Hành (7 tầng), Thư viện trung tâm, KTX 1, 2, 3, 4, KTX Lào - Campuchia, Căn tin, Trạm y tế, Sân bóng, Nhà thi đấu...
   - Tự động phân tích mã phòng: gõ "9.2.1" tự định vị Nhà 9, Tầng 2, Phòng 1; gõ "7.4.25" tự định vị Văn phòng Bộ môn Nhà 7 Tầng 4.
   - Chọn cổng xuất phát (Cổng chính Lê Duẩn, Cổng phụ Y Ngông).
   - Dẫn đường đi bộ thông minh (Turn-by-turn routing): Vẽ lộ trình đường đi ngắn nhất từ vị trí GPS đến tận cửa phòng học.

6. **Cứu hộ khẩn cấp SOS (SOS - /(main)/sos) -> Action: "OPEN_SOS"**:
   - Nút bấm báo động đỏ 1-chạm: Tự động kích hoạt GPS, gửi tọa độ vị trí thời gian thực và tín hiệu báo động đến Đội bảo vệ & Trực ban an ninh trường.
   - 4 Hotline khẩn cấp gọi trực tiếp 1-chạm:
     + **Bảo vệ & An ninh cơ sở**: **0329106783**
     + **Trạm Y tế sinh viên**: **0978269097**
     + **Cấp cứu 115**: **0326896303**
     + **Cứu hỏa PCCC 114**: **0968372005**
   - 5 loại sự cố hỗ trợ: Cần hỗ trợ y tế, Sự cố an ninh / va chạm, Chập điện / Hỏa hoạn, Kẹt thang máy, Khác.

7. **Ý kiến & Phản ánh (Feedback - /(main)/feedback) -> Action: "OPEN_FEEDBACK"**:
   - Gửi ý kiến, kiến nghị, góp ý hoặc khiếu nại tới nhà trường.
   - Các danh mục: Cơ sở vật chất, Chất lượng giảng dạy, Căng tin & Dịch vụ, An ninh & Gửi xe, Thủ tục sinh viên, Khác.
   - Đánh giá sao (1-5 sao), nhập tiêu đề, nội dung và đính kèm ảnh chụp thực tế.
   - Theo dõi trạng thái giải quyết trực tiếp qua Socket: Đã tiếp nhận -> Đang xử lý -> Đã giải quyết.

8. **Hồ sơ sinh viên & Cài đặt (Profile - /(main)/profile) -> Action: "OPEN_PROFILE"**:
   - Xem thông tin sinh viên: MSSV, Họ tên, Email, Số điện thoại, Lớp, Khoa, Ngành học.
   - Đổi ảnh đại diện (chụp từ camera, chọn ảnh từ thư viện, hoặc chọn Avatar 3D mẫu).
   - Đổi mật khẩu tài khoản (Action: "OPEN_CHANGE_PASSWORD").
   - Cài đặt ứng dụng: Bật/tắt Giao diện tối (Dark mode), bật/tắt thông báo đẩy, âm thanh, rung (Action: "OPEN_SETTINGS").
   - Đăng xuất tài khoản an toàn (xóa sạch cache và token).

9. **Tiện ích màn hình chính điện thoại Android (Home Screen Widgets)**:
   - ScheduleWidget: Hiển thị lịch học hôm nay ngay ngoài màn hình chính Android.
   - GradesWidget: Hiển thị điểm GPA hệ 4, hệ 10 và tín chỉ tích lũy ngoài màn hình chính.
   - SosWidget: Nút bấm SOS 1-chạm ngoài màn hình chính để phát báo động cứu hộ tức thì.

10. **Trợ lý ảo TTN Smart Bot (Chat - /(main)/chat)**:
    - Hỗ trợ giải đáp, tra cứu và điều hướng qua nút Action 1-chạm.

# LƯU Ý PHÂN BIỆT NHÀ 9 VÀ PHÒNG 7.4.25 (KHOA KHTN & CN / CNTT):
- Nhà học số 9: Trụ sở Khoa CNTT (Khoa KHTN&CN), gồm Văn phòng Khoa, khu giảng đường và 8 phòng máy tính thực hành (Tầng 2 & 3). Action: {"type": "OPEN_MAP_3D", "target_id": "Nhà học số 9"}.
- Phòng 7.4.25 (Nhà học số 7, Tầng 4, Phòng 25): ĐÂY LÀ VĂN PHÒNG BỘ MÔN (VP Bộ môn CNTT / KHTN&CN), nơi sinh viên gặp giảng viên bộ môn để trao đổi đồ án, tiểu luận, chuyên môn. Action: {"type": "OPEN_MAP_3D", "target_id": "Nhà học số 7"}.

# DỮ LIỆU CÁ NHÂN SINH VIÊN (từ MySQL Database):
Thời gian hiện tại: ${currentTime}
${JSON.stringify(studentData || "Chưa đăng nhập")}

# DỮ LIỆU TRI THỨC TRÍCH XUẤT (RAG VECTOR DATABASE):
"""
${ragContext || "Không có tài liệu liên quan."}
"""

# QUY TẮC CHỌN HÀNH ĐỘNG (ACTION BUTTON):
Gán action phù hợp nhất với câu trả lời để sinh viên bấm chuyển trang tức thì:
- Mở lịch học -> {"type": "OPEN_SCHEDULE", "target_id": null}
- Mở điểm số, GPA, học phí -> {"type": "OPEN_GRADES", "target_id": null}
- Mở bản đồ / chỉ đường -> {"type": "OPEN_MAP_3D", "target_id": "Tên tòa nhà hoặc phòng học"}
- Mở cứu hộ SOS -> {"type": "OPEN_SOS", "target_id": null}
- Gọi điện bảo vệ / y tế / hotline -> {"type": "CONTACT_SUPPORT", "target_id": "Số điện thoại chính xác (VD 0329106783)"}
- Mở gửi phản ánh -> {"type": "OPEN_FEEDBACK", "target_id": null}
- Mở hồ sơ cá nhân -> {"type": "OPEN_PROFILE", "target_id": null}
- Mở đổi mật khẩu -> {"type": "OPEN_CHANGE_PASSWORD", "target_id": null}
- Mở cài đặt app / Dark mode -> {"type": "OPEN_SETTINGS", "target_id": null}
- Mở xem tin tức -> {"type": "OPEN_NEWS", "target_id": null}
- Không cần chuyển trang -> {"type": "NONE", "target_id": null}

# QUY TẮC CÂU HỎI GỢI Ý (SUGGESTED_QUESTIONS):
- Đưa ra đúng 2 câu gợi ý bước đi tiếp theo CỰC KỲ NGẮN GỌN (3-6 từ) và BÁM SÁT NGAY VẤN ĐỀ VỪA NÓI.
- Tuyệt đối không gợi ý nhảy sang chủ đề khác không liên quan.

# ĐỊNH DẠNG ĐẦU RA (STRICT JSON ONLY - KHÔNG VIẾT GÌ NGOÀI JSON NÀY):
{
  "intent": "APP_FEATURE | PERSONAL_SCHEDULE | PERSONAL_GRADE | CAMPUS_MAP | GENERAL_INFO | CHITCHAT",
  "reply": "Nội dung câu trả lời ngắn gọn (2-4 dòng), đúng trọng tâm, in đậm **từ khóa**...",
  "action": {
    "type": "NONE | OPEN_MAP_3D | OPEN_SCHEDULE | OPEN_GRADES | OPEN_SOS | OPEN_FEEDBACK | OPEN_PROFILE | OPEN_SETTINGS | OPEN_CHANGE_PASSWORD | OPEN_NEWS | CONTACT_SUPPORT",
    "target_id": "Tên tòa nhà/phòng nếu OPEN_MAP_3D, số điện thoại nếu CONTACT_SUPPORT, ngược lại null"
  },
  "suggested_questions": [
    "Gợi ý 1 (3-6 từ)",
    "Gợi ý 2 (3-6 từ)"
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
   * Động cơ suy luận Fallback RAG tự sinh câu trả lời ngắn gọn, chính xác khi không có LLM
   */
  generateFallbackJSON(query, vectorMatches, studentData) {
    const lq = query.toLowerCase().trim();

    // 1. Chào hỏi / Xã giao
    if (lq === "chào" || lq === "chào bạn" || lq === "hello" || lq === "hi" || lq.includes("bạn là ai") || lq.includes("giúp được gì")) {
      return {
        intent: "CHITCHAT",
        reply: "Chào bạn! Mình là **TTN Smart Bot** — trợ lý AI của Smart Campus Đại học Tây Nguyên. Mình có thể giúp bạn tra cứu **lịch học, điểm GPA, bản đồ 3D chỉ đường, báo cứu hộ SOS** hoặc giải đáp **quy chế học vụ** nhé!",
        action: { type: "NONE", target_id: null },
        suggested_questions: ["Lịch học hôm nay của mình", "Điểm GPA của mình"],
      };
    }

    // 2. Hỏi về hotline khẩn cấp / SOS / Bảo vệ / Y tế / Cấp cứu / PCCC
    if (
      lq.includes("hotline") ||
      lq.includes("số điện thoại") ||
      lq.includes("sđt") ||
      lq.includes("sos") ||
      lq.includes("cứu hộ") ||
      lq.includes("bảo vệ") ||
      lq.includes("trạm y tế") ||
      lq.includes("cấp cứu") ||
      lq.includes("115") ||
      lq.includes("pccc") ||
      lq.includes("114") ||
      lq.includes("khẩn cấp")
    ) {
      return {
        intent: "APP_FEATURE",
        reply:
          "Danh bạ **Hotline Khẩn cấp SOS** của trường Đại học Tây Nguyên:\n" +
          "- **Bảo vệ & An ninh cơ sở**: **0329106783**\n" +
          "- **Trạm Y tế sinh viên**: **0978269097**\n" +
          "- **Cấp cứu 115**: **0326896303**\n" +
          "- **Cứu hỏa PCCC 114**: **0968372005**\n" +
          "Bạn có thể mở tab **SOS** để bấm nút phát báo động GPS trực tiếp tới bảo vệ!",
        action: { type: "OPEN_SOS", target_id: null },
        suggested_questions: ["Gọi bảo vệ trường", "Vị trí trạm y tế"],
      };
    }

    // 3. Hỏi về các tính năng tổng quan của ứng dụng
    if (
      lq.includes("tính năng") ||
      lq.includes("chức năng") ||
      lq.includes("app có gì") ||
      lq.includes("ứng dụng này") ||
      lq.includes("smart campus có gì") ||
      lq.includes("app làm được gì")
    ) {
      return {
        intent: "APP_FEATURE",
        reply:
          "Ứng dụng **Smart Campus Đại học Tây Nguyên** hỗ trợ các tiện ích toàn diện:\n" +
          "- **Lịch học**: Thời khóa biểu cá nhân theo ngày/tuần, tự thêm lịch riêng và dẫn đường tới phòng.\n" +
          "- **Điểm số**: Xem GPA hệ 4, hệ 10, xếp loại, công nợ học phí và bảng điểm chi tiết.\n" +
          "- **Bản đồ số 3D**: Định vị GPS, bản đồ vệ tinh và chỉ đường đi bộ tới từng giảng đường.\n" +
          "- **SOS Cứu hộ**: Báo động khẩn cấp 1-chạm gửi GPS và gọi 4 hotline bảo vệ, y tế.\n" +
          "- **Phản ánh**: Gửi góp ý kèm ảnh chụp thực tế và theo dõi tiến độ xử lý.\n" +
          "- **Android Widgets**: Đặt tiện ích Lịch học, Điểm GPA, SOS ngay ngoài màn hình chính.",
        action: { type: "NONE", target_id: null },
        suggested_questions: ["Xem lịch học của mình", "Mở bản đồ trường"],
      };
    }

    // 4. Hỏi về đổi mật khẩu / tài khoản
    if (lq.includes("đổi mật khẩu") || lq.includes("quên mật khẩu") || lq.includes("thay mật khẩu")) {
      return {
        intent: "APP_FEATURE",
        reply: "Để đổi mật khẩu, bạn vào tab **Hồ sơ** ở thanh điều hướng dưới cùng, sau đó chọn mục **Đổi mật khẩu tài khoản** (mật khẩu mới tối thiểu 6 ký tự).",
        action: { type: "OPEN_CHANGE_PASSWORD", target_id: null },
        suggested_questions: ["Xem hồ sơ sinh viên", "Cài đặt ứng dụng"],
      };
    }

    // 5. Hỏi về cài đặt, dark mode, giao diện tối, thông báo
    if (lq.includes("cài đặt") || lq.includes("dark mode") || lq.includes("chế độ tối") || lq.includes("giao diện tối") || lq.includes("bật thông báo")) {
      return {
        intent: "APP_FEATURE",
        reply: "Bạn có thể bật/tắt **Chế độ tối (Dark mode)**, âm thanh và thông báo đẩy tại tab **Hồ sơ** -> chọn mục **Cài đặt ứng dụng** nhé!",
        action: { type: "OPEN_SETTINGS", target_id: null },
        suggested_questions: ["Đổi mật khẩu", "Xem hồ sơ sinh viên"],
      };
    }

    // 6. Hỏi về Widget màn hình chính
    if (lq.includes("widget") || lq.includes("tiện ích màn hình")) {
      return {
        intent: "APP_FEATURE",
        reply:
          "Ứng dụng hỗ trợ 3 **Widget trên màn hình chính Android**:\n" +
          "- **ScheduleWidget**: Xem lịch học hôm nay ngoài màn hình chính.\n" +
          "- **GradesWidget**: Hiển thị điểm GPA và số tín chỉ tích lũy.\n" +
          "- **SosWidget**: Nút bấm báo động khẩn cấp 1-chạm.\n" +
          "*(Nhấn giữ màn hình chính điện thoại -> chọn Widgets -> Smart Campus để thêm)*.",
        action: { type: "NONE", target_id: null },
        suggested_questions: ["Xem lịch học hôm nay", "Xem điểm GPA"],
      };
    }

    // 7. Hỏi về Phản ánh / Góp ý / Khiếu nại / Báo hỏng
    if (lq.includes("phản ánh") || lq.includes("góp ý") || lq.includes("khiếu nại") || lq.includes("báo hỏng")) {
      return {
        intent: "APP_FEATURE",
        reply: "Bạn có thể gửi ý kiến hoặc phản ánh cơ sở vật chất (kèm ảnh chụp) tại tab **Phản ánh**. Nhà trường sẽ tiếp nhận và cập nhật tiến độ xử lý trực tiếp trên ứng dụng.",
        action: { type: "OPEN_FEEDBACK", target_id: null },
        suggested_questions: ["Theo dõi phản ánh", "Gửi phản ánh mới"],
      };
    }

    // 8. Hỏi về Tin tức & Thông báo
    if (lq.includes("tin tức") || lq.includes("thông báo trường") || lq.includes("bài viết")) {
      return {
        intent: "APP_FEATURE",
        reply: "Tin tức và thông báo mới nhất từ website trường Đại học Tây Nguyên (ttn.edu.vn) được tự động cập nhật liên tục tại **Trang chủ** của ứng dụng.",
        action: { type: "OPEN_NEWS", target_id: null },
        suggested_questions: ["Xem thông báo mới nhất", "Lịch học hôm nay"],
      };
    }

    // 9. Hỏi lịch học cá nhân hôm nay
    if (lq.includes("lịch học") || lq.includes("thời khóa biểu") || lq.includes("hôm nay có tiết") || lq.includes("tiết học")) {
      if (studentData && Array.isArray(studentData.todaySchedule) && studentData.todaySchedule.length > 0) {
        let reply = `Lịch học hôm nay của bạn (**${studentData.ho_ten || studentData.name || "Sinh viên"}**):\n`;
        studentData.todaySchedule.forEach((s, idx) => {
          reply += `- **${s.course || s.subject}**: Tiết **${s.time || "Theo ca"}** tại **${s.room || "Chưa xếp"}**${s.lecturer ? ` (GV: ${s.lecturer})` : ""}\n`;
        });
        const firstRoom = studentData.todaySchedule[0]?.room || "";
        return {
          intent: "PERSONAL_SCHEDULE",
          reply: reply.trim(),
          action: {
            type: firstRoom ? "OPEN_MAP_3D" : "OPEN_SCHEDULE",
            target_id: firstRoom || null,
          },
          suggested_questions: ["Chỉ đường đến phòng học", "Lịch học ngày mai"],
        };
      }
      return {
        intent: "PERSONAL_SCHEDULE",
        reply: "Hôm nay bạn **không có tiết học nào**. Bạn có thể đến tự học tại **Trung tâm Thư viện** hoặc xem lịch các ngày khác nhé!",
        action: { type: "OPEN_SCHEDULE", target_id: null },
        suggested_questions: ["Lịch học ngày mai", "Lịch học tuần này"],
      };
    }

    // 10. Hỏi điểm số cá nhân của bản thân
    if (
      (lq.includes("điểm") || lq.includes("gpa") || lq.includes("kết quả")) &&
      (lq.includes("của mình") || lq.includes("của tôi") || lq.includes("tôi được") || lq.includes("kết quả học tập") || lq.includes("phân tích"))
    ) {
      const gpa = studentData?.gpaSummary;
      if (gpa) {
        return {
          intent: "PERSONAL_GRADE",
          reply:
            `📊 **Kết quả học tập cá nhân (${studentData.ho_ten || "Sinh viên"}):**\n` +
            `- Điểm GPA: **${gpa.gpa4}/4.0** (${gpa.gpa10}/10)\n` +
            `- Xếp loại học lực: **${gpa.rank}**\n` +
            `- Tích lũy: **${gpa.totalCredits} tín chỉ**\n` +
            (gpa.passedCourses !== undefined ? `- Số môn đạt: **${gpa.passedCourses} môn**` : ""),
          action: { type: "OPEN_GRADES", target_id: null },
          suggested_questions: ["Cách cải thiện điểm", "Mức học bổng đạt được"],
        };
      }

      return {
        intent: "PERSONAL_GRADE",
        reply: "Để xem điểm GPA và bảng điểm chi tiết cá nhân, bạn vui lòng **đăng nhập tài khoản sinh viên** trên ứng dụng nhé!",
        action: { type: "OPEN_GRADES", target_id: null },
        suggested_questions: ["Cách đăng nhập", "Quy chế thang điểm 4"],
      };
    }

    // 11. Hỏi về Văn phòng Bộ môn / 7.4.25 / Nhà học số 9
    if (lq.includes("vp bộ môn") || lq.includes("văn phòng bộ môn") || lq.includes("7.4.25") || (lq.includes("bộ môn") && (lq.includes("cntt") || lq.includes("khtn")))) {
      return {
        intent: "CAMPUS_MAP",
        reply: "Vị trí **Văn phòng Bộ môn CNTT / KHTN & CN**:\n- Đặt tại **phòng 7.4.25** (Nhà học số 7, Tầng 4, Phòng 25). Đây là nơi sinh viên gặp giảng viên bộ môn để trao đổi đồ án, tiểu luận và chuyên môn.\n- Cơ sở giảng đường và 8 phòng máy thực hành của Khoa nằm ở **Nhà học số 9** bạn nhé!",
        action: { type: "OPEN_MAP_3D", target_id: "Nhà học số 7" },
        suggested_questions: ["Chỉ đường đến Nhà 7", "Chỉ đường đến Nhà 9"],
      };
    }

    if (lq.includes("khoa kh cn ở đâu") || lq.includes("khoa khtn ở đâu") || lq.includes("khoa cntt ở đâu") || lq.includes("nhà 9 ở đâu")) {
      return {
        intent: "CAMPUS_MAP",
        reply: "**Khoa Khoa học Tự nhiên và Công nghệ (CNTT)** đặt tại **Nhà học số 9**, gồm Văn phòng Khoa, khu giảng đường và 8 phòng máy tính thực hành (Tầng 2 & 3). Riêng Văn phòng Bộ môn đặt tại phòng **7.4.25 Nhà 7**.",
        action: { type: "OPEN_MAP_3D", target_id: "Nhà học số 9" },
        suggested_questions: ["Chỉ đường đến Nhà 9", "Văn phòng Bộ môn ở đâu"],
      };
    }

    // 12. Hỏi quy chế học vụ: Điểm F, học lại, nợ môn
    if (lq.includes("điểm f") || lq.includes("học lại") || lq.includes("nợ môn") || lq.includes("trượt môn") || lq.includes("thi lại")) {
      return {
        intent: "GENERAL_INFO",
        reply: "Theo quy chế ĐH Tây Nguyên, điểm **F** (dưới 4.0 thang 10) là mức điểm **không đạt**:\n- Bạn bắt buộc phải **đăng ký học lại** học phần này ở các học kỳ tiếp theo.\n- Điểm học phần học lại mới sẽ thay thế điểm F để tính điểm trung bình tích lũy toàn khóa.",
        action: { type: "OPEN_GRADES", target_id: null },
        suggested_questions: ["Xem bảng điểm cá nhân", "Quy chế thang điểm 4"],
      };
    }

    // 13. Hỏi quy chế: Điểm P (GDTC, GDQP)
    if (lq.includes("điểm p") || lq.includes("môn tính điểm p") || lq.includes("gdtc") || lq.includes("gdqp")) {
      return {
        intent: "GENERAL_INFO",
        reply: "Điểm **P (Pass - Đạt)** tại ĐH Tây Nguyên áp dụng cho các học phần **Giáo dục thể chất (GDTC)** và **Giáo dục Quốc phòng - An ninh (GDQP-AN)**:\n- Được tính tích lũy tín chỉ tốt nghiệp nhưng **không tính vào điểm trung bình GPA**.",
        action: { type: "OPEN_GRADES", target_id: null },
        suggested_questions: ["Điểm F học lại thế nào", "Quy chế thang điểm 4"],
      };
    }

    // 14. Hỏi quy chế: Thang điểm 4 & Cách tính điểm GPA
    if (lq.includes("thang điểm 4") || lq.includes("thang điểm 10") || lq.includes("tính điểm gpa") || lq.includes("cách tính điểm")) {
      return {
        intent: "GENERAL_INFO",
        reply: "Quy đổi thang điểm tại ĐH Tây Nguyên (ĐBP 40%, Thi 60%):\n- **8.5 - 10.0**: Điểm A -> **4.0** (Xuất sắc/Giỏi)\n- **7.0 - 8.4**: Điểm B -> **3.0** (Khá)\n- **5.5 - 6.9**: Điểm C -> **2.0** (Trung bình)\n- **4.0 - 5.4**: Điểm D -> **1.0** (Trung bình yếu)\n- **Dưới 4.0**: Điểm F -> **0.0** (Không đạt, phải học lại).",
        action: { type: "OPEN_GRADES", target_id: null },
        suggested_questions: ["Xem điểm GPA của mình", "Điều kiện học bổng"],
      };
    }

    // 15. Hỏi quy chế: Học bổng khuyến khích
    if (lq.includes("học bổng") || lq.includes("tiêu chuẩn học bổng") || lq.includes("xét học bổng")) {
      return {
        intent: "GENERAL_INFO",
        reply: "Tiêu chuẩn xét cấp **Học bổng Khuyến khích học tập** tại ĐH Tây Nguyên:\n- Điều kiện: Đăng ký >= 14 tín chỉ trong kỳ, không có môn điểm F, Điểm rèn luyện >= 70 (Khá trở lên).\n- Mức học bổng: Xuất sắc (GPA >= 3.6 & ĐRL >= 90), Giỏi (GPA 3.2-3.59 & ĐRL >= 80), Khá (GPA 2.5-3.19 & ĐRL >= 70).",
        action: { type: "OPEN_GRADES", target_id: null },
        suggested_questions: ["Xem điểm GPA của mình", "Quy định cảnh báo học vụ"],
      };
    }

    // 16. Hỏi quy chế: Cảnh báo học vụ & Thôi học
    if (lq.includes("cảnh báo học vụ") || lq.includes("bị thôi học") || lq.includes("đuổi học")) {
      return {
        intent: "GENERAL_INFO",
        reply: "Quy định **Cảnh báo học vụ** tại ĐH Tây Nguyên:\n- Bị cảnh báo nếu GPA học kỳ < 1.00 (kỳ 1) hoặc < 1.20 (các kỳ sau); hoặc GPA tích lũy < 1.20 (năm 1), < 1.40 (năm 2), < 1.60 (năm 3).\n- Sinh viên bị cảnh báo học vụ **3 lần liên tiếp** sẽ bị buộc thôi học.",
        action: { type: "OPEN_GRADES", target_id: null },
        suggested_questions: ["Xem bảng điểm của mình", "Cách cải thiện điểm"],
      };
    }

    // 17. Tự sinh câu trả lời ngắn từ kết quả Vector Search nếu độ tương đồng cao
    if (Array.isArray(vectorMatches) && vectorMatches.length > 0 && vectorMatches[0].score >= 0.55) {
      const top = vectorMatches[0];
      const isAskingLocation = lq.includes("ở đâu") || lq.includes("chỉ đường") || lq.includes("vị trí") || lq.includes("tìm đường") || lq.includes("nhà") || lq.includes("phòng") || lq.includes("giảng đường") || lq.includes("bản đồ");

      // Nếu tài liệu là Map nhưng người dùng KHÔNG hỏi vị trí/địa điểm -> Bỏ qua, không gán CAMPUS_MAP
      if (top.category !== "map" || isAskingLocation) {
        const summaryLines = top.content
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .slice(0, 4)
          .join("\n");

        return {
          intent: top.category === "map" ? "CAMPUS_MAP" : "GENERAL_INFO",
          reply: `**${top.title}:**\n${summaryLines}`,
          action: top.category === "map" ? { type: "OPEN_MAP_3D", target_id: top.title } : { type: "NONE", target_id: null },
          suggested_questions: ["Xem thêm chi tiết", "Hỏi câu khác"],
        };
      }
    }

    // 18. Mặc định ngắn gọn
    return {
      intent: "CHITCHAT",
      reply: "Mình là **TTN Smart Bot**. Bạn có thể hỏi mình về **lịch học, điểm GPA, chỉ đường 3D, báo cứu hộ SOS** hoặc **quy chế đào tạo** của Đại học Tây Nguyên nhé!",
      action: { type: "NONE", target_id: null },
      suggested_questions: ["Lịch học hôm nay của mình", "App có những tính năng gì?"],
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
      vectorDbService.searchVector(userMessage, 3),
    ]);

    // Trích xuất ngữ cảnh RAG từ các vector match trong DB (chỉ lấy tài liệu có độ tương quan)
    const ragContext = Array.isArray(vectorMatches) && vectorMatches.length > 0
      ? vectorMatches.map((item) => `[${item.title}]\n${item.content}`).join("\n\n")
      : "";

    // Hợp nhất dữ liệu sinh viên
    const studentData = {
      ...(dbStudentData || {}),
      ...(clientContext || {}),
    };

    // 2. Tạo Prompt RAG chuẩn
    const systemInstruction = buildUnifiedPrompt(studentData, ragContext, currentTime);

    // Chuẩn bị lịch sử trò chuyện
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

    // 3. Gọi Gemini LLM (Ưu tiên gemini-2.5-flash và gemini-3.5-flash-lite)
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey.trim()) {
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-3.5-flash-lite",
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
                temperature: 0.15,
                responseMimeType: "application/json",
                maxOutputTokens: 750,
              },
            },
            {
              timeout: 10000,
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
                engine: `${modelName} (Smart RAG)`,
              };
            }
          }
        } catch (geminiError) {
          console.warn(`⚠️ [Gemini ${modelName} Notice]:`, geminiError.response?.data?.error?.message || geminiError.message);
        }
      }
    }

    // 4. Fallback: Tự sinh câu trả lời ngắn gọn, chuẩn xác
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
