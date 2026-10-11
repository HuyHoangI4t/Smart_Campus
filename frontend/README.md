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

---

## 📸 5. Ảnh chụp giao diện thực tế (Screenshots Demo)

Thư mục: `assets/Screenshots _Demo/`

| STT | Màn hình | Tên file ảnh | Chức năng chính |
| :---: | :--- | :--- | :--- |
| **01** | **Đăng nhập & Khách** | [`01_auth_login.jpg`](assets/Screenshots%20_Demo/01_auth_login.jpg) | Nhập MSSV/Email, Mật khẩu hoặc đăng nhập nhanh chế độ Khách |
| **02** | **Đăng ký tài khoản** | [`02_auth_register.jpg`](assets/Screenshots%20_Demo/02_auth_register.jpg) | Đăng ký tài khoản sinh viên với MSSV, Họ tên và Mật khẩu |
| **03** | **Xác thực OTP Email** | [`03_auth_otp_verify.jpg`](assets/Screenshots%20_Demo/03_auth_otp_verify.jpg) | Nhập 6 số OTP (hỗ trợ Paste nhanh), nút gửi lại mã sau 60s đếm ngược |
| **04** | **Trang chủ Dashboard** | [`04_home_dashboard.jpg`](assets/Screenshots%20_Demo/04_home_dashboard.jpg) | Thẻ lớp học kế tiếp, GPA tích lũy, các tác vụ nhanh & cảnh báo |
| **05** | **Thông báo & Tin tức** | [`05_home_announcements_news.jpg`](assets/Screenshots%20_Demo/05_home_announcements_news.jpg) | Danh sách thông báo sinh viên & tin tức hoạt động nhà trường |
| **06** | **Thời khóa biểu tuần** | [`06_schedule_weekly.jpg`](assets/Screenshots%20_Demo/06_schedule_weekly.jpg) | Lịch học thông minh theo tuần, ngày, hiển thị phòng, tiết & GV |
| **07** | **Chỉ dẫn phòng học** | [`07_schedule_room_directions.jpg`](assets/Screenshots%20_Demo/07_schedule_room_directions.jpg) | Hướng dẫn chi tiết từng chặng từ cổng trường tới phòng học |
| **08** | **Thêm lịch học bù** | [`08_schedule_add_custom.jpg`](assets/Screenshots%20_Demo/08_schedule_add_custom.jpg) | Thêm lịch học bù, thực hành đột xuất tùy chỉnh |
| **09** | **Bản đồ khuôn viên** | [`09_map_campus_overview.jpg`](assets/Screenshots%20_Demo/09_map_campus_overview.jpg) | Bản đồ số 37 địa điểm, tìm kiếm phòng học & chip phân loại |
| **10** | **Dẫn đường Dijkstra** | [`10_map_routing_navigation.jpg`](assets/Screenshots%20_Demo/10_map_routing_navigation.jpg) | Tìm tuyến đường ngắn nhất, đổi cổng và thanh trạng thái sát đáy |
| **11** | **Kết quả học tập** | [`11_grades_overview.jpg`](assets/Screenshots%20_Demo/11_grades_overview.jpg) | Tổng hợp GPA hệ 10 & 4, tín chỉ tích lũy & lọc học kỳ |
| **12** | **Chi tiết bảng điểm** | [`12_grades_detail.jpg`](assets/Screenshots%20_Demo/12_grades_detail.jpg) | Điểm chi tiết thành phần: chuyên cần, giữa kỳ, thực hành, thi |
| **13** | **Hồ sơ sinh viên** | [`13_profile_overview.jpg`](assets/Screenshots%20_Demo/13_profile_overview.jpg) | Thông tin cá nhân, khoa đào tạo, lớp, email & số điện thoại |
| **14** | **Cài đặt & Bảo mật** | [`14_profile_security.jpg`](assets/Screenshots%20_Demo/14_profile_security.jpg) | Mục bảo mật tài khoản và nút đăng xuất khỏi thiết bị |
| **15** | **Cập nhật hồ sơ** | [`15_profile_edit.jpg`](assets/Screenshots%20_Demo/15_profile_edit.jpg) | Chỉnh sửa thông tin liên hệ và đổi ảnh đại diện sinh viên |
| **16** | **Đổi mật khẩu** | [`16_profile_change_password.jpg`](assets/Screenshots%20_Demo/16_profile_change_password.jpg) | Cập nhật mật khẩu tài khoản sinh viên |
| **17** | **Xác nhận đăng xuất** | [`17_profile_logout_confirm.jpg`](assets/Screenshots%20_Demo/17_profile_logout_confirm.jpg) | Hộp thoại xác nhận đăng xuất an toàn khỏi ứng dụng |

