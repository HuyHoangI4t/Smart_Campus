/**
 * Test: Logic Fallback thời khóa biểu động (Dynamic Fallback Schedule)
 * Đảm bảo hệ thống không hardcode ngày cũ (như 19/10/2026) mà luôn sinh tuần động theo ngày hiện tại,
 * và hiển thị đầy đủ môn học cho cả Tuần này và Tuần sau.
 */

const assert = require('assert');
const path = require('path');
const scheduleService = require(path.resolve(__dirname, '../../backend/src/services/scheduleService'));

console.log('\n=============================================');
console.log('🧪 TEST SUITE 4: DỮ LIỆU DỰ PHÒNG THỜI KHÓA BIỂU ĐỘNG');
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

// Mô phỏng logic fallback controller
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

  const week0Rows = [
    ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
    ["Thứ 2", "Lập trình thiết bị di động", "1-4", "9.2.04", "TS. Hoàng Minh"],
    ["Thứ 3", "LS Đảng CS VN", "1-4", "2.21 (CLC)", "Đoàn Văn Kỳ"],
    ["Thứ 4", "Cấu trúc dữ liệu & Giải thuật", "7-10", "9.3.01", "ThS. Lê Thị B"],
    ["Thứ 5", "Hệ cơ sở dữ liệu", "1-4", "7.3.18", "TS. Nguyễn C"],
    ["Thứ 6", "Mạng máy tính", "7-10", "9.1.02", "ThS. Phạm D"],
  ];

  const week1Rows = [
    ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
    ["Thứ 2", "Lập trình thiết bị di động (TH)", "7-10", "Phòng máy 9.1", "TS. Hoàng Minh"],
    ["Thứ 3", "Tâm lý học đại cương", "1-4", "2.4", "Lê Tô Đỗ Quyên"],
    ["Thứ 4", "Hệ cơ sở dữ liệu (TH)", "1-4", "Phòng máy 7.2", "TS. Nguyễn C"],
    ["Thứ 5", "Mạng máy tính (TH)", "7-10", "Phòng máy 9.3", "ThS. Phạm D"],
    ["Thứ 6", "Ngoại ngữ chuyên ngành", "1-4", "2.20", "Khoa Ngoại ngữ"],
  ];

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

  return {
    success: true,
    selectedWeekIndex: selectedWeekIdx,
    currentWeekIndex: 0,
    nextWeekIndex: 1,
    weekRange: fallbackAvailableWeeks[selectedWeekIdx].weekRange,
    availableWeeks: fallbackAvailableWeeks,
    ...targetProcessed
  };
}

// 1. Kiểm tra tuần mặc định (Tuần này) với ngày hiện tại (29/10/2026)
runTest('Fallback sinh đúng Tuần này chứa ngày 29/10/2026', () => {
  const fixedNow = new Date(2026, 9, 29);
  const data = generateFallbackSchedule(fixedNow, 0);

  assert.strictEqual(data.weekRange, 'Từ ngày 26/10/2026 đến ngày 01/11/2026');
  assert.strictEqual(data.availableWeeks[0].label, 'Tuần này');
  assert.strictEqual(data.availableWeeks[0].isCurrent, true);
  assert(data.schedules.length >= 5, 'Phải có ít nhất 5 môn học trong tuần này');

  // Kiểm tra Thứ 5 (29/10) có môn
  const thu5 = data.schedules.find(s => s.dayNum === 5);
  assert(thu5, 'Thứ 5 phải có môn học');
  assert.strictEqual(thu5.course, 'Hệ cơ sở dữ liệu');
  assert.strictEqual(thu5.date, '29/10/2026');
});

// 2. Kiểm tra chọn Tuần sau (weekIndex = 1)
runTest('Fallback chuyển sang Tuần sau (weekIndex = 1)', () => {
  const fixedNow = new Date(2026, 9, 29);
  const data = generateFallbackSchedule(fixedNow, 1);

  assert.strictEqual(data.selectedWeekIndex, 1);
  assert.strictEqual(data.weekRange, 'Từ ngày 02/11/2026 đến ngày 08/11/2026');
  assert.strictEqual(data.availableWeeks[1].label, 'Tuần sau');
  assert.strictEqual(data.availableWeeks[1].isNext, true);
  assert(data.schedules.length >= 5, 'Tuần sau cũng phải có đầy đủ môn học thay vì rỗng []');

  const thu5Next = data.schedules.find(s => s.dayNum === 5);
  assert(thu5Next, 'Thứ 5 tuần sau phải có môn');
  assert.strictEqual(thu5Next.course, 'Mạng máy tính (TH)');
  assert.strictEqual(thu5Next.date, '05/11/2026');
});

console.log(`\nKết quả Test Suite 4: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) {
  process.exit(1);
}

