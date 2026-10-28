# HƯỚNG DẪN BỎ COMMENT CÁC TÍNH NĂNG NATIVE KHI BUILD APK

Tài liệu này tổng hợp toàn bộ các đoạn mã đã được **tạm thời chú thích (comment out)** để dự án có thể chạy mượt mà trên **Expo Go**, cũng như hướng dẫn chi tiết cách mở lại (uncomment) khi bạn tiến hành **Build file APK** (sử dụng EAS Build hoặc `npx expo run:android`).

---

## 1. NGUYÊN NHÂN CẦN COMMENT

Dự án có 2 tính năng sử dụng mã nguồn Native sâu của Android:
1. **Thông báo đẩy cục bộ & Kênh thông báo (`expo-notifications`)**: Kể từ Expo SDK 52+, Expo Go không còn hỗ trợ trực tiếp các module native của notification đẩy dẫn đến lỗi runtime:
   ```
   Import stack:
    node_modules\expo-notifications\build\index.js
    | import "./NotificationPermissions"
   ```
2. **Widget ngoài màn hình chính Android (`react-native-android-widget`)**: Yêu cầu App Widget Provider và Java/Kotlin background service trong Android native code, không có sẵn trong Expo Go.

> **Lưu ý:** Khi build thành file APK hoàn chỉnh, các thư viện native trên sẽ được biên dịch và chạy bình thường.

---

## 2. MẸO TÌM NHANH TẤT CẢ CÁC VỊ TRÍ
Tất cả các vị trí đã comment đều có tiền tố đánh dấu thống nhất:
```text
[KHI BUILD APK]
```
👉 Bạn chỉ cần nhấn `Ctrl + Shift + F` trong VS Code / IDE và tìm kiếm: `[KHI BUILD APK]` để mở lại từng khối.

---

## 3. DANH SÁCH CHI TIẾT CÁC FILE VÀ ĐOẠN MÃ ĐÃ COMMENT

### 📁 1. `frontend/app/_layout.tsx` (File điều phối gốc)

#### Vị trí 1.1: Import thư viện ở đầu file (Khoảng dòng 5 - 8)
- **Mã hiện tại đã comment:**
```tsx
// [KHI BUILD APK]: Bỏ comment 4 dòng bên dưới để bật Thông báo đẩy & Widget Android
// import * as Notifications from 'expo-notifications';
// import { initNotifications } from '../src/services/notificationService';
// import { syncAllWidgets } from '../src/services/widgetService';
// import '../src/widgets/registerWidgets';
```
- **Khi build APK:** Bỏ dấu `//` ở cả 4 dòng import.

#### Vị trí 1.2: Kích hoạt thông báo & lắng nghe sự kiện trong `useEffect` (Khoảng dòng 16 - 54)
- **Mã hiện tại đã comment:**
```tsx
  useEffect(() => {
    // [KHI BUILD APK]: Bỏ comment toàn bộ khối bên dưới khi build APK / Development Client
    /*
    // 1. Khởi tạo Notification channels & xin quyền thông báo
    initNotifications().catch((err) => console.warn('Lỗi init notifications:', err));

    // 2. Đồng bộ các Widget màn hình chính khi khởi động app
    syncAllWidgets().catch((err) => console.warn('Lỗi sync widgets:', err));

    // 3. Lắng nghe sự kiện người dùng bấm vào thanh thông báo đẩy
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response.notification.request.content.data;
        if (data && data.screen) {
          switch (data.screen) {
            case 'grades':
              router.push('/(main)/grades');
              break;
            case 'schedule':
              router.push('/(main)/schedule');
              break;
            case 'sos':
              router.push('/(main)/sos');
              break;
            case 'home':
            default:
              router.push('/(main)/home');
              break;
          }
        }
      } catch (err) {
        console.warn('Lỗi xử lý navigation từ thông báo:', err);
      }
    });

    return () => {
      responseSubscription.remove();
    };
    */
  }, [router]);
```
- **Khi build APK:** Xóa bỏ `/*` và `*/` bao quanh khối lệnh.

---

### 📁 2. `frontend/src/services/notificationService.native.ts` (Service Thông báo)

#### Vị trí 2.1: Nạp thư viện `expo-notifications` (Khoảng dòng 15 - 33)
- **Mã hiện tại đã comment:**
```ts
let Notifications: any = null;
// [KHI BUILD APK]: Bỏ comment khối try/catch bên dưới để nạp thư viện expo-notifications
/*
try {
  Notifications = require("expo-notifications");
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority?.MAX,
      }),
    });
  }
} catch (e) {
  console.warn("expo-notifications module not loaded:", e);
}
*/
```
- **Khi build APK:** Xóa bỏ `/*` và `*/` bao quanh khối `try { ... } catch { ... }`.

---

### 📁 3. `frontend/src/widgets/registerWidgets.ts` (Đăng ký Android Widget)

#### Vị trí 3.1: Toàn bộ nội dung file (Khoảng dòng 1 - 5)
- **Mã hiện tại đã comment:**
```ts
// [KHI BUILD APK]: Bỏ comment các dòng bên dưới để đăng ký Widget cho Android
// import { registerWidgetTaskHandler } from "react-native-android-widget";
// import { widgetTaskHandler } from "./widgetTaskHandler";

// registerWidgetTaskHandler(widgetTaskHandler);
```
- **Khi build APK:** Bỏ dấu `//` ở cả 3 dòng code.

---

### 📁 4. `frontend/app/(main)/grades/index.tsx` (Màn hình Điểm số)

#### Vị trí 4.1: Import service ở đầu file (Dòng 3 - 5)
- **Mã hiện tại đã comment:**
```tsx
// [KHI BUILD APK]: Bỏ comment 2 dòng dưới để bật Widget & Thông báo điểm
// import { saveGradesForWidget } from "../../../src/services/widgetService";
// import { triggerTestNotification } from "../../../src/services/notificationService";
```

#### Vị trí 4.2: Tự động nạp điểm vào Widget Android (Khoảng dòng 193 - 209)
- **Mã hiện tại đã comment:**
```tsx
  // [KHI BUILD APK]: Bỏ comment khối bên dưới để tự động nạp điểm số vào Widget Android
  /*
  useEffect(() => {
    if (isLoggedIn && (Number(totalCredits) > 0 || Number(gpa4) > 0)) {
      saveGradesForWidget(
        {
          gpa4,
          gpa10,
          totalCredits: Number(totalCredits),
          rank: academicRank.label,
          rankColor: academicRank.color,
        },
        studentInfo
      ).catch(() => {});
    }
  }, [gpa4, gpa10, totalCredits, academicRank, studentInfo, isLoggedIn]);
  */
```

#### Vị trí 4.3: Nút bắn thông báo thử nghiệm điểm (Khoảng dòng 382 - 396)
- **Mã hiện tại đã comment:**
```tsx
        {/* [KHI BUILD APK]: Bỏ comment khối bên dưới để hiện thanh tiện ích Widget & Thông báo điểm
        <View ...>
          ...
        </View>
        */}
```

---

### 📁 5. `frontend/app/(main)/schedule/index.tsx` (Màn hình Thời khóa biểu)

#### Vị trí 5.1: Import widgetService (Dòng 29 - 30)
- **Mã hiện tại đã comment:**
```tsx
// [KHI BUILD APK]: Bỏ comment dòng dưới để kích hoạt Widget Lịch Học
// import { saveScheduleForWidget } from "../../../src/services/widgetService";
```

#### Vị trí 5.2: Tự động nạp lịch học vào Widget Android (Khoảng dòng 425 - 434)
- **Mã hiện tại đã comment:**
```tsx
  // [KHI BUILD APK]: Bỏ comment khối bên dưới để tự động nạp lịch học hôm nay vào Widget
  /*
  useEffect(() => {
    if (scheduleList && scheduleList.length > 0) {
      const todayNum = getTodayDayNum();
      const todayClasses = scheduleList.filter((s) => s.dayNum === todayNum);
      saveScheduleForWidget(todayClasses).catch(() => {});
    }
  }, [scheduleList]);
  */
```

---

### 📁 6. `frontend/app/(main)/profile/settings.tsx` (Màn hình Cài đặt)

#### Vị trí 6.1: Import notification & widget test (Dòng 16 - 18)
- **Mã hiện tại đã comment:**
```tsx
// [KHI BUILD APK]: Bỏ comment 2 dòng dưới để bật chức năng test Widget & Thông báo
// import { triggerTestNotification } from '../../../src/services/notificationService';
// import { syncAllWidgets } from '../../../src/services/widgetService';
```

#### Vị trí 6.2: Các nút kiểm tra tính năng trên UI Settings (Khoảng dòng 476 - 480)
- **Mã hiện tại đã comment:**
```tsx
            {/* [KHI BUILD APK]: Bỏ comment khối bên dưới để hiện các nút test thông báo đẩy & đồng bộ Widget
            <View ...>
            ...
            </View>
            */}
```

---

## 4. QUY TRÌNH BUILD FILE APK HOÀN CHỈNH

Sau khi bạn đã bỏ comment các đoạn mã trên:
1. Đảm bảo cấu hình `frontend/eas.json` và `frontend/app.json` đã chuẩn bị đầy đủ thông tin package (`com.vku.studentapp`).
2. Mở terminal tại thư mục `frontend`:
   ```bash
   cd frontend
   ```
3. Chạy lệnh build file APK:
   ```bash
   # Cách 1: Build file APK thông qua EAS Cloud (khuyên dùng, không cần cài đặt Android Studio nặng)
   npx eas build -p android --profile preview

   # Cách 2: Build local bằng Android SDK nếu máy có sẵn Android Studio
   npx expo run:android --variant release
   ```

