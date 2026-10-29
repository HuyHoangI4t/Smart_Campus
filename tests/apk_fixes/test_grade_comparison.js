/**
 * Test: So sánh điểm số mới và điểm số cũ để phát hiện điểm mới cập nhật
 */

const assert = require('assert');

console.log('\n=============================================');
console.log('🧪 TEST: SO SÁNH ĐIỂM SỐ MỚI VS DỮ LIỆU CŨ');
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

function detectGradeUpdates(currentGrades, oldGrades) {
  if (!Array.isArray(currentGrades) || currentGrades.length === 0) return null;
  if (!Array.isArray(oldGrades) || oldGrades.length === 0) {
    // Chưa có dữ liệu cũ -> lấy môn điểm mới nhất
    const latest = currentGrades.find(g => g.diem_tk || g.diem_tong_ket) || currentGrades[0];
    return {
      type: 'initial_latest',
      course: latest,
      title: `🎉 Điểm học phần: ${latest.ten_hp}`,
      body: `Điểm tổng kết: ${latest.diem_tk || latest.diem_tong_ket} (${latest.diem_chu || 'A'}).`
    };
  }

  // So sánh tìm môn có điểm thay đổi hoặc mới nhập
  const updatedCourse = currentGrades.find(cur => {
    const curId = cur.ma_hp || cur.ten_hp;
    const curScore = cur.diem_tk ?? cur.diem_tong_ket;
    const old = oldGrades.find(o => (o.ma_hp || o.ten_hp) === curId);
    if (!old) return true; // Môn học hoàn toàn mới
    const oldScore = old.diem_tk ?? old.diem_tong_ket;
    return curScore !== oldScore; // Điểm vừa thay đổi
  });

  if (updatedCourse) {
    const score = updatedCourse.diem_tk ?? updatedCourse.diem_tong_ket;
    return {
      type: 'new_update',
      course: updatedCourse,
      title: '🎉 Cập nhật Điểm số mới',
      body: `Điểm học phần '${updatedCourse.ten_hp}' đã có: ${score}. Chúc mừng bạn!`
    };
  }

  return {
    type: 'no_change',
    title: '🎉 Điểm số & Tín chỉ',
    body: 'Bảng điểm học kỳ mới nhất đã được đồng bộ với nhà trường.'
  };
}

const mockOldList = [
  { ma_hp: 'TIN01', ten_hp: 'Tin học đại cương', diem_tk: 8.0, diem_chu: 'B+' },
  { ma_hp: 'TOAN01', ten_hp: 'Giải tích 1', diem_tk: 7.5, diem_chu: 'B' }
];

// 1. Kiểm tra khi có 1 môn mới vừa được nhập điểm (khác 1 điểm do mới nhập)
runTest('Phát hiện môn học mới có điểm (Lập trình di động)', () => {
  const currentListWithNew = [
    ...mockOldList,
    { ma_hp: 'CNTT03', ten_hp: 'Lập trình thiết bị di động', diem_tk: 9.0, diem_chu: 'A' }
  ];
  const res = detectGradeUpdates(currentListWithNew, mockOldList);
  assert.strictEqual(res.type, 'new_update');
  assert.strictEqual(res.course.ma_hp, 'CNTT03');
  assert(res.body.includes('Lập trình thiết bị di động'));
  assert(res.body.includes('9'));
});

// 2. Kiểm tra khi 1 môn được cập nhật điểm phúc khảo (thay đổi điểm)
runTest('Phát hiện môn học vừa thay đổi điểm số', () => {
  const currentListChanged = [
    { ma_hp: 'TIN01', ten_hp: 'Tin học đại cương', diem_tk: 9.5, diem_chu: 'A+' }, // Điểm cũ là 8.0
    { ma_hp: 'TOAN01', ten_hp: 'Giải tích 1', diem_tk: 7.5, diem_chu: 'B' }
  ];
  const res = detectGradeUpdates(currentListChanged, mockOldList);
  assert.strictEqual(res.type, 'new_update');
  assert.strictEqual(res.course.ma_hp, 'TIN01');
  assert(res.body.includes('9.5'));
});

// 3. Kiểm tra khi không có điểm nào mới
runTest('Khi danh sách điểm không đổi', () => {
  const res = detectGradeUpdates(mockOldList, mockOldList);
  assert.strictEqual(res.type, 'no_change');
});

console.log(`\nKết quả: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) process.exit(1);

