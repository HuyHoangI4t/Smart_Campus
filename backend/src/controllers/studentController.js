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

  try {
    const [rows] = await db.query('SELECT mssv FROM users ORDER BY created_at DESC LIMIT 1');
    if (rows.length > 0) {
      return rows[0].mssv;
    }
  } catch (e) {
    // ignore
  }

  return '23103023';
};

// Hàm làm sạch tên
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
    const cleaned = match[1].trim().replace(/<\/?b>/gi, '').replace(/[-–—]\s*$/, '').trim();
    if (cleaned.length > 2) fullName = cleaned;
  }

  if (!fullName) {
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      if ((text.includes('Họ và tên') || text.includes('Họ tên')) && text.length < 100) {
        const parts = text.split(/:|-/);
        if (parts.length > 1) {
          const possibleName = parts[parts.length - 1].trim().replace(/<\/?b>/gi, '');
          if (possibleName.length > 2) fullName = possibleName;
        }
      }
    });
  }
  return cleanName(fullName);
};

const calculateGpaFromAllTables = (tablesData) => {
  let totalCredits = 0;
  let weightedSum10 = 0;

  tablesData.forEach(tableObj => {
    const rows = tableObj.rows;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const d1Str = row[6];
      const d2Str = row[7];
      const tChiStr = row[9];

      const d1 = parseFloat(d1Str);
      const d2 = parseFloat(d2Str);
      const credits = parseFloat(tChiStr);

      if (!isNaN(credits) && credits > 0) {
        let finalScore10 = null;
        if (!isNaN(d2)) {
          finalScore10 = d2;
        } else if (!isNaN(d1)) {
          finalScore10 = d1;
        } else {
          continue; 
        }

        totalCredits += credits;
        weightedSum10 += finalScore10 * credits;
      }
    }
  });

  const cumulativeGpa10 = totalCredits > 0 ? (weightedSum10 / totalCredits).toFixed(2) : '0.00';
  const cumulativeGpa4 = totalCredits > 0 ? ((parseFloat(cumulativeGpa10) * 4) / 10).toFixed(2) : '0.00';

  return {
    totalCredits: totalCredits.toString(),
    cumulativeGpa10,
    cumulativeGpa4
  };
};

// Get Student Profile from Database
exports.getProfile = async (req, res) => {
  const mssv = req.params.mssv || await getMssvFromReq(req);

  try {
    const [rows] = await db.query('SELECT mssv, full_name, faculty, email, created_at FROM users WHERE mssv = ?', [mssv]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên với mã số này.' });
    }
    const profile = rows[0];
    if (profile.full_name) {
      const cleaned = cleanName(profile.full_name);
      if (cleaned !== profile.full_name) {
        profile.full_name = cleaned;
        await db.query('UPDATE users SET full_name = ? WHERE mssv = ?', [cleaned, mssv]);
      }
    }
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thông tin sinh viên', error: error.message });
  }
};

// Get Grades
exports.getGrades = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { dk, semester, search } = req.body;
  const studentDk = dk || '10';

  try {
    const url = "https://www.ttn.edu.vn/libraries/tnu/kqcq.php";
    const payload = new URLSearchParams({ 'msv': mssv, 'dk': studentDk });

    const response = await axios.post(url, payload.toString(), {
      httpsAgent, // Bỏ qua lỗi SSL
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.ttn.edu.vn/index.php?option=com_tnu&view=kqchinhquy',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const extractedFullName = extractFullNameFromHtml($);

    if (extractedFullName) {
      try {
        await db.query('UPDATE users SET full_name = ? WHERE mssv = ?', [extractedFullName, mssv]);
      } catch (dbErr) {
        console.error('Database update name error:', dbErr.message);
      }
    }

    let tablesData = [];
    $('table').each((index, table) => {
      if (index === 0) return;

      const rows = [];
      $(table).find('tr').each((i, row) => {
        const cols = [];
        $(row).find('td, th').each((j, col) => {
          cols.push($(col).text().trim());
        });
        if (cols.length > 0 && cols.some(c => c !== '')) {
          rows.push(cols);
        }
      });

      if (rows.length > 1) {
        tablesData.push({ tableIndex: index + 1, rows });
      }
    });

    if (tablesData.length === 0) {
      throw new Error('Không cào được dữ liệu bảng điểm từ cổng trường.');
    }

    const gpaSummary = calculateGpaFromAllTables(tablesData);

    if (semester !== undefined && semester !== null && semester !== '') {
      tablesData = tablesData.filter(t => t.tableIndex === Number(semester));
    }

    if (search && search.trim()) {
      const keyword = search.trim().toLowerCase();
      tablesData = tablesData.map(t => {
        const header = t.rows[0];
        const dataRows = t.rows.slice(1).filter(row => {
          const courseName = (row[2] || "").toLowerCase();
          return courseName.includes(keyword);
        });
        return { ...t, rows: [header, ...dataRows] };
      }).filter(t => t.rows.length > 1);
    }

    res.json({
      success: true,
      mssv: mssv,
      fullName: extractedFullName || ('Sinh viên ' + mssv),
      gpaSummary,
      tables: tablesData
    });
  } catch (error) {
    console.warn('External portal grades error:', error.message);
    res.status(500).json({ success: false, message: 'Không thể kết nối cổng thông tin trường', error: error.message });
  }
};

// Get Current In-Progress Courses 
exports.getCurrentCourses = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { dk } = req.body;
  const studentDk = dk || '10';

  try {
    const url = "https://www.ttn.edu.vn/libraries/tnu/kqcq.php";
    const payload = new URLSearchParams({ 'msv': mssv, 'dk': studentDk });

    const response = await axios.post(url, payload.toString(), {
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.ttn.edu.vn/index.php?option=com_tnu&view=kqchinhquy',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const currentCourses = [];

    $('table').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const cols = [];
        $(row).find('td, th').each((_, col) => {
          cols.push($(col).text().trim());
        });

        if (cols.length >= 6) {
          const hasX = cols.includes('X') || cols[cols.length - 1] === 'X' || cols[8] === 'X';
          if (hasX) {
            currentCourses.push({
              name: cols[2] || 'Học phần'
            });
          }
        }
      });
    });

    res.json({
      success: true,
      mssv: mssv,
      currentCourses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy học phần hiện tại', error: error.message });
  }
};

// Get Schedule (TKB)
exports.getSchedule = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { dk } = req.body;
  const studentDk = dk || '10';

  try {
    const url = "https://www.ttn.edu.vn/libraries/tnu/tkbieusinhvien.php";
    const payload = new URLSearchParams({ 'msv': mssv, 'dk': studentDk });

    const response = await axios.post(url, payload.toString(), {
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.ttn.edu.vn/',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
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

    res.json({
      success: true,
      mssv: mssv,
      tables: tablesData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thời khóa biểu', error: error.message });
  }
};

// Get Enrolled Courses
exports.getCourses = async (req, res) => {
  const mssv = req.params.mssv || await getMssvFromReq(req);
  res.json({
    success: true,
    mssv: mssv,
    courses: []
  });
};