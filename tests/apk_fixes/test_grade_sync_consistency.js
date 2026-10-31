/**
 * Test: Kiểm tra tính đồng bộ và chính xác tuyệt đối của điểm số giữa Backend và Frontend
 * Đặc biệt kiểm tra trường hợp sinh viên có môn F (trượt môn) như MSSV 23103095.
 */

const assert = require('assert');
const gradeService = require('../../backend/src/services/gradeService');

console.log('\n===============================================================');
console.log('🧪 TEST: ĐỒNG BỘ ĐIỂM SỐ GIỮA BACKEND VÀ FRONTEND (MSSV 23103095)');
console.log('===============================================================');

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

// Hàm mô phỏng logic parseGpaSummary từ frontend/src/features/home/utils/gpaUtils.ts
function frontendConvert4(score10, diemChu) {
  if (diemChu) {
    const uc = diemChu.toUpperCase().trim();
    if (uc === 'A') return 4.0;
    if (uc === 'B') return 3.0;
    if (uc === 'C') return 2.0;
    if (uc === 'D') return 1.0;
    if (uc === 'F') return 0.0;
    if (uc === 'P' || uc === 'X') return 0.0;
  }
  if (score10 >= 8.5) return 4.0;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 5.5) return 2.0;
  if (score10 >= 4.0) return 1.0;
  return 0.0;
}

function frontendParseGpaSummary(gradeItems) {
  if (!Array.isArray(gradeItems) || gradeItems.length === 0) return null;
  const graded = gradeItems.filter((item) => {
    const letter = (item.diem_chu || item.gradeLetter || '').toUpperCase();
    const score10 =
      item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp))
        ? Number(item.diem_hp)
        : (item.grade10 ? Number(item.grade10) : 0);
    return letter !== 'X' && letter !== 'P' && (score10 > 0 || letter === 'F' || ['A', 'B', 'C', 'D'].includes(letter));
  });

  const accumulated = gradeItems.filter((item) => {
    const letter = (item.diem_chu || item.gradeLetter || '').toUpperCase();
    const score10 =
      item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp))
        ? Number(item.diem_hp)
        : (item.grade10 ? Number(item.grade10) : 0);
    return letter !== 'X' && letter !== 'F' && (letter || score10 > 0);
  });

  const totalCredits = accumulated.reduce(
    (acc, c) => acc + Number(c.so_tin_chi || c.credits || 0),
    0
  );
  const totalGradedCredits = graded.reduce(
    (acc, c) => acc + Number(c.so_tin_chi || c.credits || 0),
    0
  );

  if (totalGradedCredits === 0) return null;

  const sum10 = graded.reduce((acc, c) => {
    const score10 =
      c.diem_hp !== null && c.diem_hp !== undefined && !isNaN(Number(c.diem_hp))
        ? Number(c.diem_hp)
        : (c.grade10 ? Number(c.grade10) : 0);
    const cred = Number(c.so_tin_chi || c.credits || 0);
    return acc + score10 * cred;
  }, 0);

  const sum4 = graded.reduce((acc, c) => {
    const score10 =
      c.diem_hp !== null && c.diem_hp !== undefined && !isNaN(Number(c.diem_hp))
        ? Number(c.diem_hp)
        : (c.grade10 ? Number(c.grade10) : 0);
    const letter = (c.diem_chu || c.gradeLetter || '').toUpperCase();
    const cred = Number(c.so_tin_chi || c.credits || 0);
    return acc + frontendConvert4(score10, letter) * cred;
  }, 0);

  const gpa10Val = (sum10 / totalGradedCredits).toFixed(2);
  const gpa4Val = (sum4 / totalGradedCredits).toFixed(2);
  const rank = Number(gpa4Val) >= 3.6 ? 'Xuất sắc' : Number(gpa4Val) >= 3.2 ? 'Giỏi' : Number(gpa4Val) >= 2.5 ? 'Khá' : Number(gpa4Val) >= 2.0 ? 'Trung bình' : 'Yếu';

  return {
    gpa4: gpa4Val,
    gpa10: gpa10Val,
    totalCredits,
    rank
  };
}

// ==============================================================
// TEST CASE 1: Tính toán môn F (trượt môn) theo quy chế tín chỉ
// ==============================================================
runTest('Môn điểm F: Không tính vào tích lũy nhưng PHẢI tính vào GPA (thang 4 = 0.0)', () => {
  const sampleData = [
    { ten_hp: 'Giải tích 1', so_tin_chi: 3, diem_hp: 8.0, diem_chu: 'B' },      // B = 3.0 -> 9.0 điểm thang 4, 24.0 thang 10
    { ten_hp: 'Đại số tuyến tính', so_tin_chi: 3, diem_hp: 2.0, diem_chu: 'F' } // F = 0.0 -> 0.0 điểm thang 4, 6.0 thang 10
  ];

  const beRes = gradeService.processGradesPayload(sampleData);
  const feRes = frontendParseGpaSummary(sampleData);

  // Tổng tín chỉ: 6. Tích lũy: chỉ có Giải tích 1 qua môn -> 3 tín chỉ
  assert.strictEqual(beRes.summary.accumulatedCredits, 3);
  assert.strictEqual(feRes.totalCredits, 3);

  // Tổng tín chỉ tính GPA: cả 2 môn -> 6 tín chỉ
  assert.strictEqual(beRes.summary.gradedCredits, 6);

  // GPA 4: (3*3.0 + 3*0.0) / 6 = 1.50
  assert.strictEqual(beRes.summary.gpa4, '1.50');
  assert.strictEqual(feRes.gpa4, '1.50');

  // GPA 10: (3*8.0 + 3*2.0) / 6 = 5.00
  assert.strictEqual(beRes.summary.gpa10, '5.00');
  assert.strictEqual(feRes.gpa10, '5.00');
});

// ==============================================================
// TEST CASE 2: Môn điều kiện P (GDTC / GDQP) không ảnh hưởng GPA
// ==============================================================
runTest('Môn điểm P: Tính vào tích lũy, không tính vào GPA', () => {
  const sampleData = [
    { ten_hp: 'Tin đại cương', so_tin_chi: 2, diem_hp: 9.0, diem_chu: 'A' }, // A = 4.0
    { ten_hp: 'Bóng chuyền', so_tin_chi: 1, diem_hp: 8.0, diem_chu: 'P' }   // Môn điều kiện P
  ];

  const beRes = gradeService.processGradesPayload(sampleData);
  const feRes = frontendParseGpaSummary(sampleData);

  assert.strictEqual(beRes.summary.accumulatedCredits, 3);
  assert.strictEqual(feRes.totalCredits, 3);
  assert.strictEqual(beRes.summary.gradedCredits, 2); // Chỉ có 2 tín chỉ tính GPA
  assert.strictEqual(beRes.summary.gpa4, '4.00');
  assert.strictEqual(feRes.gpa4, '4.00');
  assert.strictEqual(beRes.summary.gpa10, '9.00');
  assert.strictEqual(feRes.gpa10, '9.00');
});

// ==============================================================
// TEST CASE 3: Môn đang học X không ảnh hưởng tích lũy và GPA
// ==============================================================
runTest('Môn đang học X: Bỏ qua không tính vào tích lũy và GPA', () => {
  const sampleData = [
    { ten_hp: 'Lập trình di động', so_tin_chi: 3, diem_hp: 8.0, diem_chu: 'B' },
    { ten_hp: 'Đồ án tốt nghiệp', so_tin_chi: 4, diem_hp: null, diem_chu: 'X' }
  ];

  const beRes = gradeService.processGradesPayload(sampleData);
  const feRes = frontendParseGpaSummary(sampleData);

  assert.strictEqual(beRes.summary.accumulatedCredits, 3);
  assert.strictEqual(feRes.totalCredits, 3);
  assert.strictEqual(beRes.summary.gpa4, '3.00');
  assert.strictEqual(feRes.gpa4, '3.00');
  assert.strictEqual(beRes.summary.gpa10, '8.00');
  assert.strictEqual(feRes.gpa10, '8.00');
});

// ==============================================================
// TEST CASE 4: Dữ liệu thực tế đầy đủ của MSSV 23103095
// ==============================================================
const db = require('../../backend/src/config/db');

async function testRealStudent() {
  totalCount++;
  try {
    const [rows] = await db.query('SELECT * FROM student_grades WHERE mssv = ?', ['23103095']);
    if (!rows || rows.length === 0) {
      console.log('  ⚠️ SKIP: Chưa có dữ liệu bảng điểm MSSV 23103095 trong DB');
      return;
    }

    const beRes = gradeService.processGradesPayload(rows);
    const feRes = frontendParseGpaSummary(beRes.data);

    console.log(`     -> Kết quả Backend:  GPA4=${beRes.summary.gpa4}, GPA10=${beRes.summary.gpa10}, Tín chỉ=${beRes.summary.accumulatedCredits}, Xếp loại=${beRes.summary.academicRank.label}`);
    console.log(`     -> Kết quả Frontend: GPA4=${feRes.gpa4}, GPA10=${feRes.gpa10}, Tín chỉ=${feRes.totalCredits}, Xếp loại=${feRes.rank}`);

    // Đồng bộ tuyệt đối giữa Backend và Frontend
    assert.strictEqual(beRes.summary.gpa4, feRes.gpa4, 'GPA4 giữa Backend và Frontend phải khớp 100%');
    assert.strictEqual(beRes.summary.gpa10, feRes.gpa10, 'GPA10 giữa Backend và Frontend phải khớp 100%');
    assert.strictEqual(beRes.summary.accumulatedCredits, feRes.totalCredits, 'Tín chỉ tích lũy phải khớp 100%');
    assert.strictEqual(beRes.summary.academicRank.label, feRes.rank, 'Xếp loại học lực phải khớp 100%');

    // Kiểm tra con số chuẩn quy chế cho MSSV 23103095 (có 1 môn F Thực hành KTLT 2 tín chỉ)
    assert.strictEqual(beRes.summary.gpa4, '2.42', 'GPA4 phải là 2.42 theo quy chế tính cả môn F');
    assert.strictEqual(beRes.summary.gpa10, '6.71', 'GPA10 phải là 6.71');
    assert.strictEqual(beRes.summary.accumulatedCredits, 106, 'Tín chỉ tích lũy phải là 106');
    assert.strictEqual(beRes.summary.gradedCredits, 97, 'Tổng tín chỉ tính GPA phải là 97 (95 môn đạt + 2 môn F)');

    console.log('  ✅ PASS: Dữ liệu thực tế MSSV 23103095 khớp 100% giữa Trang Home và Trang Điểm');
    passedCount++;
  } catch (err) {
    console.error('  ❌ FAIL: Dữ liệu thực tế MSSV 23103095');
    console.error(`     Chi tiết: ${err.message}`);
  } finally {
    console.log('\n=============================================');
    console.log(`📊 KẾT QUẢ TEST: ${passedCount}/${totalCount} BÀI KIỂM TRA ĐẠT (PASS)`);
    console.log('=============================================\n');
    process.exit(passedCount === totalCount ? 0 : 1);
  }
}

testRealStudent();
