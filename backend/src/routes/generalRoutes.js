const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo chung (hỗ trợ phân trang page, limit)
 *     tags: [General]
 */
router.get('/notifications', generalController.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Xem chi tiết nội dung thông báo theo ID
 *     tags: [General]
 */
router.get('/notifications/:id', generalController.getNotificationById);

module.exports = router;
