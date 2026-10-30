/**
 * Test: Logic Fallback thời khóa biểu động (Dynamic Fallback Schedule)
 * Đảm bảo hệ thống KHÔNG đẩy dữ liệu mẫu khi người dùng không có lịch,
 * luôn sinh tuần động theo ngày hiện tại, và hiển thị "Không có lịch học" thay vì lịch giả.
 */

const assert = require('assert');
const path = require('path');
const scheduleService = require(path.resolve(__dirname, '../../backend/src/services/scheduleService'));

console.log('\n======================================================');
console.log('🧪 TEST SUITE 4: DỮ LIỆU THỜI KHÓA BIỂU KHÔNG DÙNG MẪU');
console.log('======================================================');

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

// Mô phỏng logic fallback controller mới (không chứa dữ liệu mẫu)
function generateFallbackSchedule(now = new Date(), requestedWeekIndex = 0, customItems = []) {
  const distToMon = (now.getDay() + 6) % 7;
  const monThisWeek = new Date(now);
  monThisWeek.setDate(now.getDate() - distToMon);
  const sunThisWeek = new Date(monThisWeek);
  sunThisWeek.setDate(monThisWeek.getDate() + 6);

  const monNextWeek = new Date(monThisWeek);
  monNextWeek.setDate(monThisWeek.getDate() + 7);
  const sunNextWeek = new Date(monNextWeek);
  sunNextWeek.setDate(monNextWeek.getDate() + 6);

  const pad = (n) => String(n).padStart(2, '0');
  const fmtRange = (s, e) => `Từ ngày ${pad(s.getDate())}/${pad(s.getMonth() + 1)}/${s.getFullYear()} đến ngày ${pad(e.getDate())}/${pad(e.getMonth() + 1)}/${e.getFullYear()}`;

  const week0Range = fmtRange(monThisWeek, sunThisWeek);
  const week1Range = fmtRange(monNextWeek, sunNextWeek);

  // Không chèn môn học giả mạo vào bảng
  const week0Rows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
  const week1Rows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];

  const processedWeek0 = scheduleService.processSchedulePayload([{ tableIndex: 1, rows: week0Rows }], week0Range, customItems, { isCurrentWeek: true });
  const processedWeek1 = scheduleService.processSchedulePayload([{ tableIndex: 1, rows: week1Rows }], week1Range, customItems, { isCurrentWeek: false });

  const fallbackAvailableWeeks = [
    {
      index: 0,
      weekRange: week0Range,
      label: 'Tuần này',
      isCurrent: true,
      isNext: false,
      schedules: processedWeek0.schedules
    },
    {
      index: 1,
      weekRange: week1Range,
      label: 'Tuần sau',
      isCurrent: false,
      isNext: true,
      schedules: processedWeek1.schedules
    }
  ];

  const selectedWeekIdx = requestedWeekIndex === 1 ? 1 : 0;
  const targetProcessed = selectedWeekIdx === 1 ? processedWeek1 : processedWeek0;

  const hasSchedules = Boolean(targetProcessed.schedules && targetProcessed.schedules.length > 0);

  return {
    success: true,
    hasSchedules,
    message: hasSchedules ? "Thành công" : "Không có lịch học",
    selectedWeekIndex: selectedWeekIdx,
    currentWeekIndex: 0,
    nextWeekIndex: 1,
    weekRange: fallbackAvailableWeeks[selectedWeekIdx].weekRange,
    availableWeeks: fallbackAvailableWeeks,
    ...targetProcessed
  };
}

// 1. Kiểm tra khi người dùng KHÔNG CÓ LỊCH: schedules phải là [] và message là "Không có lịch học"
runTest('Khi user không có lịch: schedules rỗng [] và message là "Không có lịch học"', () => {
  const fixedNow = new Date(2026, 9, 29);
  const data = generateFallbackSchedule(fixedNow, 0, []);

  assert.strictEqual(data.weekRange, 'Từ ngày 26/10/2026 đến ngày 01/11/2026');
  assert.strictEqual(data.availableWeeks[0].label, 'Tuần này');
  assert.strictEqual(data.availableWeeks[0].isCurrent, true);
  
  // TUYỆT ĐỐI KHÔNG CÓ MÔN HỌC MẪU
  assert.strictEqual(data.schedules.length, 0, 'Schedules phải rỗng [], không được chứa môn mẫu');
  assert.strictEqual(data.hasSchedules, false);
  assert.strictEqual(data.message, 'Không có lịch học');
});

// 2. Kiểm tra chuyển sang Tuần sau (weekIndex = 1) khi không có lịch
runTest('Tuần sau khi không có lịch: schedules rỗng [] và không có môn mẫu', () => {
  const fixedNow = new Date(2026, 9, 29);
  const data = generateFallbackSchedule(fixedNow, 1, []);

  assert.strictEqual(data.selectedWeekIndex, 1);
  assert.strictEqual(data.weekRange, 'Từ ngày 02/11/2026 đến ngày 08/11/2026');
  assert.strictEqual(data.availableWeeks[1].label, 'Tuần sau');
  assert.strictEqual(data.schedules.length, 0, 'Tuần sau cũng phải rỗng [], không chứa môn mẫu');
  assert.strictEqual(data.hasSchedules, false);
});

// 3. Kiểm tra khi user tự thêm 1 lịch tùy chỉnh: CHỈ hiện lịch tùy chỉnh đó, KHÔNG chèn môn mẫu
runTest('Khi có lịch tùy chỉnh: chỉ trả về đúng môn tùy chỉnh, không chèn môn mẫu', () => {
  const fixedNow = new Date(2026, 9, 29);
  const customItems = [{
    id: 999,
    ten_hp: 'Ôn tập Đồ án cuối kỳ',
    thu: 'Thứ 5',
    tiet: 'Tiết 1-4',
    phong: 'Thư viện',
    ngay_hoc: '29/10/2026',
    is_custom: 1,
    week_range: 'Từ ngày 26/10/2026 đến ngày 01/11/2026'
  }];

  const data = generateFallbackSchedule(fixedNow, 0, customItems);
  assert.strictEqual(data.schedules.length, 1, 'Chỉ được có đúng 1 môn do người dùng thêm');
  assert.strictEqual(data.schedules[0].course, 'Ôn tập Đồ án cuối kỳ');
  assert.strictEqual(data.schedules[0].room, 'Thư viện');
  assert.strictEqual(data.hasSchedules, true);
  assert.strictEqual(data.message, 'Thành công');
});

console.log(`\nKết quả Test Suite 4: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) {
  process.exit(1);
}
