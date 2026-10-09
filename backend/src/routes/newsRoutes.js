const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Lấy danh sách Thông báo (RSS thongbaosv) và Tin tức (RSS tintuc) từ ĐH Tây Nguyên
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, news, announcement]
 *           default: all
 *         description: Loại bài viết cần lấy (all, news, announcement)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài viết cần lấy
 *       - in: query
 *         name: reload
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Bắt buộc tải mới từ nguồn trường TTN
 *     responses:
 *       200:
 *         description: Danh sách tin tức và thông báo
 */
router.get('/', newsController.getAllNewsAndAnnouncements);

/**
 * @swagger
 * /api/news/announcements:
 *   get:
 *     summary: Lấy riêng danh sách Thông báo sinh viên từ RSS thongbaosv
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách thông báo sinh viên
 */
router.get('/announcements', newsController.getAnnouncements);

/**
 * @swagger
 * /api/news/tintuc:
 *   get:
 *     summary: Lấy riêng danh sách Tin tức chung từ RSS tintuc
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách tin tức
 */
router.get('/tintuc', newsController.getNews);

/**
 * @swagger
 * /api/news/image-proxy:
 *   get:
 *     summary: Proxy hình ảnh từ website trường TTN để tránh lỗi SSL và 502 trên điện thoại di động
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           example: 'https://www.ttn.edu.vn/images/logo.png'
 *         description: URL hình ảnh gốc cần proxy
 *     responses:
 *       200:
 *         description: Trả về file ảnh dạng nhị phân (image/jpeg, image/png)
 */
router.get('/image-proxy', newsController.proxyImage);

/**
 * @swagger
 * /api/news/article-detail:
 *   get:
 *     summary: Lấy chi tiết toàn văn, văn bản và danh sách hình ảnh từ bài viết TTN
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           example: 'https://www.ttn.edu.vn/index.php/thongbaosv/123-thong-bao'
 *         description: Đường dẫn liên kết bài viết trên trang trường
 *     responses:
 *       200:
 *         description: Dữ liệu toàn văn bài viết và danh sách hình ảnh
 */
router.get('/article-detail', newsController.getArticleDetail);

/**
 * @swagger
 * /api/news/download-attachment:
 *   get:
 *     summary: Tải trực tiếp tài liệu đính kèm (PDF, DOCX) từ website trường
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: Đường dẫn tải file đính kèm
 *     responses:
 *       200:
 *         description: Tải tệp tin đính kèm
 */
router.get('/download-attachment', newsController.downloadAttachment);

module.exports = router;
