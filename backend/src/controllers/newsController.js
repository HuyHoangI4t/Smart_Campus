const newsService = require('../services/newsService');

/**
 * GET /api/news
 * Lấy toàn bộ Thông báo & Tin tức từ cổng trường ĐH Tây Nguyên (kết hợp DB Cache & Live RSS)
 */
exports.getAllNewsAndAnnouncements = async (req, res) => {
  try {
    const { type, limit, reload, refresh } = req.query;
    const forceRefresh = reload === 'true' || refresh === 'true' || reload === '1' || refresh === '1';

    const [announcements, news] = await Promise.all([
      newsService.getAnnouncementsWithFallback(forceRefresh),
      newsService.getNewsWithFallback(forceRefresh)
    ]);

    let result = [];
    if (type === 'news') {
      result = news;
    } else if (type === 'announcement') {
      result = announcements;
    } else {
      result = newsService.deduplicateArticles([...news, ...announcements]);
    }

    const max = limit ? parseInt(limit, 10) : result.length;
    const isFallback = announcements.some(a => a.isFallback) || news.some(n => n.isFallback);
    const isDbCached = announcements.some(a => a.isDbCached) || news.some(n => n.isDbCached);

    let statusText = 'Live RSS (Dữ liệu thực từ website)';
    if (isDbCached) {
      statusText = 'MySQL Database Cache (Bản lưu trường TTN)';
    } else if (isFallback) {
      statusText = 'Offline fallback (Dữ liệu mẫu)';
    }

    res.json({
      success: true,
      total: result.length,
      isFallback: isFallback,
      isDbCached: isDbCached,
      latestAnnouncements: announcements.slice(0, 3), // 3 Thông báo mới nhất
      latestNews: news.slice(0, 3),                  // 3 Tin tức mới nhất
      announcements: announcements,
      news: news,
      data: result.slice(0, max),
      source: {
        status: statusText,
        isFallback: isFallback,
        isDbCached: isDbCached,
        university: 'Trường Đại học Tây Nguyên (ttn.edu.vn)'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải tin tức và thông báo', error: error.message });
  }
};

/**
 * GET /api/news/announcements
 * Lấy riêng Thông báo sinh viên
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await newsService.getAnnouncementsWithFallback();
    res.json({
      success: true,
      source: 'Cổng Thông báo sinh viên TTN',
      announcements: announcements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải thông báo', error: error.message });
  }
};

/**
 * GET /api/news/tintuc
 * Lấy riêng Tin tức hoạt động
 */
exports.getNews = async (req, res) => {
  try {
    const news = await newsService.getNewsWithFallback();
    res.json({
      success: true,
      source: 'Cổng Tin tức TTN.edu.vn',
      news: news
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải tin tức', error: error.message });
  }
};

const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * GET /api/news/image-proxy?url=...
 * Proxy hình ảnh từ website trường TTN để tránh lỗi 502 và lỗi chứng chỉ SSL trên thiết bị di động thật
 */
exports.proxyImage = async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('Thiếu tham số url');
  }

  let targetUrl = String(imageUrl).trim();
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://www.ttn.edu.vn${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
  }

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      httpsAgent,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.ttn.edu.vn/'
      }
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(response.data));
  } catch (error) {
    console.warn(`[Image Proxy] Lỗi tải ảnh (${targetUrl}):`, error.message);
    // Chuyển hướng về ảnh minh họa trường học dự phòng
    return res.redirect('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80');
  }
};

