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

### Bước 4: Thiết lập và khởi chạy Trang Quản trị viên (Admin Portal)

1. Mở một cửa sổ Terminal mới:
   ```bash
   cd admin
   npm install
   npm start
   ```
2. Truy cập cổng quản trị trên trình duyệt:
   - Địa chỉ: `http://localhost:3000`
   - Quản lý tin tức, duyệt danh sách địa điểm bản đồ, thống kê cảnh báo SOS, phản hồi và tài khoản sinh viên.

---

## 📁 6. Cấu trúc thư mục (Project Structure)

```text
Smart_Campus/
├── admin/                              # Web Portal Quản trị viên (HTML/CSS/JS + Node.js)
│   ├── public/                         # Giao diện trang quản trị tĩnh
│   │   ├── css/
│   │   │   └── style.css               # Phong cách giao diện Admin Portal
│   │   ├── js/
│   │   │   ├── api.js                  # Gọi API kết nối backend
│   │   │   ├── app.js                  # Khởi tạo và điều phối các module
│   │   │   ├── dashboard.js            # Thống kê tổng quan hệ thống
│   │   │   ├── feedback.js             # Quản lý & duyệt ý kiến phản hồi
│   │   │   ├── locations.js            # Quản lý tọa độ & địa điểm bản đồ
│   │   │   ├── notifications.js        # Đăng & phát thông báo toàn trường
│   │   │   ├── sos.js                  # Giám sát cảnh báo khẩn cấp SOS
│   │   │   └── users.js                # Quản lý tài khoản sinh viên & phân quyền
│   │   └── index.html                  # Giao diện chính của Dashboard Admin
│   ├── .env                            # Biến môi trường Admin (được gitignore)
│   ├── .env.example
│   ├── .gitignore                      # Quy tắc bỏ qua file của Admin
│   ├── package.json                    # Cấu hình gói & script Admin
│   ├── package-lock.json
│   └── server.js                       # HTTP Server phục vụ Admin Portal (Port 3000)
│
├── backend/                            # REST API Server & Xử lý nghiệp vụ (Node.js/Express)
│   ├── src/
│   │   ├── config/                     # Cấu hình hệ thống & kết nối
│   │   │   ├── db.js                   # Kết nối MySQL Pool (smartcampus)
│   │   │   ├── initDb.js               # Khởi tạo bảng dữ liệu & seed mặc định
│   │   │   └── swagger.js              # Cấu hình tài liệu OpenAPI / Swagger UI
│   │   ├── controllers/                # Tầng điều khiển nghiệp vụ (Controllers)
│   │   │   ├── adminController.js      # API dành cho Admin (QL user, SOS, tin tức, map)
│   │   │   ├── authController.js       # Đăng nhập, đăng ký, OTP email, đổi mật khẩu
│   │   │   ├── campusController.js     # Bản đồ khuôn viên, phản hồi, cảnh báo SOS
│   │   │   ├── generalController.js    # Thông báo, khảo sát, hỗ trợ sinh viên
│   │   │   ├── newsController.js       # Tin tức, sự kiện nhà trường
│   │   │   └── studentController.js    # Điểm số, GPA, thời khóa biểu, CRUD lịch học
│   │   ├── database/                   # Quản lý CSDL tập trung & chuẩn hóa
│   │   │   ├── tables.js               # 1 file duy nhất chứa toàn bộ DDL 13 bảng & migrations
│   │   │   ├── seedData.js             # Dữ liệu sẵn tách biệt (Admin, 37 địa điểm, paths...)
│   │   │   ├── seeders.js              # Các hàm cập nhật, nạp dữ liệu ban đầu & bảo trì
│   │   │   └── index.js                # Điều phối trung tâm khởi tạo Database
│   │   ├── middlewares/                # Bộ lọc & kiểm tra trung gian
│   │   │   └── authMiddleware.js       # Xác thực JWT Token & kiểm tra quyền
│   │   ├── models/                     # Mô hình dữ liệu
│   │   │   └── userModel.js            # Thao tác dữ liệu người dùng
│   │   ├── routes/                     # Định tuyến API endpoints
│   │   │   ├── adminRoutes.js          # /api/admin/*
│   │   │   ├── authRoutes.js           # /api/auth/*
│   │   │   ├── campusRoutes.js         # /api/campus/*
│   │   │   ├── generalRoutes.js        # /api/general/*
│   │   │   ├── newsRoutes.js           # /api/news/*
│   │   │   └── studentRoutes.js        # /api/student/* (Lịch học, điểm, hồ sơ)
│   │   ├── services/                   # Tầng dịch vụ chuyên sâu
│   │   │   ├── cronService.js          # Lập lịch tác vụ nền tự động
│   │   │   ├── gradeService.js         # Tính toán bảng điểm, GPA thang 4 & thang 10
│   │   │   ├── newsService.js          # Thu thập & xử lý tin tức trường
│   │   │   ├── scheduleService.js      # Phân tích TKB, chỉ đường phòng học, gom nhóm
│   │   │   └── studentSyncService.js   # Đồng bộ dữ liệu đào tạo & bảo lưu lịch tự tạo
│   │   └── server.js                   # Điểm khởi chạy chính Backend Server (Port 5000)
│   ├── env.example                     # Mẫu biến môi trường backend
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── frontend/                           # Ứng dụng di động (React Native / Expo SDK 54 / TS)
│   ├── app/                            # Điều hướng & các màn hình (Expo Router)
│   │   ├── (auth)/                     # Phân hệ Xác thực tài khoản
│   │   │   ├── _layout.tsx             # Layout nhóm xác thực
│   │   │   ├── index.tsx               # Màn hình Đăng nhập
│   │   │   └── forgot-password.tsx     # Quên mật khẩu & xác thực OTP qua Email
│   │   ├── (main)/                     # Phân hệ Ứng dụng chính (Bottom Tabs Navigation)
│   │   │   ├── _layout.tsx             # Cấu hình thanh điều hướng Bottom Tab
│   │   │   ├── feedback/
│   │   │   │   └── index.tsx           # Gửi ý kiến phản hồi & góp ý
│   │   │   ├── grades/
│   │   │   │   ├── index.tsx           # Bảng điểm tổng quan & GPA các kỳ
│   │   │   │   └── grades_detail.tsx   # Chi tiết môn học & điểm thành phần
│   │   │   ├── home/
│   │   │   │   ├── index.tsx           # Trang chủ Dashboard sinh viên
│   │   │   │   ├── home_detail.tsx     # Chi tiết bài viết / tin tức
│   │   │   │   └── all_articles.tsx    # Danh sách tất cả bài viết & thông báo
│   │   │   ├── map/
│   │   │   │   └── index.tsx           # Bản đồ số khuôn viên trường tương tác
│   │   │   ├── profile/
│   │   │   │   ├── index.tsx           # Hồ sơ cá nhân, thông tin liên hệ, avatar
│   │   │   │   └── change_password.tsx # Đổi mật khẩu tài khoản
│   │   │   ├── schedule/
│   │   │   │   └── index.tsx           # Thời khóa biểu thông minh & CRUD lịch học
│   │   │   └── sos/
│   │   │       └── index.tsx           # Cảnh báo khẩn cấp SOS tới an ninh trường
│   │   ├── _layout.tsx                 # Root layout toàn ứng dụng & Theme Provider
│   │   └── index.tsx                   # Màn hình Splash / Điều phối phiên đăng nhập
│   ├── assets/                         # Tài nguyên tĩnh
│   │   └── images/
│   │       ├── favicon.png             # Icon ứng dụng
│   │       └── images.jpg              # Ảnh bìa khuôn viên trường Đại học Tây Nguyên
│   ├── src/
│   │   ├── components/                 # Thành phần giao diện tái sử dụng
│   │   │   ├── AuthHeader.tsx          # Tiêu đề form đăng nhập / đăng ký
│   │   │   ├── LoginRequiredCard.tsx   # Thẻ nhắc đăng nhập khi chưa có phiên
│   │   │   ├── MainTabs.tsx            # Thanh tab điều hướng tùy biến
│   │   │   └── NavHeader.tsx           # Header điều hướng trang con
│   │   ├── constants/                  # Hằng số toàn cục
│   │   │   ├── appColors.ts            # Bảng màu chủ đạo của ứng dụng
│   │   │   └── globalStyles.ts         # Kiểu dáng dùng chung toàn hệ thống
│   │   ├── features/                   # Tính năng chuyên biệt
│   │   │   └── map/                    # Module Bản đồ số Leaflet tích hợp WebView
│   │   │       ├── components/         # Giao diện bản đồ đã Memoized tránh re-render
│   │   │       │   ├── MapControlsOverlay.tsx     # Nút điều khiển xoay la bàn, layer, zoom
│   │   │       │   ├── MapLocationDetailCard.tsx  # Thẻ thông tin chi tiết địa điểm & chỉ đường
│   │   │       │   ├── MapLocationPickerModal.tsx # Modal chọn GPS thực tế hoặc vị trí test
│   │   │       │   └── MapSearchBar.tsx           # Thanh tìm kiếm địa điểm có gợi ý tức thì
│   │   │       ├── hooks/              # Custom Hooks tối ưu CPU, RAM & chu kỳ GPS
│   │   │       │   ├── useMapData.ts              # Quản lý nạp dữ liệu, tìm kiếm & khoảng cách
│   │   │       │   └── useMapGps.ts               # Xử lý GPS 1-lần, la bàn throttle & hủy khi blur
│   │   │       ├── services/           # Dịch vụ đệm dữ liệu siêu tốc & tải ngầm
│   │   │       │   └── mapCache.ts                # Cache bộ nhớ 5 phút + Offline AsyncStorage
│   │   │       ├── constants.ts        # Hằng số bản đồ, ranh giới khuôn viên & 37 địa điểm
│   │   │       ├── index.ts            # Entry point xuất module bản đồ
│   │   │       ├── leafletBundle.ts    # Bundle thư viện Leaflet offline
│   │   │       ├── leafletHtml.ts      # Template HTML render bản đồ, requestAnimationFrame clip
│   │   │       ├── types.ts            # Kiểu dữ liệu TypeScript cho địa điểm & đường đi
│   │   │       └── utils.ts            # Tiện ích tính khoảng cách Haversine & phân tích phòng học
│   │   ├── services/                   # Tầng gọi API kết nối máy chủ
│   │   │   ├── api.ts                  # Axios client, tự động nhận diện IP, token
│   │   │   └── get_IPv4.ts             # Tiện ích phát hiện IP LAN máy chủ
│   │   └── styles/                     # Định nghĩa giao diện & chủ đề
│   │       ├── common.styles.ts        # Styles chung
│   │       ├── index.ts                # Tổng hợp styles
│   │       ├── screen.styles.ts        # Styles các màn hình
│   │       └── theme.ts                # Theme màu sắc, typography
│   ├── app.json                        # Cấu hình dự án Expo
│   ├── package.json                    # Danh sách thư viện & scripts Expo
│   ├── package-lock.json
│   ├── tsconfig.json                   # Cấu hình TypeScript
│   ├── eslint.config.js                # Cấu hình ESLint
│   └── README.md
│
├── .gitignore                          # Cấu hình bỏ qua tệp tin Git
└── README.md                           # Tài liệu hướng dẫn & tổng quan dự án
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
