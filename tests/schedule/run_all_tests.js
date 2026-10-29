/**
 * Test Runner - Chạy toàn bộ các bài kiểm tra thời khóa biểu trong thư mục tests/schedule/
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(f => f.startsWith('test_') && f.endsWith('.js'));

console.log('======================================================');
console.log('🚀 BẮT ĐẦU CHẠY TOÀN BỘ KIỂM TRA THỜI KHÓA BIỂU (TEST SUITE)');
console.log(`📂 Thư mục: ${testDir}`);
console.log(`📋 Số lượng bài test: ${testFiles.length}`);
console.log('======================================================\n');

let allPassed = true;
let passCount = 0;
let failCount = 0;

for (const file of testFiles) {
  const filePath = path.join(testDir, file);
  try {
    execSync(`node "${filePath}"`, { stdio: 'inherit' });
    passCount++;
  } catch (error) {
    allPassed = false;
    failCount++;
    console.error(`\n❌ File ${file} gặp lỗi!`);
  }
}

console.log('\n======================================================');
if (allPassed) {
  console.log(`🎉 TẤT CẢ ${passCount} BÀI TEST ĐÃ VƯỢT QUA XUẤT SẮC! (PASS)`);
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error(`💥 CÓ ${failCount} BÀI TEST BỊ THẤT BẠI! (FAIL)`);
  console.log('======================================================\n');
  process.exit(1);
}

