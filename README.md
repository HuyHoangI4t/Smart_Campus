# 🎓 SMART CAMPUS - ỨNG DỤNG SỔ TAY & TIỆN ÍCH SINH VIÊN

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
</p>

> **Smart Campus** là giải pháp ứng dụng di động toàn diện hỗ trợ sinh viên trường **Đại học Tây Nguyên** trong việc tra cứu điểm học tập, theo dõi thời khóa biểu, định vị địa điểm trong khuôn viên và kết nối các dịch vụ hỗ trợ sinh viên nhanh chóng, tiện lợi mọi lúc mọi nơi.
>
> 🔗 **Kho mã nguồn GitHub:** [https://github.com/HuyHoangI4t/Smart_Campus](https://github.com/HuyHoangI4t/Smart_Campus)

---

## 📸 2. Ảnh minh họa & Giao diện ứng dụng (Screenshots / Demo)

<p align="center">
  <img src="frontend/assets/images/images.jpg" alt="Khuôn viên trường Đại học Tây Nguyên" width="720" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <br>
  <em>Khuôn viên trường Đại học Tây Nguyên (Tay Nguyen University)</em>
</p>

| 🔐 Đăng nhập & Xác thực | 🏠 Trang chủ & Thống kê | 📅 Thời khóa biểu |
|:---:|:---:|:---:|
| Giao diện đăng nhập, đăng ký & xác thực OTP qua Email | Dashboard tổng quan: GPA, tín chỉ, môn học hôm nay & lối tắt tiện ích | Lịch học thông minh theo tuần, xem chi tiết phòng học và giảng viên |

| 📊 Tra cứu điểm số | 🗺️ Bản đồ khuôn viên | 👤 Hồ sơ & Tiện ích |
|:---:|:---:|:---:|
| Bảng điểm chi tiết từng kỳ, GPA hệ 10 & 4, tín chỉ tích lũy | Định vị các tòa nhà giảng đường, phòng thí nghiệm, thư viện | Đổi avatar (camera/thư viện), đổi mật khẩu & gửi cảnh báo khẩn cấp SOS |

---

## ✨ 3. Tính năng nổi bật (Key Features)

- **🔐 Xác thực & Quản lý tài khoản:**
  - Đăng ký tài khoản sinh viên với MSSV, họ tên, email và số điện thoại.
  - Đăng nhập bảo mật với mã hóa mật khẩu `bcryptjs`.
  - Khôi phục mật khẩu an toàn thông qua mã OTP gửi trực tiếp về email sinh viên (Nodemailer).
  - Tự động ghi nhớ phiên đăng nhập với `AsyncStorage`.

- **🏠 Trang chủ cá nhân hóa (Dashboard):**
  - Hiển thị lời chào theo thời gian, thông tin sinh viên và mã sinh viên.
  - Thẻ tóm tắt học tập nhanh: Điểm trung bình tích lũy (GPA 10 & GPA 4), tổng số tín chỉ đã tích lũy.
  - Lịch học môn kế tiếp trong ngày, danh mục tiện ích nhanh và bảng tin thông báo nhà trường.

- **📊 Quản lý học tập & Tra cứu điểm số:**
  - Tra cứu điểm chi tiết theo từng học kỳ: Điểm chuyên cần, kiểm tra, thi, điểm tổng kết.
  - Quy đổi tự động chuẩn điểm chữ: `A, B, C, D, F, P, X` sang thang điểm 4.0.
  - Bộ tính toán chuẩn xác ở backend: Tự động loại bỏ các môn chưa hoàn thành khỏi tín chỉ tích lũy.

- **📅 Thời khóa biểu thông minh (Schedule):**
  - Xem lịch học trực quan theo ngày, theo tuần.
  - Chi tiết từng ca học: Mã học phần, tên môn học, giảng viên phụ trách, phòng học và thời gian bắt đầu/kết thúc.

- **🗺️ Bản đồ trường học (Campus Map):**
  - Bản đồ tương tác định vị các khu vực trong khuôn viên: Giảng đường, Khu hiệu bộ, Thư viện, Nhà thi đấu, Ký túc xá, Căng tin.
  - Hỗ trợ xem thông tin mô tả và chỉ đường nhanh đến từng địa điểm.

- **🚨 Tiện ích & Hỗ trợ sinh viên:**
  - **Gửi phản hồi (Feedback):** Gửi ý kiến đóng góp cho nhà trường với các chủ đề học tập, cơ sở vật chất.
  - **Khảo sát (Surveys) & Hỗ trợ (Tickets):** Trả lời phiếu khảo sát ý kiến và tạo yêu cầu trợ giúp.
  - **Báo động khẩn cấp (SOS Alert):** Nút gửi tín hiệu cấp cứu và vị trí tức thời đến đội ngũ an ninh trường.

- **👤 Quản lý hồ sơ cá nhân:**
  - Xem và cập nhật thông tin liên hệ: Email, số điện thoại, khoa, lớp.
  - Cập nhật ảnh đại diện linh hoạt: Chụp trực tiếp từ camera, tải ảnh từ thư viện thiết bị, nhập liên kết ảnh hoặc chọn bộ avatar sinh viên mẫu có sẵn.
  - Đổi mật khẩu tài khoản trực tiếp trong ứng dụng.

---

## 🛠️ 4. Công nghệ sử dụng (Tech Stack)

### Frontend (Ứng dụng di động)
- **Framework:** [React Native](https://reactnative.dev/) `v0.81.5` kết hợp [Expo SDK](https://expo.dev/) `v54`
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) `v6` (File-based routing)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/) `v5.9`
- **Giao diện & Biểu tượng:** `@expo/vector-icons` (Feather Icons), `react-native-safe-area-context`
- **Đa phương tiện & Lưu trữ:** `expo-image-picker`, `expo-image`, `@react-native-async-storage/async-storage`

### Backend (REST API Server)
- **Nền tảng:** [Node.js](https://nodejs.org/) (ES6+) & [Express.js](https://expressjs.com/) `v4.21`
- **Cơ sở dữ liệu:** [MySQL 8.0](https://www.mysql.com/) thông qua `mysql2` (Connection Pool)
- **Xác thực & Bảo mật:** `bcryptjs`, CORS middleware, Dotenv
- **Dịch vụ Email:** `nodemailer` (SMTP Google Mail gửi OTP)
- **Cào dữ liệu & Tích hợp:** `cheerio`, `axios` (Hỗ trợ truy xuất dữ liệu từ cổng thông tin đào tạo)
- **Tài liệu API:** [Swagger UI](https://swagger.io/) (`swagger-ui-express`, `swagger-jsdoc`)

---

## 🚀 5. Hướng dẫn cài đặt & Chạy dự án (Getting Started)

### Yêu cầu tiên quyết (Prerequisites)
- [Node.js](https://nodejs.org/) (Phiên bản khuyến nghị: `>= 18.x`)
- [MySQL Server](https://www.mysql.com/) hoặc [XAMPP](https://www.apachefriends.org/) (chạy MySQL cổng mặc định `3306`)
- Ứng dụng **Expo Go** trên điện thoại (tải từ Google Play / App Store) hoặc máy ảo Android Studio / iOS Simulator.

---

### Bước 1: Clone kho mã nguồn

```bash
git clone https://github.com/HuyHoangI4t/Smart_Campus.git
cd Smart_Campus
```

---

### Bước 2: Thiết lập và khởi chạy Backend

1. **Tạo cơ sở dữ liệu MySQL:**
   Mở MySQL CLI, phpMyAdmin hoặc MySQL Workbench và tạo database:
   ```sql
   CREATE DATABASE smartcampus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Cấu hình biến môi trường (`.env`):**
   Vào thư mục `backend`, tạo file `.env` (hoặc chỉnh sửa từ mẫu có sẵn):
   ```dotenv
   # Cấu hình Database MySQL
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=smartcampus
   DB_PORT=3306
   
   # Cổng chạy Backend Server
   PORT=5000
   
   # Cấu hình gửi mail OTP qua Gmail (Tùy chọn)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   ```

3. **Cài đặt thư viện và khởi động server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   > 💡 **Ghi chú:** Khi server khởi chạy lần đầu, tệp `src/config/initDb.js` sẽ tự động khởi tạo cấu trúc bảng (`users`, `feedback`, `sos_alerts`, `map_locations`, `notifications`, `surveys`, `support_tickets`) và chèn dữ liệu mẫu ban đầu.

4. **Kiểm tra trạng thái backend:**
   - Kiểm tra sức khỏe API: `http://localhost:5000/api/health`
   - Tài liệu OpenAPI / Swagger: `http://localhost:5000/api-docs`

---

### Bước 3: Thiết lập và khởi chạy Ứng dụng di động (Frontend)

1. Mở một cửa sổ Terminal mới:
   ```bash
   cd frontend
   npm install
   ```

2. **Cấu hình kết nối API:**
   Ứng dụng sử dụng cấu hình tự động nhận diện IP máy chủ trong file `frontend/src/services/api.ts`:
   - Trên **Trình duyệt Web**: Tự động dùng `http://localhost:5000/api`.
   - Trên **Thiết bị thật (Expo Go)**: Tự động trích xuất IP LAN của máy tính đang chạy Expo server.
   *(Nếu bạn chạy thiết bị thật mà không kết nối được, hãy đảm bảo điện thoại và máy tính cùng chung một mạng Wi-Fi và tường lửa Windows mở cổng `5000`)*.

3. **Khởi chạy ứng dụng với Expo:**
   ```bash
   npx expo start
   ```

4. **Trải nghiệm ứng dụng:**
   - **Android / iOS thật:** Mở ứng dụng **Expo Go**, quét mã QR hiển thị trên màn hình terminal.
   - **Android Emulator:** Nhấn phím `a` trên bàn phím.
   - **Trình duyệt Web:** Nhấn phím `w` trên bàn phím.

---

## 📁 6. Cấu trúc thư mục (Project Structure)

```text
Smart_Campus/
├── backend/                        # Mã nguồn REST API Server (Node.js/Express)
│   ├── src/
│   │   ├── config/                 # Cấu hình hệ thống
│   │   │   ├── db.js               # Kết nối MySQL Pool (smartcampus)
│   │   │   ├── initDb.js           # Khởi tạo bảng dữ liệu và hạt giống (Seed)
│   │   │   └── swagger.js          # Cấu hình OpenAPI / Swagger UI
│   │   ├── controllers/            # Tầng xử lý logic nghiệp vụ
│   │   │   ├── authController.js   # Đăng nhập, đăng ký, OTP, đổi mật khẩu
│   │   │   ├── studentController.js# Xử lý hồ sơ, điểm, TKB, tính GPA
│   │   │   ├── campusController.js # Phản hồi, báo động SOS, bản đồ
│   │   │   └── generalController.js# Thông báo, khảo sát, hỗ trợ kỹ thuật
│   │   ├── routes/                 # Định tuyến API
│   │   │   ├── authRoutes.js       # /api/auth
│   │   │   ├── studentRoutes.js    # /api/student
│   │   │   ├── campusRoutes.js     # /api/campus
│   │   │   └── generalRoutes.js    # /api/general
│   │   ├── services/               # Dịch vụ phụ trợ
│   │   │   ├── emailService.js     # Gửi email mã OTP
│   │   │   ├── gradeService.js     # Tính toán bảng điểm & GPA thang 4 / thang 10
│   │   │   └── scraperService.js   # Thu thập dữ liệu cổng trường
│   │   └── server.js               # Điểm khởi chạy chính của Backend
│   ├── package.json
│   └── README.md
│
├── frontend/                       # Mã nguồn Ứng dụng di động (Expo/React Native)
│   ├── app/                        # Điều hướng màn hình (Expo Router)
│   │   ├── _layout.tsx             # Root layout cấu hình giao diện & theme
│   │   ├── index.tsx               # Màn hình Splash / Điều hướng ban đầu
│   │   ├── (auth)/                 # Nhóm màn hình Xác thực
│   │   │   ├── index.tsx           # Đăng nhập
│   │   │   ├── register.tsx        # Đăng ký tài khoản
│   │   │   └── forgot_password.tsx # Quên mật khẩu & xác nhận mã OTP
│   │   └── (main)/                 # Nhóm màn hình Ứng dụng chính (Bottom Tabs)
│   │       ├── home/index.tsx      # Trang chủ Dashboard
│   │       ├── grades/             # Tra cứu điểm & chi tiết học kỳ
│   │       ├── schedule/           # Thời khóa biểu
│   │       ├── map/                # Bản đồ khuôn viên trường
│   │       ├── profile/            # Hồ sơ sinh viên, đổi ảnh đại diện & đổi MK
│   │       ├── feedback/           # Gửi ý kiến phản hồi
│   │       └── sos/                # Cảnh báo khẩn cấp SOS
│   ├── assets/                     # Tài nguyên hình ảnh, logo, icon, phông chữ
│   ├── src/
│   │   ├── components/             # Các Component tái sử dụng (NavHeader, MainTabs,...)
│   │   ├── constants/              # Bảng màu sắc (AppColors), kiểu dáng chung (globalStyles)
│   │   └── services/
│   │       └── api.ts              # Quản lý gọi API và xử lý token
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md                       # Tài liệu tổng quan dự án
```

---

## 👥 7. Tác giả & Thành viên thực hiện (Authors & Contributors)

Dự án được thực hiện phục vụ học phần **Lập trình ứng dụng đa nền tảng (LTUDDNT)** - Trường **Đại học Tây Nguyên**:

| STT | Họ và tên | Mã sinh viên | Vai trò | Email liên hệ |
|:---:|:---|:---:|:---|:---|
| 1 | **Nguyễn Huy Hoàng** | **23103023** | **Trưởng nhóm (Leader)** | [huyhoangpro187@gmail.com](mailto:huyhoangpro187@gmail.com) |
| 2 | **Lê Xuân Hoàng** | **23103022** | | |
| 3 | **Nguyễn Thị Mỹ Duyên** | **23103095** | | |
| 4 | **Mai Đàm Thế Kiên** | **23103035** | | |

- **Học phần:** Lập trình ứng dụng đa nền tảng (LTUDDNT).
- **Trường:** Đại học Tây Nguyên (Tay Nguyen University).
- **GitHub Repository:** [https://github.com/HuyHoangI4t/Smart_Campus](https://github.com/HuyHoangI4t/Smart_Campus)

---

## 📄 8. Giấy phép (License)

Dự án được phân phối dưới giấy phép mã nguồn mở **MIT License**. Chi tiết xem tại tệp [LICENSE](LICENSE) hoặc tham khảo nội dung tóm tắt bên dưới:

```text
MIT License

Copyright (c) 2026 Smart Campus Team - Đại học Tây Nguyên

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<p align="center">
  Made with ❤️ by <strong>Smart Campus Team</strong> • Đại học Tây Nguyên
</p>
