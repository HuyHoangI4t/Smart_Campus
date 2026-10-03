/**
 * Grade calculation and processing service
 * Đảm nhiệm toàn bộ logic tính toán điểm, tín chỉ tích lũy, GPA thang 10 & 4, xếp loại học lực.
 */

// Chuyển đổi điểm thang 10 sang thang 4 (chuẩn hệ thống đào tạo: chỉ có A, B, C, D, F, P, X)
function convertTo4Scale(score10, diemChu) {
  if (diemChu) {
    const uc = diemChu.toUpperCase().trim();
    if (uc === 'A') return 4.0;
    if (uc === 'B') return 3.0;
    if (uc === 'C') return 2.0;
    if (uc === 'D') return 1.0;
    if (uc === 'F') return 0.0;
    if (uc === 'P' || uc === 'X') return null;
  }

  if (score10 === null || score10 === undefined || isNaN(Number(score10))) return null;
  const num = Number(score10);
  if (num >= 8.5) return 4.0;
  if (num >= 7.0) return 3.0;
  if (num >= 5.5) return 2.0;
  if (num >= 4.0) return 1.0;
  return 0.0;
}

// Chuẩn hóa điểm chữ: chỉ bao gồm A, B, C, D, F, P, X
function normalizeDiemChu(rawDiemChu, score10) {
  if (rawDiemChu) {
    const uc = String(rawDiemChu).trim().toUpperCase();
    if (['A', 'B', 'C', 'D', 'F', 'P', 'X'].includes(uc)) return uc;
    if (uc.startsWith('A')) return 'A';
    if (uc.startsWith('B')) return 'B';
    if (uc.startsWith('C')) return 'C';
    if (uc.startsWith('D')) return 'D';
    if (uc.startsWith('F')) return 'F';
    if (uc.startsWith('P')) return 'P';
    if (uc.startsWith('X')) return 'X';
  }

  if (score10 !== null && score10 !== undefined && !isNaN(Number(score10))) {
    const num = Number(score10);
    if (num >= 8.5) return 'A';
    if (num >= 7.0) return 'B';
    if (num >= 5.5) return 'C';
    if (num >= 4.0) return 'D';
    return 'F';
  }

  return 'X';
}

// Xếp loại học lực dựa theo GPA thang 4
function getAcademicRank(gpa4Value) {
  const num = Number(gpa4Value);
  if (isNaN(num) || num <= 0) return { label: 'Chưa có', color: '#6B7280' };
  if (num >= 3.6) return { label: 'Xuất sắc', color: '#10B981' };
  if (num >= 3.2) return { label: 'Giỏi', color: '#3B82F6' };
  if (num >= 2.5) return { label: 'Khá', color: '#F59E0B' };
  if (num >= 2.0) return { label: 'Trung bình', color: '#6B7280' };
  return { label: 'Yếu', color: '#EF4444' };
}

// Bảng màu và nhãn cho điểm chữ (chỉ gồm A, B, C, D, F, P, X)
function getBadge(letter) {
  const uc = (letter || 'X').toUpperCase().trim();
  switch (uc) {
    case 'A':
      return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'A' };
    case 'B':
      return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', label: 'B' };
    case 'C':
      return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'C' };
    case 'D':
      return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'D' };
    case 'F':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'F' };
    case 'P':
      return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: 'Đạt' };
    case 'X':
    default:
      return { bg: '#FEF2F2', text: '#EF4444', border: '#FECACA', label: 'Đang học' };
  }
}

/**
 * Tính toán số liệu thống kê cho một danh sách học phần:
 * - Tổng tín chỉ đăng ký
 * - Tín chỉ tích lũy (loại bỏ môn chưa học 'X' và môn trượt 'F')
 * - Tín chỉ tính GPA (loại bỏ 'X', 'P', 'F')
 * - GPA thang 10 & thang 4
 * - Xếp loại học lực
 */
function calculateStats(items) {
  if (!items || items.length === 0) {
    return {
      totalCredits: 0,
      accumulatedCredits: 0,
      gradedCredits: 0,
      inProgressCredits: 0,
      gpa10: '0.00',
      gpa4: '0.00',
      academicRank: { label: 'Chưa có', color: '#6B7280' },
      totalCourses: 0,
      passedCourses: 0,
      inProgressCourses: 0,
      failedCourses: 0,
    };
  }

  let totalCredits = 0;
  let inProgressCredits = 0;
  let accumulatedCredits = 0;
  let gradedCredits = 0;
  let weightedPoints10 = 0;
  let weightedPoints4 = 0;

  let passedCourses = 0;
  let inProgressCourses = 0;
  let failedCourses = 0;

  for (const item of items) {
    const credits = Number(item.so_tin_chi) || 3;
    const letter = (item.diem_chu || '').toUpperCase().trim();
    const score10 = item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp))
      ? Number(item.diem_hp)
      : null;

    totalCredits += credits;

    // 1. Môn chưa học / đang học ('X')
    if (letter === 'X' || score10 === null) {
      inProgressCredits += credits;
      inProgressCourses++;
      continue;
    }

    // 2. Môn trượt ('F')
    if (letter === 'F' || (score10 !== null && score10 < 4.0 && letter !== 'P')) {
      failedCourses++;
      continue;
    }

    // 3. Môn đạt -> được tính vào TÍN CHỈ TÍCH LŨY (A, B, C, D, P)
    accumulatedCredits += credits;
    passedCourses++;

    // 4. Môn tính GPA (môn điều kiện 'P' như GDTC, GDQP thì không tính GPA)
    if (letter !== 'P' && score10 !== null && score10 >= 4.0) {
      const point4 = convertTo4Scale(score10, letter) || 0;
      gradedCredits += credits;
      weightedPoints10 += score10 * credits;
      weightedPoints4 += point4 * credits;
    }
  }

  const gpa10Num = gradedCredits > 0 ? (weightedPoints10 / gradedCredits) : 0;
  const gpa4Num = gradedCredits > 0 ? (weightedPoints4 / gradedCredits) : 0;
  const gpa10 = gpa10Num.toFixed(2);
  const gpa4 = gpa4Num.toFixed(2);
  const academicRank = getAcademicRank(gpa4Num);

  return {
    totalCredits,
    accumulatedCredits,
    gradedCredits,
    inProgressCredits,
    gpa10,
    gpa4,
    academicRank,
    totalCourses: items.length,
    passedCourses,
    inProgressCourses,
    failedCourses,
  };
}

/**
 * Xử lý và chuẩn hóa toàn bộ dữ liệu bảng điểm từ Database/Scraper:
 * 1. Chuẩn hóa từng môn học (bổ sung thang 4, nhãn, trạng thái tích lũy).
 * 2. Tính toán tổng kết chung (overall summary).
 * 3. Gom nhóm và tính toán thống kê riêng cho từng học kỳ.
 */
function processGradesPayload(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    const emptyStats = calculateStats([]);
    return {
      summary: emptyStats,
      semesters: ['Tất cả'],
      semesterStats: { 'Tất cả': emptyStats },
      data: []
    };
  }

  // 1. Chuẩn hóa từng môn học
  const formattedData = rawList.map((item, idx) => {
    const dbp = item.diem_dbp !== null && item.diem_dbp !== undefined && item.diem_dbp !== '' ? Number(item.diem_dbp) : null;
    const thi1 = item.diem_thi1 !== null && item.diem_thi1 !== undefined && item.diem_thi1 !== '' ? Number(item.diem_thi1) : null;
    const thi2 = item.diem_thi2 !== null && item.diem_thi2 !== undefined && item.diem_thi2 !== '' ? Number(item.diem_thi2) : null;
    const d1 = item.diem_1 !== null && item.diem_1 !== undefined && item.diem_1 !== '' ? Number(item.diem_1) : null;
    const d2 = item.diem_2 !== null && item.diem_2 !== undefined && item.diem_2 !== '' ? Number(item.diem_2) : null;
    const diemHp = d2 !== null ? d2 : (d1 !== null ? d1 : (item.diem_hp !== null && item.diem_hp !== undefined && item.diem_hp !== '' ? Number(item.diem_hp) : null));
    const diemThi = thi2 !== null ? thi2 : thi1;

    const diemChu = normalizeDiemChu(item.diem_chu, diemHp);

    const thang4 = convertTo4Scale(diemHp, diemChu);
    const badge = getBadge(diemChu);
    const isAccumulated = diemChu !== 'X' && diemChu !== 'F' && (diemHp !== null || diemChu === 'P');
    const isInProgress = diemChu === 'X';

    const hocKy = item.hoc_ky || (item.ky ? `HK${item.ky} (${item.nam_hoc || '2026'})` : 'HK1 (2026)');

    return {
      id: item.id || (idx + 1),
      ten_hp: item.ten_hp || item.name || 'Học phần',
      nam_hoc: item.nam_hoc || '',
      ky: item.ky || '',
      so_tin_chi: Number(item.so_tin_chi) || 3,
      diem_dbp: dbp,
      diem_qt: dbp,
      diem_thi1: thi1,
      diem_thi2: thi2,
      diem_thi: diemThi,
      diem_1: d1,
      diem_2: d2,
      diem_hp: diemHp,
      diem_chu: diemChu,
      thang_4: thang4,
      hoc_ky: hocKy,
      hoc_phi: item.hoc_phi || '',
      badge: badge,
      is_accumulated: isAccumulated,
      is_in_progress: isInProgress,
    };
  });

  // 2. Tính toán tổng kết chung (Tất cả)
  const summary = calculateStats(formattedData);

  // 3. Phân tách danh sách học kỳ
  const uniqueSemesters = Array.from(new Set(formattedData.map(item => item.hoc_ky)));
  const semesters = ['Tất cả', ...uniqueSemesters];

  // 4. Tính toán thống kê chi tiết cho từng học kỳ
  const semesterStats = {
    'Tất cả': summary,
  };

  for (const sem of uniqueSemesters) {
    const semItems = formattedData.filter(item => item.hoc_ky === sem);
    semesterStats[sem] = calculateStats(semItems);
  }

  return {
    summary,
    semesters,
    semesterStats,
    data: formattedData,
  };
}

module.exports = {
  convertTo4Scale,
  getAcademicRank,
  getBadge,
  calculateStats,
  processGradesPayload,
};
