# 🚀 Smart Campus Backend API Server (LTUDDNT)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Gemini_AI-Vector_RAG-8E75C2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
</p>

Máy chủ Backend API xây dựng trên nền tảng **Node.js** và **Express.js**, tích hợp **Socket.IO Realtime Engine**, trí tuệ nhân tạo **Google Gemini AI (Vector RAG)** và cơ sở dữ liệu **MySQL 8.0**. Cung cấp toàn bộ dịch vụ dữ liệu cho ứng dụng di động sinh viên và cổng quản trị Web Admin.

---

## 📌 1. Tính năng cốt lõi

### 🗄️ 1. Quản lý Cơ sở Dữ liệu Tập trung (Database Orchestrator)
- Tự động kiểm tra và khởi tạo schema cho toàn bộ **14 bảng dữ liệu chuẩn hóa** (`users`, `map_locations`, `campus_paths`, `student_schedules`, `student_grades`, `sos_alerts`, `feedback`, `news_cache`, `notifications`, `campus_knowledge`, `password_resets`, `registration_otps`, `activity_logs`, `app_settings`).
- Tự động nạp dữ liệu mẫu (Seeders): Tài khoản Admin mặc định, **40 địa điểm khuôn viên theo quy hoạch thực tế của trường** (Nhà học số 2, 5, 6, 7, 8, 9, Tòa nhà Điều hành, Thư viện Trung tâm, Bệnh viện trường, Ký túc xá 1–4...) và mạng lưới đường đi bộ nội khu ngay khi server khởi động.

### 🛡️ 2. Kiến trúc Mở rộng Bảo vệ Cổng trường (Scalability & Rate Limiting)
Hệ thống được thiết kế để phục vụ **1,000 – 10,000 sinh viên** mà không làm nghẽn cổng tra cứu của trường:
- **Chiến lược Cache TTL:** Bảng điểm (`12 giờ`), Thời khóa biểu (`24 giờ`). 95% yêu cầu tra cứu được đáp ứng trực tiếp từ MySQL với độ trễ gần như `0ms`.
- **Hàng đợi Rate Limiter (Queue FIFO):** Khống chế tối đa `3 requests` đồng thời tới cổng trường, giữ khoảng nghỉ tối thiểu `200ms` giữa các kết nối liên tiếp.
- **In-Flight Deduplication:** Khi hàng trăm sinh viên cùng tra cứu điểm của một lớp, hệ thống chỉ gửi đúng `1 request` tới web trường, các sinh viên còn lại cùng chia sẻ Promise đang xử lý.
- **Tiến trình Cron Smart Batch:** Tự động đồng bộ ngầm lúc vắng tải (**06:00, 12:00, 18:00 ICT**), ưu tiên các tài khoản có cache cũ nhất.
- **Data Pruning Thông minh:** Tự động dọn dẹp các buổi học chính khóa cũ hơn `45 ngày`; **bảo toàn vĩnh viễn 100% lịch tự tạo của sinh viên**.
- **Keep-alive Cron Ping:** Tự động gửi ping định kỳ giữ kết nối CSDL Cloud không bị ngắt kết nối hoặc rơi vào trạng thái ngủ đông (sleep).

### 🤖 3. Trợ lý AI Vector RAG (TTN Smart Bot Engine)
- **Vector Database trực tiếp trong MySQL:** Bảng `campus_knowledge` lưu trữ các khối tri thức trường học cùng vector embeddings 3072 chiều sinh bởi mô hình `gemini-embedding-001`.
- **Cosine Similarity Search:** Tính toán khoảng cách góc cosine để tìm kiếm văn bản có nội dung sát nhất với câu hỏi của sinh viên.
- **Tự sinh câu trả lời với Google Gemini:** Tự động tổng hợp thông tin ngắn gọn, chính xác; trích xuất dữ liệu điểm số và lịch học cá nhân thực tế của chính sinh viên đang đăng nhập.

### ⚡ 4. Realtime Engine (Socket.IO)
- Bắn sự kiện thời gian thực khi sinh viên gửi ý kiến phản hồi hoặc phát tín hiệu cấp cứu khẩn cấp SOS kèm tọa độ GPS trực tiếp tới Web Admin Portal.

### 📖 5. Tài liệu API Chuẩn hóa (OpenAPI / Swagger UI)
- Tích hợp giao diện Swagger UI tại `http://localhost:5000/api-docs` cho phép lập trình viên kiểm thử và tra cứu API trực quan.

---

## 🛠️ 2. Cài đặt & Khởi chạy

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục `backend/` dựa trên mẫu `.env.example`:

```dotenv
PORT=5000
NODE_ENV=development
JWT_SECRET=smartcampus_jwt_secret_key_change_in_production

# Cấu hình MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartcampus
DB_SSL=false

# Cấu hình Google Gemini AI (Vector RAG)
GEMINI_API_KEY=your_gemini_api_key_here

# Cấu hình gửi mail OTP qua Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Bước 3: Khởi động máy chủ
- **Môi trường phát triển (tự động reload khi sửa code):**
  ```bash
  npm run dev
  ```
- **Môi trường sản xuất:**
  ```bash
  npm start
  ```

---

## 🌐 3. Các đường dẫn dịch vụ chính

- **Kiểm tra trạng thái máy chủ (Health Check):**
  `GET http://localhost:5000/api/health`
- **Tài liệu Swagger UI tương tác trực tiếp:**
  `GET http://localhost:5000/api-docs`
- **Trạng thái tiến trình đồng bộ ngầm (Cron):**
  `GET http://localhost:5000/api/cron/status`

---

## 📋 4. Tổng quan các nhóm API Endpoints

### 🔐 1. Nhóm Xác thực & Tài khoản (`/api/auth/*`)
- `POST /api/auth/login`: Đăng nhập sinh viên & quản trị viên
- `POST /api/auth/register`: Đăng ký tài khoản sinh viên mới
- `POST /api/auth/send-otp`: Gửi mã OTP xác thực qua email trường `@sv.ttn.edu.vn`
- `POST /api/auth/verify-otp`: Kiểm tra tính hợp lệ của mã OTP
- `POST /api/auth/forgot-password`: Yêu cầu cấp lại mật khẩu qua OTP
- `POST /api/auth/reset-password`: Thiết lập mật khẩu mới sau khi xác thực OTP thành công
- `GET /api/auth/profile`: Lấy thông tin cá nhân và ảnh đại diện

### 🎓 2. Nhóm Nghiệp vụ Sinh viên (`/api/student/*`)
- `POST /api/student/grades`: Tra cứu bảng điểm chi tiết các học kỳ & GPA (hỗ trợ Cache TTL 12h)
- `POST /api/student/schedule`: Tra cứu thời khóa biểu các tuần học (hỗ trợ Cache TTL 24h)
- `GET /api/student/schedule/custom`: Lấy danh sách các ca học bù / thực hành cá nhân tự tạo
- `POST /api/student/schedule/custom`: Thêm mới ca học bù / thực hành cá nhân
- `PUT /api/student/schedule/custom/:id`: Cập nhật ca học bù / thực hành cá nhân
- `DELETE /api/student/schedule/custom/:id`: Xóa ca học cá nhân
- `PUT /api/student/profile`: Cập nhật thông tin liên hệ và ảnh đại diện sinh viên

### 🗺️ 3. Nhóm Bản đồ & Tiện ích Học đường (`/api/campus/*` & `/api/general/*`)
- `GET /api/campus/map` (hoặc `/api/map`): Danh sách 40 địa điểm khuôn viên trường và tọa độ GPS
- `GET /api/campus/paths`: Mạng lưới các đoạn đường đi bộ nội khu phục vụ dẫn đường
- `POST /api/campus/route`: Tính toán tuyến đường đi bộ ngắn nhất giữa 2 điểm (Dijkstra)
- `POST /api/campus/feedback`: Gửi ý kiến phản hồi về cơ sở vật chất, đào tạo
- `POST /api/campus/sos`: Phát tín hiệu cứu trợ khẩn cấp SOS thời gian thực kèm tọa độ
- `GET /api/general/news`: Bảng tin tức, thông báo chính thức của trường

### 🤖 4. Nhóm Trợ lý AI TTN Smart Bot (`/api/chat/*`)
- `POST /api/chat/ask`: Gửi câu hỏi đến TTN Smart Bot RAG AI (truy xuất Vector DB MySQL và tự sinh câu trả lời với Gemini AI)
- `GET /api/chat/suggestions`: Lấy danh sách câu hỏi gợi ý thông minh bám sát ngữ cảnh

### 🛡️ 5. Nhóm Quản trị viên (`/api/admin/*` - Yêu cầu Bearer Token)
- `GET /api/admin/stats`: Thống kê tổng quan người dùng, phản hồi, cảnh báo SOS
- `GET /api/admin/users`: Danh sách người dùng kèm Avatar thực tế
- `POST /api/admin/users`: Tạo mới tài khoản sinh viên / cán bộ quản trị
- `PUT /api/admin/users/:id`: Cập nhật thông tin & ảnh đại diện người dùng
- `DELETE /api/admin/users/:id`: Xóa tài khoản
- `GET /api/admin/feedback`: Danh sách phản hồi của sinh viên
- `PUT /api/admin/feedback/:id`: Duyệt và chuyển trạng thái xử lý phản hồi
- `GET /api/admin/sos`: Danh sách cảnh báo SOS thời gian thực
- `PUT /api/admin/sos/:id`: Tiếp nhận và xử lý tín hiệu cứu hộ SOS
- `GET / POST / PUT / DELETE /api/admin/locations`: Quản lý 40 địa điểm bản đồ khuôn viên
- `GET / POST / PUT / DELETE /api/admin/paths`: Quản lý và vẽ đường đi bộ nội bộ trường
