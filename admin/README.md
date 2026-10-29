# 🛡️ Smart Campus Admin Portal (Trang Quản trị Hệ thống)

Cổng thông tin Quản trị viên (Web Admin Portal) phục vụ công tác quản lý, giám sát và điều hành hệ sinh thái **Smart Campus** - Trường **Đại học Tây Nguyên**.

---

## 📌 1. Các phân hệ chức năng chính

- **📊 Dashboard Thống kê:**
  - Tổng số tài khoản sinh viên và quản trị viên trong hệ thống.
  - Tổng số ý kiến phản hồi đã tiếp nhận và tỷ lệ giải quyết thành công.
  - Tổng số lượt phát cảnh báo khẩn cấp SOS và tiến độ xử lý của an ninh trường.
  - Biểu đồ tương tác thời gian thực theo tuần.
- **👥 Quản lý người dùng (Users Management):**
  - Danh sách tài khoản sinh viên & quản trị viên với **Ảnh đại diện (Avatar)** thực tế.
  - Modal thêm mới / chỉnh sửa tài khoản: Hỗ trợ xem trước ảnh đại diện và **tải ảnh trực tiếp từ máy tính (Base64)** hoặc nhập đường dẫn ảnh.
  - Tìm kiếm linh hoạt theo MSSV, Họ tên, Email, Lớp, Khoa.
- **🗺️ Quản lý Bản đồ khuôn viên & Mạng lưới đường (Campus Map):**
  - Quản lý tọa độ, mô tả, danh mục của **37 địa điểm** quan trọng trong trường.
  - **Trực tiếp vẽ và biên tập đường đi bộ nội bộ (Campus Paths)** trên nền bản đồ Leaflet.
  - Hỗ trợ nút khôi phục mạng lưới đường mặc định chuẩn xác của trường.
- **📢 Phát thông báo toàn trường (Notifications):** Soạn thảo, đăng tải và phân loại thông báo đào tạo, học phí, sự kiện.
- **💬 Xử lý phản hồi (Feedback):** Tiếp nhận, phân loại và chuyển trạng thái "Đã giải quyết" cho các ý kiến đóng góp của sinh viên.
- **🚨 Trung tâm cảnh báo khẩn cấp SOS:** Bắt sóng cảnh báo tức thời từ sinh viên qua **Socket.IO Realtime**, xem vị trí tọa độ để điều phối hỗ trợ an ninh.

---

## 🚀 2. Cài đặt & Khởi chạy

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Khởi động máy chủ
- **Môi trường phát triển:**
  ```bash
  npm run dev
  ```
- **Môi trường sản xuất:**
  ```bash
  npm start
  ```

### Bước 3: Truy cập hệ thống
- Mở trình duyệt tại: **`http://localhost:5001`**
- **Tài khoản quản trị mặc định:**
  - Tên đăng nhập / MSSV: `admin`
  - Mật khẩu: `123456`

---

## 📁 3. Cấu trúc thư mục Admin

```text
admin/
├── public/                             # Tài nguyên giao diện Web tĩnh
│   ├── css/
│   │   └── style.css                   # Định kiểu giao diện trang quản trị
│   ├── js/
│   │   ├── api.js                      # Service gọi REST API (kết nối Backend :5000)
│   │   ├── app.js                      # Điều phối giao diện, Socket.IO Realtime
│   │   ├── dashboard.js                # Biểu đồ và số liệu thống kê
│   │   ├── feedback.js                 # Xử lý phản hồi sinh viên
│   │   ├── locations.js                # Quản lý 37 địa điểm và vẽ đường đi bộ
│   │   ├── notifications.js            # Đăng và quản lý thông báo
│   │   ├── sos.js                      # Theo dõi và tiếp nhận cảnh báo SOS
│   │   └── users.js                    # Quản lý tài khoản và ảnh đại diện
│   └── index.html                      # Giao diện chính Single Page Application
├── server.js                           # Node.js Express Server phục vụ cổng 5001
└── package.json
```

