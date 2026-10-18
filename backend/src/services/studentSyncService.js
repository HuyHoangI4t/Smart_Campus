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

// ============================================================================
// HỆ THỐNG ĐIỀU TIẾT TẢI (RATE LIMITING) & HÀNG ĐỢI REQUEST CỔNG TRƯỜNG TTN
// ============================================================================
const MAX_CONCURRENT_TTN = 3; // Tối đa 3 request đồng thời tới web trường
let activeTtnRequests = 0;
const ttnRequestQueue = [];

function enqueueTtnRequest(taskFn) {
  return new Promise((resolve, reject) => {
    ttnRequestQueue.push({ taskFn, resolve, reject });
    processTtnQueue();
  });
}

function processTtnQueue() {
  if (activeTtnRequests >= MAX_CONCURRENT_TTN || ttnRequestQueue.length === 0) {
    return;
  }
  const { taskFn, resolve, reject } = ttnRequestQueue.shift();
  activeTtnRequests++;

  Promise.resolve()
    .then(taskFn)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeTtnRequests--;
      setTimeout(processTtnQueue, 200); // Cách nhau tối thiểu 200ms bảo vệ cổng trường
    });
}

// Bảng theo dõi chống cào trùng lặp cùng thời điểm cho cùng 1 MSSV
const inFlightGradeSyncs = new Map();
const inFlightScheduleSyncs = new Map();

// Cấu hình thời gian sống của Cache (Time-To-Live - TTL)
const TTL_GRADES_MS = 12 * 60 * 60 * 1000;   // 12 giờ cho Điểm thi
const TTL_SCHEDULE_MS = 24 * 60 * 60 * 1000; // 24 giờ cho Thời khóa biểu

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
 * 1. Cào và lưu bảng điểm cho 1 MSSV vào DB (student_grades) - Có điều tiết tải & chống trùng lặp
 */
async function syncGradesForStudent(mssv, dk = '10') {
  if (!mssv || mssv === 'guest' || mssv.includes('@') || mssv.length < 4) {
    return { success: false, message: 'MSSV không hợp lệ' };
  }

  // Chống cào lặp đồng thời cho cùng 1 MSSV
  if (inFlightGradeSyncs.has(mssv)) {
    return inFlightGradeSyncs.get(mssv);
  }

  const syncPromise = (async () => {
    try {
      const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': dk });
      const response = await enqueueTtnRequest(() =>
        axios.post(TTN_CONFIG.GRADES_URL, payload.toString(), {
          httpsAgent,
          headers: {
            ...TTN_CONFIG.COMMON_HEADERS,
            'Referer': TTN_CONFIG.GRADES_REFERER,
            'Accept': '*/*'
          },
          timeout: 4000
        })
      );

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
      const bulkValues = liveSubjects.map((s) => [
        mssv, s.ten_hp, s.nam_hoc, s.ky, s.diem_dbp,
        s.diem_thi1, s.diem_thi2, s.diem_1, s.diem_2,
        s.diem_chu, s.so_tin_chi, s.hoc_phi, s.hoc_ky
      ]);
      await db.query(
        `INSERT INTO student_grades 
         (mssv, ten_hp, nam_hoc, ky, diem_dbp, diem_thi1, diem_thi2, diem_1, diem_2, diem_chu, so_tin_chi, hoc_phi, hoc_ky) 
         VALUES ?`,
        [bulkValues]
      );
      return { success: true, count: liveSubjects.length, studentName: extractedName };
    }

    return { success: false, message: 'Không có dữ liệu điểm trả về từ web trường' };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      inFlightGradeSyncs.delete(mssv);
    }
  })();

  inFlightGradeSyncs.set(mssv, syncPromise);
  return syncPromise;
}

/**
 * 2. Cào và lưu thời khóa biểu cho 1 MSSV vào DB (student_schedules) - Có điều tiết tải & chống trùng lặp
 */
async function syncScheduleForStudent(mssv, dk = '10') {
  if (!mssv || mssv === 'guest' || mssv.includes('@') || mssv.length < 4) {
    return { success: false, message: 'MSSV không hợp lệ' };
  }

  // Chống cào lặp đồng thời cho cùng 1 MSSV
  if (inFlightScheduleSyncs.has(mssv)) {
    return inFlightScheduleSyncs.get(mssv);
  }

  const syncPromise = (async () => {
    try {
      const payload = new URLSearchParams({ 'msv': mssv, 'mssv': mssv, 'dk': dk });
      const response = await enqueueTtnRequest(() =>
        axios.post(TTN_CONFIG.SCHEDULE_URL, payload.toString(), {
          httpsAgent,
          headers: {
            ...TTN_CONFIG.COMMON_HEADERS,
            'Referer': TTN_CONFIG.SCHEDULE_REFERER,
            'Accept': 'text/plain, */*; q=0.01'
          },
          timeout: 4000
        })
      );

      const $ = cheerio.load(response.data);
    const parsedWeeks = [];

    function parseTableRows(tableElem) {
      const rows = [["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên"]];
      if (!tableElem || tableElem.length === 0) return rows;
      const headers = [];
      tableElem.find('tr').first().find('th').slice(1).each((j, th) => {
        headers.push($(th).text().replace(/\s+/g, ' ').trim());
      });

      tableElem.find('tr').slice(1).each((rowIdx, tr) => {
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
                  pushScheduleRow(headers, colIdx, buoi, currentLesson, rows);
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
              pushScheduleRow(headers, colIdx, buoi, currentLesson, rows);
            }
          }
        }
      });
      return rows;
    }

    $('p').each((i, pElem) => {
      const pText = $(pElem).text().trim();
      if (pText.startsWith('Từ ngày')) {
        const table = $(pElem).next('table');
        const rows = parseTableRows(table);
        parsedWeeks.push({
          index: parsedWeeks.length,
          weekRangeText: pText,
          rows
        });
      }
    });

    if (parsedWeeks.length === 0) {
      const firstTable = $('table').first();
      if (firstTable.length > 0) {
        parsedWeeks.push({
          index: 0,
          weekRangeText: "Lịch học tuần hiện tại",
          rows: parseTableRows(firstTable)
        });
      }
    }

    let totalSaved = 0;
    if (parsedWeeks.length > 0) {
      await db.query('DELETE FROM student_schedules WHERE mssv = ? AND (is_custom = 0 OR is_custom IS NULL)', [mssv]);
      const bulkScheduleValues = [];
      for (const w of parsedWeeks) {
        if (w.rows && w.rows.length > 1) {
          for (let i = 1; i < w.rows.length; i++) {
            const r = w.rows[i];
            bulkScheduleValues.push([
              mssv,
              `HP-${w.index}-${i}`,
              r[1],
              r[0],
              r[2],
              r[3],
              r[4],
              'HK1 (2025-2026)',
              0,
              '',
              'chinh_khoa',
              w.weekRangeText
            ]);
          }
        }
      }
      if (bulkScheduleValues.length > 0) {
        await db.query(
          'INSERT INTO student_schedules (mssv, ma_hp, ten_hp, thu, tiet, phong, giang_vien, hoc_ky, is_custom, ghi_chu, loai_lich, week_range) VALUES ?',
          [bulkScheduleValues]
        );
        totalSaved = bulkScheduleValues.length;
      }
      return { success: true, count: totalSaved, totalWeeks: parsedWeeks.length };
    }

    return { success: false, message: 'Không có dòng thời khóa biểu trả về từ web trường' };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      inFlightScheduleSyncs.delete(mssv);
    }
  })();

  inFlightScheduleSyncs.set(mssv, syncPromise);
  return syncPromise;
}

/**
 * 3. Dọn dẹp thời khóa biểu cũ (Data Pruning) để cơ sở dữ liệu luôn gọn nhẹ
 * Loại bỏ các lịch học chính khóa quá 45 ngày (giữ lại lịch học tự tạo is_custom = 1)
 */
async function pruneStaleSchedules(daysThreshold = 45) {
  try {
    const [res] = await db.query(
      `DELETE FROM student_schedules 
       WHERE (is_custom = 0 OR is_custom IS NULL) 
         AND created_at < NOW() - INTERVAL ? DAY`,
      [daysThreshold]
    );
    if (res.affectedRows > 0) {
      console.log(`🧹 [Data Pruning] Đã dọn dẹp ${res.affectedRows} bản ghi thời khóa biểu cũ (> ${daysThreshold} ngày).`);
    }
    return res.affectedRows || 0;
  } catch (err) {
    console.warn('Lỗi khi dọn dẹp student_schedules cũ:', err.message);
    return 0;
  }
}

/**
 * 4. Đồng bộ thông minh: Chỉ đồng bộ sinh viên đang hoạt động mà Cache đã hết hạn
 * Giới hạn theo lô (Batching, mặc định 30 SV/lần) và có độ trễ nghỉ (Pacing) để bảo vệ cổng trường
 */
async function syncAllActiveStudents(maxBatchSize = 30) {
  try {
    // 1. Dọn dẹp lịch cũ trước
    await pruneStaleSchedules(45);

    // 2. Lấy danh sách sinh viên có hoạt động gần đây mà cache đã quá hạn TTL (12h đối với điểm, 24h đối với TKB)
    const [rows] = await db.query(
      `SELECT DISTINCT u.mssv,
              MAX(sg.created_at) AS last_grade_sync,
              MAX(ss.created_at) AS last_sched_sync
       FROM users u
       LEFT JOIN student_grades sg ON u.mssv = sg.mssv
       LEFT JOIN student_schedules ss ON u.mssv = ss.mssv AND (ss.is_custom = 0 OR ss.is_custom IS NULL)
       WHERE u.role = 'sinh_vien' 
         AND u.mssv IS NOT NULL 
         AND u.mssv != 'guest' 
         AND u.mssv NOT LIKE '%@%' 
         AND LENGTH(u.mssv) >= 4
       GROUP BY u.mssv
       ORDER BY (last_grade_sync IS NULL) DESC, last_grade_sync ASC
       LIMIT ?`,
      [maxBatchSize]
    );

    if (!rows || rows.length === 0) {
      return { total: 0, syncedGrades: 0, syncedSchedules: 0 };
    }

    let syncedGrades = 0;
    let syncedSchedules = 0;
    const now = Date.now();

    for (const r of rows) {
      const mssv = r.mssv;
      const gradeAge = r.last_grade_sync ? (now - new Date(r.last_grade_sync).getTime()) : Infinity;
      const schedAge = r.last_sched_sync ? (now - new Date(r.last_sched_sync).getTime()) : Infinity;

      // Chỉ cào nếu cache điểm đã quá hạn 12 giờ
      if (gradeAge >= TTL_GRADES_MS) {
        const gradeRes = await syncGradesForStudent(mssv);
        if (gradeRes.success) syncedGrades++;
        await new Promise(resolve => setTimeout(resolve, 350)); // Nghỉ 350ms giữa các request
      }

      // Chỉ cào nếu cache TKB đã quá hạn 24 giờ
      if (schedAge >= TTL_SCHEDULE_MS) {
        const scheduleRes = await syncScheduleForStudent(mssv);
        if (scheduleRes.success) syncedSchedules++;
        await new Promise(resolve => setTimeout(resolve, 350));
      }
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
  syncAllActiveStudents,
  pruneStaleSchedules,
  TTL_GRADES_MS,
  TTL_SCHEDULE_MS
};
