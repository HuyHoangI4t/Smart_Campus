const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const initializeTables = require('./config/initDb');
const setupSwagger = require('./config/swagger');

// Import modular routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const campusRoutes = require('./routes/campusRoutes');
const generalRoutes = require('./routes/generalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const newsRoutes = require('./routes/newsRoutes');
const cronService = require('./services/cronService');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets for Web Portal
app.use(express.static(path.join(__dirname, '../public')));

// Initialize DB tables & Swagger UI on startup
initializeTables();
setupSwagger(app);

/**
 * Web Portal Route (Trang Quản trị Hệ thống dành riêng cho Admin - Không qua app mobile)
 */
app.get(['/portal', '/admin'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/portal/index.html'));
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Kiểm tra trạng thái server và kết nối MySQL (smartcampus).
 *     responses:
 *       200:
 *         description: Server và Database hoạt động bình thường.
 */
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      message: 'LTDDDNT Backend API & MySQL database (smartcampus) đang hoạt động bình thường.',
      cron: cronService.getSyncStatus()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Lỗi kết nối database', error: error.message });
  }
});

/**
 * Endpoint kiểm tra trạng thái và đồng bộ dữ liệu thủ công từ cổng trường
 */
app.get('/api/cron/status', (req, res) => {
  res.json({ success: true, ...cronService.getSyncStatus() });
});

app.post('/api/cron/sync', async (req, res) => {
  try {
    const result = await cronService.runFullSync('MANUAL_API_TRIGGER');
    res.json({ success: true, message: 'Đồng bộ dữ liệu thành công', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi đồng bộ', error: err.message });
  }
});

// Mount Routes (supporting modular paths and legacy /api paths)
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/general', generalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);

app.use('/api', generalRoutes);
app.use('/api', studentRoutes);
app.use('/api', campusRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LTDDDNT Backend server đang chạy tại cổng ${PORT} (0.0.0.0)`);
  console.log(`💻 Trang Quản Trị Web (Admin Portal): http://localhost:${PORT}/portal`);
  console.log(`📱 Expo Go / Mobile API: http://192.168.1.22:${PORT}/api`);
  console.log(`📄 Swagger UI sẵn sàng tại http://localhost:${PORT}/api-docs`);
  
  // Khởi động tiến trình đồng bộ dữ liệu tự động 3 lần/ngày
  cronService.startCronJobs();
});
