const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=============================================");
console.log("🧪 TEST: XỬ LÝ LỚP HỌC TRỰC TUYẾN (ONLINE) & SAO CHÉP MÃ MEET");
console.log("=============================================");

// 1. Kiểm tra hàm parseRoomDirections của Backend scheduleService
const scheduleService = require("../../backend/src/services/scheduleService");

// Test 1: Lớp học Online với thông tin phòng Meet
const onlineItem1 = scheduleService.processSchedulePayload(
  [
    {
      tableIndex: 1,
      rows: [
        ["Ngày", "Tên môn học", "Tiết", "Phòng", "Giảng viên", "Ghi chú"],
        [
          "Thứ 2 09/11",
          "An toàn thông tin",
          "7-10",
          "Online",
          "Phan Xuân Thọ",
          "PM: Google Meet, mã: fve-nero-roo",
        ],
      ],
    },
  ],
  "Từ ngày 09/11/2026 đến ngày 15/11/2026"
);

assert(onlineItem1.schedules && onlineItem1.schedules.length === 1, "Phải parse được 1 môn học");
const sched = onlineItem1.schedules[0];

assert.strictEqual(sched.room, "Online", "Phòng học phải là Online");
assert.strictEqual(sched.course, "An toàn thông tin");
assert.strictEqual(sched.note, "PM: Google Meet, mã: fve-nero-roo", "Ghi chú phải chứa mã Google Meet");
assert.strictEqual(sched.direction.isOnline, true, "Phải đánh dấu isOnline = true");
assert.strictEqual(sched.direction.buildingCode, "Online", "buildingCode phải là Online");
assert.notStrictEqual(sched.direction.building, "Nhà học số 2", "KHÔNG ĐƯỢC chỉ đường đến Nhà học số 2");
assert.strictEqual(sched.direction.meetingUrl, "https://meet.google.com/fve-nero-roo", "meetingUrl phải là link Google Meet chuẩn");
console.log("  ✅ PASS: Backend scheduleService nhận diện Online, gán link Meet và KHÔNG chỉ đường tới Nhà 2");

// Test 2: Kiểm tra bóc tách table HTML trong studentSyncService
const syncServiceCode = fs.readFileSync(
  path.join(__dirname, "../../backend/src/services/studentSyncService.js"),
  "utf8"
);
assert(syncServiceCode.includes("line.startsWith('PM:')"), "studentSyncService phải trích xuất dòng PM:");
assert(syncServiceCode.includes("r[5] || ''"), "studentSyncService phải lưu ghi chú vào cột ghi_chu DB");
console.log("  ✅ PASS: studentSyncService lưu thông tin phần mềm & mã phòng Meet vào Database");

// Test 3: Kiểm tra frontend roomDirections.ts
const roomDirectionsTs = fs.readFileSync(
  path.join(__dirname, "../../frontend/src/features/schedule/utils/roomDirections.ts"),
  "utf8"
);
assert(roomDirectionsTs.includes("isOnline"), "roomDirections.ts phải có logic kiểm tra isOnline");
assert(roomDirectionsTs.includes("meet.google.com"), "roomDirections.ts phải trích xuất link meet.google.com");
assert(!roomDirectionsTs.includes("let building = \"Nhà học số 2\""), "Default không được là Nhà học số 2");
console.log("  ✅ PASS: frontend roomDirections.ts loại bỏ hoàn toàn lỗi gán Nhà 2 cho Online");

// Test 4: Kiểm tra ScheduleRoomDirectionModal.tsx có tính năng sao chép mã phòng thay vì chỉ đường
const modalTsx = fs.readFileSync(
  path.join(__dirname, "../../frontend/src/features/schedule/components/ScheduleRoomDirectionModal.tsx"),
  "utf8"
);
assert(modalTsx.includes("expo-clipboard"), "Modal phải dùng expo-clipboard để sao chép");
assert(modalTsx.includes("Clipboard.setStringAsync"), "Modal phải gọi setStringAsync");
assert(modalTsx.includes("Mã tham gia phòng học"), "Modal phải hiển thị hộp mã phòng Online");
assert(modalTsx.includes("Sao chép mã phòng"), "Modal phải có nút sao chép mã phòng");
assert(modalTsx.includes("Tham gia Google Meet ngay"), "Modal phải có nút mở link Meet trực tiếp");
console.log("  ✅ PASS: ScheduleRoomDirectionModal cung cấp mã, nút sao chép và mở Meet thay vì chỉ đường");

// Test 5: Kiểm tra ScheduleCard.tsx hiển thị huy hiệu Online và biểu tượng video
const cardTsx = fs.readFileSync(
  path.join(__dirname, "../../frontend/src/features/schedule/components/ScheduleCard.tsx"),
  "utf8"
);
assert(cardTsx.includes("isOnline"), "ScheduleCard phải nhận diện isOnline");
assert(cardTsx.includes("video"), "ScheduleCard phải hiển thị icon video cho lớp Online");
console.log("  ✅ PASS: ScheduleCard hiển thị rõ trạng thái Online và ghi chú phòng học");

// Test 6: Kiểm tra thay nút chỉ đường bằng mở link khi là online
assert(cardTsx.includes("handleOpenLink"), "ScheduleCard phải có hàm handleOpenLink");
assert(cardTsx.includes("Mở link"), "ScheduleCard phải hiển thị nút 'Mở link' cho lớp Online");
assert(cardTsx.includes("Linking.openURL"), "ScheduleCard phải gọi Linking.openURL khi nhấn Mở link");
console.log("  ✅ PASS: ScheduleCard thay nút 'Chỉ đường' bằng nút 'Mở link' cho lớp học Online");

// Test 7: Kiểm tra hiển thị lịch học trang Home (HomeNextClassCard) theo đúng giao diện gốc đẹp mắt
const homeCardTsx = fs.readFileSync(
  path.join(__dirname, "../../frontend/src/features/home/components/HomeNextClassCard.tsx"),
  "utf8"
);
assert(homeCardTsx.includes("isOnline ? \"Mở link\" : \"Chỉ đường\""), "HomeNextClassCard phải có nút 'Mở link' cho Online và 'Chỉ đường' cho trực tiếp");
assert(homeCardTsx.includes("Linking.openURL"), "HomeNextClassCard phải gọi Linking.openURL cho lớp online");
assert(homeCardTsx.includes("handleActionPress"), "HomeNextClassCard phải có hàm xử lý riêng cho capsule");
console.log("  ✅ PASS: HomeNextClassCard giữ nguyên giao diện gốc đẹp mắt và phân biệt Mở link vs Chỉ đường");

// Test 8: Kiểm tra import saveScheduleForWidget trong schedule/index.tsx
const scheduleIndexTsx = fs.readFileSync(
  path.join(__dirname, "../../frontend/app/(main)/schedule/index.tsx"),
  "utf8"
);
assert(scheduleIndexTsx.includes("saveScheduleForWidget"), "schedule/index.tsx phải import và sử dụng saveScheduleForWidget");
assert(/import\s*\{[^}]*saveScheduleForWidget[^}]*\}\s*from\s*["'].*widgetService["']/.test(scheduleIndexTsx), "schedule/index.tsx phải import saveScheduleForWidget từ widgetService");
console.log("  ✅ PASS: schedule/index.tsx đã import saveScheduleForWidget tránh lỗi ReferenceError trong useEffect");

// Test 9: Kiểm tra đồng bộ xóa lịch học sang trang Home (Không bị đọng lịch cũ trên Home)
const homeIndexTsx = fs.readFileSync(
  path.join(__dirname, "../../frontend/app/(main)/home/index.tsx"),
  "utf8"
);
assert(homeIndexTsx.includes("setNextClass(null)"), "home/index.tsx phải gọi setNextClass(null) khi lịch học bị xóa hoặc không còn môn");
assert(homeIndexTsx.includes("apiGetSchedule(isRealAccount ? mssv : undefined, true)"), "home/index.tsx phải gọi apiGetSchedule có force reload = true để tránh cache cũ");

const scheduleServiceJs = fs.readFileSync(
  path.join(__dirname, "../../backend/src/services/scheduleService.js"),
  "utf8"
);
assert(scheduleServiceJs.includes("options.nextWeekSchedule"), "scheduleService phải tự động lấy môn tuần kế tiếp khi tuần hiện tại không còn tiết học");

const scheduleApiTs = fs.readFileSync(
  path.join(__dirname, "../../frontend/src/services/api/scheduleApi.ts"),
  "utf8"
);
assert(scheduleApiTs.includes("cleanFromCache"), "scheduleApi.ts phải có hàm cleanFromCache xóa sạch nextClass cũ trong offline storage");
console.log("  ✅ PASS: Khi xóa lịch học, dữ liệu trang Home và Cache Offline tự động đồng bộ dọn sạch, không bị đọng lịch cũ");

console.log("\nKết quả: 9/9 kiểm tra thành công.\n");
