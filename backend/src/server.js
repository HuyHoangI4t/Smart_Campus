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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB tables & Swagger UI on startup
initializeTables();
setupSwagger(app);

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
    res.json({ status: 'ok', message: 'LTDDDNT Backend API & MySQL database (smartcampus) đang hoạt động bình thường.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Lỗi kết nối database', error: error.message });
  }
});

// Mount Routes (supporting modular paths and legacy /api paths)
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/general', generalRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', generalRoutes);
app.use('/api', studentRoutes);
app.use('/api', campusRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LTDDDNT Backend server đang chạy tại cổng ${PORT} (0.0.0.0)`);
  console.log(`📱 Expo Go / Mobile API: http://192.168.1.5:${PORT}/api`);
  console.log(`📄 Swagger UI sẵn sàng tại http://localhost:${PORT}/api-docs`);
});
