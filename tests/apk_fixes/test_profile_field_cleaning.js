/**
 * Test: Làm sạch các trường thông tin hồ sơ (Không để chữ 'Chưa cập nhật' trong ô nhập)
 */

const assert = require('assert');

console.log('\n=============================================');
console.log('🧪 TEST: LÀM SẠCH GIÁ TRỊ Ô NHẬP HỒ SƠ');
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

function cleanProfileField(val) {
  if (!val || val.trim() === "Chưa cập nhật" || val.trim().toLowerCase() === "chưa cập nhật") {
    return "";
  }
  return val.trim();
}

// 1. Kiểm tra xóa chữ 'Chưa cập nhật'
runTest('Chuỗi "Chưa cập nhật" chuyển thành rỗng ""', () => {
  assert.strictEqual(cleanProfileField("Chưa cập nhật"), "");
  assert.strictEqual(cleanProfileField("chưa cập nhật"), "");
  assert.strictEqual(cleanProfileField("  Chưa cập nhật  "), "");
});

// 2. Kiểm tra undefined hoặc null
runTest('Giá trị undefined hoặc null chuyển thành rỗng ""', () => {
  assert.strictEqual(cleanProfileField(undefined), "");
  assert.strictEqual(cleanProfileField(null), "");
  assert.strictEqual(cleanProfileField(""), "");
});

// 3. Kiểm tra số điện thoại thật được giữ nguyên
runTest('Số điện thoại thật được giữ nguyên', () => {
  assert.strictEqual(cleanProfileField("0912345678"), "0912345678");
  assert.strictEqual(cleanProfileField("  0329106783  "), "0329106783");
});

// 4. Kiểm tra lớp học thật được giữ nguyên
runTest('Lớp học thật được giữ nguyên', () => {
  assert.strictEqual(cleanProfileField("Kỹ thuật phần mềm K23"), "Kỹ thuật phần mềm K23");
});

console.log(`\nKết quả: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) process.exit(1);

