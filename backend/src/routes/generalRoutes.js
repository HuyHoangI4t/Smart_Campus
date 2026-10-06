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
router.post('/notifications', generalController.createNotification);
router.get('/notifications/:id', generalController.getNotificationById);
router.delete('/notifications/:id', generalController.deleteNotification);

module.exports = router;
