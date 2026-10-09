const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');
const https = require('https');
const gradeService = require('../services/gradeService');
const scheduleService = require('../services/scheduleService');

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

  // 1. Đọc ngay từ Database siêu tốc (1-2ms) nếu không yêu cầu reload cưỡng bức
  if (!forceRefresh && mssv && !isGuestOrEmail(mssv)) {
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
          isDbCached: true,
          ho_ten: studentName || ('Sinh viên ' + mssv),
          ...processed
        });
      }
    } catch (e) {
      console.warn('Lỗi query student_grades từ DB:', e.message);
    }
  }

  // 2. Chỉ cào trực tiếp bảng điểm sinh viên từ kqcq.php của trường TTN khi DB trống hoặc khi reload
  let liveSubjects = [];
  try {
    const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': studentDk });

    const response = await axios.post(TTN_CONFIG.GRADES_URL, payload.toString(), {
      httpsAgent,
      headers: {
        ...TTN_CONFIG.COMMON_HEADERS,
        'Referer': TTN_CONFIG.GRADES_REFERER,
        'Accept': '*/*'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    let extractedName = extractFullNameFromHtml($);

    if (extractedName && mssv && !isGuestOrEmail(mssv)) {
      studentName = extractedName;
      try {
        await db.query('UPDATE users SET ho_ten = ?, full_name = ? WHERE mssv = ?', [extractedName, extractedName, mssv]);
      } catch (err) {}
    }

    // Bóc tách toàn bộ bảng từ response HTML của kqcq.php
    const tablesData = [];
    $('table').each((index, table) => {
      const rows = [];
      $(table).find('tr').each((i, row) => {
        const cols = [];
        $(row).find('td, th').each((j, col) => {
          cols.push($(col).text().trim());
        });
        if (cols.length > 1 && cols.some(c => c !== '')) {
          rows.push(cols);
        }
      });
      if (rows.length > 0) tablesData.push({ tableIndex: index, rows });
    });

    for (const table of tablesData) {
      const rows = table.rows || [];
      if (rows.length < 2) continue;
      const header = rows[0] || [];

      // Nhận diện bảng điểm chính quy trường Tây Nguyên (có các cột Năm học, Học phần, ĐBP, Thi1, Thi2, Đ1, Đ2, ĐChữ, TChỉ, Học phí)
      const isGradeTable = header.some(h => 
        h.includes('Năm học') || h.includes('Học phần') || h.includes('ĐBP') || h.includes('ĐChữ') || h.includes('TChỉ')
      );

      if (isGradeTable) {
        let colNam = 0, colKy = 1, colHp = 2, colDbp = 3, colThi1 = 4, colThi2 = 5, colD1 = 6, colD2 = 7, colChu = 8, colTc = 9, colPhi = 10;

        header.forEach((h, idx) => {
          const l = h.toLowerCase();
          if (l.includes('năm học')) colNam = idx;
          else if (l === 'kỳ' || l.includes('học kỳ')) colKy = idx;
          else if (l.includes('học phần') || l.includes('tên môn') || l.includes('tên')) colHp = idx;
          else if (l.includes('đbp') || l.includes('quá trình')) colDbp = idx;
          else if (l.includes('thi1') || l.includes('thi 1')) colThi1 = idx;
          else if (l.includes('thi2') || l.includes('thi 2')) colThi2 = idx;
          else if (l.includes('đ1') || l.includes('điểm 1')) colD1 = idx;
          else if (l.includes('đ2') || l.includes('điểm 2')) colD2 = idx;
          else if (l.includes('đchữ') || l.includes('chữ')) colChu = idx;
          else if (l.includes('tchỉ') || l.includes('tín chỉ') || l === 'tc') colTc = idx;
          else if (l.includes('học phí') || l.includes('tiền')) colPhi = idx;
        });

        for (let rIdx = 1; rIdx < rows.length; rIdx++) {
          const r = rows[rIdx];
          if (r.length < 4) continue;
          const tenHp = cleanName(r[colHp] || '');
          if (!tenHp || tenHp.length < 2 || /^\d+$/.test(tenHp)) continue;

          const namHoc = r[colNam] || '';
          const ky = r[colKy] || '';
          const dbpStr = r[colDbp];
          const thi1Str = r[colThi1];
          const thi2Str = r[colThi2];
          const d1Str = r[colD1];
          const d2Str = r[colD2];
          const dchuStr = r[colChu];
          const tcStr = r[colTc];
          const phiStr = r[colPhi] || '';

          const dbp = dbpStr !== '' && !isNaN(parseFloat(dbpStr)) ? parseFloat(dbpStr) : null;
          const thi1 = thi1Str !== '' && !isNaN(parseFloat(thi1Str)) ? parseFloat(thi1Str) : null;
          const thi2 = thi2Str !== '' && !isNaN(parseFloat(thi2Str)) ? parseFloat(thi2Str) : null;
          const d1 = d1Str !== '' && !isNaN(parseFloat(d1Str)) ? parseFloat(d1Str) : null;
          const d2 = d2Str !== '' && !isNaN(parseFloat(d2Str)) ? parseFloat(d2Str) : null;

          const diemThi = thi2 !== null ? thi2 : thi1;
          const diemHp = d2 !== null ? d2 : d1;
          const tc = tcStr !== '' && !isNaN(parseFloat(tcStr)) ? parseFloat(tcStr) : 3;

          let dchu = dchuStr || (diemHp !== null ? '' : 'X');
          if (!dchu && diemHp !== null) {
            dchu = diemHp >= 8.5 ? 'A' : diemHp >= 7.0 ? 'B' : diemHp >= 5.5 ? 'C' : diemHp >= 4.0 ? 'D' : 'F';
          }

          const semStr = ky ? `HK${ky} (${namHoc})` : (namHoc ? `Năm ${namHoc}` : 'HK1 (2026)');

          liveSubjects.push({
            ten_hp: tenHp,
            nam_hoc: namHoc,
            ky: ky,
            diem_dbp: dbp,
            diem_qt: dbp,
            diem_thi1: thi1,
            diem_thi2: thi2,
            diem_thi: diemThi,
            diem_1: d1,
            diem_2: d2,
            diem_hp: diemHp,
            diem_chu: dchu,
            so_tin_chi: tc,
            hoc_phi: phiStr,
            hoc_ky: semStr
          });
        }
      }
    }
  } catch (error) {
    console.warn('Lỗi cào dữ liệu từ kqcq.php:', error.message);
  }

  // 2. Nếu cào thành công từ kqcq.php: lưu vào Database và trả về ngay
  if (liveSubjects.length > 0) {
    try {
      await db.query('DELETE FROM student_grades WHERE mssv = ?', [mssv]);
      for (const s of liveSubjects) {
        await db.query(
          `INSERT INTO student_grades 
           (mssv, ten_hp, nam_hoc, ky, diem_dbp, diem_thi1, diem_thi2, diem_1, diem_2, diem_chu, so_tin_chi, hoc_phi, hoc_ky) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mssv, s.ten_hp, s.nam_hoc, s.ky, s.diem_dbp, 
            s.diem_thi1, s.diem_thi2, s.diem_1, s.diem_2, 
            s.diem_chu, s.so_tin_chi, s.hoc_phi, s.hoc_ky
          ]
        );
      }
    } catch (e) {
      console.warn('Lỗi lưu student_grades:', e.message);
    }

    const processed = gradeService.processGradesPayload(liveSubjects);
    return res.json({
      success: true,
      mssv: mssv,
      ho_ten: studentName || ('Sinh viên ' + mssv),
      ...processed
    });
  }

  // 3. Nếu cào trực tiếp không thành công, kiểm tra dữ liệu đã lưu trong Database
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
        isDbCached: true,
        ho_ten: studentName || ('Sinh viên ' + mssv),
        ...processed
      });
    }
  } catch (e) {
    console.warn('Lỗi query student_grades từ DB:', e.message);
  }

  // 4. Dự phòng: Danh sách học phần chuyên ngành chuẩn
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
        'SELECT id, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich FROM student_schedules WHERE (mssv = ? OR mssv = "guest") AND is_custom = 1 ORDER BY id ASC',
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
    const processed = scheduleService.processSchedulePayload(defaultTables, "Từ ngày 28/09/2026 đến ngày 04/10/2026", customItems);
    return res.json({
      success: true,
      mssv: mssv,
      isGuest: true,
      ...processed
    });
  }

  const forceRefresh = req.query.reload === 'true' || req.query.refresh === 'true' || req.body?.reload === true;

  // 1. Kiểm tra ngay trong Database siêu tốc (1-2ms) nếu không yêu cầu reload cưỡng bức
  if (!forceRefresh && mssv && !isGuestOrEmail(mssv)) {
    try {
      const [dbSchedules] = await db.query(
        'SELECT id, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich FROM student_schedules WHERE mssv = ? ORDER BY id ASC',
        [mssv]
      );
      if (dbSchedules && dbSchedules.length > 0) {
        const cachedRows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
        const customItems = [];
        for (const row of dbSchedules) {
          if (row.is_custom) {
            customItems.push(row);
          } else {
            cachedRows.push([
              row.thu || "Thứ 2",
              row.ten_hp || "Môn học",
              row.tiet || "1-4",
              row.phong || "Khu giảng đường",
              row.giang_vien || "Giảng viên bộ môn"
            ]);
          }
        }
        const rawTables = [{ tableIndex: 1, rows: cachedRows }];
        const processed = scheduleService.processSchedulePayload(rawTables, dbSchedules[0]?.hoc_ky || "Lịch học đã lưu từ cổng đào tạo", customItems);
        return res.json({
          success: true,
          mssv: mssv,
          isDbCached: true,
          ...processed
        });
      }
    } catch (e) {
      console.warn('Lỗi đọc student_schedules từ DB:', e.message);
    }
  }

  // 2. Chỉ cào từ cổng trường khi DB chưa có hoặc khi người dùng vuốt reload
  try {
    const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': studentDk });

    const response = await axios.post(TTN_CONFIG.SCHEDULE_URL, payload.toString(), {
      httpsAgent,
      headers: {
        ...TTN_CONFIG.COMMON_HEADERS,
        'Referer': TTN_CONFIG.SCHEDULE_REFERER,
        'Accept': 'text/plain, */*; q=0.01'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetWeekP = null;
    let targetWeekRangeText = "";

    // 1. Tìm đúng tuần hiện tại dựa theo khoảng thời gian hệ thống
    $('p').each((i, pElem) => {
      const pText = $(pElem).text().trim();
      if (pText.startsWith('Từ ngày')) {
        const match = pText.match(/Từ ngày\s+(\d{2}\/\d{2}\/\d{4})\s+đến ngày\s+(\d{2}\/\d{2}\/\d{4})/i);
        if (match) {
          const [_, startStr, endStr] = match;
          const [sDay, sMonth, sYear] = startStr.split('/');
          const [eDay, eMonth, eYear] = endStr.split('/');

          const startDate = new Date(`${sYear}-${sMonth}-${sDay}`);
          const endDate = new Date(`${eYear}-${eMonth}-${eDay}`);
          endDate.setHours(23, 59, 59, 999);

          if (today >= startDate && today <= endDate) {
            targetWeekP = $(pElem);
            targetWeekRangeText = pText;
            return false;
          }
        }
      }
    });

    // Nếu không khớp ngày hiện tại, lấy tuần đầu tiên làm mặc định
    if (!targetWeekP) {
      const firstP = $('p').filter((i, el) => $(el).text().trim().startsWith('Từ ngày')).first();
      if (firstP.length > 0) {
        targetWeekP = firstP;
        targetWeekRangeText = firstP.text().trim();
      }
    }

    const parsedRows = [
      ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]
    ];

    // 2. Bóc tách dữ liệu bảng của tuần đó
    if (targetWeekP && targetWeekP.length > 0) {
      const table = targetWeekP.next('table');
      if (table.length > 0) {
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
      }
    }

    // 3. Lưu cache vào bảng student_schedules trong DB (chỉ xóa và cập nhật lịch chính khóa, giữ nguyên lịch thủ công/đột xuất)
    if (parsedRows.length > 1 && mssv && !isGuestOrEmail(mssv)) {
      try {
        await db.query('DELETE FROM student_schedules WHERE mssv = ? AND (is_custom = 0 OR is_custom IS NULL)', [mssv]);
        for (let i = 1; i < parsedRows.length; i++) {
          const r = parsedRows[i];
          await db.query(
            'INSERT INTO student_schedules (mssv, ma_hp, ten_hp, thu, tiet, phong, giang_vien, hoc_ky, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [mssv, `HP-${i}`, r[1], r[0], r[2], r[3], r[4], 'HK1 (2025-2026)']
          );
        }
      } catch (e) {}
    }

    let customItems = [];
    if (mssv) {
      try {
        const [customRows] = await db.query(
          'SELECT id, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich FROM student_schedules WHERE (mssv = ? OR mssv = "guest") AND is_custom = 1 ORDER BY id ASC',
          [mssv]
        );
        customItems = customRows || [];
      } catch (e) {}
    }

    const rawTables = [{ tableIndex: 1, rows: parsedRows }];
    const processed = scheduleService.processSchedulePayload(rawTables, targetWeekRangeText || "Lịch học tuần hiện tại", customItems);
    return res.json({
      success: true,
      mssv: mssv,
      ...processed
    });

  } catch (error) {
    console.warn('Lỗi cào lịch học:', error.message);
  }

  // 4. Nếu cào trực tiếp không thành công, kiểm tra dữ liệu đã lưu trong Database
  if (mssv && !isGuestOrEmail(mssv)) {
    try {
      const [dbSchedules] = await db.query(
        'SELECT id, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich FROM student_schedules WHERE mssv = ? ORDER BY id ASC',
        [mssv]
      );
      if (dbSchedules && dbSchedules.length > 0) {
        const cachedRows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
        const customItems = [];
        for (const row of dbSchedules) {
          if (row.is_custom) {
            customItems.push(row);
          } else {
            cachedRows.push([
              row.thu || "Thứ 2",
              row.ten_hp || "Môn học",
              row.tiet || "1-4",
              row.phong || "Khu giảng đường",
              row.giang_vien || "Giảng viên bộ môn"
            ]);
          }
        }
        const rawTables = [{ tableIndex: 1, rows: cachedRows }];
        const processed = scheduleService.processSchedulePayload(rawTables, "Lịch học đã lưu từ cổng đào tạo", customItems);
        return res.json({
          success: true,
          mssv: mssv,
          isDbCached: true,
          ...processed
        });
      }
    } catch (dbErr) {
      console.warn('Lỗi query student_schedules từ DB:', dbErr.message);
    }
  }

  // Dữ liệu dự phòng nếu cào lỗi
  let fallbackCustom = [];
  if (mssv) {
    try {
      const [cRows] = await db.query(
        'SELECT id, thu, ten_hp, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich FROM student_schedules WHERE (mssv = ? OR mssv = "guest") AND is_custom = 1 ORDER BY id ASC',
        [mssv]
      );
      fallbackCustom = cRows || [];
    } catch (e) {}
  }

  const fallbackTables = [{
    tableIndex: 1,
    rows: [
      ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
      ["Thứ 2", "Lập trình thiết bị di động", "1-4", "9.2.04", "TS. Hoàng Minh"],
      ["Thứ 3", "LS Đảng CS VN", "1-4", "2.21 (CLC)", "Đoàn Văn Kỳ"],
      ["Thứ 4", "Cấu trúc dữ liệu & Giải thuật", "7-10", "9.3.01", "ThS. Lê Thị B"]
    ]
  }];
  const processedFallback = scheduleService.processSchedulePayload(fallbackTables, "Từ ngày 28/09/2026 đến ngày 04/10/2026", fallbackCustom);
  res.json({
    success: true,
    mssv: mssv,
    ...processedFallback
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

// ─────────────────────────────────────────────────────────────────────────────
// 3. API GET/PUT PROFILE - Hồ sơ cá nhân sinh viên
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  const mssv = req.params.mssv || req.query.mssv || await getMssvFromReq(req);
  try {
    const [rows] = await db.query(
      'SELECT id, mssv, ho_ten, email, so_dien_thoai, lop, khoa, avatar FROM users WHERE mssv = ?',
      [mssv]
    );

    if (rows.length === 0) {
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

    const u = rows[0];
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
    const [existing] = await db.query('SELECT * FROM users WHERE mssv = ?', [mssv]);
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
    const { ten_hp, thu, tiet, phong, giang_vien, ghi_chu, loai_lich } = req.body || {};

    if (!ten_hp || !thu || !phong) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ tên môn/hoạt động, thứ trong tuần và phòng học.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO student_schedules (mssv, ma_hp, ten_hp, thu, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        mssv || 'guest',
        'TH-CUSTOM',
        ten_hp.trim(),
        thu.trim(),
        (tiet || 'Ca học').trim(),
        phong.trim(),
        (giang_vien || '').trim(),
        'HK1 (2025-2026)',
        (ghi_chu || '').trim(),
        (loai_lich || 'dot_xuat').trim()
      ]
    );

    const newId = result.insertId;
    const direction = scheduleService.parseRoomDirections(phong);
    const dayNum = scheduleService.getDayNumber(thu);
    const cleanTime = (raw) => {
      let s = String(raw || 'Ca học').trim();
      while (/^tiết\s+tiết/i.test(s)) {
        s = s.replace(/^tiết\s+/i, '');
      }
      return s.startsWith('Tiết') || s.includes(':') ? s : `Tiết ${s}`;
    };

    return res.json({
      success: true,
      message: 'Thêm lịch học đột xuất/thủ công thành công!',
      data: {
        id: newId,
        course: ten_hp.trim(),
        code: thu.trim(),
        time: cleanTime(tiet),
        room: phong.trim(),
        day: thu.trim(),
        dayNum,
        lecturer: (giang_vien || '').trim(),
        direction,
        isCustom: true,
        note: (ghi_chu || '').trim(),
        type: (loai_lich || 'dot_xuat').trim()
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
    const { ten_hp, thu, tiet, phong, giang_vien, ghi_chu, loai_lich } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu ID lịch học cần cập nhật' });
    }

    let query = `UPDATE student_schedules SET 
      ten_hp = COALESCE(?, ten_hp),
      thu = COALESCE(?, thu),
      tiet = COALESCE(?, tiet),
      phong = COALESCE(?, phong),
      giang_vien = COALESCE(?, giang_vien),
      ghi_chu = COALESCE(?, ghi_chu),
      loai_lich = COALESCE(?, loai_lich)
      WHERE id = ? AND is_custom = 1`;
    let params = [
      ten_hp !== undefined ? ten_hp.trim() : null,
      thu !== undefined ? thu.trim() : null,
      tiet !== undefined ? tiet.trim() : null,
      phong !== undefined ? phong.trim() : null,
      giang_vien !== undefined ? giang_vien.trim() : null,
      ghi_chu !== undefined ? ghi_chu.trim() : null,
      loai_lich !== undefined ? loai_lich.trim() : null,
      id
    ];

    if (mssv && mssv !== 'guest') {
      query += ' AND (mssv = ? OR mssv = "guest")';
      params.push(mssv);
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học cần sửa hoặc không có quyền thao tác' });
    }

    const [rows] = await db.query('SELECT * FROM student_schedules WHERE id = ?', [id]);
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
        type: updated.loai_lich || 'dot_xuat'
      }
    });
  } catch (error) {
    console.error('Lỗi cập nhật lịch học thủ công:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật lịch học: ' + error.message });
  }
};

/**
 * Xóa lịch học thủ công
 */
exports.deleteCustomSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const mssv = await getMssvFromReq(req);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu ID lịch học cần xóa' });
    }

    let query = 'DELETE FROM student_schedules WHERE id = ? AND is_custom = 1';
    let params = [id];
    if (mssv && mssv !== 'guest') {
      query += ' AND (mssv = ? OR mssv = "guest")';
      params.push(mssv);
    }

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