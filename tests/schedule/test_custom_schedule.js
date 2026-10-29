/**
 * Test: Thêm và lọc lịch học tùy chỉnh (Custom Schedule Handling)
 * Kiểm tra filterCustomItemsForWeek, parseWeekRangeDates kết hợp với lịch thêm thủ công
 */

const assert = require('assert');
const path = require('path');
const scheduleService = require(path.resolve(__dirname, '../../backend/src/services/scheduleService'));

console.log('\n=============================================');
console.log('🧪 TEST SUITE 3: LỊCH HỌC TÙY CHỈNH (CUSTOM SCHEDULE)');
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

const weekThis = 'Từ ngày 26/10/2026 đến ngày 01/11/2026';
const weekNext = 'Từ ngày 02/11/2026 đến ngày 08/11/2026';

const mockCustomItems = [
  {
    id: 101,
    ten_hp: 'Họp nhóm đồ án di động',
    thu: 'Thứ 5',
    tiet: 'Tiết 5-6',
    phong: '9.3.01',
    giang_vien: 'TS. Hoàng Minh',
    is_custom: 1,
    ngay_hoc: '29/10/2026',
    week_range: weekThis,
    loai_lich: 'dot_xuat'
  },
  {
    id: 102,
    ten_hp: 'Seminar Trí tuệ nhân tạo',
    thu: 'Thứ 3',
    tiet: 'Tiết 1-4',
    phong: 'Hội trường 400',
    giang_vien: 'GS. Johnson',
    is_custom: 1,
    ngay_hoc: '03/11/2026',
    week_range: weekNext,
    loai_lich: 'dot_xuat'
  }
];

// 1. Kiểm tra lọc lịch theo tuần hiện tại (26/10 - 01/11)
runTest('Lọc lịch học cho Tuần này (26/10 - 01/11)', () => {
  const filtered = scheduleService.filterCustomItemsForWeek(mockCustomItems, weekThis, true);
  assert.strictEqual(filtered.length, 1, 'Chỉ được có đúng 1 lịch thuộc tuần này');
  assert.strictEqual(filtered[0].ten_hp, 'Họp nhóm đồ án di động');
  assert.strictEqual(filtered[0].ngay_hoc, '29/10/2026');
});

// 2. Kiểm tra lọc lịch theo tuần sau (02/11 - 08/11)
runTest('Lọc lịch học cho Tuần sau (02/11 - 08/11)', () => {
  const filtered = scheduleService.filterCustomItemsForWeek(mockCustomItems, weekNext, false);
  assert.strictEqual(filtered.length, 1, 'Chỉ được có đúng 1 lịch thuộc tuần sau');
  assert.strictEqual(filtered[0].ten_hp, 'Seminar Trí tuệ nhân tạo');
  assert.strictEqual(filtered[0].ngay_hoc, '03/11/2026');
});

// 3. Kiểm tra processSchedulePayload khi có kèm lịch tùy chỉnh
runTest('Nhúng lịch tùy chỉnh vào payload thời khóa biểu', () => {
  const tables = [{
    tableIndex: 1,
    rows: [
      ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
      ["Thứ 5", "Hệ cơ sở dữ liệu", "1-4", "7.3.18", "TS. Nguyễn C"]
    ]
  }];
  const result = scheduleService.processSchedulePayload(tables, weekThis, mockCustomItems);
  
  // Thứ 5 (29/10) phải có cả môn chính khóa và môn tùy chỉnh
  const thu5Classes = result.schedules.filter(s => s.dayNum === 5);
  assert.strictEqual(thu5Classes.length, 2, 'Thứ 5 phải có 2 lịch (1 chính khóa, 1 tùy chỉnh)');

  const customClass = thu5Classes.find(s => s.isCustom);
  assert(customClass, 'Phải có lịch có isCustom = true');
  assert.strictEqual(customClass.course, 'Họp nhóm đồ án di động');
  assert.strictEqual(customClass.date, '29/10/2026');
});

console.log(`\nKết quả Test Suite 3: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) {
  process.exit(1);
}

