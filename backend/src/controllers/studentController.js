const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');
const https = require('https');

// Tạo một httpsAgent để bỏ qua lỗi chứng chỉ SSL tự ký của trường (tránh SSLCertVerificationError)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Helper to get mssv from request (headers, token, body, query, or latest user)
const getMssvFromReq = async (req) => {
  if (req.body && req.body.mssv) return req.body.mssv;
  if (req.body && req.body.masv) return req.body.masv;
  if (req.query && req.query.mssv) return req.query.mssv;
  if (req.query && req.query.masv) return req.query.masv;
  if (req.params && req.params.mssv) return req.params.mssv;
  if (req.headers['x-mssv']) return req.headers['x-mssv'];
  if (req.headers['x-masv']) return req.headers['x-masv'];

  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token.startsWith('jwt-token-')) {
      const parts = token.split('-');
      if (parts.length >= 3 && parts[2]) {
        return parts[2];
      }
    }
    if (token && !token.includes(' ') && token.length <= 15) {
      return token;
    }
  }

  return 'guest';
};

// Helper kiểm tra tài khoản khách
const isGuestOrEmail = (mssv) => {
  return !mssv || mssv === 'guest' || mssv.includes('@') || mssv.startsWith('test') || mssv.length < 4;
};

// Hàm làm sạch tên (Đã sửa lỗi ký tự lạ)
const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/[\(\[\-]?\s*(trạng thái\vert{}đang học).*?[\)\]]?/gi, '')     .replace(/^[:\-\s]+\vert{}[:\-\s]+$/g, '')     .replace(/\s*\)+$/, '')
    .replace(/\s*\({2,}/g, '(')
    .trim();
};

const extractFullNameFromHtml = ($) => {
  let fullName = null;
  const htmlContent = $.html();
  const match = htmlContent.match(/(?:Họ và tên|Họ tên)\s*[:\-]\s*(?:<b>)?([^<]+)(?:<\/b>)?/i);

  if (match && match[1]) {
    const cleaned = match[1].trim().replace(/<\/?b>/gi, '').replace(/[-–—]\s*$/, '').trim();
    if (cleaned.length > 2) fullName = cleaned;
  }

  if (!fullName) {
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      if ((text.includes('Họ và tên:') || text.includes('Họ tên:')) && text.length < 80) {
        const parts = text.split(/[:\-]/);
        if (parts.length > 1) {
          const candidate = parts.slice(1).join(':').trim();
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

// Get Grades (Bảng Điểm của sinh viên)
exports.getGrades = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { dk } = req.body || {};
  const studentDk = dk || '10';

  if (isGuestOrEmail(mssv)) {
    return res.json({
      success: true,
      mssv: mssv,
      isGuest: true,
      data: [
        { ma_hp: 'NT118', ten_hp: 'Lập trình thiết bị di động (Mẫu khách)', so_tin_chi: 3, diem_qt: 9.0, diem_th: 8.5, diem_thi: 8.0, diem_hp: 8.5, diem_chu: 'A', hoc_ky: 'HK1 (2025-2026)' },
        { ma_hp: 'CS301', ten_hp: 'Cấu trúc dữ liệu & Giải thuật', so_tin_chi: 4, diem_qt: 8.0, diem_th: 8.0, diem_thi: 8.0, diem_hp: 8.0, diem_chu: 'B+', hoc_ky: 'HK1 (2025-2026)' },
        { ma_hp: 'IT202', ten_hp: 'Hệ cơ sở dữ liệu', so_tin_chi: 3, diem_qt: 7.0, diem_th: 8.0, diem_thi: 7.5, diem_hp: 7.5, diem_chu: 'B', hoc_ky: 'HK1 (2025-2026)' },
      ]
    });
  }

  let studentName = null;
  try {
    const [uRows] = await db.query('SELECT ho_ten, full_name FROM users WHERE mssv = ?', [mssv]);
    if (uRows.length > 0) studentName = uRows[0].ho_ten || uRows[0].full_name;
  } catch (e) {}

  try {
    const [dbGrades] = await db.query(
      'SELECT ma_hp, ten_hp, so_tin_chi, diem_qt, diem_th, diem_thi, diem_hp, diem_chu, hoc_ky FROM student_grades WHERE mssv = ?',
      [mssv]
    );
    if (dbGrades && dbGrades.length > 0) {
      return res.json({
        success: true,
        mssv: mssv,
        ho_ten: studentName || ('Sinh viên ' + mssv),
        data: dbGrades
      });
    }
  } catch (e) {}

  try {
    const url = "https://www.ttn.edu.vn/libraries/tnu/diemsinhvien.php";
    const payload = new URLSearchParams({ 'msv': mssv, 'dk': studentDk });

    const response = await axios.post(url, payload.toString(), {
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.ttn.edu.vn/',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    let extractedName = extractFullNameFromHtml($);

    if (extractedName && mssv && !isGuestOrEmail(mssv)) {
      try {
        await db.query('UPDATE users SET ho_ten = ?, full_name = ? WHERE mssv = ?', [extractedName, extractedName, mssv]);
      } catch (err) {}
    }

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
      tablesData.push({ tableIndex: index + 1, rows });
    });

    const subjects = [];
    if (tablesData.length > 0) {
      const rows = tablesData[0].rows || [];
      rows.slice(1).forEach((r, idx) => {
        if (r.length >= 5) {
          const diemHp = parseFloat(r[6] || r[5] || '0') || 8.0;
          subjects.push({
            ma_hp: r[1] || `HP-${idx + 1}`,
            ten_hp: r[2] || 'Học phần',
            so_tin_chi: parseInt(r[3], 10) || 3,
            diem_qt: parseFloat(r[4]) || diemHp,
            diem_th: parseFloat(r[5]) || diemHp,
            diem_thi: parseFloat(r[6]) || diemHp,
            diem_hp: diemHp,
            diem_chu: r[7] || (diemHp >= 8.5 ? 'A' : diemHp >= 7.0 ? 'B' : 'C'),
            hoc_ky: 'HK1 (2025-2026)'
          });
        }
      });
    }

    if (subjects.length > 0) {
      for (const s of subjects) {
        try {
          await db.query(
            'INSERT INTO student_grades (mssv, ma_hp, ten_hp, so_tin_chi, diem_qt, diem_th, diem_thi, diem_hp, diem_chu, hoc_ky) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [mssv, s.ma_hp, s.ten_hp, s.so_tin_chi, s.diem_qt, s.diem_th, s.diem_thi, s.diem_hp, s.diem_chu, s.hoc_ky]
          );
        } catch (e) {}
      }

      return res.json({
        success: true,
        mssv: mssv,
        ho_ten: extractedName || studentName,
        data: subjects
      });
    }
  } catch (error) {}

  res.json({
    success: true,
    mssv: mssv,
    ho_ten: studentName || ('Sinh viên ' + mssv),
    data: []
  });
};

// Get Student Profile
exports.getProfile = async (req, res) => {
  const mssv = req.params.mssv || req.query.mssv || await getMssvFromReq(req);
  try {
    const [rows] = await db.query(
      'SELECT id, mssv, ho_ten, full_name, email, so_dien_thoai, phone, lop, khoa, ngay_sinh, gioi_tinh, avatar FROM users WHERE mssv = ?',
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
          ngay_sinh: '2005-05-15',
          gioi_tinh: 'Nam',
          avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        }
      });
    }

    const u = rows[0];
    res.json({
      success: true,
      student: {
        id: u.id,
        mssv: u.mssv,
        ho_ten: u.ho_ten || u.full_name || ('Sinh viên ' + u.mssv),
        fullName: u.full_name || u.ho_ten || ('Sinh viên ' + u.mssv),
        email: u.email || `${u.mssv}@sv.ttn.edu.vn`,
        so_dien_thoai: u.so_dien_thoai || u.phone || 'Chưa cập nhật',
        phone: u.phone || u.so_dien_thoai || 'Chưa cập nhật',
        lop: u.lop || 'Kỹ thuật phần mềm K23',
        khoa: u.khoa || 'Công nghệ Thông tin',
        ngay_sinh: u.ngay_sinh || '2005-05-15',
        gioi_tinh: u.gioi_tinh || 'Nam',
        avatar: u.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thông tin sinh viên', error: error.message });
  }
};

// Update Student Profile
exports.updateProfile = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { ho_ten, fullName, email, so_dien_thoai, phone, lop, khoa, ngay_sinh, gioi_tinh } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE mssv = ?', [mssv]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên.' });
    }

    const current = existing[0];
    const updatedName = (ho_ten !== undefined ? ho_ten : fullName) || current.ho_ten || current.full_name;
    const updatedEmail = email !== undefined ? email : current.email;
    const updatedPhone = (so_dien_thoai !== undefined ? so_dien_thoai : phone) || current.so_dien_thoai || current.phone;
    const updatedLop = lop !== undefined ? lop : current.lop;
    const updatedKhoa = khoa !== undefined ? khoa : current.khoa;
    const updatedNgaySinh = ngay_sinh !== undefined ? ngay_sinh : current.ngay_sinh;
    const updatedGioiTinh = gioi_tinh !== undefined ? gioi_tinh : current.gioi_tinh;

    await db.query(
      'UPDATE users SET ho_ten = ?, full_name = ?, email = ?, so_dien_thoai = ?, phone = ?, lop = ?, khoa = ?, ngay_sinh = ?, gioi_tinh = ? WHERE mssv = ?',
      [updatedName, updatedName, updatedEmail, updatedPhone, updatedPhone, updatedLop, updatedKhoa, updatedNgaySinh, updatedGioiTinh, mssv]
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
        ngay_sinh: updatedNgaySinh,
        gioi_tinh: updatedGioiTinh
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ: ' + error.message });
  }
};

// Get Schedule - Cào chính xác toàn bộ môn học trong tuần hiện tại
exports.getSchedule = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { dk } = req.body || {};
  const studentDk = dk || '10';

  if (isGuestOrEmail(mssv)) {
    return res.json({
      success: true,
      mssv: mssv,
      weekRange: "Từ ngày 28/09/2026 đến ngày 04/10/2026",
      tables: [{
        tableIndex: 1,
        rows: [
          ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
          ["Thứ 3 29/09", "LS Đảng CS VN", "1-4", "2.21 (CLC)", "Đoàn Văn Kỳ"]
        ]
      }]
    });
  }

  try {
    const url = "https://www.ttn.edu.vn/libraries/tnu/tkbieusinhvien.php";
    const payload = new URLSearchParams({ 'msv': mssv, 'dk': studentDk });

    const response = await axios.post(url, payload.toString(), {
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.ttn.edu.vn/',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Lấy ngày hiện tại hệ thống
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
      const firstP = $('p').filter((i, el) =>$(el).text().trim().startsWith('Từ ngày')).first();
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
        // Lấy tiêu đề các ngày: "Thứ 2 28/09", "Thứ 3 29/09"...
        table.find('tr').first().find('th').slice(1).each((j, th) => {
          headers.push($(th).text().replace(/\s+/g, ' ').trim());
        });

        // Duyệt qua từng dòng buổi (Sáng, Chiều, Tối)
        table.find('tr').slice(1).each((rowIdx, tr) => {
          const tds = $(tr).find('td');
          if (tds.length > 0) {
            const buoi = $(tds[0]).text().trim();

            // Duyệt từng cột ngày trong tuần
            for (let colIdx = 1; colIdx < tds.length; colIdx++) {
              const cellHtml = $(tds[colIdx]).html() || '';
              if (!cellHtml.includes('HP:')) continue; // Ô không có môn thì bỏ qua

              // Chia nội dung ô theo thẻ <br>
              const lines = cellHtml.split(/<br\s*\/?>/i);
              let currentLesson = { ten_hp: '', tiet: '', phong: '', giang_vien: '' };

              lines.forEach(rawLine => {
                const line = cheerio.load(rawLine).text().trim();
                if (!line) return;

                if (line.startsWith('HP:')) {
                  // Nếu đã có môn trước đó đang lưu, đẩy vào mảng trước khi gán môn mới
                  if (currentLesson.ten_hp) {
                    pushRow(headers, colIdx, buoi, currentLesson, parsedRows);
                    currentLesson = { ten_hp: '', tiet: '', phong: '', giang_vien: '' };
                  }
                  // Bóc tách tên học phần và tiết học trong ngoặc (VD: HP: LS Đảng CS VN (1-4))
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

              // Đẩy nốt môn học cuối cùng trong ô vào danh sách
              if (currentLesson.ten_hp) {
                pushRow(headers, colIdx, buoi, currentLesson, parsedRows);
              }
            }
          }
        });
      }
    }

    return res.json({
      success: true,
      mssv: mssv,
      weekRange: targetWeekRangeText || "Lịch học tuần hiện tại",
      tables: [{ tableIndex: 1, rows: parsedRows }]
    });

  } catch (error) {
    console.warn('Lỗi cào lịch học:', error.message);
  }

  // Dữ liệu dự phòng nếu cào lỗi
  res.json({
    success: true,
    mssv: mssv,
    weekRange: "Từ ngày 28/09/2026 đến ngày 04/10/2026",
    tables: [{
      tableIndex: 1,
      rows: [
        ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"],
        ["Thứ 3 29/09", "LS Đảng CS VN", "1-4", "2.21 (CLC)", "Đoàn Văn Kỳ"]
      ]
    }]
  });
};

// Hàm hỗ trợ chuẩn hóa dòng dữ liệu đẩy vào mảng
function pushRow(headers, colIdx, buoi, currentLesson, parsedRows) {
  const dayStr = headers[colIdx - 1] || 'Thứ 2';
  let dayName = 'Thứ 2';
  
  if (dayStr.toUpperCase().includes('CN') || dayStr.toLowerCase().includes('chủ nhật')) {
    dayName = 'CN';
  } else {
    const parts = dayStr.split(' ');
    dayName = parts.join(' '); // Giữ nguyên đầy đủ dạng "Thứ 3 29/09"
  }

  parsedRows.push([
    dayName.trim(),                          // Cột 0: Ngày (Ví dụ: "Thứ 3 29/09")
    currentLesson.ten_hp,                    // Cột 1: Tên môn học
    currentLesson.tiet || (buoi === 'Sáng' ? '1-4' : '7-10'), // Cột 2: Tiết
    currentLesson.phong || 'Chưa xếp',       // Cột 3: Phòng
    currentLesson.giang_vien || 'Giảng viên' // Cột 4: Giảng viên
  ]);
}

// Get Enrolled Courses
exports.getCourses = async (req, res) => {
  const mssv = req.params.mssv || req.query.mssv || await getMssvFromReq(req);
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT ma_hp, ten_hp, so_tin_chi, hoc_ky FROM student_grades WHERE mssv = ?',
      [mssv]
    );
    res.json({ success: true, mssv: mssv, courses: rows });
  } catch (e) {
    res.json({ success: true, mssv: mssv, courses: [] });
  }
};

// Get Current Courses
exports.getCurrentCourses = async (req, res) => {
  const mssv = req.params.mssv || req.query.mssv || await getMssvFromReq(req);
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT ma_hp, ten_hp, thu, tiet, phong, giang_vien FROM student_schedules WHERE mssv = ?',
      [mssv]
    );
    res.json({ success: true, mssv: mssv, currentCourses: rows });
  } catch (e) {
    res.json({ success: true, mssv: mssv, currentCourses: [] });
  }
};