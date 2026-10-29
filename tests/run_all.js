/**
 * Tổng hợp toàn bộ các bài kiểm tra của dự án:
 * 1. tests/schedule/ : Kiểm tra logic thời khóa biểu, tuần động, chỉ đường, môn tùy chỉnh
 * 2. tests/apk_fixes/: Kiểm tra các bản sửa lỗi APK (bán kính SOS 50m, so sánh điểm, làm sạch hồ sơ, modal trường)
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('======================================================================');
console.log('🏆 BẮT ĐẦU CHẠY TOÀN BỘ TEST SUITES CỦA DỰ ÁN (FULL REGRESSION)');
console.log('======================================================================\n');

const suites = [
  { name: '1. THỜI KHÓA BIỂU & TUẦN ĐỘNG', script: 'tests/schedule/run_all_tests.js' },
  { name: '2. CÁC BẢN SỬA LỖI APK (SOS 50M, ĐIỂM THẬT, HỒ SƠ, MODAL)', script: 'tests/apk_fixes/run_apk_tests.js' }
];

let allPassed = true;

for (const suite of suites) {
  console.log(`\n▶️ CHẠY PHẦN: ${suite.name}...`);
  try {
    execSync(`node "${path.resolve(__dirname, '..', suite.script)}"`, { stdio: 'inherit' });
  } catch (err) {
    allPassed = false;
    console.error(`❌ PHẦN: ${suite.name} CÓ LỖI!`);
  }
}

console.log('\n======================================================================');
if (allPassed) {
  console.log('🌟 TẤT CẢ CÁC BỘ TEST ĐÃ VƯỢT QUA 100% THÀNH CÔNG!');
  console.log('======================================================================\n');
  process.exit(0);
} else {
  console.error('💥 CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM THỬ!');
  console.log('======================================================================\n');
  process.exit(1);
}

