# 🛡️ Smart Campus Admin Portal (Trang Quản trị Hệ thống)

<p align="center">
  <img src="https://img.shields.io/badge/Admin_Portal-Single_Page_App-007ACC?style=for-the-badge&logo=javascript&logoColor=white" alt="SPA" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
</p>

Cổng thông tin Quản trị viên (Web Admin Portal) phục vụ công tác quản lý, giám sát và điều hành toàn diện hệ sinh thái **Smart Campus** - Trường **Đại học Tây Nguyên (TNU)**.

---

## 📌 1. Các phân hệ chức năng chính

### 📊 1. Dashboard Thống kê Thời gian thực
- Tổng số tài khoản sinh viên và quản trị viên đang hoạt động trong hệ thống.
- Tổng số ý kiến phản hồi đã tiếp nhận và tỷ lệ giải quyết thành công.
- Tổng số lượt phát cảnh báo khẩn cấp SOS và tiến độ xử lý của đội ngũ an ninh.
- Biểu đồ tương tác thời gian thực cập nhật dữ liệu liên tục.

### 👥 2. Quản lý Người dùng (Users Management)
- Danh sách tài khoản sinh viên & quản trị viên hiển thị kèm **Ảnh đại diện (Avatar) thực tế**.
- **Modal Thêm mới / Chỉnh sửa tài khoản:**
  - Hỗ trợ xem trước ảnh đại diện trực quan.
  - Cho phép tải ảnh trực tiếp từ máy tính (**chuyển đổi Base64 tự động**) hoặc dán đường dẫn ảnh URL.
- Bộ lọc và tìm kiếm đa năng theo MSSV, Họ tên, Email, Lớp và Khoa đào tạo.

### 🗺️ 3. Quản lý Bản đồ Khuôn viên & Biên tập Đường nội bộ (Campus Map Editor)
- Quản lý tọa độ GPS, danh mục, hình ảnh và mô tả của **40 địa điểm chuẩn hóa thực tế** trong trường (Nhà học số 2, Nhà học số 5 Khoa Y Dược, Nhà học số 6, 7 Khoa Kinh tế, Nhà học số 8 Khoa Sư phạm, Nhà học số 9 Khoa CNTT & KHTN-CN, Tòa nhà Điều hành, Thư viện Trung tâm, Bệnh viện trường, Ký túc xá 1–4...).
- **Công cụ Biên tập Tuyến đường (Campus Path Builder):**
  - Trực tiếp click chuột để vẽ, kéo thả chỉnh sửa các đoạn đường đi bộ nội khu trên nền bản đồ Leaflet.
  - Nút khôi phục mạng lưới đường mặc định chuẩn xác của trường chỉ với 1 cú click.

### 📢 4. Phát Thông báo Toàn trường (Notifications)
- Soạn thảo, đăng tải và phân loại các thông báo đào tạo, học phí, sự kiện tới toàn thể sinh viên trong trường.

### 💬 5. Tiếp nhận & Xử lý Phản hồi (Feedback Management)
- Tiếp nhận ý kiến đóng góp của sinh viên về cơ sở vật chất, chất lượng dịch vụ giảng dạy.
- Phân loại và chuyển trạng thái "Đang xử lý" $\rightarrow$ "Đã giải quyết".

### 🚨 6. Trung tâm Cảnh báo Khẩn cấp SOS Realtime
- Bắt sóng cảnh báo cấp cứu tức thời từ ứng dụng di động của sinh viên qua **Socket.IO Realtime**.
- Định vị chính xác tọa độ GPS của người phát tín hiệu để điều phối lực lượng an ninh và y tế kịp thời.

---

## 🚀 2. Cài đặt & Khởi chạy

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Khởi động máy chủ Web Admin
- **Môi trường phát triển:**
  ```bash
  npm run dev
  ```
- **Môi trường sản xuất:**
  ```bash
  npm start
  ```

### Bước 3: Đăng nhập hệ thống
- Mở trình duyệt tại địa chỉ: **`http://localhost:5001`**
- **Thông tin tài khoản quản trị mặc định:**
  - Tên đăng nhập / MSSV: `admin`
  - Mật khẩu: `admin123`

---

## 📁 3. Cấu trúc Thư mục Admin Portal

```text
admin/
├── public/                             # Tài nguyên giao diện Web tĩnh
│   ├── css/
│   │   └── style.css                   # Định kiểu giao diện trang quản trị
│   ├── js/
│   │   ├── api.js                      # Service gọi REST API (kết nối Backend :5000)
│   │   ├── app.js                      # Điều phối giao diện chung & Socket.IO Realtime
│   │   ├── dashboard.js                # Biểu đồ và số liệu thống kê thời gian thực
│   │   ├── feedback.js                 # Xử lý & duyệt phản hồi sinh viên
│   │   ├── locations.js                # Quản lý 40 địa điểm và vẽ đường đi bộ Leaflet
│   │   ├── notifications.js            # Đăng tải và quản lý thông báo toàn trường
│   │   ├── sos.js                      # Theo dõi và tiếp nhận cảnh báo cấp cứu SOS
│   │   └── users.js                    # Quản lý tài khoản sinh viên và ảnh đại diện
│   └── index.html                      # Giao diện chính Single Page Application
├── server.js                           # Node.js Express Server phục vụ cổng 5001
└── package.json
```
