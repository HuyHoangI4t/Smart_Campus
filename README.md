# 🎓 SMART CAMPUS - ỨNG DỤNG SỔ TAY & TIỆN ÍCH SINH VIÊN

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
</p>

> **Smart Campus** là giải pháp hệ sinh thái ứng dụng toàn diện hỗ trợ sinh viên trường **Đại học Tây Nguyên**:
> - 📱 **Ứng dụng di động (Mobile App):** Tra cứu điểm số, thời khóa biểu thông minh, bản đồ khuôn viên với dẫn đường nội bộ (thuật toán Dijkstra), la bàn định hướng và các tiện ích sinh viên.
> - 💻 **Cổng quản trị (Admin Portal):** Quản lý tài khoản sinh viên (hỗ trợ avatar), duyệt phản hồi, cảnh báo SOS thời gian thực qua Socket.IO, chỉnh sửa 37 địa điểm và vẽ mạng lưới đường nội bộ trực tiếp trên bản đồ số.
> - ⚡ **Khởi động 1 chạm:** Kèm sẵn script `start_all.bat` khởi chạy đồng thời Backend, Admin Portal và Mobile App.

---

## 📸 1. Ảnh minh họa & Giao diện ứng dụng (Screenshots / Demo)

<p align="center">
  <img src="frontend/assets/images/images.jpg" alt="Khuôn viên trường Đại học Tây Nguyên" width="720" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <br>
  <em>Khuôn viên trường Đại học Tây Nguyên (Tay Nguyen University)</em>
</p>

### 📱 Giao diện chính của ứng dụng di động Smart Campus

| 🔐 Đăng nhập hệ thống | 📝 Đăng ký tài khoản | 📩 Xác thực OTP Email |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100158.png" width="240" alt="Đăng nhập" /> | <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100245.png" width="240" alt="Đăng ký" /> | <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100326.png" width="240" alt="Xác thực OTP Email" /> |
| *Đăng nhập bằng MSSV / Email hoặc Khách* | *Đăng ký tài khoản sinh viên* | *Gửi & xác thực OTP qua Email trường* |

| 🏠 Trang chủ (Dashboard) | 📅 Thời khóa biểu theo tuần | 🧭 Chỉ đường & Bản đồ số |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100501.png" width="240" alt="Trang chủ" /> | <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100509.png" width="240" alt="Thời khóa biểu" /> | <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100515.png" width="240" alt="Chỉ đường phòng học" /> |
| *Lớp học tiếp theo, tin tức & lối tắt* | *Lịch học theo tuần, xem phòng & GV* | *Dẫn đường Dijkstra, xoay theo góc đường* |

| 📊 Kết quả học tập (Điểm) | 👤 Hồ sơ sinh viên | 🔒 Đổi mật khẩu |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100524.png" width="240" alt="Kết quả học tập" /> | <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100544.png" width="240" alt="Hồ sơ sinh viên" /> | <img src="frontend/assets/Screenshots%20_Demo/Screenshot%202026-10-09%20100555.png" width="240" alt="Đổi mật khẩu" /> |
| *GPA hệ 10 & 4, tín chỉ & lọc kỳ* | *Thông tin sinh viên & avatar* | *Cập nhật mật khẩu bảo mật* |

---

## ✨ 2. Tính năng nổi bật (Key Features)

### 📱 Ứng dụng Di động (Mobile App):
- **🔐 Xác thực linh hoạt:**
  - Đăng nhập bằng MSSV / Mật khẩu (bảo mật `bcryptjs`).
  - Hỗ trợ **Chế độ Khách (Guest Mode)**: Trải nghiệm bản đồ và thông tin trường mà không bị làm phiền bởi các thông báo xin quyền vị trí, bộ nhớ, camera.
  - Quên mật khẩu & gửi mã OTP xác thực qua Email sinh viên (`@sv.ttn.edu.vn`).
- **🗺️ Bản đồ & Dẫn đường thông minh (Campus Map & Navigation):**
  - **Thuật toán Dijkstra:** Tìm tuyến đường đi bộ ngắn nhất giữa các tòa nhà trong trường dựa trên mạng lưới đường nội bộ.
  - **Trải nghiệm như Google Maps:** Khi bấm bắt đầu chỉ đường, bản đồ tự động zoom cận cảnh và xoay theo hướng đường di chuyển.
  - **Biểu tượng vị trí hình tam giác:** Tích hợp la bàn (Compass / Heading) hiển thị hướng nhìn thực tế của người dùng và đưa vị trí về tâm màn hình.
  - **Lọc rung lắc cảm biến:** Thuật toán làm mịn góc quay (ngưỡng lệch $\ge 8^\circ$ và giới hạn tối thiểu 450ms) giúp tiết kiệm pin và chống giật.
  - **Tự động ẩn thanh điều hướng (Bottom Tabs):** Tối ưu hóa toàn bộ diện tích màn hình khi đang trong chế độ dẫn đường.
  - **37 Địa điểm trọng điểm:** Tòa nhà điều hành, Thư viện, Giảng đường A1-A6, B1-B3, Ký túc xá, Sân vận động, Căn tin...
- **📅 Thời khóa biểu thông minh (Schedule):**
  - Xem lịch học theo tuần và ngày, hiển thị phòng học, tiết học, giảng viên.
  - Thêm / chỉnh sửa lịch học bù, thực hành đột xuất: Giao diện thẻ **Ngày học** tự động đồng bộ thứ trong tuần, ô **Tiết học** full-width với danh sách chọn nhanh mượt mà.
- **📊 Kết quả học tập (Grades):**
  - Tra cứu điểm thành phần, chuyên cần, thi, điểm chữ.
  - Tự động tính toán điểm trung bình tích lũy GPA (thang 10 & thang 4), tổng tín chỉ đạt.
- **🚨 Tiện ích sinh viên:**
  - Gửi ý kiến phản hồi (Feedback) về cơ sở vật chất, dịch vụ đào tạo.
  - Nút cấp cứu khẩn cấp **SOS Alert** truyền tọa độ tức thời về ban an ninh.
  - Quản lý hồ sơ cá nhân: Cập nhật số điện thoại, lớp, đổi ảnh đại diện (camera, thư viện hoặc URL).

### 💻 Trang Quản trị viên (Admin Portal - Port 5001):
- **📊 Bảng điều khiển (Dashboard):** Biểu đồ tương tác thời gian thực, thống kê người dùng, phản hồi, cảnh báo SOS.
- **👥 Quản lý người dùng (Users):**
  - Xem danh sách sinh viên & quản trị viên với **Avatar thực tế** (ảnh URL và ảnh Base64).
  - Modal thêm/sửa tài khoản tích hợp **xem trước và tải ảnh đại diện** trực quan.
  - Tìm kiếm đa năng theo MSSV, Họ tên, Email, Lớp, Khoa.
- **🗺️ Quản lý bản đồ & đường nội bộ:**
  - Thêm, sửa, xóa 37 địa điểm khuôn viên trường.
  - Trực tiếp vẽ, chỉnh sửa và khôi phục mạng lưới đường đi bộ nội bộ (Campus Paths) trên bản đồ Leaflet.
- **⚡ Kết nối Realtime (Socket.IO):** Cập nhật ngay lập tức các phản hồi và tín hiệu SOS của sinh viên mà không cần tải lại trang.

---

## 🛠️ 3. Công nghệ sử dụng (Tech Stack)

| Phân hệ | Công nghệ & Thư viện chính |
| :--- | :--- |
| **Frontend** | React Native `0.81.5`, Expo SDK `54`, TypeScript `5.9`, Expo Router `v6`, React Native WebView, Leaflet `1.9`, Reanimated `4.1` |
| **Backend** | Node.js (ES6+), Express.js `4.21`, Socket.IO `4.8`, MySQL2 (Connection Pool), bcryptjs, Nodemailer, Cheerio, Axios |
| **Database** | MySQL 8.0 (Cơ chế tự động tạo schema & nạp seeders khi khởi động) |
| **Admin Portal** | HTML5 / Vanilla JS (ES6 Modules), Tailwind CSS, Lucide Icons, Leaflet.js |
| **Tài liệu API** | OpenAPI 3.0 / Swagger UI (`swagger-ui-express`) |

---

## 🚀 4. Hướng dẫn khởi chạy nhanh (Quick Start)

### Yêu cầu hệ thống:
- [Node.js](https://nodejs.org/) (Phiên bản `>= 18.x`)
- [MySQL Server](https://www.mysql.com/) hoặc [XAMPP](https://www.apachefriends.org/) (chạy cổng `3306`)
- Ứng dụng **Expo Go** trên điện thoại Android / iOS (để test Mobile App)

---

### ⚡ CÁCH 1: Khởi động 1 chạm bằng file `.bat` (Khuyên dùng trên Windows)

Chỉ cần **nhấp đúp chuột (Double Click)** vào file:
👉 **[start_all.bat](file:///e:/LTDDDNT/start_all.bat)** (hoặc `run.bat`)

File sẽ tự động mở 3 cửa sổ console chạy đồng thời:
1. `BACKEND API (Port 5000)`: Khởi chạy Node.js server, kết nối MySQL và Socket.IO.
2. `ADMIN PORTAL (Port 5001)`: Khởi chạy máy chủ giao diện Web Admin.
3. `FRONTEND APP (Expo)`: Khởi chạy Expo Metro bundler, hiển thị mã QR để quét bằng điện thoại.

---

### 🛠️ CÁCH 2: Khởi động thủ công từng phần bằng Terminal

#### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL
Mở MySQL CLI, phpMyAdmin hoặc Navicat và tạo database:
```sql
CREATE DATABASE smartcampus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Bước 2: Chạy Backend Server
```bash
cd backend
npm install
npm run dev
```
> 💡 **Tự động hóa:** File `src/server.js` sẽ tự động kết nối MySQL, tạo toàn bộ 13 bảng dữ liệu và chèn sẵn tài khoản admin, 37 địa điểm và đường nội bộ mà bạn không cần import file SQL thủ công.
- **API Health:** `http://localhost:5000/api/health`
- **Swagger Docs:** `http://localhost:5000/api-docs`

#### Bước 3: Chạy Admin Portal
```bash
cd admin
npm install
npm start
```
- Truy cập trình duyệt: `http://localhost:5001`
- Tài khoản quản trị mặc định: `admin` / Mật khẩu: `admin123`

#### Bước 4: Chạy Mobile App (Frontend)
```bash
cd frontend
npm install
npx expo start
```
- Mở ứng dụng **Expo Go** trên điện thoại, quét mã QR trên màn hình console để trải nghiệm app.

---

## 📁 5. Cấu trúc thư mục dự án (Project Structure)

```text
LTDDDNT/
├── start_all.bat                       # Script khởi động 1 chạm cả 3 hệ thống
├── run.bat                             # Shortcut chạy start_all.bat
│
├── admin/                              # Web Portal Quản trị viên (Port 5001)
│   ├── public/                         # Mã nguồn giao diện Admin tĩnh
│   │   ├── css/style.css               # Phong cách giao diện Admin
│   │   ├── js/
│   │   │   ├── api.js                  # Gọi REST API kết nối Backend
│   │   │   ├── app.js                  # Điều phối chung, Realtime Socket.IO
│   │   │   ├── dashboard.js            # Thống kê & biểu đồ hoạt động
│   │   │   ├── feedback.js             # Quản lý & duyệt phản hồi
│   │   │   ├── locations.js            # Quản lý 37 địa điểm khuôn viên
│   │   │   ├── notifications.js        # Phát thông báo toàn trường
│   │   │   ├── sos.js                  # Xử lý cảnh báo khẩn cấp SOS
│   │   │   └── users.js                # Quản lý sinh viên/admin, ảnh đại diện
│   │   └── index.html                  # Giao diện chính Admin Dashboard
│   ├── package.json                    # Cấu hình gói Admin
│   └── server.js                       # HTTP server phục vụ Admin Portal
│
├── backend/                            # REST API Server & Xử lý nghiệp vụ (Port 5000)
│   ├── src/
│   │   ├── config/                     # Cấu hình CSDL, Swagger UI
│   │   │   ├── db.js                   # Kết nối MySQL Pool (hỗ trợ DB_SSL)
│   │   │   ├── initDb.js               # Điểm kết nối khởi tạo tự động
│   │   │   └── swagger.js              # Tài liệu OpenAPI / Swagger
│   │   ├── controllers/                # Bộ điều khiển nghiệp vụ
│   │   │   ├── adminController.js      # CRUD người dùng (hỗ trợ avatar), map, SOS
│   │   │   ├── authController.js       # Đăng nhập, đăng ký, OTP Email, profile
│   │   │   ├── campusController.js     # Bản đồ, định tuyến đường, phản hồi, SOS
│   │   │   ├── generalController.js    # Thông báo, khảo sát
│   │   │   ├── newsController.js       # Tin tức trường học
│   │   │   └── studentController.js    # Bảng điểm, TKB, lịch thực hành
│   │   ├── database/                   # Quản lý schema CSDL tập trung
│   │   │   ├── tables.js               # Định nghĩa DDL toàn bộ 13 bảng
│   │   │   ├── seedData.js             # 37 địa điểm, tài khoản mẫu, đường nội bộ
│   │   │   ├── seeders.js              # Hàm nạp dữ liệu mặc định
│   │   │   └── index.js                # Điều phối khởi tạo CSDL
│   │   ├── middlewares/                # Middleware xác thực JWT & quyền Admin
│   │   ├── routes/                     # Định tuyến API
│   │   ├── services/                   # Dịch vụ nền (Cron sync, Grade, Schedule)
│   │   └── server.js                   # Entry point máy chủ Express & Socket.IO
│   ├── .env.example                    # Mẫu cấu hình môi trường backend
│   └── package.json
│
├── frontend/                           # Ứng dụng di động Expo / React Native
│   ├── app/                            # Expo Router (Cấu trúc định tuyến màn hình)
│   │   ├── (auth)/                     # Đăng nhập, đăng ký, quên mật khẩu
│   │   ├── (main)/                     # Các tab chính ứng dụng
│   │   │   ├── home/                   # Trang chủ Dashboard sinh viên
│   │   │   ├── map/                    # Bản đồ Leaflet, dẫn đường Dijkstra
│   │   │   ├── schedule/               # Thời khóa biểu & thêm lịch học
│   │   │   ├── grades/                 # Kết quả học tập & tra cứu GPA
│   │   │   ├── profile/                # Hồ sơ cá nhân & đổi mật khẩu
│   │   │   ├── feedback/               # Gửi ý kiến đóng góp
│   │   │   └── sos/                    # Nút báo động khẩn cấp
│   │   └── _layout.tsx                 # Root layout toàn ứng dụng
│   ├── src/
│   │   ├── components/                 # Header, MainTabs đồng bộ giao diện
│   │   ├── features/map/               # Module bản đồ chuyên sâu
│   │   │   ├── hooks/useMapGps.ts      # Xử lý GPS, la bàn hướng nhìn
│   │   │   ├── leafletHtml.ts          # Template bản đồ tương tác
│   │   │   └── utils.ts                # Thuật toán tìm đường & phòng học
│   │   └── services/                   # Kết nối API, phân quyền khách
│   ├── app.json                        # Cấu hình dự án Expo
│   └── package.json
└── README.md
```

---

## 👥 6. Tác giả & Thành viên thực hiện (Authors)

Dự án được thực hiện phục vụ học phần **Lập trình ứng dụng đa nền tảng (LTUDDNT)** - Trường **Đại học Tây Nguyên**:

| STT | Họ và tên | Mã sinh viên | Vai trò | Email liên hệ |
|:---:|:---|:---:|:---|:---|
| 1 | **Nguyễn Huy Hoàng** | **23103023** | **Trưởng nhóm (Leader)** | [huyhoangpro187@gmail.com](mailto:huyhoangpro187@gmail.com) |
| 2 | **Lê Xuân Hoàng** | **23103022** | Thành viên | |
| 3 | **Nguyễn Thị Mỹ Duyên** | **23103095** | Thành viên | |
| 4 | **Mai Đàm Thế Kiên** | **23103035** | Thành viên | |

---

## 📄 7. Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**.

<p align="center">
  Made with ❤️ by <strong>Smart Campus Team</strong> • Đại học Tây Nguyên
</p>
