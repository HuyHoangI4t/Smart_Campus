# CƠ CHẾ NATIVE WIDGET & THÔNG BÁO CHO ANDROID APK (ĐÃ TỰ ĐỘNG HÓA HOÀN TOÀN)

> **Cập nhật quan trọng:** Mã nguồn hiện tại đã được cấu hình tự động thông minh bằng `Constants.executionEnvironment === ExecutionEnvironment.StoreClient` (`!isExpoGo`) và Entry point `index.ts`. Bạn **KHÔNG CẦN phải comment / uncomment thủ công** khi chuyển đổi giữa Expo Go và Build APK nữa!

---

## 1. NGUYÊN NHÂN WIDGET TỪNG BỊ "VÔ HÌNH" KHI KÉO RA MÀN HÌNH CHÍNH

1. **Thiếu file khởi động gốc (`index.ts`)**:
   - Khi người dùng kéo Widget ra màn hình chính, hệ điều hành Android kích hoạt một **Headless JS Task** ngầm (`RNWidgetBackgroundTaskWorker`) chứ **không khởi động màn hình UI (Activity)**.
   - Trước đây trong `package.json`, `"main": "expo-router/entry"` chỉ nạp UI `_layout.tsx` khi người dùng mở App. Khi kéo widget lúc app tắt, `_layout.tsx` không hề chạy, dẫn đến `registerWidgetTaskHandler` **chưa từng được đăng ký trong React Native AppRegistry**.
   - Hậu quả: Layout mặc định ban đầu `rn_widget.xml` là một `ImageView` trong suốt 100% (`@android:color/transparent`), task nền không chạy nên không vẽ được bitmap, widget hoàn toàn **tàng hình/vô hình**.

2. **Xung đột React Compiler (`reactCompiler: true` trong `app.json`)**:
   - Expo SDK 54 bật tính năng thử nghiệm `reactCompiler`. Thư viện `react-native-android-widget` chạy ngoài chu trình render của React (Static Virtual DOM traversal), khi React Compiler biến đổi component thành hook memoization sẽ phát sinh lỗi `Invalid Hook Call` làm task nền crash âm thầm.
   - **Giải pháp:** Đã thêm chỉ thị `"use no memo";` lên đầu các file widget (`ScheduleWidget.tsx`, `GradesWidget.tsx`, `SosWidget.tsx`, `widgetTaskHandler.tsx`).

3. **Mã nguồn bị comment và phụ thuộc toggle thủ công**:
   - Các import và lệnh đồng bộ widget trước đây bị comment trong `_layout.tsx`, `schedule/index.tsx`, `grades/index.tsx`.
   - Hiện tại đã mở lại và bảo vệ bằng điều kiện an toàn `!isExpoGo`, app luôn tự động đồng bộ điểm và thời khóa biểu mỗi khi đăng nhập hoặc mở app.

---

## 2. KIẾN TRÚC ĐÃ KHẮC PHỤC

1. **`frontend/index.ts`** làm Entry Point chính:
   ```typescript
   import 'expo-router/entry';
   import Constants, { ExecutionEnvironment } from 'expo-constants';
   import { Platform } from 'react-native';

   const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

   if (Platform.OS === 'android' && !isExpoGo) {
     const { registerWidgetTaskHandler } = require('react-native-android-widget');
     const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
     registerWidgetTaskHandler(widgetTaskHandler);
   }
   ```
2. **`frontend/package.json`**:
   - `"main": "index.ts"` đảm bảo cả Expo Router và Headless JS Task đều khởi động đúng chuẩn.
3. **Các Widget đã có `"use no memo";`**:
   - Ngăn chặn React Compiler can thiệp làm hỏng cây cấu trúc Widget.

---

## 3. CÁC LỆNH BUILD APK
Mọi thứ đã sẵn sàng, bạn chỉ cần chạy lệnh build như bình thường:
```bash
cd frontend
npm run mode:apk
eas build -p android --profile preview
```
(Hoặc build trực tiếp bằng EAS / Android Studio).
Widget kéo ra màn hình chính sẽ hiện đầy đủ giao diện, màu sắc và dữ liệu tức thì!
