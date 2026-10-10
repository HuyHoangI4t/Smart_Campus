# 🚀 Smart Campus Backend API Server (LTUDDNT)

Máy chủ Backend API xây dựng trên nền tảng **Node.js** và **Express.js**, tích hợp **Socket.IO** và cơ sở dữ liệu **MySQL 8.0**. Cung cấp toàn bộ dịch vụ dữ liệu cho ứng dụng di động sinh viên và cổng quản trị Web Admin.

---

## 📌 1. Tính năng cốt lõi

- **Quản lý dữ liệu tập trung (Database Orchestrator):** Tự động khởi tạo schema cho toàn bộ 13 bảng dữ liệu và nạp seeders (tài khoản Admin, 37 địa điểm khuôn viên, mạng lưới đường nội bộ) ngay khi server khởi động.
- **Xác thực & Phân quyền:** Đăng nhập, đăng ký, cấp mã OTP qua Gmail SMTP để khôi phục mật khẩu, mã hóa mật khẩu `bcryptjs`.
- **Đồng bộ học tập:** Phân tích điểm học phần, tính toán GPA hệ 10 và hệ 4 chuẩn hóa, đồng bộ thời khóa biểu theo tuần từ cổng đào tạo.
- **Bản đồ & Dẫn đường số:** Quản lý tọa độ 37 địa điểm trọng điểm và mạng lưới đường đi bộ nội bộ (Campus Paths), hỗ trợ thuật toán Dijkstra tìm đường đi ngắn nhất.
- **Realtime Engine (Socket.IO):** Bắn sự kiện thời gian thực khi sinh viên gửi phản hồi hoặc phát tín hiệu SOS khẩn cấp đến ban quản trị.
- **Tài liệu OpenAPI / Swagger UI:** Cung cấp giao diện tra cứu và thử nghiệm API trực tiếp.

---

## 🛠️ 2. Cài đặt & Khởi chạy

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục `backend/` dựa trên `.env.example`:
```dotenv
PORT=5000
NODE_ENV=development
JWT_SECRET=smartcampus_jwt_secret_key_change_in_production

# Cấu hình MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=smartcampus
DB_SSL=false

# Cấu hình gửi mail OTP qua Gmail
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
- **Tài liệu Swagger UI tương tác:**
  `GET http://localhost:5000/api-docs`
- **Trạng thái tiến trình đồng bộ ngầm (Cron):**
  `GET http://localhost:5000/api/cron/status`

---

## 📋 4. Tổng quan các nhóm API Endpoints

### 🔐 1. Nhóm Xác thực (`/api/auth/*`)
- `POST /api/auth/login`: Đăng nhập sinh viên & quản trị viên
- `POST /api/auth/register`: Đăng ký tài khoản sinh viên mới
- `POST /api/auth/forgot-password`: Yêu cầu gửi mã OTP khôi phục mật khẩu qua Email
- `POST /api/auth/verify-otp`: Kiểm tra tính hợp lệ của mã OTP
- `POST /api/auth/reset-password`: Thiết lập mật khẩu mới sau khi xác thực OTP
- `GET /api/auth/profile`: Lấy thông tin cá nhân và avatar của người dùng

### 🎓 2. Nhóm Sinh viên (`/api/student/*`)
- `POST /api/student/grades`: Bảng điểm chi tiết các học kỳ, điểm thành phần & GPA
- `POST /api/student/schedule`: Thời khóa biểu các tuần học kèm giảng viên, phòng học
- `GET /api/student/schedule/custom`: Danh sách các ca học bù / thực hành tự tạo
- `POST /api/student/schedule/custom`: Thêm mới ca học bù / thực hành
- `PUT /api/student/schedule/custom/:id`: Cập nhật ca học bù / thực hành
- `DELETE /api/student/schedule/custom/:id`: Xóa ca học tự tạo
- `PUT /api/student/profile`: Cập nhật thông tin liên hệ và ảnh đại diện

### 🗺️ 3. Nhóm Bản đồ & Tiện ích (`/api/campus/*` & `/api/general/*`)
- `GET /api/campus/map` (hoặc `/api/map`): Danh sách 37 địa điểm và tọa độ GPS
- `GET /api/campus/paths`: Mạng lưới các đoạn đường đi bộ nội bộ (Campus Walkways)
- `POST /api/campus/route`: Tính toán tuyến đường đi bộ ngắn nhất giữa 2 điểm (Dijkstra)
- `POST /api/campus/feedback`: Gửi ý kiến đóng góp cho nhà trường
- `POST /api/campus/sos`: Phát tín hiệu khẩn cấp SOS kèm tọa độ
- `GET /api/general/news`: Bảng tin tức, thông báo chính thức của nhà trường

### 🛡️ 4. Nhóm Quản trị viên (`/api/admin/*` - Yêu cầu Bearer Token)
- `GET /api/admin/stats`: Thống kê tổng quan người dùng, phản hồi, cảnh báo SOS
- `GET /api/admin/users`: Danh sách người dùng kèm Avatar
- `POST /api/admin/users`: Tạo mới tài khoản sinh viên / cán bộ
- `PUT /api/admin/users/:id`: Cập nhật thông tin & ảnh đại diện người dùng
- `DELETE /api/admin/users/:id`: Xóa tài khoản
- `GET /api/admin/feedback`: Danh sách phản hồi của sinh viên
- `PUT /api/admin/feedback/:id`: Duyệt và chuyển trạng thái phản hồi
- `GET /api/admin/sos`: Danh sách cảnh báo SOS
- `PUT /api/admin/sos/:id`: Tiếp nhận và xử lý tín hiệu SOS
- `GET/POST/PUT/DELETE /api/admin/locations`: Quản lý 37 địa điểm bản đồ
- `GET/POST/PUT/DELETE /api/admin/paths`: Quản lý và vẽ đường đi bộ nội bộ trường
