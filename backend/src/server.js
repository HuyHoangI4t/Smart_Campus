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
const os = require('os');

dotenv.config();

// Bắt lỗi tiến trình cấp cao tránh sập server đột ngột
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Process] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🚨 [Process] Uncaught Exception:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Ghi nhận lượt tương tác hệ thống vào MySQL (phục vụ biểu đồ Dashboard thống kê thời gian thực)
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && !req.path.includes('/health') && req.method !== 'OPTIONS') {
    const mssv = req.headers['x-mssv'] || 'guest';
    const action = `${req.method} ${req.path.slice(0, 60)}`;
    db.query('INSERT INTO activity_logs (action, mssv, ip_address) VALUES (?, ?, ?)', [
      action,
      mssv,
      req.ip || '127.0.0.1'
    ]).catch(() => {});
  }
  next();
});

// Initialize DB tables & Swagger UI on startup
initializeTables();
setupSwagger(app);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Kiểm tra trạng thái hoạt động của máy chủ (Health Check)
 *     tags: [System]
 *     description: Kiểm tra trạng thái server, kết nối MySQL (smartcampus) và trạng thái Cron Job.
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
 * @swagger
 * /api/cron/status:
 *   get:
 *     summary: Kiểm tra trạng thái tiến trình đồng bộ dữ liệu tự động
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Trả về thời điểm đồng bộ gần nhất và trạng thái
 */
app.get('/api/cron/status', (req, res) => {
  res.json({ success: true, ...cronService.getSyncStatus() });
});

/**
 * @swagger
 * /api/cron/sync:
 *   post:
 *     summary: Kích hoạt đồng bộ dữ liệu đào tạo ngay lập tức (Manual Trigger)
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 */
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

const getLocalIPv4 = () => {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    // Bỏ qua mạng ảo (VMware, VirtualBox, vEthernet, loopback)
    if (/vmware|virtual|vethernet|loopback|pseudo/i.test(name)) continue;
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (/wi-fi|wifi|ethernet/i.test(name)) {
          return iface.address;
        }
        candidates.push(iface.address);
      }
    }
  }
  return candidates[0] || '192.168.1.20';
};

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIPv4();
  console.log(`🚀 LTDDDNT Backend server đang chạy tại cổng ${PORT} (0.0.0.0)`);
  console.log(`📱 Expo Go / Mobile API: http://${localIP}:${PORT}/api`);
  console.log(`📄 Swagger UI sẵn sàng tại http://localhost:${PORT}/api-docs`);
  
  // Khởi động tiến trình đồng bộ dữ liệu tự động 3 lần/ngày
  cronService.startCronJobs();
});
