# 📱 Smart Campus Mobile Application (Frontend)

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Expo_Router-v6-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo Router" />
  <img src="https://img.shields.io/badge/Android_Widgets-Supported-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Widgets" />
</p>

Ứng dụng di động sinh viên **Smart Campus** dành cho trường **Đại học Tây Nguyên (TNU)**, được xây dựng trên nền tảng **React Native (v0.81.5)**, **Expo SDK 54**, **TypeScript (v5.9)** với kiến trúc điều hướng dạng tập tin **Expo Router v6**.

---

## ✨ 1. Tính năng nổi bật

### 🛡️ Chính sách Không Dữ liệu Giả (Zero Mock Data)
- **100% Dữ liệu thực tế:** Toàn bộ lịch học, bảng điểm, thông báo, tin tức và widget đều lấy từ dữ liệu thực tế của sinh viên.
- **Không dùng dữ liệu mẫu (Fallback Mock):** Khi sinh viên chưa có môn học hoặc chưa có điểm trong học kỳ, ứng dụng hiển thị trạng thái trống thân thiện, không chèn bất kỳ môn học mẫu nào gây hiểu lầm.

### 🚀 Màn hình Khởi động Thương hiệu TNU (Splash / Loading Screen)
- Thiết kế chuẩn nhận diện thương hiệu Đại học Tây Nguyên với dải màu **Deep Sapphire Blue** sang trọng và huy hiệu trường sắc nét.
- Hiệu ứng nhịp thở phát sáng (Pulse Glow), thanh phần trăm tiến trình mượt mà cùng các dòng trạng thái nạp dữ liệu thay đổi linh hoạt.
- Tự động nạp dữ liệu nền song song (`Promise.allSettled`) khi mở ứng dụng giúp các màn hình bên trong hiển thị tức thì.

### 🤖 Trợ lý AI TTN Smart Bot (Vector RAG AI & Gemini)
- **Giao diện Glassmorphism Hiện đại:** Thiết kế kính mờ cao cấp, hỗ trợ chế độ Tối/Sáng (Dark/Light mode) và rung phản hồi xúc giác (Haptics).
- **Gợi ý Câu hỏi Trong suốt Không nền (No BG):** Toàn bộ danh mục câu hỏi Bento, thanh trượt ngang câu hỏi nhanh và gợi ý sau tin nhắn của Bot đều được thiết kế dạng trong suốt (`backgroundColor: "transparent"`), viền kính thanh thoát, hòa quyện tự nhiên với hiệu ứng ánh sáng AI.
- **Xử lý Bàn phím Android Hoàn hảo:** Nâng hạ chính xác theo bàn phím bằng `Animated.Value` + `Keyboard.addListener`, triệt tiêu hoàn toàn lỗi che khuất thanh chat và lỗi thụt dải trắng 44px trên Android Edge-to-Edge / Xiaomi MIUI / HyperOS.
- **Tự sinh câu trả lời:** Kết hợp Vector RAG (tìm kiếm độ tương đồng Cosine trong MySQL) và Google Gemini AI để trả lời chính xác quy chế, học bổng, vị trí nhà học, kèm dữ liệu điểm số và lịch học cá nhân của chính người dùng.

### 🗺️ Bản đồ Số & Dẫn đường Thông minh (Leaflet Dijkstra)
- **40 địa điểm chuẩn hóa:** Quản lý tọa độ chính xác của Nhà học số 2, Nhà học số 5 (Khoa Y Dược), Nhà học số 6, 7 (Khoa Kinh tế), Nhà học số 8 (Khoa Sư phạm), Nhà học số 9 (Khoa CNTT & KHTN-CN), Tòa nhà Điều hành, Thư viện, Ký túc xá 1–4, Bệnh viện trường...
- **Trải nghiệm như Google Maps:** Tự động phóng to và xoay bản đồ theo hướng di chuyển thực tế của người dùng.
- **La bàn định hướng:** Biểu tượng tam giác chỉ hướng nhìn thực tế, thuật toán lọc rung lắc cảm biến ($\ge 8^\circ$, throttle 450ms) giúp tiết kiệm pin.
- **Chế độ Khách (Guest Mode):** Cho phép xem bản đồ và tra cứu thông tin trường ngay mà không đòi hỏi quyền GPS, camera hay bộ nhớ.

### 📌 Tiện ích Màn hình chính Android (Home Screen Widgets)
Hỗ trợ 3 Android App Widgets (`react-native-android-widget`):
1. **`ScheduleWidget` (Lịch học hôm nay):** Hiển thị tên môn học, thời gian, tiết học, phòng học và giảng viên ngay trên màn hình chính điện thoại.
2. **`GradesWidget` (Điểm số & GPA):** Hiển thị GPA hệ 10, GPA hệ 4, tổng tín chỉ tích lũy và xếp loại học lực.
3. **`SosWidget` (Cứu nạn khẩn cấp):** Báo động SOS 1 chạm gửi tọa độ GPS về phòng an ninh trường.

### 🔔 Thông báo Đẩy Thời gian Thực (Push Notifications)
- Tích hợp `expo-notifications` với các kênh thông báo chuyên biệt: Báo điểm mới, Cảnh báo học vụ, Nhắc lịch học ngày mai.
- Tự động so sánh dữ liệu điểm số mới vs cũ để đẩy thông báo ngay khi giảng viên vừa cập nhật điểm.

### 📅 Thời khóa biểu & Điểm số
- Tự động xác định tuần học thực tế dựa trên ngày tháng năm hiện tại.
- Thêm / sửa lịch thực hành đột xuất hoặc học bù: Tự động tính thứ từ ngày chọn, ô chọn tiết dạng dropdown full-width tiện lợi.

---

## 🚀 2. Cài đặt & Khởi chạy

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Chuyển đổi chế độ phù hợp
```bash
# Nếu chạy thử nghiệm trên Expo Go:
npm run mode:dev

# Nếu đóng gói APK bằng EAS Build / Prebuild:
npm run mode:apk
```

### Bước 3: Khởi chạy Metro Bundler
```bash
npx expo start
```

### Bước 4: Trải nghiệm ứng dụng
- **Điện thoại thật (Android / iOS):** Mở ứng dụng **Expo Go**, quét mã QR trên màn hình terminal.
- **Máy ảo Android Studio:** Nhấn phím `a` trên bàn phím terminal.
- **Trình duyệt Web:** Nhấn phím `w` trên bàn phím terminal.

---

## 🛠️ 3. Cấu hình Kết nối API & Mạng LAN

Cấu hình IP tự động nằm tại [`src/services/get_IPv4.ts`](src/services/get_IPv4.ts) và [`src/services/api.ts`](src/services/api.ts):
- **Trình duyệt Web:** Kết nối `http://localhost:5000/api`.
- **Thiết bị thật (Expo Go):** Tự động nhận diện địa chỉ IPv4 LAN của máy tính đang chạy Expo Bundler.
- **Lưu ý:** Đảm bảo điện thoại và máy tính kết nối **chung một mạng Wi-Fi** và mở cổng `5000` trên tường lửa máy tính.

---

## 📁 4. Cấu trúc Thư mục Frontend

```text
frontend/
├── app/                                # Expo Router (File-based Routing)
│   ├── index.tsx                       # Màn hình Splash nhận diện Deep Sapphire
│   ├── _layout.tsx                     # Root Layout (SafeArea, Theme, Push Notifications)
│   ├── (auth)/                         # Nhóm màn hình Xác thực
│   │   ├── index.tsx                   # Đăng nhập (hỗ trợ Chế độ Khách)
│   │   ├── register.tsx                # Đăng ký tài khoản sinh viên mới
│   │   ├── forgot-password.tsx         # Quên mật khẩu & xác nhận OTP
│   │   └── otp_verification.tsx        # Màn hình nhập OTP 6 số
│   └── (main)/                         # Nhóm màn hình chính (Bottom Tabs)
│       ├── _layout.tsx                 # Cấu hình Bottom Tabs Navigation
│       ├── home/                       # Trang chủ sinh viên & tin tức
│       ├── map/                        # Bản đồ số Leaflet & Dẫn đường Dijkstra
│       ├── schedule/                   # Thời khóa biểu tuần & thêm lịch học
│       ├── grades/                     # Kết quả học tập & bảng điểm chi tiết
│       ├── profile/                    # Hồ sơ cá nhân, đổi mật khẩu & cài đặt
│       ├── chat/                       # Trợ lý AI TTN Smart Bot RAG
│       ├── feedback/                   # Gửi ý kiến phản hồi
│       └── sos/                        # Báo động khẩn cấp SOS
├── src/
│   ├── components/                     # NavHeader, MainTabs, GlassView, BottomNav
│   ├── constants/                      # appColors.ts, glassStyles.ts
│   ├── context/                        # ThemeContext (Dark / Light mode)
│   ├── features/                       # Các module tính năng chuyên sâu
│   │   ├── chat/                       # Smart Bot avatar, typing dots, bubble, welcome
│   │   ├── map/                        # Leaflet template, GPS hook, Dijkstra routing
│   │   └── schedule/                   # Bóc tách TKB, tính tuần động, lịch tự tạo
│   ├── services/                       # API clients, thông báo đẩy, widget service
│   └── widgets/                        # ScheduleWidget, GradesWidget, SosWidget
├── scripts/
│   └── toggle_apk_mode.js              # Script 1 lệnh chuyển đổi Dev / APK mode
├── app.json                            # Cấu hình ứng dụng Expo, permissions & adaptive icon
├── eas.json                            # Cấu hình EAS Build APK đám mây
└── package.json
```
