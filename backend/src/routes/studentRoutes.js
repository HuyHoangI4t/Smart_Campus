const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

/**
 * @swagger
 * /api/student/grades:
 *   get:
 *     summary: Lấy bảng điểm sinh viên theo kỳ hoặc toàn khóa (GET)
 *     tags: [Student]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *         description: Mã số sinh viên
 *       - in: query
 *         name: dk
 *         schema:
 *           type: string
 *           example: '10'
 *         description: Đợt / Học kỳ (bỏ trống để lấy tất cả)
 *     responses:
 *       200:
 *         description: Trả về danh sách môn học, điểm chi tiết, GPA thang 10 và GPA thang 4
 *   post:
 *     summary: Lấy bảng điểm sinh viên (POST body)
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GradesRequest'
 *     responses:
 *       200:
 *         description: Trả về bảng điểm chi tiết
 */
router.get('/grades', studentController.getGrades);
router.post('/grades', studentController.getGrades);

/**
 * @swagger
 * /api/student/grades/{mssv}:
 *   get:
 *     summary: Lấy bảng điểm theo MSSV trên URL
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: mssv
 *         required: true
 *         schema:
 *           type: string
 *           example: '23103023'
 *         description: Mã số sinh viên
 *     responses:
 *       200:
 *         description: Trả về bảng điểm
 *   post:
 *     summary: Lấy bảng điểm theo MSSV trên URL (phương thức POST)
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
 *         description: Trả về bảng điểm
 */
router.get('/grades/:mssv', studentController.getGrades);
router.post('/grades/:mssv', studentController.getGrades);

/**
 * @swagger
 * /api/student/schedule/custom:
 *   post:
 *     summary: Thêm lịch học thủ công / Thực hành đột xuất / Học bù / Kiểm tra
 *     tags: [Student]
 *     description: Tự tạo ca học riêng cho sinh viên. Hệ thống sẽ tự động bóc tách tên phòng và sinh hướng dẫn chỉ đường các bước đến tòa nhà.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomScheduleRequest'
 *     responses:
 *       201:
 *         description: Tạo lịch học thủ công thành công
 */
router.post('/schedule/custom', studentController.createCustomSchedule);

/**
 * @swagger
 * /api/student/schedule/custom/{id}:
 *   put:
 *     summary: Cập nhật thông tin lịch học thủ công đã tạo
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID của ca học tự tạo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomScheduleRequest'
 *     responses:
 *       200:
 *         description: Cập nhật ca học thành công
 *   delete:
 *     summary: Xóa một lịch học thủ công tự tạo
 *     tags: [Student]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID của ca học cần xóa
 *     responses:
 *       200:
 *         description: Xóa lịch học thành công
 */
router.put('/schedule/custom/:id', studentController.updateCustomSchedule);
router.delete('/schedule/custom/:id', studentController.deleteCustomSchedule);

/**
 * @swagger
 * /api/student/schedule:
 *   get:
 *     summary: Lấy thời khóa biểu sinh viên (kết hợp lịch chính khóa và lịch tự tạo)
 *     tags: [Student]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *       - in: query
 *         name: dk
 *         schema:
 *           type: string
 *           example: '10'
 *     responses:
 *       200:
 *         description: Danh sách thời khóa biểu được gom nhóm theo ngày trong tuần, kèm chỉ đường phòng học
 *   post:
 *     summary: Lấy thời khóa biểu sinh viên (POST body)
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleRequest'
 *     responses:
 *       200:
 *         description: Danh sách thời khóa biểu
 */
router.get('/schedule', studentController.getSchedule);
router.post('/schedule', studentController.getSchedule);

/**
 * @swagger
 * /api/student/schedule/{mssv}:
 *   get:
 *     summary: Lấy thời khóa biểu theo MSSV trên URL
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
 *         description: Danh sách thời khóa biểu
 *   post:
 *     summary: Lấy thời khóa biểu theo MSSV trên URL (phương thức POST)
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
 *         description: Danh sách thời khóa biểu
 */
router.get('/schedule/:mssv', studentController.getSchedule);
router.post('/schedule/:mssv', studentController.getSchedule);

/**
 * @swagger
 * /api/student/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ sinh viên
 *     tags: [Student]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *     responses:
 *       200:
 *         description: Thông tin chi tiết sinh viên (họ tên, email, lớp, khoa, ảnh đại diện)
 */
router.get('/profile', studentController.getProfile);

/**
 * @swagger
 * /api/student/profile/{mssv}:
 *   get:
 *     summary: Lấy hồ sơ sinh viên theo MSSV trên đường dẫn
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
 *         description: Thông tin hồ sơ sinh viên
 */
router.get('/profile/:mssv', studentController.getProfile);

/**
 * @swagger
 * /api/student/profile:
 *   put:
 *     summary: Cập nhật thông tin hồ sơ sinh viên (Email, số điện thoại, ảnh avatar)
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *               email:
 *                 type: string
 *                 example: '23103023@sv.ttn.edu.vn'
 *               so_dien_thoai:
 *                 type: string
 *                 example: '0987654321'
 *               avatar_url:
 *                 type: string
 *                 example: 'https://example.com/avatar.jpg'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/profile', studentController.updateProfile);

module.exports = router;
