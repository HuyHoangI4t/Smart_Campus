const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

/**
 * @swagger
 * /api/grades:
 *   post:
 *     summary: Lấy bảng điểm sinh viên và tự động cập nhật tên (POST)
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *                 description: Mã số sinh viên
 *               msv:
 *                 type: string
 *                 example: '23103023'
 *                 description: Mã số sinh viên (viết tắt)
 *               dk:
 *                 type: string
 *                 example: '10'
 *                 description: Đợt học / Học kỳ (mặc định 10)
 *     responses:
 *       200:
 *         description: Trả về danh sách điểm của sinh viên
 */
router.post('/grades', studentController.getGrades);
router.get('/grades', studentController.getGrades);
router.get('/grades/:mssv', studentController.getGrades);
router.post('/grades/:mssv', studentController.getGrades);
router.post('/student/grades', studentController.getGrades);
router.get('/student/grades', studentController.getGrades);
router.get('/student/grades/:mssv', studentController.getGrades);
router.post('/student/grades/:mssv', studentController.getGrades);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Lấy thời khóa biểu sinh viên (POST)
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *                 description: Mã số sinh viên
 *               dk:
 *                 type: string
 *                 example: '10'
 *                 description: Đợt học / Học kỳ
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/schedule', studentController.getSchedule);
router.get('/schedule', studentController.getSchedule);
router.get('/schedule/:mssv', studentController.getSchedule);
router.post('/schedule/:mssv', studentController.getSchedule);
router.post('/student/schedule', studentController.getSchedule);
router.get('/student/schedule', studentController.getSchedule);
router.get('/student/schedule/:mssv', studentController.getSchedule);
router.post('/student/schedule/:mssv', studentController.getSchedule);

/**
 * @swagger
 * /api/student/current-courses:
 *   post:
 *     summary: Lấy danh sách học phần đang học (POST)
 *     tags: [Student]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/student/current-courses', studentController.getCurrentCourses);

/**
 * @swagger
 * /api/student/profile:
 *   get:
 *     summary: Lấy thông tin sinh viên hiện tại
 *     tags: [Student]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *     responses:
 *       200:
 *         description: Thành công
 *   put:
 *     summary: Cập nhật thông tin sinh viên
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *               ho_ten:
 *                 type: string
 *                 example: 'Nguyễn Văn A'
 *               email:
 *                 type: string
 *                 example: '23103023@sv.ttn.edu.vn'
 *               so_dien_thoai:
 *                 type: string
 *                 example: '0912345678'
 *               lop:
 *                 type: string
 *                 example: 'Kỹ thuật phần mềm K23'
 *               khoa:
 *                 type: string
 *                 example: 'Công nghệ Thông tin'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get('/student/profile', studentController.getProfile);
router.get('/student/profile/:mssv', studentController.getProfile);
router.get('/profile', studentController.getProfile);
router.get('/profile/:mssv', studentController.getProfile);
router.put('/student/profile', studentController.updateProfile);
router.put('/profile', studentController.updateProfile);

/**
 * @swagger
 * /api/student/courses:
 *   get:
 *     summary: Lấy danh sách các môn đã đăng ký
 *     tags: [Student]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/student/courses', studentController.getCourses);

/**
 * @swagger
 * /api/student/courses/{mssv}:
 *   get:
 *     summary: Lấy danh sách các môn đã đăng ký theo MSSV
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: mssv
 *         required: true
 *         schema:
 *           type: string
 *           example: '23103023'
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/student/courses/:mssv', studentController.getCourses);

module.exports = router;
