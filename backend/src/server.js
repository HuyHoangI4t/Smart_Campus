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
const http = require('http');
const { Server } = require('socket.io');

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

// Khởi tạo HTTP Server & Socket.IO Realtime Engine
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 [Socket.IO] Client kết nối: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.IO] Client ngắt kết nối: ${socket.id}`);
  });
});

// Gắn io instance vào Express app để các controller truy cập được qua req.app.get('io')
app.set('io', io);

// Security Headers (OWASP Recommended)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Hàng đợi ghi nhận lượt tương tác (Micro-batched non-blocking queue)
// Tránh nghẽn Event Loop và giảm tải 95% số lượng truy vấn INSERT đơn lẻ vào MySQL
const activityLogBatch = [];
let activityFlushTimer = null;
const MAX_ACTIVITY_QUEUE = 250;

function flushActivityLogs() {
  if (activityLogBatch.length === 0) return Promise.resolve();
  const batch = activityLogBatch.splice(0, activityLogBatch.length);
  const values = batch.map(b => [b.action, b.mssv, b.ip]);
  return db.query('INSERT INTO activity_logs (action, mssv, ip_address) VALUES ?', [values])
    .then(() => {
      if (io) io.emit('activity_update');
    })
    .catch(() => {});
}

app.use((req, res, next) => {
  const isApi = req.path.startsWith('/api');
  // LOẠI TRỪ HOÀN TOÀN: các API quản trị Admin, xác thực auth, health check, cron job nội bộ
  const isInternal = req.path.startsWith('/api/admin') ||
                     req.path.startsWith('/api/auth') ||
                     req.path.startsWith('/api/health') ||
                     req.path.startsWith('/api/cron') ||
                     req.path.includes('/swagger') ||
                     req.path.includes('/api-docs');

  if (isApi && !isInternal && req.method !== 'OPTIONS') {
    let mssv = req.headers['x-mssv'] || 'guest';
    if (mssv === 'guest') {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer jwt-token-')) {
        const parts = authHeader.replace(/^Bearer\s+/i, '').split('-');
        if (parts.length >= 3 && parts[2]) mssv = parts[2].trim();
      }
    }
    const action = `${req.method} ${req.path.slice(0, 60)}`;
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const cleanIp = String(rawIp).replace(/^.*:/, '').slice(0, 45);
    
    // Giữ hàng đợi trong giới hạn để chống leak RAM khi DB tải nặng
    if (activityLogBatch.length >= MAX_ACTIVITY_QUEUE) {
      activityLogBatch.splice(0, 50);
    }
    
    activityLogBatch.push({
      action,
      mssv,
      ip: cleanIp
    });

    if (activityLogBatch.length >= 25) {
      if (activityFlushTimer) clearTimeout(activityFlushTimer);
      flushActivityLogs();
    } else if (!activityFlushTimer) {
      activityFlushTimer = setTimeout(() => {
        activityFlushTimer = null;
        flushActivityLogs();
      }, 1500);
    }
  }
  next();
});

// Khởi tạo Swagger UI API Docs
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

async function startServer() {
  try {
    // Tự động khởi tạo database, tạo 14 bảng và import toàn bộ dữ liệu mẫu
    console.log('🔄 Đang kiểm tra cấu trúc cơ sở dữ liệu và dữ liệu mẫu...');
    await initializeTables();
  } catch (err) {
    console.error('⚠️ [Startup] Khởi tạo database thất bại:', err.message);
  }

  server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIPv4();
    console.log(`🚀 LTDDDNT Backend server đang chạy tại cổng ${PORT} (0.0.0.0)`);
    console.log(`📱 Expo Go / Mobile API: http://${localIP}:${PORT}/api`);
    console.log(`📄 Swagger UI sẵn sàng tại http://localhost:${PORT}/api-docs`);
    console.log(`⚡ [Socket.IO] Realtime Engine sẵn sàng tại ws://${localIP}:${PORT}`);
    
    // Khởi động tiến trình đồng bộ dữ liệu tự động 3 lần/ngày
    cronService.startCronJobs();
  });

  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Nhận tín hiệu [${signal}]. Đang đóng máy chủ nhẹ nhàng...`);
    try {
      await flushActivityLogs();
    } catch {}
    server.close(() => {
      console.log('🛑 [HTTP/Socket.IO] Đã đóng các kết nối đang chờ.');
      process.exit(0);
    });
    setTimeout(() => {
      console.warn('⚠️ Ép buộc thoát tiến trình sau 3000ms.');
      process.exit(0);
    }, 3000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer();

