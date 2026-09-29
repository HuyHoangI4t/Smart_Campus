# LTDDDNT Node.js Backend

Backend API server built with **Node.js**, **Express**, **Axios**, and **Cheerio**. It provides REST endpoints for the LTDDDNT mobile app and proxies student grade and timetable data from the university portal (ttn.edu.vn).

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```
   Or production:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` / `POST /api/auth/login` - Student login
- `GET /api/auth/me` - Get current student profile
- `POST /api/student/grades` - Get student grades (scrapes ttn.edu.vn or falls back to mock data)
- `POST /api/student/schedule` - Get student timetable (scrapes ttn.edu.vn or falls back to mock data)
- `GET /api/notifications` - Get notifications
- `POST /api/feedback` - Submit student feedback
- `POST /api/sos` - Send emergency SOS alert
- `GET /api/map` - Get campus map locations


📂 Cấu trúc tại thư mục backend/src/:
   1. config/:
      - db.js: Kết nối MySQL pool (smartcampus).
      - initDb.js: Tự động tạo bảng (users, feedback, sos_alerts, map_locations, notifications, surveys, support_tickets).
      - swagger.js: Cấu hình tài liệu Swagger UI.
   2. controllers/:
      - authController.js: Xử lý đăng nhập, đăng ký, đổi mật khẩu, thông tin cá nhân.
      - studentController.js: Xử lý điểm, TKB, học phí, khóa học từ ttn.edu.vn và cơ sở dữ liệu.
      - generalController.js: Xử lý thông báo, khảo sát, hỗ trợ.
      - campusController.js: Xử lý phản hồi, SOS và bản đồ.
   3. routes/:
      - authRoutes.js: Định tuyến xác thực.
      - studentRoutes.js: Định tuyến sinh viên.
      - generalRoutes.js: Định tuyến thông báo, khảo sát.
      - campusRoutes.js: Định tuyến tiện ích campus.



   - Server Port: 5000.
   - Swagger UI: http://localhost:5000/api-docs
   - Health check: http://localhost:5000/api/health
