const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const db = require('../config/db');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

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

const cleanName = (name) => {
  if (!name) return name;
  return name
    .replace(/[\(\[\-]?\s*(trạng thái|đang học).*?[\)\]]?/gi, '')
    .replace(/^[:\-\s]+|[:\-\s]+$/g, '')
    .replace(/\s*\)+$/, '')
    .replace(/\s*\({2,}/g, '(')
    .trim();
};

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

function pushScheduleRow(headers, colIdx, buoi, currentLesson, parsedRows) {
  const dayStr = headers[colIdx - 1] || 'Thứ 2';
  let dayName = 'Thứ 2';

  if (dayStr.toUpperCase().includes('CN') || dayStr.toLowerCase().includes('chủ nhật')) {
    dayName = 'CN';
  } else {
    const parts = dayStr.split(' ');
    dayName = parts.join(' ');
  }

  parsedRows.push([
    dayName.trim(),
    currentLesson.ten_hp,
    currentLesson.tiet || (buoi === 'Sáng' ? '1-4' : '7-10'),
    currentLesson.phong || 'Chưa xếp',
    currentLesson.giang_vien || 'Giảng viên'
  ]);
}

/**
 * 1. Cào và lưu bảng điểm cho 1 MSSV vào DB (student_grades)
 */
async function syncGradesForStudent(mssv, dk = '10') {
  if (!mssv || mssv === 'guest' || mssv.includes('@') || mssv.length < 4) {
    return { success: false, message: 'MSSV không hợp lệ' };
  }

  try {
    const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': dk });
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
    if (extractedName) {
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
      if (rows.length > 0) tablesData.push({ tableIndex: index, rows });
    });

    const liveSubjects = [];
    for (const table of tablesData) {
      const rows = table.rows || [];
      if (rows.length < 2) continue;
      const header = rows[0] || [];

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

    if (liveSubjects.length > 0) {
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
      return { success: true, count: liveSubjects.length, studentName: extractedName };
    }

    return { success: false, message: 'Không có dữ liệu điểm trả về từ web trường' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 2. Cào và lưu thời khóa biểu cho 1 MSSV vào DB (student_schedules)
 */
async function syncScheduleForStudent(mssv, dk = '10') {
  if (!mssv || mssv === 'guest' || mssv.includes('@') || mssv.length < 4) {
    return { success: false, message: 'MSSV không hợp lệ' };
  }

  try {
    const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': dk });
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

    if (!targetWeekP) {
      const firstP = $('p').filter((i, el) => $(el).text().trim().startsWith('Từ ngày')).first();
      if (firstP.length > 0) {
        targetWeekP = firstP;
        targetWeekRangeText = firstP.text().trim();
      }
    }

    const parsedRows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];

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
                    pushScheduleRow(headers, colIdx, buoi, currentLesson, parsedRows);
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
                pushScheduleRow(headers, colIdx, buoi, currentLesson, parsedRows);
              }
            }
          }
        });
      }
    }

    if (parsedRows.length > 1) {
      await db.query('DELETE FROM student_schedules WHERE mssv = ? AND (is_custom = 0 OR is_custom IS NULL)', [mssv]);
      for (let i = 1; i < parsedRows.length; i++) {
        const r = parsedRows[i];
        await db.query(
          'INSERT INTO student_schedules (mssv, ma_hp, ten_hp, thu, tiet, phong, giang_vien, hoc_ky) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [mssv, `HP-${i}`, r[1], r[0], r[2], r[3], r[4], 'HK1 (2025-2026)']
        );
      }
      return { success: true, count: parsedRows.length - 1, weekRange: targetWeekRangeText };
    }

    return { success: false, message: 'Không có dòng thời khóa biểu trả về từ web trường' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 3. Đồng bộ toàn bộ sinh viên có tài khoản thực trong cơ sở dữ liệu
 */
async function syncAllActiveStudents() {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT mssv FROM users 
       WHERE role = 'sinh_vien' 
         AND mssv IS NOT NULL 
         AND mssv != 'guest' 
         AND mssv NOT LIKE '%@%' 
         AND LENGTH(mssv) >= 4`
    );

    if (!rows || rows.length === 0) {
      return { total: 0, syncedGrades: 0, syncedSchedules: 0 };
    }

    let syncedGrades = 0;
    let syncedSchedules = 0;

    for (const r of rows) {
      const mssv = r.mssv;
      const gradeRes = await syncGradesForStudent(mssv);
      if (gradeRes.success) syncedGrades++;

      const scheduleRes = await syncScheduleForStudent(mssv);
      if (scheduleRes.success) syncedSchedules++;
    }

    return {
      total: rows.length,
      syncedGrades,
      syncedSchedules
    };
  } catch (err) {
    console.error('Lỗi syncAllActiveStudents:', err.message);
    return { total: 0, error: err.message };
  }
}

module.exports = {
  syncGradesForStudent,
  syncScheduleForStudent,
  syncAllActiveStudents
};
