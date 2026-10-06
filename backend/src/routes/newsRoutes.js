const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Lấy danh sách Thông báo (RSS thongbaosv) và Tin tức (RSS tintuc) từ TTN
 *     tags: [News]
 */
router.get('/', newsController.getAllNewsAndAnnouncements);

/**
 * @swagger
 * /api/news/announcements:
 *   get:
 *     summary: Lấy riêng Thông báo từ RSS thongbaosv
 *     tags: [News]
 */
router.get('/announcements', newsController.getAnnouncements);

/**
 * @swagger
 * /api/news/tintuc:
 *   get:
 *     summary: Lấy riêng Tin tức từ RSS tintuc
 *     tags: [News]
 */
router.get('/tintuc', newsController.getNews);

/**
 * @swagger
 * /api/news/image-proxy:
 *   get:
 *     summary: Proxy hình ảnh từ server trường TTN để tránh lỗi 502 và SSL trên điện thoại
 *     tags: [News]
 */
router.get('/image-proxy', newsController.proxyImage);

/**
 * @swagger
 * /api/news/article-detail:
 *   get:
 *     summary: Lấy chi tiết toàn văn và tất cả hình ảnh từ bài viết TTN
 *     tags: [News]
 */
router.get('/article-detail', newsController.getArticleDetail);

/**
 * @swagger
 * /api/news/download-attachment:
 *   get:
 *     summary: Tải trực tiếp tài liệu đính kèm (PDF, DOCX) từ website trường
 *     tags: [News]
 */
router.get('/download-attachment', newsController.downloadAttachment);

module.exports = router;


