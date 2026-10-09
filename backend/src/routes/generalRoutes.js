const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/general/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo chung của Nhà trường
 *     tags: [General]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang cần lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng thông báo mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *   post:
 *     summary: Tạo thông báo mới (Yêu cầu quyền Admin)
 *     tags: [General]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationRequest'
 *     responses:
 *       201:
 *         description: Tạo thông báo thành công
 */
router.get('/notifications', generalController.getNotifications);
router.post('/notifications', verifyToken, requireRole('admin'), generalController.createNotification);

/**
 * @swagger
 * /api/general/notifications/{id}:
 *   get:
 *     summary: Xem chi tiết một thông báo theo ID
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
 *         description: Chi tiết thông báo
 *   delete:
 *     summary: Xóa một thông báo theo ID (Yêu cầu quyền Admin)
 *     tags: [General]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.get('/notifications/:id', generalController.getNotificationById);
router.delete('/notifications/:id', verifyToken, requireRole('admin'), generalController.deleteNotification);

module.exports = router;
