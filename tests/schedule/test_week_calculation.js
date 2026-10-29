/**
 * Test: Tính toán khoảng tuần (Week Range Calculation)
 * Kiểm tra các hàm getWeekRangeFromDate, parseWeekRangeDates, parseDateVN, normalizeDateVN
 */

const assert = require('assert');
const path = require('path');
const scheduleService = require(path.resolve(__dirname, '../../backend/src/services/scheduleService'));

console.log('\n=============================================');
console.log('🧪 TEST SUITE 1: TÍNH TOÁN KHOẢNG TUẦN VÀ NGÀY');
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

// 1. Kiểm tra ngày hiện tại (29/10/2026 - Thứ 5) phải thuộc tuần 26/10/2026 đến 01/11/2026
runTest('Tính khoảng tuần cho ngày Thứ 5 (29/10/2026)', () => {
  const testDate = new Date(2026, 9, 29); // Tháng 10 là index 9
  const range = scheduleService.getWeekRangeFromDate(testDate);
  assert.strictEqual(range, 'Từ ngày 26/10/2026 đến ngày 01/11/2026', `Kỳ vọng 26/10 đến 01/11 nhưng nhận được: ${range}`);
});

// 2. Kiểm tra ngày Thứ 2 đầu tuần (26/10/2026)
runTest('Tính khoảng tuần cho ngày Thứ 2 (26/10/2026)', () => {
  const range = scheduleService.getWeekRangeFromDate('26/10/2026');
  assert.strictEqual(range, 'Từ ngày 26/10/2026 đến ngày 01/11/2026');
});

// 3. Kiểm tra ngày Chủ Nhật cuối tuần (01/11/2026) vẫn thuộc tuần 26/10 - 01/11
runTest('Tính khoảng tuần cho ngày Chủ Nhật (01/11/2026)', () => {
  const range = scheduleService.getWeekRangeFromDate('01/11/2026');
  assert.strictEqual(range, 'Từ ngày 26/10/2026 đến ngày 01/11/2026');
});

// 4. Kiểm tra parseWeekRangeDates tách đúng startDate và endDate
runTest('Bóc tách chuỗi khoảng tuần parseWeekRangeDates', () => {
  const { startDate, endDate } = scheduleService.parseWeekRangeDates('Từ ngày 26/10/2026 đến ngày 01/11/2026');
  assert(startDate instanceof Date && !isNaN(startDate.getTime()), 'startDate phải là Date hợp lệ');
  assert(endDate instanceof Date && !isNaN(endDate.getTime()), 'endDate phải là Date hợp lệ');
  assert.strictEqual(startDate.getDate(), 26);
  assert.strictEqual(startDate.getMonth(), 9);
  assert.strictEqual(startDate.getFullYear(), 2026);
  assert.strictEqual(endDate.getDate(), 1);
  assert.strictEqual(endDate.getMonth(), 10); // Tháng 11 là index 10
  assert.strictEqual(endDate.getFullYear(), 2026);
});

// 5. Kiểm tra normalizeDateVN với các định dạng khác nhau
runTest('Chuẩn hóa ngày normalizeDateVN', () => {
  assert.strictEqual(scheduleService.normalizeDateVN('2026-10-29'), '29/10/2026');
  assert.strictEqual(scheduleService.normalizeDateVN('29/10/2026'), '29/10/2026');
  assert.strictEqual(scheduleService.normalizeDateVN('5/9/2026'), '05/09/2026');
  assert.strictEqual(scheduleService.normalizeDateVN(new Date(2026, 9, 29)), '29/10/2026');
});

// 6. Kiểm tra getDayNameFromDate
runTest('Xác định thứ getDayNameFromDate', () => {
  assert.strictEqual(scheduleService.getDayNameFromDate('26/10/2026'), 'Thứ 2');
  assert.strictEqual(scheduleService.getDayNameFromDate('29/10/2026'), 'Thứ 5');
  assert.strictEqual(scheduleService.getDayNameFromDate('01/11/2026'), 'CN');
});

console.log(`\nKết quả Test Suite 1: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) {
  process.exit(1);
}

