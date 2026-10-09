const express = require('express');
const router = express.Router();
const campusController = require('../controllers/campusController');
const generalController = require('../controllers/generalController');

/**
 * @swagger
 * /api/campus/feedback:
 *   post:
 *     summary: Gửi phản hồi, góp ý cơ sở vật chất và đào tạo
 *     tags: [Campus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackRequest'
 *     responses:
 *       200:
 *         description: Gửi phản hồi thành công
 */
router.post('/feedback', campusController.submitFeedback);

/**
 * @swagger
 * /api/campus/sos:
 *   post:
 *     summary: Gửi tín hiệu cấp cứu và cảnh báo khẩn cấp SOS tới đội bảo vệ trường
 *     tags: [Campus]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SosRequest'
 *     responses:
 *       200:
 *         description: Gửi cảnh báo SOS thành công
 */
router.post('/sos', campusController.submitSos);

/**
 * @swagger
 * /api/campus/map:
 *   get:
 *     summary: Lấy danh sách 37 địa điểm và tòa nhà khuôn viên Đại học Tây Nguyên
 *     tags: [Campus]
 *     responses:
 *       200:
 *         description: Danh sách địa điểm gồm ID, tên tòa nhà, phân loại, kinh độ, vĩ độ và mô tả
 */
router.get('/map', campusController.getMapLocations);

/**
 * @swagger
 * /api/campus/locations:
 *   get:
 *     summary: Lấy danh sách địa điểm bản đồ (đồng danh với /api/campus/map)
 *     tags: [Campus]
 *     responses:
 *       200:
 *         description: Danh sách địa điểm
 */
router.get('/locations', campusController.getMapLocations);

/**
 * @swagger
 * /api/campus/paths:
 *   get:
 *     summary: Lấy mạng lưới đường đi nội bộ khuôn viên trường (Paths / Polyline nodes)
 *     tags: [Campus]
 *     responses:
 *       200:
 *         description: Danh sách các đoạn đường và tọa độ định tuyến trong khuôn viên
 */
router.get('/paths', campusController.getCampusPaths);

/**
 * @swagger
 * /api/campus/dashboard:
 *   get:
 *     summary: Lấy dữ liệu tổng quan trang chủ sinh viên (Dashboard Overview)
 *     tags: [Campus]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *     responses:
 *       200:
 *         description: Tóm tắt điểm GPA, ca học kế tiếp, thông báo mới và tiện ích nhanh
 */
router.get('/dashboard', campusController.getDashboard);
router.get('/home/dashboard', campusController.getDashboard);

/**
 * @swagger
 * /api/campus/feedback/config:
 *   get:
 *     summary: Lấy cấu hình các danh mục và chủ đề gửi phản hồi
 *     tags: [Campus]
 *     responses:
 *       200:
 *         description: Danh sách chủ đề phản hồi mẫu
 */
router.get('/feedback/config', campusController.getFeedbackConfig);

/**
 * @swagger
 * /api/campus/sos/config:
 *   get:
 *     summary: Lấy danh bạ đường dây nóng và số điện thoại khẩn cấp trường
 *     tags: [Campus]
 *     responses:
 *       200:
 *         description: Danh sách số hotline bảo vệ, y tế, ban giám hiệu
 */
router.get('/sos/config', campusController.getSosConfig);

router.get('/notifications', generalController.getNotifications);
router.post('/notifications', generalController.createNotification);
router.delete('/notifications/:id', generalController.deleteNotification);

module.exports = router;
