const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

/**
 * @swagger
 * /api/grades:
 *   post:
 *     summary: Lấy bảng điểm sinh viên và tự động cập nhật tên
 */
router.post('/grades', studentController.getGrades);
router.get('/grades', studentController.getGrades);
router.get('/student/grades', studentController.getGrades);
router.get('/student/grades/:mssv', studentController.getGrades);

/**
 * @swagger
 * /api/student/current-courses:
 *   post:
 *     summary: Lấy danh sách học phần đang học
 */
router.post('/student/current-courses', studentController.getCurrentCourses);
router.get('/student/current-courses', studentController.getCurrentCourses);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Lấy thời khóa biểu (TKB)
 */
router.post('/schedule', studentController.getSchedule);
router.get('/schedule', studentController.getSchedule);
router.get('/student/schedule', studentController.getSchedule);
router.get('/student/schedule/:mssv', studentController.getSchedule);

/**
 * @swagger
 * /api/student/profile/{mssv}:
 *   get:
 *     summary: Lấy thông tin chi tiết sinh viên từ database
 */
router.get('/student/profile/:mssv', studentController.getProfile);
router.get('/student/profile', studentController.getProfile);
router.put('/student/profile', studentController.updateProfile);

router.get('/student/courses', studentController.getCourses);
router.get('/student/courses/:mssv', studentController.getCourses);

module.exports = router;

