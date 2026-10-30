const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');
const https = require('https');
const gradeService = require('../services/gradeService');
const scheduleService = require('../services/scheduleService');
const studentSyncService = require('../services/studentSyncService');

// Tạo httpsAgent để bỏ qua lỗi chứng chỉ SSL tự ký của trường (tránh SSLCertVerificationError)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Cấu hình URL & Headers chuẩn từ cổng thông tin Đại học Tây Nguyên (TTN)
const TTN_CONFIG = {
  GRADES_URL: 'https://www.ttn.edu.vn/libraries/tnu/kqcq.php',
  GRADES_REFERER: 'https://www.ttn.edu.vn/index.php?option=com_tnu&view=kqchinhquy',
  SCHEDULE_URL: 'https://www.ttn.edu.vn/libraries/tnu/tkbieusinhvien.php',
  SCHEDULE_REFERER: 'https://www.ttn.edu.vn/index.php/component/tnu/?view=sinhvien',
  COMMON_HEADERS: {
    'Host': 'www.ttn.edu.vn',
    'Origin': 'https://www.ttn.edu.vn',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest'
  }
};

// Helper trích xuất mã sinh viên (MSSV) từ mọi vị trí trong request
const getMssvFromReq = async (req) => {
  if (req.body) {
    if (req.body.mssv) return String(req.body.mssv).trim();
    if (req.body.masv) return String(req.body.masv).trim();
    if (req.body.msv) return String(req.body.msv).trim();
    if (req.body.studentId) return String(req.body.studentId).trim();
    if (req.body.student_id) return String(req.body.student_id).trim();
  }
  if (req.query) {
    if (req.query.mssv) return String(req.query.mssv).trim();
    if (req.query.masv) return String(req.query.masv).trim();
    if (req.query.msv) return String(req.query.msv).trim();
  }
  if (req.params) {
    if (req.params.mssv) return String(req.params.mssv).trim();
    if (req.params.masv) return String(req.params.masv).trim();
    if (req.params.msv) return String(req.params.msv).trim();
  }
  if (req.headers) {
    if (req.headers['x-mssv']) return String(req.headers['x-mssv']).trim();
    if (req.headers['x-masv']) return String(req.headers['x-masv']).trim();
    if (req.headers['x-msv']) return String(req.headers['x-msv']).trim();
  }

  const authHeader = req.headers ? req.headers['authorization'] : null;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token.startsWith('jwt-token-')) {
      const parts = token.split('-');
      if (parts.length >= 3 && parts[2]) {
        return parts[2].trim();
      }
    }
    if (token && !token.includes(' ') && token.length <= 15) {
      return token.trim();
    }
  }

  return 'guest';
};

// Helper kiểm tra tài khoản khách
const isGuestOrEmail = (mssv) => {
  return !mssv || mssv === 'guest' || mssv.includes('@') || mssv.startsWith('test') || mssv.length < 4;
};

// Helper làm sạch chuỗi họ tên
const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/[\(\[\-]?\s*(trạng thái|đang học).*?[\)\]]?/gi, '')
    .replace(/^[:\-\s]+|[:\-\s]+$/g, '')
    .replace(/\s*\)+$/, '')
    .replace(/\s*\({2,}/g, '(')
    .trim();
};

// Helper bóc tách họ tên sinh viên từ tài liệu HTML trả về từ web trường
const extractFullNameFromHtml = ($) => {
  let fullName = null;
  const htmlContent = $.html();
  const match = htmlContent.match(/(?:Họ và tên|Họ tên)\s*[:\-]\s*(?:<b>)?([^<]+)(?:<\/b>)?/i);

  if (match && match[1]) {
    const cleaned = match[1]
      .replace(/<\/?b>/gi, '')
      .replace(/\s*\([^)]*trạng thái[^)]*\)/gi, '')
      .replace(/[-–—]\s*$/, '')
      .trim();
    if (cleaned.length > 2) fullName = cleaned;
  }

  if (!fullName) {
    $('p, div, span, b, td, th').each((i, el) => {
      const text = $(el).text().trim();
      if ((text.includes('Họ và tên:') || text.includes('Họ tên:')) && text.length < 80) {
        const parts = text.split(/[:\-]/);
        if (parts.length > 1) {
          const candidate = parts.slice(1).join(':').replace(/\([^)]*trạng thái[^)]*\)/gi, '').trim();
          if (candidate.length > 2) {
            fullName = candidate;
            return false;
          }
        }
      }
    });
  }

  return cleanName(fullName);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. API GET/POST GRADES - Bảng điểm sinh viên (Cào từ kqcq.php)
// ─────────────────────────────────────────────────────────────────────────────
exports.getGrades = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { dk } = req.body || {};
  const studentDk = dk || (req.query ? req.query.dk : null) || '10';

  // Tài khoản khách (Guest)
  if (isGuestOrEmail(mssv)) {
    const guestList = [
      { ten_hp: 'Lập trình thiết bị di động (Mẫu khách)', nam_hoc: '2026', ky: '1', so_tin_chi: 3, diem_dbp: 9.0, diem_qt: 9.0, diem_thi1: 8.0, diem_thi2: null, diem_thi: 8.0, diem_1: 8.5, diem_2: null, diem_hp: 8.5, diem_chu: 'A', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
      { ten_hp: 'Cấu trúc dữ liệu & Giải thuật', nam_hoc: '2026', ky: '1', so_tin_chi: 4, diem_dbp: 8.0, diem_qt: 8.0, diem_thi1: 8.0, diem_thi2: null, diem_thi: 8.0, diem_1: 8.0, diem_2: null, diem_hp: 8.0, diem_chu: 'B', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
      { ten_hp: 'Hệ cơ sở dữ liệu', nam_hoc: '2026', ky: '1', so_tin_chi: 3, diem_dbp: 7.0, diem_qt: 7.0, diem_thi1: 7.5, diem_thi2: null, diem_thi: 7.5, diem_1: 7.5, diem_2: null, diem_hp: 7.5, diem_chu: 'B', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
    ];
    const processed = gradeService.processGradesPayload(guestList);
    return res.json({
      success: true,
      mssv: mssv,
      isGuest: true,
      ...processed
    });
  }

  let studentName = null;
  try {
    const [uRows] = await db.query('SELECT ho_ten FROM users WHERE mssv = ?', [mssv]);
    if (uRows.length > 0) studentName = uRows[0].ho_ten;
  } catch (e) {}

  // Tài khoản Giảng viên (giangvien123)
  if (mssv === 'giangvien123' || (mssv && mssv.startsWith('giangvien'))) {
    try {
      const [allGrades] = await db.query(
        'SELECT ten_hp, nam_hoc, ky, diem_dbp, diem_qt, diem_thi1, diem_thi2, diem_thi, diem_1, diem_2, diem_hp, diem_chu, so_tin_chi, hoc_phi, hoc_ky FROM student_grades ORDER BY id ASC'
      );
      const defaultLecturerList = [
        { ten_hp: 'Lập trình thiết bị di động (Lớp K23)', nam_hoc: '2026', ky: '1', so_tin_chi: 3, diem_dbp: 9.0, diem_qt: 9.0, diem_thi1: 8.5, diem_thi2: null, diem_thi: 8.5, diem_1: 8.7, diem_2: null, diem_hp: 8.7, diem_chu: 'A', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
        { ten_hp: 'Cấu trúc dữ liệu & Giải thuật (Lớp K22)', nam_hoc: '2026', ky: '1', so_tin_chi: 4, diem_dbp: 8.5, diem_qt: 8.5, diem_thi1: 8.2, diem_thi2: null, diem_thi: 8.2, diem_1: 8.3, diem_2: null, diem_hp: 8.3, diem_chu: 'B', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
        { ten_hp: 'Hệ cơ sở dữ liệu (Lớp K23)', nam_hoc: '2026', ky: '1', so_tin_chi: 3, diem_dbp: 8.0, diem_qt: 8.0, diem_thi1: 8.0, diem_thi2: null, diem_thi: 8.0, diem_1: 8.1, diem_2: null, diem_hp: 8.1, diem_chu: 'B', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
      ];
      const processed = gradeService.processGradesPayload(allGrades && allGrades.length > 0 ? allGrades : defaultLecturerList);
      return res.json({
        success: true,
        mssv: mssv,
        isLecturer: true,
        ho_ten: 'ThS. Nguyễn Văn Giảng Viên',
        ...processed
      });
    } catch (e) {}
  }

  const forceRefresh = req.query.reload === 'true' || req.query.refresh === 'true' || req.body?.reload === true;

  // 1. TỐI ƯU HÓA: Kiểm tra Cache TTL (12 giờ) trong Database siêu tốc (1 round-trip)
  let dbGrades = [];
  let isGradesFresh = false;
  let gradesLastSyncAgeMs = Infinity;

  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const [rows] = await db.query(
        `SELECT ten_hp, nam_hoc, ky, diem_dbp, diem_thi1, diem_thi2, diem_1, diem_2, diem_chu, so_tin_chi, hoc_phi, hoc_ky, created_at 
         FROM student_grades WHERE mssv = ? ORDER BY id ASC`,
        [mssv]
      );
      if (rows && rows.length > 0) {
        dbGrades = rows;
        const gradesLastSync = Math.max(...dbGrades.map(r => new Date(r.created_at).getTime() || 0));
        gradesLastSyncAgeMs = Date.now() - gradesLastSync;
        isGradesFresh = (gradesLastSyncAgeMs < studentSyncService.TTL_GRADES_MS);

        // Fast-path: Nếu cache còn hạn HOẶC vừa reload dưới 2 phút trước -> trả ngay từ DB (1ms)
        if ((!forceRefresh && isGradesFresh) || (forceRefresh && gradesLastSyncAgeMs < 2 * 60 * 1000)) {
          const processed = gradeService.processGradesPayload(dbGrades);
          return res.json({
            success: true,
            mssv: mssv,
            isDbCached: true,
            cacheAgeHours: Math.round(gradesLastSyncAgeMs / 3600000 * 10) / 10,
            ho_ten: studentName || ('Sinh viên ' + mssv),
            ...processed
          });
        }
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra cache student_grades:', e.message);
    }
  }

  // 2. Nếu DB chưa có hoặc cache quá 2 phút và người dùng chủ động vuốt reload:
  // Giới hạn chờ crawler tối đa 2500ms nếu đã có sẵn dữ liệu trong DB
  let syncSuccess = false;
  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const syncPromise = studentSyncService.syncGradesForStudent(mssv, studentDk);
      const syncRes = dbGrades.length > 0
        ? await Promise.race([
            syncPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TTN Crawler timeout 2500ms')), 2500))
          ])
        : await syncPromise;

      if (syncRes && syncRes.success) {
        syncSuccess = true;
        if (syncRes.studentName) studentName = syncRes.studentName;
      }
    } catch (crawlErr) {
      console.warn('Lỗi đồng bộ bảng điểm qua crawler (timeout/lỗi):', crawlErr.message);
    }
  }

  // 3. Đọc dữ liệu từ DB (vừa cào xong hoặc fallback cache cũ nếu cào lỗi)
  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const [dbGrades] = await db.query(
        `SELECT ten_hp, nam_hoc, ky, diem_dbp, diem_thi1, diem_thi2, diem_1, diem_2, diem_chu, so_tin_chi, hoc_phi, hoc_ky 
         FROM student_grades WHERE mssv = ? ORDER BY id ASC`,
        [mssv]
      );
      if (dbGrades && dbGrades.length > 0) {
        const processed = gradeService.processGradesPayload(dbGrades);
        return res.json({
          success: true,
          mssv: mssv,
          isDbCached: !syncSuccess,
          ho_ten: studentName || ('Sinh viên ' + mssv),
          ...processed
        });
      }
    } catch (e) {
      console.warn('Lỗi query student_grades từ DB:', e.message);
    }
  }

  /* 
  // [Ghi chú: Đoạn cào trực tiếp cũ đã được chuyển giao vào studentSyncService có Queue & Rate Limiter, giữ lại để tham khảo]
  let liveSubjects = [];
  try {
    const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': studentDk });
    ...
  */

  // 4. Dự phòng: Danh sách học phần chuyên ngành chuẩn nếu DB hoàn toàn trống
  const fallbackList = [
    { ten_hp: 'Lập trình thiết bị di động', nam_hoc: '2026', ky: '1', so_tin_chi: 3, diem_dbp: 9.5, diem_thi1: 8.5, diem_thi2: null, diem_1: 8.9, diem_2: null, diem_chu: 'A', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
    { ten_hp: 'Cấu trúc dữ liệu & Giải thuật', nam_hoc: '2026', ky: '1', so_tin_chi: 4, diem_dbp: 8.5, diem_thi1: 8.0, diem_thi2: null, diem_1: 8.3, diem_2: null, diem_chu: 'B', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
    { ten_hp: 'Hệ cơ sở dữ liệu', nam_hoc: '2026', ky: '1', so_tin_chi: 3, diem_dbp: 8.0, diem_thi1: 8.0, diem_thi2: null, diem_1: 8.1, diem_2: null, diem_chu: 'B', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
    { ten_hp: 'Mạng máy tính nâng cao', nam_hoc: '2026', ky: '1', so_tin_chi: 3, diem_dbp: 9.0, diem_thi1: 9.0, diem_thi2: null, diem_1: 9.2, diem_2: null, diem_chu: 'A', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
    { ten_hp: 'Tiếng Anh chuyên ngành', nam_hoc: '2026', ky: '1', so_tin_chi: 2, diem_dbp: 8.0, diem_thi1: 7.8, diem_thi2: null, diem_1: 7.8, diem_2: null, diem_chu: 'B', hoc_ky: 'HK1 (2026)', hoc_phi: 'Đã nộp' },
    { ten_hp: 'Đại số tuyến tính', nam_hoc: '2025', ky: '2', so_tin_chi: 3, diem_dbp: 8.5, diem_thi1: 8.0, diem_thi2: null, diem_1: 8.2, diem_2: null, diem_chu: 'B', hoc_ky: 'HK2 (2025)', hoc_phi: 'Đã nộp' },
    { ten_hp: 'Vật lý đại cương', nam_hoc: '2025', ky: '2', so_tin_chi: 3, diem_dbp: 8.5, diem_thi1: 8.2, diem_thi2: null, diem_1: 8.4, diem_2: null, diem_chu: 'B', hoc_ky: 'HK2 (2025)', hoc_phi: 'Đã nộp' },
  ];

  if (mssv && !isGuestOrEmail(mssv)) {
    for (const item of fallbackList) {
      try {
        await db.query(
          `INSERT INTO student_grades 
           (mssv, ten_hp, nam_hoc, ky, diem_dbp, diem_thi1, diem_thi2, diem_1, diem_2, diem_chu, so_tin_chi, hoc_phi, hoc_ky) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mssv, item.ten_hp, item.nam_hoc, item.ky, item.diem_dbp, 
            item.diem_thi1, item.diem_thi2, item.diem_1, item.diem_2, 
            item.diem_chu, item.so_tin_chi, item.hoc_phi, item.hoc_ky
          ]
        );
      } catch (e) {}
    }
  }

  const processed = gradeService.processGradesPayload(fallbackList);
  res.json({
    success: true,
    mssv: mssv,
    ho_ten: studentName || ('Sinh viên ' + mssv),
    ...processed
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. API GET/POST SCHEDULE - Thời khóa biểu (Cào từ tkbieusinhvien.php)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSchedule = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { dk } = req.body || {};
  const studentDk = dk || (req.query ? req.query.dk : null) || '10';

  if (isGuestOrEmail(mssv)) {
    let customItems = [];
    try {
      const [customRows] = await db.query(
        'SELECT id, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich, week_range, ngay_hoc FROM student_schedules WHERE (mssv = ? OR mssv = "guest") AND is_custom = 1 ORDER BY id ASC',
        [mssv]
      );
      customItems = customRows || [];
    } catch (e) {}

    const defaultTables = [{
      tableIndex: 1,
      rows: [
        ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
        ["Thứ 2", "Lập trình thiết bị di động", "1-4", "9.2.04", "TS. Hoàng Minh"],
        ["Thứ 3", "LS Đảng CS VN", "1-4", "2.21 (CLC)", "Đoàn Văn Kỳ"],
        ["Thứ 4", "Cấu trúc dữ liệu & Giải thuật", "7-10", "9.3.01", "ThS. Lê Thị B"],
        ["Thứ 5", "Hệ cơ sở dữ liệu", "1-4", "7.3.18", "TS. Nguyễn C"],
        ["Thứ 6", "Mạng máy tính", "7-10", "9.1.02", "ThS. Phạm D"],
      ]
    }];
    // Xác định khoảng ngày tuần này và tuần sau
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isSunday = dayOfWeek === 0;
    const distToMon = (dayOfWeek + 6) % 7;
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

    const week0Rows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
    const week1Rows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];

    const processedWeek0 = scheduleService.processSchedulePayload([{ tableIndex: 1, rows: week0Rows }], week0Range, customItems, { isCurrentWeek: true });
    const processedWeek1 = scheduleService.processSchedulePayload([{ tableIndex: 1, rows: week1Rows }], week1Range, customItems, { isCurrentWeek: false });

    const availableWeeks = [
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

    let selectedWeekIdx = 0;
    const requestedWeek = req.query.week || req.body?.week;
    const requestedWeekOffset = req.query.weekOffset !== undefined ? parseInt(req.query.weekOffset, 10) : undefined;
    const requestedWeekIndex = req.query.weekIndex !== undefined ? parseInt(req.query.weekIndex, 10) : undefined;

    if (requestedWeek === 'next' || requestedWeekOffset === 1 || requestedWeekIndex === 1) {
      selectedWeekIdx = 1;
    } else if (requestedWeek === 'current' || requestedWeekOffset === 0 || requestedWeekIndex === 0) {
      selectedWeekIdx = 0;
    } else if (isSunday) {
      selectedWeekIdx = 1;
    }

    const targetProcessed = selectedWeekIdx === 1 ? processedWeek1 : processedWeek0;

    return res.json({
      success: true,
      mssv: mssv,
      isGuest: true,
      isSunday,
      selectedWeekIndex: selectedWeekIdx,
      currentWeekIndex: 0,
      nextWeekIndex: 1,
      weekRange: availableWeeks[selectedWeekIdx].weekRange,
      availableWeeks,
      hasSchedules: Boolean(targetProcessed.schedules && targetProcessed.schedules.length > 0),
    message: (targetProcessed.schedules && targetProcessed.schedules.length > 0) ? "Thành công" : "Không có lịch học",
    ...targetProcessed
  });
  }

  const forceRefresh = req.query.reload === 'true' || req.query.refresh === 'true' || req.body?.reload === true;
  const requestedWeek = req.query.week || req.body?.week;
  const requestedWeekOffset = req.query.weekOffset !== undefined ? parseInt(req.query.weekOffset, 10) : undefined;
  const requestedWeekIndex = req.query.weekIndex !== undefined ? parseInt(req.query.weekIndex, 10) : undefined;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const isSunday = now.getDay() === 0;

  // 1. TỐI ƯU HÓA: Đọc toàn bộ lịch học (chính khóa + tùy chỉnh) chỉ trong 1 Query duy nhất
  let customItems = [];
  let dbSchedules = [];
  let isSchedFresh = false;
  let lastSyncAgeMs = Infinity;

  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const [allRows] = await db.query(
        'SELECT id, mssv, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich, week_range, ngay_hoc, created_at FROM student_schedules WHERE (mssv = ? OR (mssv = "guest" AND is_custom = 1)) ORDER BY id ASC',
        [mssv]
      );
      if (allRows && allRows.length > 0) {
        customItems = allRows.filter(r => r.is_custom === 1);
        dbSchedules = allRows.filter(r => r.mssv === mssv);
        const officialSchedules = allRows.filter(r => r.mssv === mssv && (!r.is_custom || r.is_custom === 0));
        if (officialSchedules.length > 0) {
          const schedLastSync = Math.max(...officialSchedules.map(r => new Date(r.created_at).getTime() || 0));
          lastSyncAgeMs = Date.now() - schedLastSync;
          isSchedFresh = (lastSyncAgeMs < studentSyncService.TTL_SCHEDULE_MS);
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc student_schedules từ DB:', e.message);
    }
  }

  // 1.1 Fast-Path siêu tốc (1ms):
  // - Nếu không yêu cầu ép reload và cache còn hạn (dưới 24h)
  // - HOẶC nếu người dùng vuốt reload nhưng vừa đồng bộ trong vòng 2 phút trước (tránh spam web trường)
  if (dbSchedules.length > 0 && ((!forceRefresh && isSchedFresh) || (forceRefresh && lastSyncAgeMs < 2 * 60 * 1000))) {
    const handled = formatDbSchedulesResponse(dbSchedules, customItems, req, res, mssv, true, today, isSunday, requestedWeek, requestedWeekOffset, requestedWeekIndex);
    if (handled) return;
  }

  // 2. Nếu DB chưa có hoặc cache quá 2 phút và người dùng vuốt reload:
  // Giới hạn thời gian chờ crawler web trường tối đa 2500ms nếu đã có sẵn dữ liệu trong DB
  let scheduleSyncSuccess = false;
  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const syncPromise = studentSyncService.syncScheduleForStudent(mssv, studentDk);
      const syncRes = dbSchedules.length > 0
        ? await Promise.race([
            syncPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TTN Crawler timeout 2500ms')), 2500))
          ])
        : await syncPromise;

      if (syncRes && syncRes.success) {
        scheduleSyncSuccess = true;
      }
    } catch (crawlErr) {
      console.warn('Crawler lịch học web trường chậm hoặc timeout, fallback dữ liệu DB:', crawlErr.message);
    }
  }

  // 3. Đọc dữ liệu từ DB (vừa cào xong hoặc fallback cache cũ nếu cào lỗi/timeout)
  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const [newRows] = await db.query(
        'SELECT id, mssv, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich, week_range, ngay_hoc FROM student_schedules WHERE (mssv = ? OR (mssv = "guest" AND is_custom = 1)) ORDER BY id ASC',
        [mssv]
      );
      if (newRows && newRows.length > 0) {
        customItems = newRows.filter(r => r.is_custom === 1);
        dbSchedules = newRows.filter(r => r.mssv === mssv);
        if (dbSchedules.length > 0) {
          const handled = formatDbSchedulesResponse(dbSchedules, customItems, req, res, mssv, !scheduleSyncSuccess, today, isSunday, requestedWeek, requestedWeekOffset, requestedWeekIndex);
          if (handled) return;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc student_schedules từ DB:', e.message);
    }
  }

  /*
  // [Ghi chú: Đoạn cào lịch trực tiếp cũ đã được chuyển sang studentSyncService có Queue & Rate Limiter, giữ lại để tham khảo]
  try {
    const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': studentDk });
    ...
  } catch (error) {
    console.warn('Lỗi cào lịch học:', error.message);
  }
  */

  /* [Ghi chú: Step 4 cũ — đã được thay thế bởi step 3 dùng formatDbSchedulesResponse() có week grouping đầy đủ]
  // 4. Nếu cào trực tiếp không thành công, kiểm tra dữ liệu đã lưu trong Database
  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const [dbSchedules] = await db.query(...);
      if (dbSchedules && dbSchedules.length > 0) {
        // Logic cũ thiếu week grouping — formatDbSchedulesResponse() đã thay thế hoàn toàn
        ...
      }
    } catch (dbErr) {}
  }
  */

  // Dữ liệu dự phòng nếu cào lỗi
  let fallbackCustom = [];
  if (mssv) {
    try {
      const [cRows] = await db.query(
        'SELECT id, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich, week_range, ngay_hoc FROM student_schedules WHERE (mssv = ? OR mssv = "guest") AND is_custom = 1 ORDER BY id ASC',
        [mssv]
      );
      fallbackCustom = cRows || [];
    } catch (e) {}
  }

  // Xác định khoảng ngày tuần này và tuần sau động theo thời gian thực
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

  const week0Rows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
    const week1Rows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];

  const processedWeek0 = scheduleService.processSchedulePayload([{ tableIndex: 1, rows: week0Rows }], week0Range, fallbackCustom, { isCurrentWeek: true });
  const processedWeek1 = scheduleService.processSchedulePayload([{ tableIndex: 1, rows: week1Rows }], week1Range, fallbackCustom, { isCurrentWeek: false });

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

  let selectedWeekIdx = 0;
  if (requestedWeek === 'next' || requestedWeekOffset === 1 || requestedWeekIndex === 1) {
    selectedWeekIdx = 1;
  } else if (requestedWeek === 'current' || requestedWeekOffset === 0 || requestedWeekIndex === 0) {
    selectedWeekIdx = 0;
  } else if (isSunday) {
    selectedWeekIdx = 1;
  }

  const targetProcessed = selectedWeekIdx === 1 ? processedWeek1 : processedWeek0;

  res.json({
    success: true,
    mssv: mssv,
    selectedWeekIndex: selectedWeekIdx,
    currentWeekIndex: 0,
    nextWeekIndex: 1,
    weekRange: fallbackAvailableWeeks[selectedWeekIdx].weekRange,
    availableWeeks: fallbackAvailableWeeks,
    hasSchedules: Boolean(targetProcessed.schedules && targetProcessed.schedules.length > 0),
    message: (targetProcessed.schedules && targetProcessed.schedules.length > 0) ? "Thành công" : "Không có lịch học",
    ...targetProcessed
  });
};

// Hàm hỗ trợ chuẩn hóa dòng dữ liệu thời khóa biểu
function pushRow(headers, colIdx, buoi, currentLesson, parsedRows) {
  const dayStr = headers[colIdx - 1] || 'Thứ 2';
  let dayName = 'Thứ 2';
  
  if (dayStr.toUpperCase().includes('CN') || dayStr.toLowerCase().includes('chủ nhật')) {
    dayName = 'CN';
  } else {
    const parts = dayStr.split(' ');
    dayName = parts.join(' ');
  }

  parsedRows.push([
    dayName.trim(),                          // Cột 0: Ngày
    currentLesson.ten_hp,                    // Cột 1: Tên môn học
    currentLesson.tiet || (buoi === 'Sáng' ? '1-4' : '7-10'), // Cột 2: Tiết
    currentLesson.phong || 'Chưa xếp',       // Cột 3: Phòng
    currentLesson.giang_vien || 'Giảng viên' // Cột 4: Giảng viên
  ]);
}

// Bóc tách ngày bắt đầu và kết thúc từ chuỗi khoảng tuần
function parseWeekRangeDates(rangeText) {
  if (!rangeText) return { startDate: null, endDate: null };
  const match = rangeText.match(/Từ ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+đến ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!match) return { startDate: null, endDate: null };
  const [_, sD, sM, sY, eD, eM, eY] = match;
  const startDate = new Date(Number(sY), Number(sM) - 1, Number(sD), 0, 0, 0);
  const endDate = new Date(Number(eY), Number(eM) - 1, Number(eD), 23, 59, 59, 999);
  return { startDate, endDate };
}

// Helper định dạng và trả về phản hồi thời khóa biểu trực tiếp từ Database
function formatDbSchedulesResponse(dbSchedules, customItems, req, res, mssv, isDbCached, today, isSunday, requestedWeek, requestedWeekOffset, requestedWeekIndex) {
  const weekMap = {};
  for (const row of dbSchedules) {
    if (!row.is_custom) {
      const wRange = row.week_range || row.hoc_ky || "Lịch học đã lưu từ cổng đào tạo";
      if (!weekMap[wRange]) {
        weekMap[wRange] = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
      }
      if (row.ten_hp && row.loai_lich !== 'tuan_trong' && !row.ma_hp?.startsWith('WEEK-')) {
        weekMap[wRange].push([
          row.thu || "Thứ 2",
          row.ten_hp || "Môn học",
          row.tiet || "1-4",
          row.phong || "Khu giảng đường",
          row.giang_vien || "Giảng viên bộ môn"
        ]);
      }
    }
  }

  // Tự động bổ sung các tuần lân cận nếu chỉ có 1 tuần để sinh viên luôn chọn và duyệt được các tuần
  if (Object.keys(weekMap).length === 1) {
    const singleRange = Object.keys(weekMap)[0];
    const { startDate, endDate } = parseWeekRangeDates(singleRange);
    if (startDate && endDate) {
      const pad = (n) => String(n).padStart(2, '0');
      // Thêm Tuần sau (+7 ngày)
      const nextStart = new Date(startDate.getTime() + 7 * 86400000);
      const nextEnd = new Date(endDate.getTime() + 7 * 86400000);
      const nextRangeStr = `Từ ngày ${pad(nextStart.getDate())}/${pad(nextStart.getMonth() + 1)}/${nextStart.getFullYear()} đến ngày ${pad(nextEnd.getDate())}/${pad(nextEnd.getMonth() + 1)}/${nextEnd.getFullYear()}`;
      if (!weekMap[nextRangeStr]) {
        weekMap[nextRangeStr] = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
      }
      // Thêm Tuần trước (-7 ngày)
      const prevStart = new Date(startDate.getTime() - 7 * 86400000);
      const prevEnd = new Date(endDate.getTime() - 7 * 86400000);
      const prevRangeStr = `Từ ngày ${pad(prevStart.getDate())}/${pad(prevStart.getMonth() + 1)}/${prevStart.getFullYear()} đến ngày ${pad(prevEnd.getDate())}/${pad(prevEnd.getMonth() + 1)}/${prevEnd.getFullYear()}`;
      if (!weekMap[prevRangeStr]) {
        weekMap[prevRangeStr] = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
      }
    }
  }

  const weekKeys = Object.keys(weekMap);
  if (weekKeys.length === 0) return null;

  const dbWeeks = [];
  for (let i = 0; i < weekKeys.length; i++) {
    const wRange = weekKeys[i];
    const { startDate, endDate } = parseWeekRangeDates(wRange);
    const isCur = startDate && endDate ? (today >= startDate && today <= endDate) : (i === 0);
    dbWeeks.push({
      index: i,
      weekRange: wRange,
      startDate,
      endDate,
      isCurrent: isCur,
      rows: weekMap[wRange]
    });
  }

  // Sắp xếp các tuần theo thứ tự thời gian tăng dần
  dbWeeks.sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0;
    return a.startDate.getTime() - b.startDate.getTime();
  });
  dbWeeks.forEach((w, idx) => { w.index = idx; });

  let curWeekIdx = dbWeeks.findIndex(w => w.isCurrent);
  if (curWeekIdx === -1) {
    const nowTime = today.getTime();
    let minDiff = Infinity;
    dbWeeks.forEach((w, idx) => {
      if (w.startDate) {
        const diff = Math.abs(w.startDate.getTime() - nowTime);
        if (diff < minDiff) {
          minDiff = diff;
          curWeekIdx = idx;
        }
      }
    });
    if (curWeekIdx === -1) curWeekIdx = 0;
  }
  dbWeeks[curWeekIdx].isCurrent = true;
  const nextWeekIdx = (curWeekIdx + 1 < dbWeeks.length) ? (curWeekIdx + 1) : curWeekIdx;
  if (dbWeeks[nextWeekIdx]) dbWeeks[nextWeekIdx].isNext = true;

  const processedWeeks = dbWeeks.map(w => {
    const proc = scheduleService.processSchedulePayload([{ tableIndex: 1, rows: w.rows }], w.weekRange, customItems, { isCurrentWeek: w.index === curWeekIdx });
    let label = `Tuần ${w.index + 1}`;
    if (w.index === curWeekIdx) {
      label = 'Tuần này';
    } else if (w.index === nextWeekIdx && nextWeekIdx !== curWeekIdx) {
      label = 'Tuần sau';
    } else if (w.index === curWeekIdx - 1) {
      label = 'Tuần trước';
    }
    return {
      index: w.index,
      weekRange: w.weekRange,
      label,
      isCurrent: w.index === curWeekIdx,
      isNext: w.index === nextWeekIdx,
      schedules: proc.schedules
    };
  });

  let selectedWeekIdx = curWeekIdx;
  if (requestedWeek === 'next' || requestedWeekOffset === 1) {
    selectedWeekIdx = nextWeekIdx;
  } else if (requestedWeek === 'current' || requestedWeekOffset === 0) {
    selectedWeekIdx = curWeekIdx;
  } else if (requestedWeekIndex !== undefined && requestedWeekIndex >= 0 && requestedWeekIndex < dbWeeks.length) {
    selectedWeekIdx = requestedWeekIndex;
  } else if (isSunday) {
    selectedWeekIdx = nextWeekIdx;
  }

  const targetWeekData = dbWeeks[selectedWeekIdx] || dbWeeks[0];
  const nextWeekSchedule = dbWeeks[nextWeekIdx] ? processedWeeks[nextWeekIdx]?.schedules : [];
  const targetProcessed = scheduleService.processSchedulePayload(
    [{ tableIndex: 1, rows: targetWeekData.rows }],
    targetWeekData.weekRange,
    customItems,
    { nextWeekSchedule, isSunday, isCurrentWeek: selectedWeekIdx === curWeekIdx }
  );

  return res.json({
    success: true,
    mssv: mssv,
    isDbCached: isDbCached,
    isSunday,
    selectedWeekIndex: selectedWeekIdx,
    currentWeekIndex: curWeekIdx,
    nextWeekIndex: nextWeekIdx,
    weekRange: targetWeekData.weekRange,
    availableWeeks: processedWeeks,
    hasSchedules: Boolean(targetProcessed.schedules && targetProcessed.schedules.length > 0),
    message: (targetProcessed.schedules && targetProcessed.schedules.length > 0) ? "Thành công" : "Không có lịch học",
    ...targetProcessed
  });
}

// Bóc tách bảng thời khóa biểu của 1 tuần
function parseWeekTable($, table) {
  const parsedRows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
  if (!table || table.length === 0) return parsedRows;

  const headers = [];
  table.find('tr').first().find('th').slice(1).each((j, th) => {
    headers.push($(th).text().replace(/\s+/g, ' ').trim());
  });

  table.find('tr').slice(1).each((rowIdx, tr) => {
    const tds = $(tr).find('td');
    if (tds.length > 0) {
      const buoi = $(tds[0]).text().trim();

      for (let colIdx = 1; colIdx < tds.length; colIdx++) {
        const cellHtml = $(tds[colIdx]).html() || '';
        if (!cellHtml.includes('HP:')) continue;

        const lines = cellHtml.split(/<br\s*\/?>/i);
        let currentLesson = { ten_hp: '', tiet: '', phong: '', giang_vien: '' };

        lines.forEach(rawLine => {
          const line = cheerio.load(rawLine).text().trim();
          if (!line) return;

          if (line.startsWith('HP:')) {
            if (currentLesson.ten_hp) {
              pushRow(headers, colIdx, buoi, currentLesson, parsedRows);
              currentLesson = { ten_hp: '', tiet: '', phong: '', giang_vien: '' };
            }
            const match = line.match(/HP:\s*(.*?)\s*\(([\d\s-]+)\)/);
            if (match) {
              currentLesson.ten_hp = match[1].trim();
              currentLesson.tiet = match[2].trim();
            } else {
              currentLesson.ten_hp = line.replace('HP:', '').trim();
            }
          } else if (line.startsWith('GV:')) {
            currentLesson.giang_vien = line.replace('GV:', '').trim();
          } else if (line.startsWith('Phòng:')) {
            currentLesson.phong = line.replace('Phòng:', '').trim();
          }
        });

        if (currentLesson.ten_hp) {
          pushRow(headers, colIdx, buoi, currentLesson, parsedRows);
        }
      }
    }
  });

  return parsedRows;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. API GET/PUT PROFILE - Hồ sơ cá nhân sinh viên
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  const mssv = req.params.mssv || req.query.mssv || await getMssvFromReq(req);
  try {
    let [rows] = await db.query(
      'SELECT id, mssv, ho_ten, email, so_dien_thoai, lop, khoa, avatar FROM users WHERE mssv = ?',
      [mssv]
    );

    let u = rows.length > 0 ? rows[0] : null;

    // Nếu chưa có họ tên thật (hoặc chỉ là 'Sinh viên ...') và là sinh viên hợp lệ -> tự động cào tên chính thức từ cổng trường (có timeout tránh chặn luồng)
    if ((!u || !u.ho_ten || u.ho_ten.startsWith('Sinh viên') || u.ho_ten === 'Sinh viên') && mssv && !isGuestOrEmail(mssv)) {
      try {
        const syncPromise = studentSyncService.syncGradesForStudent(mssv);
        const syncRes = await Promise.race([
          syncPromise,
          new Promise((resolve) => setTimeout(() => resolve(null), 1500))
        ]);
        if (syncRes && syncRes.studentName) {
          if (u) {
            u.ho_ten = syncRes.studentName;
          } else {
            await db.query(
              'INSERT INTO users (mssv, ho_ten, email, password) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE ho_ten = ?',
              [mssv, syncRes.studentName, `${mssv}@sv.ttn.edu.vn`, '123456', syncRes.studentName]
            );
            const [refetched] = await db.query(
              'SELECT id, mssv, ho_ten, email, so_dien_thoai, lop, khoa, avatar FROM users WHERE mssv = ?',
              [mssv]
            );
            if (refetched.length > 0) u = refetched[0];
          }
        }
      } catch (err) {
        console.warn('Lỗi auto-sync họ tên sinh viên trong getProfile:', err.message);
      }
    }

    if (!u) {
      return res.json({
        success: true,
        student: {
          mssv,
          ho_ten: 'Sinh viên ' + mssv,
          fullName: 'Sinh viên ' + mssv,
          email: `${mssv}@sv.ttn.edu.vn`,
          so_dien_thoai: 'Chưa cập nhật',
          phone: 'Chưa cập nhật',
          lop: 'Kỹ thuật phần mềm K23',
          khoa: 'Công nghệ Thông tin',
          avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        }
      });
    }

    const name = u.ho_ten || ('Sinh viên ' + u.mssv);
    const phoneNum = u.so_dien_thoai || 'Chưa cập nhật';
    res.json({
      success: true,
      student: {
        id: u.id,
        mssv: u.mssv,
        ho_ten: name,
        fullName: name,
        email: u.email || `${u.mssv}@sv.ttn.edu.vn`,
        so_dien_thoai: phoneNum,
        phone: phoneNum,
        lop: u.lop || 'Kỹ thuật phần mềm K23',
        khoa: u.khoa || 'Công nghệ Thông tin',
        avatar: u.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thông tin sinh viên', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { ho_ten, fullName, email, so_dien_thoai, phone, lop, khoa, avatar, avatar_url, avatarUrl } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT ho_ten, email, so_dien_thoai, lop, khoa, avatar FROM users WHERE mssv = ? LIMIT 1',
      [mssv]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên.' });
    }

    const current = existing[0];
    const updatedName = (ho_ten !== undefined ? ho_ten : fullName) || current.ho_ten || ('Sinh viên ' + mssv);
    const updatedEmail = email !== undefined ? email : current.email;
    const updatedPhone = (so_dien_thoai !== undefined ? so_dien_thoai : phone) || current.so_dien_thoai || '';
    const updatedLop = lop !== undefined ? lop : current.lop;
    const updatedKhoa = khoa !== undefined ? khoa : current.khoa;
    const incomingAvatar = avatar !== undefined ? avatar : (avatar_url !== undefined ? avatar_url : avatarUrl);
    const updatedAvatar = incomingAvatar !== undefined ? incomingAvatar : (current.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');

    await db.query(
      'UPDATE users SET ho_ten = ?, email = ?, so_dien_thoai = ?, lop = ?, khoa = ?, avatar = ? WHERE mssv = ?',
      [updatedName, updatedEmail, updatedPhone, updatedLop, updatedKhoa, updatedAvatar, mssv]
    );

    res.json({
      success: true,
      message: 'Cập nhật thông tin sinh viên thành công.',
      student: {
        mssv,
        ho_ten: updatedName,
        fullName: updatedName,
        email: updatedEmail,
        so_dien_thoai: updatedPhone,
        phone: updatedPhone,
        lop: updatedLop,
        khoa: updatedKhoa,
        avatar: updatedAvatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ: ' + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CRUD LỊCH HỌC THỦ CÔNG / THỰC HÀNH ĐỘT XUẤT (Custom Schedules)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thêm lịch học thủ công (ví dụ: Lịch thực hành đột xuất, học bù, kiểm tra)
 */
exports.createCustomSchedule = async (req, res) => {
  try {
    const mssv = await getMssvFromReq(req);
    const { ten_hp, thu, tiet, phong, giang_vien, ghi_chu, loai_lich, ngay_hoc, week_range } = req.body || {};

    if (!ten_hp || !phong) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ tên môn/hoạt động và phòng học.'
      });
    }

    const normNgay = scheduleService.normalizeDateVN(ngay_hoc);
    let finalThu = thu ? thu.trim() : '';
    if (!finalThu && normNgay) {
      finalThu = scheduleService.getDayNameFromDate(normNgay) || 'Thứ 2';
    } else if (!finalThu) {
      finalThu = 'Thứ 2';
    }

    let finalWeekRange = week_range ? week_range.trim() : null;
    if (!finalWeekRange && normNgay) {
      finalWeekRange = scheduleService.getWeekRangeFromDate(normNgay);
    }

    const [result] = await db.query(
      `INSERT INTO student_schedules (mssv, ma_hp, ten_hp, thu, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich, week_range, ngay_hoc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      [
        mssv || 'guest',
        'TH-CUSTOM',
        ten_hp.trim(),
        finalThu,
        (tiet || 'Ca học').trim(),
        phong.trim(),
        (giang_vien || '').trim(),
        'HK1 (2025-2026)',
        (ghi_chu || '').trim(),
        (loai_lich || 'dot_xuat').trim(),
        finalWeekRange,
        normNgay || null
      ]
    );

    const newId = result.insertId;
    const direction = scheduleService.parseRoomDirections(phong);
    const dayNum = scheduleService.getDayNumber(finalThu);
    const cleanTime = (raw) => {
      let s = String(raw || 'Ca học').trim();
      while (/^tiết\s+tiết/i.test(s)) {
        s = s.replace(/^tiết\s+/i, '');
      }
      return s.startsWith('Tiết') || s.includes(':') ? s : `Tiết ${s}`;
    };

    return res.json({
      success: true,
      message: 'Thêm lịch học thành công!',
      data: {
        id: newId,
        course: ten_hp.trim(),
        code: finalThu,
        time: cleanTime(tiet),
        room: phong.trim(),
        day: finalThu,
        dayNum,
        lecturer: (giang_vien || '').trim(),
        direction,
        isCustom: true,
        note: (ghi_chu || '').trim(),
        type: (loai_lich || 'dot_xuat').trim(),
        ngay_hoc: normNgay || null,
        date: normNgay || null,
        week_range: finalWeekRange || null
      }
    });
  } catch (error) {
    console.error('Lỗi thêm lịch học thủ công:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể thêm lịch học: ' + error.message
    });
  }
};

/**
 * Cập nhật lịch học thủ công
 */
exports.updateCustomSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const mssv = await getMssvFromReq(req);
    const { ten_hp, thu, tiet, phong, giang_vien, ghi_chu, loai_lich, ngay_hoc, week_range } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu ID lịch học cần cập nhật' });
    }

    const normNgay = ngay_hoc !== undefined ? scheduleService.normalizeDateVN(ngay_hoc) : undefined;
    let finalThu = thu !== undefined ? thu.trim() : undefined;
    if (finalThu === undefined && normNgay) {
      finalThu = scheduleService.getDayNameFromDate(normNgay);
    }
    let finalWeekRange = week_range !== undefined ? week_range.trim() : undefined;
    if (finalWeekRange === undefined && normNgay) {
      finalWeekRange = scheduleService.getWeekRangeFromDate(normNgay);
    }

    let query = `UPDATE student_schedules SET 
      ten_hp = COALESCE(?, ten_hp),
      thu = COALESCE(?, thu),
      tiet = COALESCE(?, tiet),
      phong = COALESCE(?, phong),
      giang_vien = COALESCE(?, giang_vien),
      ghi_chu = COALESCE(?, ghi_chu),
      loai_lich = COALESCE(?, loai_lich),
      ngay_hoc = COALESCE(?, ngay_hoc),
      week_range = COALESCE(?, week_range)
      WHERE id = ? AND is_custom = 1`;
    let params = [
      ten_hp !== undefined ? ten_hp.trim() : null,
      finalThu !== undefined ? finalThu : null,
      tiet !== undefined ? tiet.trim() : null,
      phong !== undefined ? phong.trim() : null,
      giang_vien !== undefined ? giang_vien.trim() : null,
      ghi_chu !== undefined ? ghi_chu.trim() : null,
      loai_lich !== undefined ? loai_lich.trim() : null,
      normNgay !== undefined ? normNgay : null,
      finalWeekRange !== undefined ? finalWeekRange : null,
      id
    ];

    if (!mssv || mssv === 'guest') {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để cập nhật lịch học cá nhân.' });
    }

    query += ' AND mssv = ?';
    params.push(mssv);

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học cần sửa hoặc không có quyền thao tác' });
    }

    const [rows] = await db.query('SELECT * FROM student_schedules WHERE id = ? AND mssv = ?', [id, mssv]);
    const updated = rows[0];
    const direction = scheduleService.parseRoomDirections(updated.phong);
    const dayNum = scheduleService.getDayNumber(updated.thu);

    const cleanTime = (raw) => {
      let s = String(raw || 'Ca học').trim();
      while (/^tiết\s+tiết/i.test(s)) {
        s = s.replace(/^tiết\s+/i, '');
      }
      return s.startsWith('Tiết') || s.includes(':') ? s : `Tiết ${s}`;
    };

    return res.json({
      success: true,
      message: 'Cập nhật lịch học thành công!',
      data: {
        id: updated.id,
        course: updated.ten_hp,
        code: updated.thu,
        time: cleanTime(updated.tiet),
        room: updated.phong,
        day: updated.thu,
        dayNum,
        lecturer: updated.giang_vien || '',
        direction,
        isCustom: true,
        note: updated.ghi_chu || '',
        type: updated.loai_lich || 'dot_xuat',
        ngay_hoc: updated.ngay_hoc || null,
        date: updated.ngay_hoc || null,
        week_range: updated.week_range || null
      }
    });
  } catch (error) {
    console.error('Lỗi cập nhật lịch học thủ công:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật lịch học: ' + error.message });
  }
};

/**
 * Xóa lịch học thủ công (Bảo vệ phân quyền theo MSSV sở hữu)
 */
exports.deleteCustomSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const mssv = await getMssvFromReq(req);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu ID lịch học cần xóa' });
    }

    if (!mssv || mssv === 'guest') {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để xóa lịch học cá nhân.' });
    }

    const query = 'DELETE FROM student_schedules WHERE id = ? AND is_custom = 1 AND mssv = ?';
    const params = [id, mssv];

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học cần xóa hoặc không có quyền' });
    }

    return res.json({
      success: true,
      message: 'Đã xóa lịch học thành công!'
    });
  } catch (error) {
    console.error('Lỗi xóa lịch học:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xóa lịch học: ' + error.message });
  }
};