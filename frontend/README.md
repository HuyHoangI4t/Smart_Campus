# 📱 Smart Campus Mobile Application (Frontend)

Ứng dụng di động sinh viên **Smart Campus** dành cho trường **Đại học Tây Nguyên**, xây dựng bằng **React Native (v0.81.5)**, **Expo SDK 54** và **TypeScript (v5.9)** với cấu trúc định tuyến **Expo Router v6**.

---

## ✨ 1. Tính năng nổi bật

- **Trang chủ Dashboard:** Thẻ tóm tắt GPA hệ 10 & 4, tín chỉ tích lũy, môn học kế tiếp, danh mục tiện ích nhanh và tin tức nhà trường.
- **Bản đồ số & Dẫn đường thông minh (Leaflet WebView):**
  - Định vị GPS và chỉ đường đi bộ nội bộ theo thuật toán **Dijkstra**.
  - **Mô phỏng trải nghiệm Google Maps:** Tự động phóng to và xoay bản đồ theo hướng đường khi bắt đầu di chuyển.
  - **Biểu tượng tam giác định hướng:** Hiển thị góc quay la bàn người dùng, tự động đưa vị trí về tâm màn hình.
  - **Tối ưu trải nghiệm:** Tự động ẩn thanh điều hướng dưới (Bottom Tabs) khi đang dẫn đường để mở rộng góc nhìn.
  - **Lọc rung lắc la bàn:** Giảm độ nhạy (chỉ quay khi lệch $\ge 8^\circ$) và khống chế tần suất cập nhật $\ge 450\text{ms}$ giúp tiết kiệm pin.
  - **Chế độ Khách (Guest Mode):** Cho phép người dùng trải nghiệm ngay mà không đòi hỏi quyền GPS, camera hay bộ nhớ.
- **Thời khóa biểu thông minh (Schedule):**
  - Xem lịch học theo tuần và ngày, hiển thị phòng học, giảng viên, môn học.
  - Thêm / sửa lịch thực hành đột xuất hoặc học bù: Tự động tính thứ từ ngày chọn, ô chọn tiết dạng dropdown full-width.
- **Kết quả học tập (Grades):** Tra cứu điểm chuyên cần, giữa kỳ, thi, điểm chữ và GPA tích lũy.
- **Hồ sơ cá nhân:** Cập nhật thông tin, thay đổi ảnh đại diện (camera, thư viện ảnh hoặc link ảnh), đổi mật khẩu.
- **Tiện ích trường học:** Gửi phản hồi nhà trường, nút báo động khẩn cấp SOS một chạm.

---

## 🚀 2. Cài đặt & Khởi chạy

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Khởi chạy với Expo Metro Bundler
```bash
npx expo start
```

### Bước 3: Trải nghiệm ứng dụng
- **Điện thoại thật (Android / iOS):** Cài ứng dụng **Expo Go** từ Google Play hoặc App Store, sau đó quét mã QR hiển thị trên màn hình terminal.
- **Máy ảo Android Studio:** Nhấn phím `a` trên bàn phím.
- **Trình duyệt Web:** Nhấn phím `w` trên bàn phím.

---

## 🛠️ 3. Cấu hình kết nối API

File cấu hình kết nối nằm tại [src/services/get_IPv4.ts](src/services/get_IPv4.ts) và [src/services/api.ts](src/services/api.ts):
- **Trên Web:** Tự động kết nối `http://localhost:5000/api`.
- **Trên Thiết bị thật (Expo Go):** Tự động phát hiện địa chỉ IP LAN của máy tính chạy Expo Bundler.
- Đảm bảo điện thoại và máy tính kết nối **chung một mạng Wi-Fi** và tường lửa Windows cho phép mở cổng `5000`.

---

## 📁 4. Cấu trúc thư mục Frontend

```text
frontend/
├── app/                                # Expo Router (File-based routing)
│   ├── (auth)/                         # Nhóm màn hình Xác thực
│   │   ├── index.tsx                   # Đăng nhập (hỗ trợ Chế độ Khách)
│   │   └── forgot-password.tsx         # Quên mật khẩu & OTP Email
│   ├── (main)/                         # Nhóm màn hình chính (Bottom Tabs)
│   │   ├── _layout.tsx                 # Cấu hình Bottom Tabs Navigation
│   │   ├── home/                       # Trang chủ sinh viên
│   │   ├── map/                        # Bản đồ số & Dẫn đường khuôn viên
│   │   ├── schedule/                   # Thời khóa biểu & thêm lịch thực hành
│   │   ├── grades/                     # Bảng điểm & GPA
│   │   ├── profile/                    # Hồ sơ cá nhân & đổi mật khẩu
│   │   ├── feedback/                   # Gửi phản hồi
│   │   └── sos/                        # Báo động khẩn cấp SOS
│   └── _layout.tsx                     # Root Layout toàn ứng dụng
├── src/
│   ├── components/                     # MainTabs, NavHeader, AuthHeader
│   ├── constants/                      # appColors.ts, globalStyles.ts
│   ├── features/map/                   # Module Bản đồ số Leaflet
│   │   ├── hooks/useMapGps.ts          # Xử lý GPS, la bàn hướng nhìn
│   │   ├── leafletHtml.ts              # Template HTML render bản đồ
│   │   └── utils.ts                    # Tiện ích Dijkstra & tính khoảng cách
│   └── services/
│       ├── api.ts                      # Client gọi REST API
│       ├── get_IPv4.ts                 # Nhận diện IP tự động
│       └── permissionService.ts        # Quản lý quyền hệ thống & chế độ Khách
├── app.json                            # Cấu hình ứng dụng Expo & Permissions
└── package.json
```
