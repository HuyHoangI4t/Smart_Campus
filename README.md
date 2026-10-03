# Smart Campus

Ứng dụng di động hỗ trợ sinh viên tra cứu thông tin học tập và sử dụng các tiện ích trong khuôn viên trường. Dự án gồm ứng dụng React Native/Expo và REST API Node.js/Express kết nối MySQL.

<p align="center">
  <img src="ltdddnt/assets/images/images.jpg" alt="Khuôn viên trường Đại học Tân Trào" width="640">
</p>

## Tính năng

- Đăng ký, đăng nhập và khôi phục mật khẩu bằng OTP.
- Xem hồ sơ cá nhân, điểm và lịch học.
- Tra cứu học phần, thông báo và khảo sát.
- Gửi phản hồi, tạo yêu cầu hỗ trợ và gửi cảnh báo SOS.
- Xem vị trí các địa điểm trong khuôn viên trường.

## Công nghệ

- **Ứng dụng:** React Native 0.81, Expo SDK 54, Expo Router 6, TypeScript.
- **Backend:** Node.js, Express, MySQL (`mysql2`).
- **Tích hợp:** Swagger UI; truy vấn thông tin điểm và lịch học từ cổng thông tin trường.

## Cấu trúc dự án

```text
.
├── backend/   # REST API, cấu hình cơ sở dữ liệu và tài liệu API
└── ltdddnt/   # Ứng dụng di động Expo
```

## Yêu cầu

- Node.js và npm.
- MySQL Server.
- Expo Go hoặc Android/iOS simulator nếu chạy ứng dụng trên thiết bị.

## Cài đặt và chạy

### 1. Khởi động backend

Tạo database MySQL trước khi chạy server:

```sql
CREATE DATABASE smartcampus;
```

Tạo file `backend/.env` với thông tin kết nối của bạn:

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartcampus
DB_PORT=3306
PORT=5000

# Cấu hình SMTP nếu muốn gửi OTP qua email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

Cài đặt và chạy backend trong terminal:

```bash
cd backend
npm install
npm run dev
```

Backend tạo các bảng cần thiết khi khởi động. Có thể kiểm tra trạng thái tại `http://localhost:5000/api/health`; giao diện Swagger ở `http://localhost:5000/api-docs`.

### 2. Khởi động ứng dụng

Mở terminal thứ hai:

```bash
cd ltdddnt
npm install
npm start
```

Dùng Expo Go quét QR hoặc chọn Android/iOS simulator trong Expo CLI. Khi chạy trên thiết bị thật, thiết bị cần cùng mạng với máy chạy backend để truy cập API.

## API chính

| Nhóm | Một số endpoint |
| --- | --- |
| Sức khỏe dịch vụ | `GET /api/health` |
| Xác thực | `/api/auth` — đăng ký, OTP, đăng nhập, hồ sơ và mật khẩu |
| Sinh viên | `/api/student` — hồ sơ, điểm, lịch học và học phần |
| Tiện ích khuôn viên | `/api/campus` — phản hồi, SOS và bản đồ |
| Thông tin chung | `/api/general` — thông báo, khảo sát và hỗ trợ |

Xem danh sách endpoint và schema đầy đủ tại Swagger UI: `http://localhost:5000/api-docs`.

## Tài liệu liên quan

- [README hướng dẫn backend](backend/README.md)
- [README ứng dụng Expo](ltdddnt/README.md)
