const express = require('express');
const router = express.Router();
const campusController = require('../controllers/campusController');

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Gửi phản hồi, góp ý cơ sở vật chất
 *     tags: [Campus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackRequest'
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/feedback', campusController.submitFeedback);

/**
 * @swagger
 * /api/sos:
 *   post:
 *     summary: Gửi cảnh báo khẩn cấp SOS
 *     tags: [Campus]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SosRequest'
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/sos', campusController.submitSos);

/**
 * @swagger
 * /api/map:
 *   get:
 *     summary: Lấy vị trí bản đồ khuôn viên
 *     tags: [Campus]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/map', campusController.getMapLocations);

module.exports = router;
