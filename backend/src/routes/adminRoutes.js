const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. Thống kê tổng quan
router.get('/stats', adminController.getDashboardStats);

// 2. Quản lý sinh viên & người dùng
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// 3. Quản lý thông báo
router.get('/notifications', adminController.getNotifications);
router.post('/notifications', adminController.createNotification);
router.delete('/notifications/:id', adminController.deleteNotification);

// 4. Quản lý ý kiến phản hồi
router.get('/feedback', adminController.getAllFeedback);
router.delete('/feedback/:id', adminController.deleteFeedback);

// 5. Quản lý cảnh báo SOS
router.get('/sos', adminController.getAllSosAlerts);
router.delete('/sos/:id', adminController.deleteSosAlert);

module.exports = router;
