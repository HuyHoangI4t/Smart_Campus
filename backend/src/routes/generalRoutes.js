const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo chung (có hỗ trợ phân trang page, limit)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/notifications', generalController.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Xem chi tiết nội dung của một thông báo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/notifications/:id', generalController.getNotificationById);

/**
 * @swagger
 * /api/surveys:
 *   get:
 *     summary: Lấy danh sách các phiếu khảo sát (đánh giá giảng viên, khảo sát ý kiến)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/surveys', generalController.getSurveys);

/**
 * @swagger
 * /api/surveys/submit:
 *   post:
 *     summary: Gửi kết quả khảo sát của sinh viên lên hệ thống
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               surveyId:
 *                 type: integer
 *               mssv:
 *                 type: string
 *               answers:
 *                 type: object
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/surveys/submit', generalController.submitSurvey);

/**
 * @swagger
 * /api/support/tickets:
 *   post:
 *     summary: Gửi phản hồi, kiến nghị hoặc báo lỗi về phòng công tác sinh viên
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mssv:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/support/tickets', generalController.submitSupportTicket);

module.exports = router;
