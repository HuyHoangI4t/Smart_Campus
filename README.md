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
> - 💻 **Cổng quản trị (Admin Portal):** Quản lý tài khoản sinh viên, duyệt phản hồi, cảnh báo SOS thời gian thực qua Socket.IO, chỉnh sửa 37 địa điểm và vẽ mạng lưới đường nội bộ trực tiếp trên bản đồ số.
> - ⚡ **Khởi động 1 chạm:** Kèm sẵn script `start_all.bat` khởi chạy đồng thời Backend, Admin Portal và Mobile App.
> - 🚀 **Tối ưu hóa quy mô lớn:** Hệ thống Cache TTL + Rate Limiter bảo vệ cổng trường khi có 1,000–10,000 sinh viên đồng thời.

---

## 📸 1. Ảnh minh họa & Giao diện ứng dụng (Screenshots / Demo)

<p align="center">
  <img src="frontend/assets/images/images.jpg" alt="Khuôn viên trường Đại học Tây Nguyên" width="720" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <br>
  <em>Khuôn viên trường Đại học Tây Nguyên (Tay Nguyen University)</em>
</p>

### 📱 Giao diện ứng dụng di động Smart Campus

#### 🔐 1. Xác thực & Đăng ký tài khoản (Authentication & OTP)
| 🔐 Đăng nhập hệ thống | 📝 Đăng ký tài khoản | 📩 Xác thực OTP Email (60s) |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/01_auth_login.jpg" width="240" alt="Đăng nhập" /> | <img src="frontend/assets/Screenshots%20_Demo/02_auth_register.jpg" width="240" alt="Đăng ký" /> | <img src="frontend/assets/Screenshots%20_Demo/03_auth_otp_verify.jpg" width="240" alt="Xác thực OTP Email" /> |
| *Đăng nhập bằng MSSV / Email hoặc Chế độ Khách* | *Đăng ký tài khoản sinh viên mới* | *Xác thực mã OTP 6 số & nút gửi lại sau 60s* |

#### 🏠 2. Trang chủ & Tin tức nhà trường (Home Dashboard & News)
| 🏠 Trang chủ (Dashboard) | 📢 Thông báo & Tin tức |
| :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/04_home_dashboard.jpg" width="240" alt="Trang chủ Dashboard" /> | <img src="frontend/assets/Screenshots%20_Demo/05_home_announcements_news.jpg" width="240" alt="Thông báo & Tin tức" /> |
| *Lớp học kế tiếp, GPA, tác vụ nhanh & cảnh báo* | *Thông báo sinh viên & tin tức hoạt động* |

#### 📅 3. Thời khóa biểu thông minh (Smart Schedule)
| 📅 Lịch học theo tuần & ngày | 🧭 Chỉ đường tới phòng học | ➕ Thêm lịch bù / thực hành |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/06_schedule_weekly.jpg" width="240" alt="Lịch học theo tuần" /> | <img src="frontend/assets/Screenshots%20_Demo/07_schedule_room_directions.jpg" width="240" alt="Chỉ dẫn phòng học" /> | <img src="frontend/assets/Screenshots%20_Demo/08_schedule_add_custom.jpg" width="240" alt="Thêm lịch học cá nhân" /> |
| *Lịch học theo tuần, xem phòng, tiết & GV* | *Lộ trình di chuyển chi tiết từ cổng tới phòng* | *Tùy chỉnh lịch học bù, thực hành đột xuất* |

#### 🗺️ 4. Bản đồ số & Dẫn đường nội bộ (Campus Map & Navigation)
| 🗺️ Tổng quan khuôn viên 37 địa điểm | 🧭 Dẫn đường Dijkstra & Đổi cổng vào |
| :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/09_map_campus_overview.jpg" width="240" alt="Bản đồ khuôn viên" /> | <img src="frontend/assets/Screenshots%20_Demo/10_map_routing_navigation.jpg" width="240" alt="Dẫn đường Dijkstra" /> |
| *Tìm kiếm tòa nhà, chip lọc loại & thẻ chi tiết* | *Đường đi bộ Dijkstra, đổi cổng & thanh trạng thái đáy* |

#### 📊 5. Kết quả học tập (Grades & Academic)
| 📊 Bảng điểm tổng quan & GPA | 📑 Chi tiết điểm thành phần |
| :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/11_grades_overview.jpg" width="240" alt="Kết quả học tập" /> | <img src="frontend/assets/Screenshots%20_Demo/12_grades_detail.jpg" width="240" alt="Chi tiết bảng điểm" /> |
| *GPA hệ 10 & 4, tín chỉ tích lũy & lọc học kỳ* | *Điểm quá trình, thực hành, thi 1, thi 2 & học phần* |

#### 👤 6. Hồ sơ sinh viên & Bảo mật tài khoản (Profile & Security)
| 👤 Hồ sơ sinh viên | ⚙️ Cài đặt & Đăng xuất | ✏️ Cập nhật hồ sơ & Avatar |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/13_profile_overview.jpg" width="240" alt="Hồ sơ sinh viên" /> | <img src="frontend/assets/Screenshots%20_Demo/14_profile_security.jpg" width="240" alt="Cài đặt & Bảo mật" /> | <img src="frontend/assets/Screenshots%20_Demo/15_profile_edit.jpg" width="240" alt="Cập nhật hồ sơ" /> |
| *Thông tin sinh viên, khoa, lớp, email & SĐT* | *Bảo mật tài khoản & nút đăng xuất thiết bị* | *Chỉnh sửa thông tin liên hệ & đổi ảnh đại diện* |

| 🔒 Đổi mật khẩu tài khoản | 🚪 Xác nhận đăng xuất |
| :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/16_profile_change_password.jpg" width="240" alt="Đổi mật khẩu" /> | <img src="frontend/assets/Screenshots%20_Demo/17_profile_logout_confirm.jpg" width="240" alt="Xác nhận đăng xuất" /> |
| *Cập nhật mật khẩu mới an toàn* | *Hộp thoại xác nhận đăng xuất khỏi thiết bị* |

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
  - **Biểu tượng vị trí hình tam giác:** Tích hợp la bàn hiển thị hướng nhìn thực tế của người dùng và đưa vị trí về tâm màn hình.
  - **Lọc rung lắc cảm biến:** Thuật toán làm mịn góc quay (ngưỡng lệch ≥ 8° và giới hạn tối thiểu 450ms) giúp tiết kiệm pin và chống giật.
  - **Tự động ẩn thanh điều hướng (Bottom Tabs):** Tối ưu hóa toàn bộ diện tích màn hình khi đang trong chế độ dẫn đường.
  - **37 Địa điểm trọng điểm:** Tòa nhà điều hành, Thư viện, Giảng đường A1-A6, B1-B3, Ký túc xá, Sân vận động, Căn tin...
- **📅 Thời khóa biểu thông minh (Schedule):**
  - Xem lịch học theo tuần và ngày, hiển thị phòng học, tiết học, giảng viên.
  - Thêm / chỉnh sửa lịch học bù, thực hành đột xuất: Giao diện thẻ **Ngày học** tự động đồng bộ thứ trong tuần, ô **Tiết học** full-width với danh sách chọn nhanh mượt mà.
  - Vuốt xuống (Pull-to-Refresh) để đồng bộ lịch mới nhất từ cổng trường.
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

## 🚀 3. Kiến trúc tối ưu hóa quy mô lớn (Scalability Architecture)

Hệ thống được thiết kế để phục vụ **1,000 – 10,000 sinh viên** mà **không làm quá tải** cổng tra cứu `ttn.edu.vn` của trường:

### 🗄️ Chiến lược Cache TTL (Time-To-Live) trong Database

```
Student requests grades/schedule
        │
        ▼
  ┌─────────────────────────┐
  │   Check DB Cache TTL    │
  │  Grades:   12 giờ       │
  │  Schedule: 24 giờ       │
  └─────────┬───────────────┘
            │
     Cache còn hạn?
      ┌─────┴──────┐
      │ Có         │ Hết hạn / Chưa có
      ▼            ▼
  Trả từ DB    Enqueue → Rate Limiter → Cào ttn.edu.vn
  (0ms, 0 req)  (max 3 đồng thời, 200ms gap)
                     │
                     ▼
              Lưu vào MySQL → Trả về app
```

| Thành phần | Giá trị | Mục đích |
|:---|:---:|:---|
| `TTL_GRADES_MS` | 12 giờ | Cache bảng điểm — chỉ cào lại sau 12h |
| `TTL_SCHEDULE_MS` | 24 giờ | Cache thời khóa biểu — chỉ cào lại sau 24h |
| `MAX_CONCURRENT_TTN` | 3 | Tối đa 3 request đồng thời tới `ttn.edu.vn` |
| Gap giữa requests | 200ms | Bảo vệ cổng tra cứu trường khỏi bị quá tải |
| Pacing cron batch | 350ms | Thời gian nghỉ giữa mỗi sinh viên trong batch |
| Batch size cron | 30 SV | Số sinh viên mỗi lần đồng bộ nền |

### ⚡ Các cơ chế bảo vệ

1. **In-Flight Deduplication** — Nếu 1000 sinh viên cùng xem điểm của MSSV `23103023` vào cùng lúc, chỉ **1 request duy nhất** được gửi tới `ttn.edu.vn`, 999 request còn lại chờ và nhận kết quả từ cùng Promise.

2. **Rate Limiter Queue** — Hàng đợi FIFO tự động, đảm bảo tối đa `MAX_CONCURRENT_TTN = 3` request đồng thời tới web trường, 200ms giữa các request liên tiếp.

3. **Smart Batch Sync (Cron)** — Cron chạy lúc **06:00, 12:00, 18:00** (Asia/Ho_Chi_Minh). Chỉ đồng bộ những sinh viên có cache **đã quá hạn TTL**, ưu tiên cache cũ nhất trước.

4. **Data Pruning** — Tự động xóa lịch học chính khóa (`is_custom = 0`) cũ hơn **45 ngày** trước mỗi lần batch sync, giữ DB luôn gọn. Lịch học tự tạo của sinh viên (`is_custom = 1`) **không bao giờ bị xóa**.

5. **Fallback Cache** — Nếu cào thất bại (ttn.edu.vn không phản hồi), hệ thống vẫn trả dữ liệu cũ từ DB thay vì báo lỗi cho sinh viên.

### 📈 Ước lượng hiệu suất

| Quy mô | Không có Cache | Với Cache TTL |
|:---|:---:|:---:|
| 100 sinh viên đăng nhập cùng lúc | 100 request → ttn.edu.vn | ~0 request (cache hit) |
| 1,000 sinh viên/ngày | 1,000+ request | ≤ 30 request (cron batch/lần) |
| 10,000 sinh viên/ngày | **Quá tải ttn.edu.vn** | ≤ 30 request (cron batch/lần) |

---

## 🛠️ 4. Công nghệ sử dụng (Tech Stack)

| Phân hệ | Công nghệ & Thư viện chính |
| :--- | :--- |
| **Frontend** | React Native `0.81.5`, Expo SDK `54`, TypeScript `5.9`, Expo Router `v6`, React Native WebView, Leaflet `1.9`, Reanimated `4.1` |
| **Backend** | Node.js (ES6+), Express.js `4.21`, Socket.IO `4.8`, MySQL2 (Connection Pool), bcryptjs, Nodemailer, Cheerio, Axios |
| **Database** | MySQL 8.0 (Cơ chế tự động tạo schema & nạp seeders khi khởi động) |
| **Admin Portal** | HTML5 / Vanilla JS (ES6 Modules), Tailwind CSS, Lucide Icons, Leaflet.js |
| **Tài liệu API** | OpenAPI 3.0 / Swagger UI (`swagger-ui-express`) |
| **Tối ưu hóa** | Cache TTL Strategy, Rate Limiter Queue, In-Flight Dedup, Data Pruning, Cron Smart Batch |

---

## 🚀 5. Hướng dẫn khởi chạy nhanh (Quick Start)

### Yêu cầu hệ thống:
- [Node.js](https://nodejs.org/) (Phiên bản `>= 18.x`)
- [MySQL Server](https://www.mysql.com/) hoặc [XAMPP](https://www.apachefriends.org/) (chạy cổng `3306`)
- Ứng dụng **Expo Go** trên điện thoại Android / iOS (để test Mobile App)

---

### ⚡ CÁCH 1: Khởi động 1 chạm bằng file `.bat` (Khuyên dùng trên Windows)

Chỉ cần **nhấp đúp chuột (Double Click)** vào file:
👉 **`start_all.bat`** (hoặc `run.bat`)

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

## 📁 6. Cấu trúc thư mục dự án (Project Structure)

```text
LTDDDNT/
├── start_all.bat                       # Script khởi động 1 chạm cả 3 hệ thống
├── run.bat                             # Shortcut chạy start_all.bat
│
├── admin/                              # Web Portal Quản trị viên (Port 5001)
│   ├── public/                         # Mã nguồn giao diện Admin tĩnh
│   │   ├── css/style.css               # Phong cách giao diện Admin
│   │   ├── js/
│   │   │   ├── api.js                  # Gọi REST API + token cache in-memory
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
│   │   │   └── studentController.js    # Điểm & TKB (TTL cache + fallback)
│   │   ├── database/                   # Quản lý schema CSDL tập trung
│   │   │   ├── tables.js               # Định nghĩa DDL toàn bộ 13 bảng
│   │   │   ├── seedData.js             # 37 địa điểm, tài khoản mẫu, đường nội bộ
│   │   │   ├── seeders.js              # Hàm nạp dữ liệu mặc định
│   │   │   └── index.js                # Điều phối khởi tạo CSDL
│   │   ├── middlewares/                # Middleware xác thực JWT & quyền Admin
│   │   ├── routes/                     # Định tuyến API
│   │   ├── services/
│   │   │   ├── studentSyncService.js   # ⭐ Rate Limiter + Cache TTL + Dedup + Pruning
│   │   │   ├── cronService.js          # Cron tự động (06:00, 12:00, 18:00 ICT)
│   │   │   ├── gradeService.js         # Xử lý & tính toán điểm số GPA
│   │   │   ├── scheduleService.js      # Parse & format thời khóa biểu
│   │   │   └── newsService.js          # Cào tin tức từ ttn.edu.vn
│   │   └── server.js                   # Entry point Express + Socket.IO
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

## ⚙️ 7. Cấu hình môi trường (Environment Variables)

Tạo file `.env` trong thư mục `backend/` (xem mẫu tại `backend/.env.example`):

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=smartcampus

# JWT
JWT_SECRET=your_secret_key_here

# Email OTP (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Optional: SSL (cho MySQL Cloud)
# DB_SSL=true
```

---

## 🔌 8. API Endpoints chính (REST API)

| Phương thức | Endpoint | Mô tả |
|:---:|:---|:---|
| `POST` | `/api/auth/login` | Đăng nhập sinh viên |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới |
| `POST` | `/api/auth/send-otp` | Gửi OTP xác thực qua Email |
| `GET` | `/api/grades?mssv=...` | Lấy bảng điểm (cache TTL 12h) |
| `GET` | `/api/schedule?mssv=...` | Lấy thời khóa biểu (cache TTL 24h) |
| `GET` | `/api/schedule?mssv=...&reload=true` | Bỏ qua cache, cào ngay từ trường |
| `POST` | `/api/schedule/custom` | Thêm lịch học thủ công |
| `PUT` | `/api/schedule/custom/:id` | Sửa lịch học thủ công |
| `DELETE` | `/api/schedule/custom/:id` | Xóa lịch học thủ công |
| `GET` | `/api/map/locations` | Danh sách 37 địa điểm |
| `GET` | `/api/map/paths` | Mạng lưới đường nội bộ |
| `GET` | `/api/news` | Tin tức từ cổng trường |
| `GET` | `/api/notifications` | Thông báo từ trường |
| `POST` | `/api/feedback` | Gửi phản hồi |
| `POST` | `/api/sos` | Gửi tín hiệu SOS khẩn cấp |
| `GET` | `/api/admin/stats` | Thống kê tổng quan (Admin) |
| `GET` | `/api/admin/users` | Danh sách người dùng (Admin) |
| `GET` | `/api/health` | Kiểm tra trạng thái server |
| `GET` | `/api-docs` | Swagger UI tài liệu API |

---

## 👥 9. Tác giả & Thành viên thực hiện (Authors)

Dự án được thực hiện phục vụ học phần **Lập trình ứng dụng đa nền tảng (LTUDDNT)** - Trường **Đại học Tây Nguyên**:

| STT | Họ và tên | Mã sinh viên | Vai trò | Email liên hệ |
|:---:|:---|:---:|:---|:---|
| 1 | **Nguyễn Huy Hoàng** | **23103023** | **Trưởng nhóm (Leader)** | [huyhoangpro187@gmail.com](mailto:huyhoangpro187@gmail.com) |
| 2 | **Lê Xuân Hoàng** | **23103022** | Thành viên | |
| 3 | **Nguyễn Thị Mỹ Duyên** | **23103095** | Thành viên | |
| 4 | **Mai Đàm Thế Kiên** | **23103035** | Thành viên | |

---

## 📄 10. Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**.

<p align="center">
  Made with ❤️ by <strong>Smart Campus Team</strong> • Đại học Tây Nguyên
</p>
