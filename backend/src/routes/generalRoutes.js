const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');

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
 *     summary: Tạo thông báo mới
 *     tags: [General]
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
router.post('/notifications', generalController.createNotification);

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
 *     summary: Xóa một thông báo theo ID
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
 *         description: Xóa thành công
 */
router.get('/notifications/:id', generalController.getNotificationById);
router.delete('/notifications/:id', generalController.deleteNotification);

module.exports = router;
