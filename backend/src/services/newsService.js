const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const db = require('../config/db');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const RSS_ANNOUNCEMENTS_URL = 'https://www.ttn.edu.vn/index.php/svthongbao?format=feed&type=rss';
const RSS_NEWS_URL = 'https://www.ttn.edu.vn/index.php/mthongbao/tintuc?format=feed&type=rss';

function formatRssDate(dateStr) {
  if (!dateStr) return 'Mới cập nhật';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // ignore
  }
  return dateStr;
}

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[“"”'’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(url) {
  if (!url) return '';
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .trim();
}

function deduplicateArticles(items) {
  const seenTitles = new Set();
  const seenUrls = new Set();
  const uniqueItems = [];

  for (const item of items) {
    if (!item) continue;
    const normTitle = normalizeTitle(item.title);
    const normUrl = normalizeUrl(item.link);

    if (normTitle && seenTitles.has(normTitle)) continue;
    if (normUrl && seenUrls.has(normUrl)) continue;

    if (normTitle) seenTitles.add(normTitle);
    if (normUrl) seenUrls.add(normUrl);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

// ─── 1. FETCH LIVE ANNOUNCEMENTS FROM RSS ─────────────────────────────────────
async function fetchAnnouncementsFromRss() {
  const items = [];
  try {
    const res = await axios.get(RSS_ANNOUNCEMENTS_URL, {
      httpsAgent,
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(res.data, { xmlMode: true });

    $('item').each((idx, el) => {
      const title = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const pubDate = $(el).find('pubDate').text().trim();
      const authorRaw = $(el).find('author').text().trim();
      const category = $(el).find('category').text().trim() || 'Thông báo sinh viên';
      const descHtml = $(el).find('description').text().trim();

      let authorName = '';
      const authorMatch = authorRaw.match(/\(([^)]+)\)/);
      if (authorMatch) {
        authorName = authorMatch[1].trim();
      }

      const $desc = cheerio.load(descHtml);
      const attachments = [];
      $desc('a').each((i, aEl) => {
        const href = $desc(aEl).attr('href');
        let text = $desc(aEl).text().trim() || 'Tài liệu đính kèm';
        if (href) {
          let fullHref = href;
          if (fullHref.startsWith('/')) {
            fullHref = 'https://www.ttn.edu.vn' + fullHref;
          }
          if (text.toUpperCase() === 'TẠI ĐÂY') {
            text = fullHref.toLowerCase().includes('.pdf')
              ? `Văn bản PDF đính kèm (${i + 1})`
              : `Liên kết chi tiết (${i + 1})`;
          }
          attachments.push({
            title: text,
            url: fullHref,
            isPdf: /\.pdf$/i.test(fullHref)
          });
        }
      });

      $desc('br').replaceWith('\n');
      $desc('p').each((i, pEl) => {
        $desc(pEl).append('\n\n');
      });
      $desc('div').each((i, dEl) => {
        $desc(dEl).append('\n');
      });

      let cleanContent = $desc.text()
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n +/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const firstParagraph = cleanContent.split('\n\n')[0] || cleanContent;
      const cleanSummary = firstParagraph.length > 200
        ? firstParagraph.slice(0, 197) + '...'
        : firstParagraph;

      if (title) {
        items.push({
          id: `ann-${idx + 1}`,
          guid: link || `ann-${title.slice(0, 50)}`,
          type: 'announcement',
          source: 'Website TTN.edu.vn',
          sourceName: 'Cổng Thông báo sinh viên TTN',
          badge: 'Thông báo SV',
          badgeColor: '#0F172A',
          title: title,
          summary: cleanSummary || title,
          content: cleanContent || title,
          date: formatRssDate(pubDate),
          rawDate: pubDate,
          link: link || 'https://www.ttn.edu.vn/index.php/svthongbao',
          sender: authorName || 'Phòng Công tác Sinh viên',
          author: authorName || 'Phòng Công tác Sinh viên',
          category: category,
          attachments: attachments
        });
      }
    });
  } catch (error) {
    console.warn('Lỗi lấy RSS Thông báo:', error.message);
  }

  return deduplicateArticles(items);
}

// ─── 2. FETCH LIVE NEWS FROM RSS ─────────────────────────────────────────────
async function fetchNewsFromRss() {
  const items = [];
  try {
    const res = await axios.get(RSS_NEWS_URL, {
      httpsAgent,
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(res.data, { xmlMode: true });

    $('item').each((idx, el) => {
      const title = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const pubDate = $(el).find('pubDate').text().trim();
      const authorRaw = $(el).find('author').text().trim();
      const category = $(el).find('category').text().trim() || 'Tin tức';
      const descHtml = $(el).find('description').text().trim();

      let authorName = '';
      const authorMatch = authorRaw.match(/\(([^)]+)\)/);
      if (authorMatch) {
        authorName = authorMatch[1].trim();
      }

      const $desc = cheerio.load(descHtml);
      let img = $desc('img').attr('src') || '';
      if (img && !img.startsWith('http')) {
        img = `https://www.ttn.edu.vn${img}`;
      }
      $desc('img').remove();

      const attachments = [];
      $desc('a').each((i, aEl) => {
        const href = $desc(aEl).attr('href');
        let text = $desc(aEl).text().trim() || 'Liên kết chi tiết';
        if (href) {
          let fullHref = href;
          if (fullHref.startsWith('/')) {
            fullHref = 'https://www.ttn.edu.vn' + fullHref;
          }
          attachments.push({
            title: text,
            url: fullHref,
            isPdf: /\.pdf$/i.test(fullHref)
          });
        }
      });

      $desc('br').replaceWith('\n');
      $desc('p').each((i, pEl) => {
        $desc(pEl).append('\n\n');
      });
      $desc('div').each((i, dEl) => {
        $desc(dEl).append('\n');
      });

      let cleanContent = $desc.text()
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n +/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const firstParagraph = cleanContent.split('\n\n')[0] || cleanContent;
      const cleanSummary = firstParagraph.length > 200
        ? firstParagraph.slice(0, 197) + '...'
        : firstParagraph;

      if (title) {
        items.push({
          id: `news-${idx + 1}`,
          guid: link || `news-${title.slice(0, 50)}`,
          type: 'news',
          source: 'Website TTN.edu.vn',
          sourceName: 'Cổng Tin tức TTN.edu.vn',
          badge: 'Tin hoạt động',
          badgeColor: '#2563EB',
          title: title,
          summary: cleanSummary || title,
          content: cleanContent || title,
          date: formatRssDate(pubDate),
          rawDate: pubDate,
          imageUrl: img || undefined,
          link: link || 'https://www.ttn.edu.vn/index.php/mthongbao/tintuc',
          sender: authorName || 'Ban Biên tập TTN',
          author: authorName || 'Ban Biên tập TTN',
          category: category,
          attachments: attachments
        });
      }
    });
  } catch (error) {
    console.warn('Lỗi lấy RSS Tin tức:', error.message);
  }

  return deduplicateArticles(items);
}

// ─── 3. LƯU BỘ ĐỆM VÀO MYSQL (news_cache) ───────────────────────────────────
async function saveItemsToDb(items) {
  if (!items || items.length === 0) return 0;
  let savedCount = 0;

  for (const item of items) {
    if (!item || !item.title) continue;
    const guid = item.guid || item.link || item.title;
    const type = item.type || 'news';
    const attachmentsJson = JSON.stringify(item.attachments || []);

    try {
      await db.query(
        `INSERT INTO news_cache 
         (guid, type, title, summary, content, link, pub_date, raw_date, author, category, image_url, badge, badge_color, source_name, attachments) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           title = VALUES(title),
           summary = VALUES(summary),
           content = VALUES(content),
           pub_date = VALUES(pub_date),
           raw_date = VALUES(raw_date),
           author = VALUES(author),
           category = VALUES(category),
           image_url = VALUES(image_url),
           badge = VALUES(badge),
           badge_color = VALUES(badge_color),
           source_name = VALUES(source_name),
           attachments = VALUES(attachments),
           updated_at = NOW()`,
        [
          guid,
          type,
          item.title,
          item.summary || item.title,
          item.content || item.title,
          item.link || '',
          item.date || '',
          item.rawDate || '',
          item.author || item.sender || '',
          item.category || '',
          item.imageUrl || null,
          item.badge || (type === 'announcement' ? 'Thông báo SV' : 'Tin hoạt động'),
          item.badgeColor || (type === 'announcement' ? '#0F172A' : '#2563EB'),
          item.sourceName || 'Cổng thông tin TTN',
          attachmentsJson
        ]
      );
      savedCount++;
    } catch (err) {
      console.warn(`Lỗi lưu tin "${item.title.slice(0, 30)}":`, err.message);
    }
  }

  return savedCount;
}

// ─── 4. LẤY TỪ MYSQL (news_cache) KHI OFFLINE HOẶC RSS KHÔNG PHẢN HỒI ────────
async function getItemsFromDb(type, limit) {
  try {
    let sql = 'SELECT * FROM news_cache';
    const params = [];

    if (type && type !== 'all') {
      sql += ' WHERE type = ?';
      params.push(type);
    }

    sql += ' ORDER BY id DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const [rows] = await db.query(sql, params);
    if (!rows || rows.length === 0) return [];

    return rows.map((r) => {
      let attachments = [];
      if (r.attachments) {
        try {
          attachments = typeof r.attachments === 'string' ? JSON.parse(r.attachments) : r.attachments;
        } catch (e) {
          attachments = [];
        }
      }

      return {
        id: `${r.type}-${r.id}`,
        guid: r.guid,
        type: r.type,
        source: 'Website TTN.edu.vn (Bản lưu DB)',
        sourceName: r.source_name || 'Cổng thông tin TTN',
        badge: r.badge || (r.type === 'announcement' ? 'Thông báo SV' : 'Tin hoạt động'),
        badgeColor: r.badge_color || (r.type === 'announcement' ? '#0F172A' : '#2563EB'),
        title: r.title,
        summary: r.summary || r.title,
        content: r.content || r.title,
        date: r.pub_date,
        rawDate: r.raw_date,
        imageUrl: r.image_url || undefined,
        link: r.link || 'https://www.ttn.edu.vn',
        sender: r.author || 'Đại học Tây Nguyên',
        author: r.author || 'Đại học Tây Nguyên',
        category: r.category || '',
        attachments: attachments,
        isDbCached: true
      };
    });
  } catch (err) {
    console.warn('Lỗi đọc news_cache từ MySQL:', err.message);
    return [];
  }
}

// ─── 5. MẪU DỰ PHÒNG CUỐI CÙNG ──────────────────────────────────────────────
const FALLBACK_ANNOUNCEMENTS = [
  {
    id: 'sample-ann-1',
    type: 'announcement',
    isFallback: true,
    source: 'Hệ thống ngoại tuyến',
    sourceName: 'Dữ liệu mẫu dự phòng',
    badge: 'Dữ liệu mẫu',
    badgeColor: '#D97706',
    title: '[Dữ liệu mẫu] Thông báo nộp học phí học kỳ mới',
    summary: '[LƯU Ý: Đây là bài viết mẫu dự phòng khi thiết bị mất kết nối hoặc máy chủ TTN không phản hồi]. Hướng dẫn chi thủ tục nộp học phí qua cổng ngân hàng hoặc ví điện tử đối với sinh viên toàn trường.',
    date: '02/10/2026',
    link: 'https://www.ttn.edu.vn/index.php/mthongbao/thongbaosv',
    sender: 'Phòng Kế hoạch - Tài chính'
  },
  {
    id: 'sample-ann-2',
    type: 'announcement',
    isFallback: true,
    source: 'Hệ thống ngoại tuyến',
    sourceName: 'Dữ liệu mẫu dự phòng',
    badge: 'Dữ liệu mẫu',
    badgeColor: '#D97706',
    title: '[Dữ liệu mẫu] Rà soát bổ sung hồ sơ miễn giảm học phí cho SV chính sách',
    summary: '[LƯU Ý: Đây là bài viết mẫu dự phòng khi thiết bị mất kết nối hoặc máy chủ TTN không phản hồi]. Sinh viên thuộc diện chính sách nộp hồ sơ theo quy định tại Phòng Công tác Sinh viên.',
    date: '28/09/2026',
    link: 'https://www.ttn.edu.vn/index.php/mthongbao/thongbaosv',
    sender: 'Phòng Công tác Sinh viên'
  },
  {
    id: 'sample-ann-3',
    type: 'announcement',
    isFallback: true,
    source: 'Hệ thống ngoại tuyến',
    sourceName: 'Dữ liệu mẫu dự phòng',
    badge: 'Dữ liệu mẫu',
    badgeColor: '#D97706',
    title: '[Dữ liệu mẫu] Kích hoạt và cấp tài khoản số trường ĐH Tây Nguyên',
    summary: '[LƯU Ý: Đây là bài viết mẫu dự phòng khi thiết bị mất kết nối hoặc máy chủ TTN không phản hồi]. Hướng dẫn tân sinh viên đăng nhập hệ thống cổng thông tin đào tạo và email sinh viên.',
    date: '25/09/2026',
    link: 'https://www.ttn.edu.vn/index.php/mthongbao/thongbaosv',
    sender: 'Trung tâm CNTT'
  }
];

const FALLBACK_NEWS = [
  {
    id: 'sample-news-1',
    type: 'news',
    isFallback: true,
    source: 'Hệ thống ngoại tuyến',
    sourceName: 'Dữ liệu mẫu dự phòng',
    badge: 'Dữ liệu mẫu',
    badgeColor: '#D97706',
    title: '[Dữ liệu mẫu] Tập huấn Đổi mới sáng tạo và chuyển đổi số sinh viên',
    summary: '[LƯU Ý: Đây là bài viết mẫu dự phòng khi thiết bị mất kết nối hoặc máy chủ TTN không phản hồi]. Chương trình bồi dưỡng kỹ năng ứng dụng công nghệ và tư duy khởi nghiệp cho sinh viên.',
    date: '01/10/2026',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    link: 'https://www.ttn.edu.vn/index.php/mthongbao/tintuc',
    sender: 'Ban Biên tập TTN'
  },
  {
    id: 'sample-news-2',
    type: 'news',
    isFallback: true,
    source: 'Hệ thống ngoại tuyến',
    sourceName: 'Dữ liệu mẫu dự phòng',
    badge: 'Dữ liệu mẫu',
    badgeColor: '#D97706',
    title: '[Dữ liệu mẫu] Hội thảo nâng cao chất lượng đào tạo và nghiên cứu khoa học',
    summary: '[LƯU Ý: Đây là bài viết mẫu dự phòng khi thiết bị mất kết nối hoặc máy chủ TTN không phản hồi]. Tổng kết các giải pháp nâng cao hiệu quả giảng dạy và thực hành trong năm học mới.',
    date: '01/10/2026',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
    link: 'https://www.ttn.edu.vn/index.php/mthongbao/tintuc',
    sender: 'Ban Biên tập TTN'
  },
  {
    id: 'sample-news-3',
    type: 'news',
    isFallback: true,
    source: 'Hệ thống ngoại tuyến',
    sourceName: 'Dữ liệu mẫu dự phòng',
    badge: 'Dữ liệu mẫu',
    badgeColor: '#D97706',
    title: '[Dữ liệu mẫu] Đảng ủy Trường ĐH Tây Nguyên triển khai ứng dụng công nghệ số',
    summary: '[LƯU Ý: Đây là bài viết mẫu dự phòng khi thiết bị mất kết nối hoặc máy chủ TTN không phản hồi]. Đẩy mạnh chuyển đổi số trong công tác điều hành và quản lý giáo dục.',
    date: '30/09/2026',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
    link: 'https://www.ttn.edu.vn/index.php/mthongbao/tintuc',
    sender: 'Ban Biên tập TTN'
  }
];

// ─── 6. HÀM CHÍNH: LẤY DỮ LIỆU SIÊU TỐC (DB & IN-MEMORY CACHE TRƯỚC TIÊN) ──────
let announcementsMemCache = null;
let announcementsCacheTime = 0;
let newsMemCache = null;
let newsCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút lưu RAM

async function getAnnouncementsWithFallback(forceRefresh = false) {
  const now = Date.now();
  // 1. Kiểm tra RAM cache (0.1ms)
  if (!forceRefresh && announcementsMemCache && (now - announcementsCacheTime < CACHE_TTL_MS)) {
    return announcementsMemCache;
  }

  // 2. Đọc trực tiếp từ MySQL news_cache (1-2ms)
  if (!forceRefresh) {
    const cached = await getItemsFromDb('announcement', 20);
    if (cached && cached.length > 0) {
      announcementsMemCache = cached;
      announcementsCacheTime = now;
      return cached;
    }
  }

  // 3. Chỉ cào Live RSS khi DB trống hoặc khi có yêu cầu reload (forceRefresh = true)
  const live = await fetchAnnouncementsFromRss();
  if (live.length > 0) {
    saveItemsToDb(live).catch(() => {});
    announcementsMemCache = live;
    announcementsCacheTime = now;
    return live;
  }

  const cachedFallback = await getItemsFromDb('announcement', 20);
  if (cachedFallback.length > 0) {
    announcementsMemCache = cachedFallback;
    announcementsCacheTime = now;
    return cachedFallback;
  }

  return FALLBACK_ANNOUNCEMENTS;
}

async function getNewsWithFallback(forceRefresh = false) {
  const now = Date.now();
  // 1. Kiểm tra RAM cache (0.1ms)
  if (!forceRefresh && newsMemCache && (now - newsCacheTime < CACHE_TTL_MS)) {
    return newsMemCache;
  }

  // 2. Đọc trực tiếp từ MySQL news_cache (1-2ms)
  if (!forceRefresh) {
    const cached = await getItemsFromDb('news', 20);
    if (cached && cached.length > 0) {
      newsMemCache = cached;
      newsCacheTime = now;
      return cached;
    }
  }

  // 3. Chỉ cào Live RSS khi DB trống hoặc khi có yêu cầu reload (forceRefresh = true)
  const live = await fetchNewsFromRss();
  if (live.length > 0) {
    saveItemsToDb(live).catch(() => {});
    newsMemCache = live;
    newsCacheTime = now;
    return live;
  }

  const cachedFallback = await getItemsFromDb('news', 20);
  if (cachedFallback.length > 0) {
    newsMemCache = cachedFallback;
    newsCacheTime = now;
    return cachedFallback;
  }

  return FALLBACK_NEWS;
}

module.exports = {
  fetchAnnouncementsFromRss,
  fetchNewsFromRss,
  saveItemsToDb,
  getItemsFromDb,
  getAnnouncementsWithFallback,
  getNewsWithFallback,
  deduplicateArticles,
  formatRssDate
};
