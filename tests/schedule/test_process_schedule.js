/**
 * Test: Bóc tách và xử lý dữ liệu thời khóa biểu (Schedule Processing)
 * Kiểm tra processSchedulePayload, parseRoomDirections, gán thứ và ngày tương ứng
 */

const assert = require('assert');
const path = require('path');
const scheduleService = require(path.resolve(__dirname, '../../backend/src/services/scheduleService'));

console.log('\n=============================================');
console.log('🧪 TEST SUITE 2: BÓC TÁCH THỜI KHÓA BIỂU');
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

// 1. Kiểm tra parseRoomDirections định vị nhà và phòng
runTest('Định vị phòng học parseRoomDirections (dạng X.Y.Z)', () => {
  const dir = scheduleService.parseRoomDirections('9.2.04');
  assert(dir, 'Kết quả direction không được rỗng');
  assert.strictEqual(dir.buildingCode, 'Nhà 9');
  assert.strictEqual(dir.floor, 'Tầng 2');
  assert.strictEqual(dir.room, 'Phòng 04');
});

runTest('Định vị phòng học parseRoomDirections (dạng X.Z)', () => {
  const dir = scheduleService.parseRoomDirections('2.21 (CLC)');
  assert(dir, 'Kết quả direction không được rỗng');
  assert.strictEqual(dir.buildingCode, 'Nhà 2');
  assert(dir.room.includes('Phòng 21'), 'Phải chứa tên phòng 21');
});

// 2. Kiểm tra processSchedulePayload tạo đúng danh sách môn học theo tuần
runTest('Xử lý bảng thời khóa biểu tuần processSchedulePayload', () => {
  const tables = [{
    tableIndex: 1,
    rows: [
      ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
      ["Thứ 2", "Lập trình thiết bị di động", "1-4", "9.2.04", "TS. Hoàng Minh"],
      ["Thứ 5", "Hệ cơ sở dữ liệu", "1-4", "7.3.18", "TS. Nguyễn C"]
    ]
  }];
  const weekRange = 'Từ ngày 26/10/2026 đến ngày 01/11/2026';
  const result = scheduleService.processSchedulePayload(tables, weekRange, []);

  assert(result, 'Kết quả trả về không được rỗng');
  assert(Array.isArray(result.schedules), 'schedules phải là một mảng');
  assert.strictEqual(result.schedules.length, 2, 'Phải có 2 môn học');

  const thu2 = result.schedules.find(s => s.dayNum === 2);
  assert(thu2, 'Phải có môn Thứ 2');
  assert.strictEqual(thu2.course, 'Lập trình thiết bị di động');
  assert.strictEqual(thu2.date, '26/10/2026', 'Ngày thứ 2 phải là 26/10/2026');

  const thu5 = result.schedules.find(s => s.dayNum === 5);
  assert(thu5, 'Phải có môn Thứ 5');
  assert.strictEqual(thu5.course, 'Hệ cơ sở dữ liệu');
  assert.strictEqual(thu5.date, '29/10/2026', 'Ngày thứ 5 phải là 29/10/2026');
});

console.log(`\nKết quả Test Suite 2: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) {
  process.exit(1);
}
