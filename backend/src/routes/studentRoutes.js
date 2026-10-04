const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

/**
 * @swagger
 * /api/grades:
 *   get:
 *     summary: Lấy bảng điểm sinh viên
 *     tags: [Student]
 *   post:
 *     summary: Lấy bảng điểm sinh viên (POST kèm mssv)
 *     tags: [Student]
 */
router.get('/grades', studentController.getGrades);
router.post('/grades', studentController.getGrades);
router.get('/grades/:mssv', studentController.getGrades);
router.post('/grades/:mssv', studentController.getGrades);

/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: Lấy thời khóa biểu sinh viên
 *     tags: [Student]
 *   post:
 *     summary: Lấy thời khóa biểu sinh viên (POST kèm mssv)
 *     tags: [Student]
 */
router.get('/schedule', studentController.getSchedule);
router.post('/schedule', studentController.getSchedule);
router.get('/schedule/:mssv', studentController.getSchedule);
router.post('/schedule/:mssv', studentController.getSchedule);

/**
 * @swagger
 * /api/student/profile:
 *   get:
 *     summary: Lấy thông tin sinh viên hiện tại
 *     tags: [Student]
 *   put:
 *     summary: Cập nhật thông tin sinh viên
 *     tags: [Student]
 */
router.get('/profile', studentController.getProfile);
router.get('/profile/:mssv', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

module.exports = router;
