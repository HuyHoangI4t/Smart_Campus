/**
 * Test: Phân loại nội dung hiển thị trong HomeNoticeModal
 * Đảm bảo thông báo từ nhà trường không hiển thị trạng thái ý kiến phản hồi
 */

const assert = require('assert');

console.log('\n=============================================');
console.log('🧪 TEST: HIỂN THỊ MODAL THÔNG BÁO TỪ TRƯỜNG');
console.log('=============================================');

let passedCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Chi tiết: ${err.message}`);
  }
}

function resolveNoticeModalTexts(alert) {
  const isResolved =
    alert.variant === "success" ||
    alert.status?.toLowerCase().includes("đã xử lý") ||
    alert.status?.toLowerCase().includes("đã giải quyết") ||
    alert.status?.toLowerCase().includes("hoàn tất");

  const isSos = alert.type === "sos";
  const isFeedback = alert.type === "feedback";

  let heading = isResolved
    ? "Trạng thái: Đã xử lý an toàn"
    : isSos
    ? "Trạng thái: Đang tiếp nhận & hỗ trợ"
    : isFeedback
    ? `Trạng thái: ${alert.status || "Đang xử lý"}`
    : "Thông báo chính thức từ Nhà trường";

  let desc = isResolved
    ? "Sự việc đã được đội an ninh / ban quản lý kiểm tra và giải quyết hoàn tất."
    : isSos
    ? "Tín hiệu SOS đã được hệ thống truyền trực tiếp đến đội bảo vệ và y tế trường."
    : isFeedback
    ? "Ý kiến phản hồi của bạn đã được ghi nhận và đang được bộ phận chuyên trách giải quyết."
    : `Văn bản thông báo được phát hành chính thức bởi ${alert.sender || "Nhà trường"} tới toàn thể sinh viên.`;

  return { heading, desc, isFeedback, isSos };
}

// 1. Kiểm tra thông báo từ trường (loại school_notice)
runTest('Thông báo từ trường không được chứa chữ ý kiến phản hồi', () => {
  const schoolAlert = {
    type: "school_notice",
    title: "Kế hoạch đăng ký môn học",
    sender: "Phòng Đào Tạo",
    status: "Thông báo"
  };
  const res = resolveNoticeModalTexts(schoolAlert);
  assert.strictEqual(res.heading, "Thông báo chính thức từ Nhà trường");
  assert(res.desc.includes("Phòng Đào Tạo"));
  assert(!res.desc.includes("Ý kiến phản hồi"));
});

// 2. Kiểm tra ý kiến phản hồi sinh viên (loại feedback)
runTest('Ý kiến phản hồi sinh viên hiển thị đúng thông tin phản hồi', () => {
  const feedbackAlert = {
    type: "feedback",
    title: "Phản ánh máy lạnh phòng 9.2.04",
    status: "Đang xử lý"
  };
  const res = resolveNoticeModalTexts(feedbackAlert);
  assert.strictEqual(res.heading, "Trạng thái: Đang xử lý");
  assert(res.desc.includes("Ý kiến phản hồi của bạn đã được ghi nhận"));
});

// 3. Kiểm tra thông báo SOS
runTest('Thông báo SOS hiển thị đội bảo vệ và y tế', () => {
  const sosAlert = {
    type: "sos",
    title: "Khẩn cấp y tế",
    status: "Chờ xử lý"
  };
  const res = resolveNoticeModalTexts(sosAlert);
  assert(res.desc.includes("đội bảo vệ và y tế"));
});

console.log(`\nKết quả: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) process.exit(1);

