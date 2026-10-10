const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Bước 1 - Gửi yêu cầu đăng ký tài khoản sinh viên (gửi OTP về email)
 *     tags: [Auth]
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
 *                 example: '23103023'
 *                 description: Mã số sinh viên
 *               password:
 *                 type: string
 *                 example: '123456'
 *                 description: Mật khẩu
 *               fullName:
 *                 type: string
 *                 example: 'Nguyễn Văn A'
 *                 description: Họ và tên
 *               email:
 *                 type: string
 *                 example: '23103023@sv.ttn.edu.vn'
 *                 description: Email sinh viên
 *     responses:
 *       200:
 *         description: Gửi OTP đăng ký thành công
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/register-verify:
 *   post:
 *     summary: Bước 2 - Xác thực OTP và hoàn tất đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *               - otpCode
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *                 description: Mã số sinh viên
 *               otpCode:
 *                 type: string
 *                 example: '123456'
 *                 description: Mã OTP gồm 6 số đã nhận qua email
 *     responses:
 *       201:
 *         description: Đăng ký thành công và đã lưu vào cơ sở dữ liệu
 */
router.post('/register-verify', authController.verifyRegisterOtp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập sinh viên (nhận vào mã SV/email + mật khẩu, trả về JWT Token)
 *     tags: [Auth]
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
 *                 example: '23103023'
 *                 description: Mã số sinh viên hoặc email
 *               password:
 *                 type: string
 *                 example: '1872005'
 *                 description: Mật khẩu
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất (hủy phiên làm việc trên server)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin chi tiết của người đang đăng nhập (họ tên, mã, email, avatar, lớp)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *         description: Mã số sinh viên
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/me', authController.getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Lấy hồ sơ tài khoản cá nhân (Đồng danh với /api/auth/me)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: mssv
 *         schema:
 *           type: string
 *           example: '23103023'
 *     responses:
 *       200:
 *         description: Thông tin chi tiết người dùng
 */
router.get('/profile', authController.getMe);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Đổi mật khẩu tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *               currentPassword:
 *                 type: string
 *                 example: '123456'
 *               newPassword:
 *                 type: string
 *                 example: '654321'
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
router.put('/change-password', authController.changePassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Quên mật khẩu - Gửi mã OTP xác thực qua email
 *     tags: [Auth]
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
 *                 description: Mã số sinh viên cần khôi phục mật khẩu
 *               email:
 *                 type: string
 *                 example: '23103023@sv.ttn.edu.vn'
 *     responses:
 *       200:
 *         description: Mã OTP đã được gửi đến email
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Kiểm tra mã OTP khôi phục mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *               - otpCode
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *               otpCode:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: Xác thực OTP thành công
 */
router.post('/verify-otp', authController.verifyOtp);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt mật khẩu mới sau khi có OTP hoặc Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *               - newPassword
 *             properties:
 *               mssv:
 *                 type: string
 *                 example: '23103023'
 *               newPassword:
 *                 type: string
 *                 example: '123456'
 *               otpCode:
 *                 type: string
 *                 example: '123456'
 *               token:
 *                 type: string
 *                 example: ''
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;
