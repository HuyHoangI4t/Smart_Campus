const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo chung (có hỗ trợ phân trang page, limit)
 *     tags: [General]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
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
 *     tags: [General]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
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
 *     tags: [General]
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
 *     tags: [General]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - surveyId
 *               - mssv
 *             properties:
 *               surveyId:
 *                 type: integer
 *                 example: 1
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *               answers:
 *                 type: object
 *                 example: { "cau1": "5", "cau2": "Rất hài lòng" }
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
 *     tags: [General]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *               title:
 *                 type: string
 *                 example: 'Yêu cầu cấp lại thẻ sinh viên'
 *               content:
 *                 type: string
 *                 example: 'Em bị mất thẻ sinh viên, muốn xin thủ tục làm lại.'
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/support/tickets', generalController.submitSupportTicket);

module.exports = router;
