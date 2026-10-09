const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Bắt buộc xác thực Bearer token và quyền Quản trị viên (admin) trên toàn bộ Admin API
router.use(verifyToken, requireRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Hệ thống API Quản trị viên (Admin Portal & Mobile Admin)
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Lấy dữ liệu thống kê tổng quan (Dashboard Stats)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Trả về số lượng người dùng, thông báo, phản hồi, cảnh báo SOS
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lấy danh sách người dùng / sinh viên
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo MSSV, họ tên, email, lớp, khoa
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Lọc theo vai trò (sinh_vien, admin,...)
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *   post:
 *     summary: Tạo tài khoản người dùng mới
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *               - password
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103099'
 *               ho_ten:
 *                 type: string
 *                 example: 'Trần Văn B'
 *               email:
 *                 type: string
 *                 example: '23103099@sv.ttn.edu.vn'
 *               password:
 *                 type: string
 *                 example: '123456'
 *               role:
 *                 type: string
 *                 example: 'sinh_vien'
 *               so_dien_thoai:
 *                 type: string
 *                 example: '0987654321'
 *               lop:
 *                 type: string
 *                 example: 'Kỹ thuật phần mềm K23'
 *               khoa:
 *                 type: string
 *                 example: 'Công nghệ Thông tin'
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 */
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ho_ten:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               so_dien_thoai:
 *                 type: string
 *               lop:
 *                 type: string
 *               khoa:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa tài khoản người dùng và toàn bộ dữ liệu liên quan
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Lấy danh sách tất cả thông báo
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *   post:
 *     summary: Đăng thông báo mới từ Nhà trường / Quản trị
 *     tags: [Admin]
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
 *               title:
 *                 type: string
 *                 example: 'Thông báo nghỉ lễ'
 *               content:
 *                 type: string
 *                 example: 'Toàn trường nghỉ lễ theo quy định...'
 *               type:
 *                 type: string
 *                 example: 'info'
 *               sender:
 *                 type: string
 *                 example: 'Phòng Đào Tạo'
 *               date:
 *                 type: string
 *                 example: '07/10/2026'
 *     responses:
 *       201:
 *         description: Đăng thông báo thành công
 */
router.get('/notifications', adminController.getNotifications);
router.post('/notifications', adminController.createNotification);

/**
 * @swagger
 * /api/admin/notifications/{id}:
 *   put:
 *     summary: Chỉnh sửa thông báo
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *               sender:
 *                 type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thông báo thành công
 *   delete:
 *     summary: Xóa thông báo
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thông báo thành công
 */
router.put('/notifications/:id', adminController.updateNotification);
router.delete('/notifications/:id', adminController.deleteNotification);

/**
 * @swagger
 * /api/admin/feedback:
 *   get:
 *     summary: Xem danh sách ý kiến phản hồi từ sinh viên
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Danh sách phản hồi
 */
router.get('/feedback', adminController.getAllFeedback);

/**
 * @swagger
 * /api/admin/feedback/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái xử lý phản hồi
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: 'Đã giải quyết'
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
router.put('/feedback/:id/status', adminController.updateFeedbackStatus);

/**
 * @swagger
 * /api/admin/feedback/{id}:
 *   delete:
 *     summary: Xóa ý kiến phản hồi
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/feedback/:id', adminController.deleteFeedback);

/**
 * @swagger
 * /api/admin/sos:
 *   get:
 *     summary: Xem danh sách cảnh báo SOS khẩn cấp
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Danh sách cảnh báo SOS
 */
router.get('/sos', adminController.getAllSosAlerts);

/**
 * @swagger
 * /api/admin/sos/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái xử lý cảnh báo SOS
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: 'Đã xử lý'
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
router.put('/sos/:id/status', adminController.updateSosStatus);

/**
 * @swagger
 * /api/admin/sos/{id}:
 *   delete:
 *     summary: Xóa cảnh báo SOS
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/sos/:id', adminController.deleteSosAlert);

/**
 * @swagger
 * /api/admin/locations:
 *   get:
 *     summary: Lấy danh sách địa điểm khuôn viên trường dành cho Admin
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Danh sách địa điểm
 *   post:
 *     summary: Thêm mới địa điểm khuôn viên trường
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationRequest'
 *     responses:
 *       201:
 *         description: Thêm địa điểm thành công
 */
router.get('/locations', adminController.getLocations);
router.post('/locations', adminController.createLocation);

/**
 * @swagger
 * /api/admin/locations/{id}:
 *   put:
 *     summary: Cập nhật thông tin địa điểm khuôn viên
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa một địa điểm khuôn viên
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa địa điểm thành công
 */
router.put('/locations/:id', adminController.updateLocation);
router.delete('/locations/:id', adminController.deleteLocation);

/**
 * @swagger
 * /api/admin/locations/reset:
 *   post:
 *     summary: Khôi phục danh sách 37 địa điểm tòa nhà chuẩn mặc định của Đại học Tây Nguyên
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Khôi phục thành công
 */
router.post('/locations/reset', adminController.resetLocations);

/**
 * @swagger
 * /api/admin/paths:
 *   get:
 *     summary: Lấy danh sách mạng lưới đường đi nội bộ khuôn viên
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Danh sách các đoạn đường
 *   post:
 *     summary: Thêm mới đoạn đường nội bộ
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - coordinates
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Đường nối Nhà 2 và Nhà 9'
 *               coordinates:
 *                 type: string
 *                 example: '[[12.6568, 108.0267], [12.6570, 108.0270]]'
 *     responses:
 *       201:
 *         description: Thêm đoạn đường thành công
 */
router.get('/paths', adminController.getPaths);
router.post('/paths', adminController.createPath);

/**
 * @swagger
 * /api/admin/paths/{id}:
 *   put:
 *     summary: Cập nhật đoạn đường đi
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa đoạn đường đi
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/paths/:id', adminController.updatePath);
router.delete('/paths/:id', adminController.deletePath);

/**
 * @swagger
 * /api/admin/paths/reset:
 *   post:
 *     summary: Khôi phục mạng lưới đường đi chuẩn mặc định của khuôn viên trường
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Khôi phục thành công
 */
router.post('/paths/reset', adminController.resetPaths);

module.exports = router;

