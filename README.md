# 🎓 SMART CAMPUS - HỆ SINH THÁI SỔ TAY & TIỆN ÍCH SINH VIÊN

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Tests-26%2F26_PASS-success?style=for-the-badge&logo=jest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
</p>

> **Smart Campus** là giải pháp hệ sinh thái ứng dụng số toàn diện dành riêng cho sinh viên và ban quản trị trường **Đại học Tây Nguyên (TNU)**:
> - 📱 **Ứng dụng di động (Mobile App):** Tra cứu thời khóa biểu thông minh, kết quả học tập & GPA, bản đồ số 40 địa điểm với dẫn đường nội bộ theo thuật toán Dijkstra, la bàn định hướng, trợ lý AI TTN Smart Bot RAG, Android Home Screen Widgets và thông báo đẩy.
> - 💻 **Cổng quản trị (Web Admin Portal):** Quản lý hồ sơ sinh viên với Avatar thực tế, duyệt ý kiến phản hồi, bắt sóng cảnh báo khẩn cấp SOS thời gian thực qua Socket.IO, cập nhật tọa độ 40 địa điểm và trực tiếp vẽ mạng lưới đường đi bộ nội khu trên nền bản đồ Leaflet.
> - 🛡️ **Chính sách Không Mock Data (Zero Mock Data):** 100% dữ liệu hiển thị từ người dùng và cổng trường thực tế, triệt tiêu toàn bộ dữ liệu mẫu giả lập.
> - ⚡ **Khởi động 1 chạm:** Script `start_all.bat` khởi chạy đồng thời Backend API (`:5000`), Admin Portal (`:5001`) và Mobile App Expo Bundler.
> - 🚀 **Khả năng mở rộng cao:** Kiến trúc Cache TTL + Rate Limiter Queue bảo vệ cổng trường khỏi quá tải khi phục vụ đồng thời hàng ngàn sinh viên.

---

## 📸 1. Ảnh minh họa & Giao diện ứng dụng (Screenshots Demo)

<p align="center">
  <img src="frontend/assets/images/images.jpg" alt="Khuôn viên trường Đại học Tây Nguyên" width="720" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.18);">
  <br>
  <em>Khuôn viên trường Đại học Tây Nguyên (Tay Nguyen University - 567 Lê Duẩn, TP. Buôn Ma Thuột)</em>
</p>

### 📱 Giao diện ứng dụng di động Smart Campus

#### 🔐 1. Xác thực & Đăng ký tài khoản (Authentication & OTP)
| 🔐 Đăng nhập hệ thống | 📝 Đăng ký tài khoản | 📩 Xác thực OTP Email (60s) |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/01_auth_login.jpg" width="230" alt="Đăng nhập" /> | <img src="frontend/assets/Screenshots%20_Demo/02_auth_register.jpg" width="230" alt="Đăng ký" /> | <img src="frontend/assets/Screenshots%20_Demo/03_auth_otp_verify.jpg" width="230" alt="Xác thực OTP Email" /> |
| *Đăng nhập MSSV/Email hoặc Chế độ Khách* | *Đăng ký tài khoản sinh viên mới* | *Nhập OTP 6 số xác minh qua email sinh viên* |

#### 🏠 2. Trang chủ & Tin tức nhà trường (Home Dashboard & News)
| 🏠 Trang chủ (Dashboard) | 📢 Thông báo & Tin tức hoạt động |
| :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/04_home_dashboard.jpg" width="230" alt="Trang chủ Dashboard" /> | <img src="frontend/assets/Screenshots%20_Demo/05_home_announcements_news.jpg" width="230" alt="Thông báo & Tin tức" /> |
| *Tiết học kế tiếp, GPA, lối tắt tiện ích nhanh* | *Thông báo sinh viên & tin tức chính thức* |

#### 📅 3. Thời khóa biểu thông minh (Smart Schedule)
| 📅 Lịch học theo tuần & ngày | 🧭 Hướng dẫn tới phòng học | ➕ Thêm lịch học bù / cá nhân |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/06_schedule_weekly.jpg" width="230" alt="Lịch học theo tuần" /> | <img src="frontend/assets/Screenshots%20_Demo/07_schedule_room_directions.jpg" width="230" alt="Chỉ dẫn phòng học" /> | <img src="frontend/assets/Screenshots%20_Demo/08_schedule_add_custom.jpg" width="230" alt="Thêm lịch học cá nhân" /> |
| *Xem lịch theo tuần, tiết, phòng & giảng viên* | *Chỉ dẫn di chuyển từ cổng tới phòng học* | *Thêm lịch học bù, thực hành đột xuất* |

#### 🗺️ 4. Bản đồ số & Dẫn đường nội bộ (Campus Map & Navigation)
| 🗺️ Bản đồ 40 địa điểm chuẩn hóa | 🧭 Dẫn đường Dijkstra & Đổi cổng |
| :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/09_map_campus_overview.jpg" width="230" alt="Bản đồ khuôn viên" /> | <img src="frontend/assets/Screenshots%20_Demo/10_map_routing_navigation.jpg" width="230" alt="Dẫn đường Dijkstra" /> |
| *Tìm kiếm tòa nhà, chip lọc & thẻ thông tin* | *Đường đi bộ ngắn nhất, xoay theo góc di chuyển* |

#### 📊 5. Kết quả học tập & Bảng điểm (Grades & GPA)
| 📊 Bảng điểm tổng quan & GPA | 📑 Chi tiết điểm thành phần |
| :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/11_grades_overview.jpg" width="230" alt="Kết quả học tập" /> | <img src="frontend/assets/Screenshots%20_Demo/12_grades_detail.jpg" width="230" alt="Chi tiết bảng điểm" /> |
| *GPA hệ 10 & 4, tín chỉ tích lũy, xếp loại* | *Điểm chuyên cần, giữa kỳ, thực hành, thi* |

#### 👤 6. Hồ sơ sinh viên & Bảo mật tài khoản (Profile & Security)
| 👤 Hồ sơ sinh viên | ⚙️ Cài đặt & Đăng xuất | ✏️ Cập nhật hồ sơ & Avatar |
| :---: | :---: | :---: |
| <img src="frontend/assets/Screenshots%20_Demo/13_profile_overview.jpg" width="230" alt="Hồ sơ sinh viên" /> | <img src="frontend/assets/Screenshots%20_Demo/14_profile_security.jpg" width="230" alt="Cài đặt & Bảo mật" /> | <img src="frontend/assets/Screenshots%20_Demo/15_profile_edit.jpg" width="230" alt="Cập nhật hồ sơ" /> |
| *Thông tin sinh viên, khoa, lớp, email & SĐT* | *Cài đặt ứng dụng & đăng xuất thiết bị* | *Chỉnh sửa thông tin liên hệ & đổi ảnh đại diện* |

---

## ✨ 2. Tính năng nổi bật của Hệ thống (Key Features)

### 📱 1. Ứng dụng Di động (Mobile App)
- **🛡️ Chính sách Không Dữ liệu Giả (Zero Mock Data Policy):** Toàn bộ dữ liệu hiển thị (Lịch học, Điểm số, Thông báo, Tin tức, Widgets) là dữ liệu thật. Khi sinh viên chưa có lịch hoặc chưa có điểm, giao diện hiển thị trạng thái trống trang nhã, không chèn các môn học mẫu giả lập.
- **🚀 Màn hình Khởi động Thương hiệu TTN (Deep Sapphire Splash):**
  - Gradient màu xanh Sapphire nhận diện Đại học Tây Nguyên kết hợp huy hiệu sắc nét.
  - Hiệu ứng nhịp thở Pulse, thanh tiến trình động và nạp dữ liệu nền song song (`Promise.allSettled`).
- **🤖 Trợ lý AI Thông minh (TTN Smart Bot - Vector RAG AI):**
  - **Vector Database trong MySQL:** Tri thức khuôn viên và quy chế được chuyển đổi sang vector embeddings 3072 chiều qua mô hình `gemini-embedding-001`.
  - **Cosine Similarity Search:** Truy xuất tài liệu chính xác theo ngữ nghĩa tự nhiên.
  - **Tự sinh câu trả lời bằng Gemini AI:** Không dùng câu trả lời rập khuôn, trích xuất điểm GPA và lịch học cá nhân của chính sinh viên đang đăng nhập.
  - **Giao diện Glassmorphism No BG:** Thiết kế gợi ý câu hỏi trong suốt không nền (`backgroundColor: "transparent"`), viền kính thanh thoát, hòa hợp với nền ánh sáng AI.
  - **Xử lý Bàn phím Android Hoàn hảo:** Nâng hạ chính xác theo bàn phím bằng `Animated.Value` + `Keyboard.addListener`, triệt tiêu hoàn toàn lỗi che khuất và lỗi tụt dải trắng 44px trên Android Edge-to-Edge / Xiaomi MIUI / HyperOS.
- **🗺️ Bản đồ Số & Dẫn đường Nội bộ (Leaflet Dijkstra Engine):**
  - **40 địa điểm chuẩn hóa:** Nhà học số 2, Nhà học số 5 (Khoa Y Dược), Nhà học số 6, Nhà học số 7 (Khoa Kinh tế), Nhà học số 8 (Khoa Sư phạm), Nhà học số 9 (Khoa CNTT & KHTN-CN), Tòa nhà Điều hành, Thư viện Trung tâm, Bệnh viện trường, Viện CNSH & Môi trường, Ký túc xá 1–4, Sân vận động, Căn tin Đảo sinh viên... (Không dùng ký hiệu Tòa A, B, C không có thực).
  - **Dẫn đường như Google Maps:** Tìm đường đi bộ ngắn nhất bằng thuật toán Dijkstra; tự động zoom cận cảnh và xoay bản đồ theo hướng di chuyển thực tế.
  - **La bàn & Định hướng:** Biểu tượng tam giác xoay mượt mà, lọc rung lắc cảm biến ($\ge 8^\circ$, throttle 450ms) giúp tiết kiệm pin.
  - **Chế độ Khách (Guest Mode):** Cho phép xem bản đồ và tra cứu thông tin trường ngay lập tức mà không bắt buộc đăng nhập hay cấp quyền thiết bị.
- **📌 Android Home Screen Widgets:**
  - `ScheduleWidget`: Hiển thị tiết học, phòng học, giảng viên của môn học hôm nay ngay trên màn hình chính Android.
  - `GradesWidget`: Hiển thị GPA hệ 10, GPA hệ 4, tổng tín chỉ tích lũy và xếp loại học lực.
  - `SosWidget`: Nút bấm phát tín hiệu cấp cứu khẩn cấp 1 chạm kèm tọa độ GPS.
- **🔔 Thông báo Đẩy Thời gian Thực (Push Notifications):**
  - Tự động so sánh dữ liệu điểm số mới vs cũ để đẩy thông báo ngay khi giảng viên vừa nhập điểm.
  - Nhắc nhở lịch học trước ngày học, cảnh báo học vụ và tin báo khẩn cấp SOS.
- **📅 Thời khóa biểu & Điểm số:**
  - Tự động xác định tuần học thực tế dựa trên ngày hiện tại.
  - Thêm, sửa, xóa lịch học bù, thực hành đột xuất (lịch cá nhân được bảo toàn vĩnh viễn, không bị xóa khi đồng bộ).

### 💻 2. Cổng Quản trị Web (Admin Portal - Port 5001)
- **📊 Bảng điều khiển (Dashboard):** Biểu đồ hoạt động thời gian thực, tổng số sinh viên, phản hồi và cảnh báo SOS.
- **👥 Quản lý Người dùng:** Danh sách tài khoản sinh viên kèm **Ảnh đại diện thực tế**, modal thêm/sửa hỗ trợ xem trước và upload ảnh Base64 hoặc URL.
- **🗺️ Quản lý Bản đồ & Mạng lưới Đường nội bộ:** Thêm/sửa 40 địa điểm và trực tiếp vẽ, biên tập đường đi bộ nội khu trên nền bản đồ số.
- **⚡ Kết nối Realtime qua Socket.IO:** Tiếp nhận ngay lập tức các ý kiến phản hồi và tín hiệu báo động SOS của sinh viên kèm tọa độ GPS trực quan.

---

## 🚀 3. Kiến trúc Tối ưu hóa Quy mô lớn (Scalability Architecture)

Hệ thống được thiết kế để phục vụ **1,000 – 10,000 sinh viên** mà **không làm quá tải** cổng tra cứu đào tạo của trường:

```text
Yêu cầu tra cứu Điểm / Lịch học từ Sinh viên
                   │
                   ▼
       ┌───────────────────────┐
       │   Kiểm tra Cache DB   │
       │   Điểm số:   12 giờ   │
       │   Lịch học:  24 giờ   │
       └───────────┬───────────┘
                   │
            Cache còn hạn?
            ┌──────┴──────┐
            │ Có          │ Hết hạn / Chưa có
            ▼             ▼
      Trả từ MySQL     Xếp hàng → Rate Limiter → Cào cổng ttn.edu.vn
      (0ms, 0 req)     (Tối đa 3 đồng thời, gap 200ms)
                              │
                              ▼
                      Lưu vào CSDL MySQL → Phản hồi App
```

| Cơ chế bảo vệ | Thông số | Mục đích & Hiệu quả |
|:---|:---:|:---|
| **Cache TTL Bảng điểm** | `12 giờ` | Không truy vấn lại cổng trường nếu dữ liệu chưa quá 12h |
| **Cache TTL Thời khóa biểu** | `24 giờ` | Giảm 95% tải tra cứu trùng lặp của sinh viên cùng lớp |
| **Rate Limiter Queue** | `3 requests` | Tối đa 3 luồng đồng thời tới cổng trường, nghỉ 200ms giữa mỗi request |
| **In-Flight Deduplication** | `1 Promise` | 1,000 SV cùng xem điểm lúc công bố chỉ sinh đúng 1 request tới trường |
| **Smart Batch Sync (Cron)** | `06:00, 12:00, 18:00` | Tự động đồng bộ ngầm lúc vắng tải, ưu tiên cache cũ nhất |
| **Data Pruning** | `45 ngày` | Tự động dọn dẹp lịch chính khóa cũ hơn 45 ngày; giữ nguyên 100% lịch tự tạo |
| **Fallback DB Cache** | `Fail-safe` | Khi cổng trường bảo trì, app vẫn hiển thị dữ liệu cũ trong DB kèm cảnh báo nhẹ |

---

## 🛠️ 4. Công nghệ Sử dụng (Tech Stack)

| Phân hệ | Công nghệ & Thư viện chủ đạo |
|:---|:---|
| **Mobile App (Frontend)** | React Native `0.81.5`, Expo SDK `54`, TypeScript `5.9`, Expo Router `v6`, React Native WebView, Leaflet `1.9`, Reanimated `4.1`, Android App Widgets (`react-native-android-widget`), Expo Notifications |
| **Backend API** | Node.js (ES6+), Express.js `4.21`, Socket.IO `4.8`, MySQL2 (Connection Pool), Google Gemini API (`@google/genai`), bcryptjs, Nodemailer, Cheerio Web Scraper, Axios |
| **Database** | MySQL 8.0 InnoDB (14 bảng quan hệ chuẩn hóa, tự động tạo Schema & nạp Seeders khi khởi động, lưu trữ Vector Embeddings 3072 chiều) |
| **Admin Portal** | HTML5 / Vanilla JS (ES6 Modules), Tailwind CSS, Lucide Icons, Leaflet.js, Socket.IO Client |
| **Tài liệu API** | OpenAPI 3.0 / Swagger UI (`swagger-ui-express`) tại `http://localhost:5000/api-docs` |
| **Kiểm thử tự động** | Node.js Test Runner tập trung (`tests/run_all.js`), 10 test suites, 26 bài test chuyên sâu |

---

## 🧪 5. Hệ thống Kiểm thử Tự động (Automated Test Suites)

Dự án tích hợp bộ kiểm thử hồi quy toàn diện với **10 test suites (26 bài test)** đảm bảo tính ổn định tuyệt đối trước mỗi lần triển khai:

```bash
# Chạy toàn bộ 10 bộ test từ thư mục gốc:
node tests/run_all.js
```

### Chi tiết các bộ kiểm thử:
1. **Phần 1: Thời khóa biểu & Tính toán Tuần động (`tests/schedule/`)**
   - `test_week_calc.js`: Tính toán chính xác khoảng tuần, thứ trong tuần, chuẩn hóa ngày VN.
   - `test_schedule_parser.js`: Phân tích phòng học dạng `X.Y.Z`, `X.Z` và xử lý bảng thời khóa biểu tuần.
   - `test_custom_schedule.js`: Thêm, sửa, lọc lịch thực hành/bù theo tuần này và tuần sau.
   - `test_no_mock_data.js`: Đảm bảo thời khóa biểu không chèn bất kỳ môn học mẫu nào khi sinh viên không có lịch.
2. **Phần 2: Sửa lỗi APK & Tính năng Nghiệp vụ (`tests/apk_fixes/`)**
   - `test_chat_keyboard_layout.js`: Kiểm tra cấu hình `softwareKeyboardLayoutMode: "resize"`, cơ chế `keyboardOffset` hoạt động chính xác trên Android và các gợi ý trong suốt (No BG).
   - `test_grade_comparison.js`: Thuật toán so sánh bảng điểm mới vs cũ để kích hoạt thông báo tức thì.
   - `test_notice_modal.js`: Phân loại chính xác thông báo từ trường, ý kiến sinh viên và cứu hộ SOS.
   - `test_no_mock_data_global.js`: Kiểm tra Zero Mock Data toàn cục (Schedule, News, Grades, Home).
   - `test_profile_clean.js`: Làm sạch dữ liệu form hồ sơ, không lưu chuỗi `"Chưa cập nhật"`.
   - `test_sos_radius.js`: Bán kính cảnh báo khẩn cấp SOS chính xác 50 mét.

```text
======================================================================
🏆 BẮT ĐẦU CHẠY TOÀN BỘ TEST SUITES CỦA DỰ ÁN (FULL REGRESSION)
======================================================================
  ✅ PASS: 4/4 Test Suites Thời khóa biểu & Tuần động
  ✅ PASS: 6/6 Test Suites Bản vá APK & Nghiệp vụ chuyên sâu
======================================================================
🌟 TẤT CẢ CÁC BỘ TEST ĐÃ VƯỢT QUA 100% THÀNH CÔNG! (26/26 PASS)
======================================================================
```

---

## 🚀 6. Hướng dẫn Cài đặt & Khởi chạy (Quick Start)

### Yêu cầu tiên quyết:
- **Node.js** phiên bản `>= 18.x`
- **MySQL Server 8.0** hoặc **XAMPP** (chạy cổng `3306`)
- Ứng dụng **Expo Go** trên điện thoại Android / iOS (để test ứng dụng di động)

---

### ⚡ CÁCH 1: Khởi động 1 chạm bằng file `.bat` (Khuyên dùng trên Windows)

Chỉ cần **nhấp đúp chuột (Double Click)** vào file:
👉 **`start_all.bat`** (hoặc `run.bat`)

File sẽ tự động mở 3 cửa sổ console chạy song song:
1. `BACKEND API (Port 5000)`: Khởi chạy Node.js server, kết nối MySQL và mở cổng Socket.IO.
2. `ADMIN PORTAL (Port 5001)`: Phục vụ Web Admin Dashboard.
3. `FRONTEND APP (Expo Metro)`: Khởi chạy bundler và hiển thị mã QR để quét từ điện thoại.

---

### 🛠️ CÁCH 2: Khởi động thủ công từng phân hệ

#### Bước 1: Khởi tạo Cơ sở Dữ liệu MySQL
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
> 💡 **Khởi tạo tự động:** Backend sẽ tự động kết nối MySQL, tạo toàn bộ 14 bảng dữ liệu và nạp sẵn tài khoản Admin, 40 địa điểm chuẩn và mạng lưới đường đi bộ nội bộ mà không cần import file SQL thủ công.
- **Kiểm tra API Health:** `http://localhost:5000/api/health`
- **Tài liệu Swagger UI:** `http://localhost:5000/api-docs`

#### Bước 3: Chạy Web Admin Portal
```bash
cd admin
npm install
npm start
```
- Mở trình duyệt: `http://localhost:5001`
- Tài khoản quản trị mặc định: `admin` / Mật khẩu: `admin123`

#### Bước 4: Chạy Mobile App (Frontend)
```bash
cd frontend
npm install
npx expo start
```
- Mở ứng dụng **Expo Go** trên điện thoại và quét mã QR trên màn hình terminal.

---

## 📦 7. Chuyển đổi Chế độ Phát triển & Build APK

Dự án cung cấp bộ công cụ chuyển đổi trạng thái bằng 1 câu lệnh duy nhất:

```bash
# Khi chạy thử nghiệm trên Expo Go:
npm run mode:dev

# Khi đóng gói APK sản xuất / EAS Build:
npm run mode:apk
```

> Chi tiết các bước build file APK độc lập cài đặt trực tiếp lên điện thoại Android được hướng dẫn tại file [HUONG_DAN_UNCOMMENT_KHI_BUILD_APK.md](HUONG_DAN_UNCOMMENT_KHI_BUILD_APK.md).

---

## 📁 8. Cấu trúc Thư mục Toàn dự án (Project Structure)

```text
LTDDDNT/
├── start_all.bat                       # Script khởi động 1 chạm 3 hệ thống
├── run.bat                             # Shortcut chạy start_all.bat
├── HUONG_DAN_UNCOMMENT_KHI_BUILD_APK.md# Hướng dẫn chi tiết đóng gói APK
├── TAI_LIEU_KIEN_TRUC_HE_THONG.md      # Tài liệu đặc tả kiến trúc kỹ thuật sâu
│
├── admin/                              # Web Portal Quản trị viên (Port 5001)
│   ├── public/                         # Giao diện Web tĩnh (HTML/CSS/JS)
│   │   ├── css/style.css               # Phong cách giao diện Admin Portal
│   │   ├── js/                         # Logic điều phối giao diện, Socket.IO, bản đồ
│   │   └── index.html                  # Giao diện chính Single Page Application
│   ├── package.json
│   └── server.js                       # Server phục vụ cổng 5001
│
├── backend/                            # REST API Engine & Realtime Server (Port 5000)
│   ├── src/
│   │   ├── config/                     # Cấu hình CSDL, Swagger UI
│   │   ├── controllers/                # Điều khiển nghiệp vụ Auth, Student, Campus, Chat, Admin
│   │   ├── database/                   # Schema 14 bảng, 40 địa điểm seeders, đường nội bộ
│   │   ├── middlewares/                # Middleware JWT & phân quyền Admin
│   │   ├── routes/                     # Định tuyến API
│   │   ├── services/                   # Cache TTL, Rate Limiter, Gemini Vector RAG, Cron Batch
│   │   └── server.js                   # Entry point Express + Socket.IO
│   ├── .env.example
│   └── package.json
│
├── frontend/                           # Ứng dụng di động Expo / React Native
│   ├── app/                            # Expo Router (Cấu trúc định tuyến màn hình)
│   │   ├── index.tsx                   # Màn hình Splash nhận diện Deep Sapphire
│   │   ├── (auth)/                     # Đăng nhập, đăng ký, OTP Email
│   │   ├── (main)/                     # Các tab chính (Home, Map, Schedule, Grades, Profile, Chat)
│   │   └── _layout.tsx                 # Root layout toàn ứng dụng
│   ├── src/
│   │   ├── components/                 # Header, MainTabs, GlassView
│   │   ├── features/                   # Map Leaflet, Chatbot TTN Smart Bot
│   │   ├── services/                   # Kết nối API, Thông báo đẩy, Widgets
│   │   └── widgets/                    # ScheduleWidget, GradesWidget, SosWidget
│   ├── app.json                        # Cấu hình dự án Expo & Permissions
│   ├── eas.json                        # Cấu hình build APK đám mây (EAS Build)
│   └── package.json
│
└── tests/                              # Hệ thống Kiểm thử Tự động (Automated Test Suites)
    ├── schedule/                       # 4 test suites thời khóa biểu & tuần động
    ├── apk_fixes/                      # 6 test suites sửa lỗi APK & nghiệp vụ
    └── run_all.js                      # Master test runner chạy toàn bộ 10 suites
```

---

## 🔌 9. Bảng API Endpoints Chính (REST API)

| Phương thức | Endpoint | Mô tả |
|:---:|:---|:---|
| `POST` | `/api/auth/login` | Đăng nhập tài khoản sinh viên / cán bộ |
| `POST` | `/api/auth/register` | Đăng ký tài khoản sinh viên mới |
| `POST` | `/api/auth/send-otp` | Gửi mã OTP xác thực qua email trường `@sv.ttn.edu.vn` |
| `POST` | `/api/student/grades` | Bảng điểm chi tiết, điểm thành phần & GPA (Cache TTL 12h) |
| `POST` | `/api/student/schedule` | Thời khóa biểu các tuần học (Cache TTL 24h) |
| `POST` | `/api/student/schedule/custom` | Thêm ca học bù / thực hành cá nhân |
| `GET` | `/api/campus/map` | Danh mục 40 địa điểm khuôn viên chuẩn hóa |
| `GET` | `/api/campus/paths` | Mạng lưới đường đi bộ nội khu phục vụ dẫn đường |
| `POST` | `/api/campus/route` | Tính toán đường đi ngắn nhất giữa 2 điểm (Dijkstra) |
| `POST` | `/api/chat/ask` | Hỏi đáp TTN Smart Bot RAG AI (Vector DB + Gemini) |
| `GET` | `/api/chat/suggestions` | Danh sách câu hỏi gợi ý thông minh |
| `POST` | `/api/campus/feedback` | Gửi ý kiến phản hồi về cơ sở vật chất, đào tạo |
| `POST` | `/api/campus/sos` | Phát tín hiệu cứu hộ khẩn cấp SOS thời gian thực |
| `GET` | `/api/admin/stats` | Thống kê số liệu người dùng, phản hồi, SOS (Admin) |
| `GET` | `/api/health` | Kiểm tra tình trạng kết nối máy chủ |
| `GET` | `/api-docs` | Swagger UI tương tác tài liệu API trực tiếp |

---

## 👥 10. Tác giả & Thành viên Thực hiện (Authors)

Dự án được nghiên cứu và phát triển phục vụ học phần **Lập trình ứng dụng đa nền tảng (LTUDDNT)** - Khoa Khoa học Tự nhiên và Công nghệ, Trường **Đại học Tây Nguyên**:

| STT | Họ và tên | Mã sinh viên | Vai trò | Email liên hệ |
|:---:|:---|:---:|:---|:---|
| 1 | **Nguyễn Huy Hoàng** | **23103023** | **Trưởng nhóm (Team Leader)** | [huyhoangpro187@gmail.com](mailto:huyhoangpro187@gmail.com) |
| 2 | **Lê Xuân Hoàng** | **23103022** | Thành viên | [lxhoang@ttn.edu.vn](mailto:lxhoang@ttn.edu.vn) |
| 3 | **Nguyễn Thị Mỹ Duyên** | **23103095** | Thành viên | [ntmduyen@ttn.edu.vn](mailto:ntmduyen@ttn.edu.vn) |
| 4 | **Mai Đàm Thế Kiên** | **23103035** | Thành viên | [mdtkien@ttn.edu.vn](mailto:mdtkien@ttn.edu.vn) |

---

## 📄 11. Giấy phép (License)

Dự án được phân phối dưới giấy phép mã nguồn mở **MIT License**.

<p align="center">
  Made with ❤️ by <strong>Smart Campus Development Team</strong> • Trường Đại học Tây Nguyên (TNU)
</p>
