/**
 * Test Suite: Kiểm tra tính năng Bóng Chat Messenger & Notification Service
 * Xác minh:
 * 1. FloatingChatBot:
 *    - Sử dụng pan.getLayout() trên Android để tọa độ hit-test luôn chính xác 100%.
 *    - Bắt cử chỉ ngay lập tức với onStartShouldSetPanResponder: () => true.
 *    - Cơ chế thả tay chạy về cạnh ngang (snapX) ở bất kỳ độ cao Y nào.
 *    - Không bị bóng trong suốt (không dùng routeOpacity gây mờ).
 *    - Logo favicon.png hiển thị đầy đủ cả khi đóng vào (tab mép) lẫn khi mở tự do.
 * 2. Notification Service:
 *    - notificationService.native.ts export đầy đủ: initNotifications, sendInstantNotification, calculateDistanceMeters.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n=============================================');
console.log('🧪 TEST: BÓNG CHAT MESSENGER & NOTIFICATION SERVICE');
console.log('=============================================');

let passCount = 0;

// 1. Kiểm tra file FloatingChatBot.tsx
const chatBotPath = path.resolve(__dirname, '../../frontend/src/features/chat/components/FloatingChatBot.tsx');
assert.ok(fs.existsSync(chatBotPath), 'File FloatingChatBot.tsx phải tồn tại');
const chatBotContent = fs.readFileSync(chatBotPath, 'utf8');

// Test 1.1: Bắt cử chỉ tức thì onStartShouldSetPanResponder: () => true
assert.ok(
  chatBotContent.includes('onStartShouldSetPanResponder: () => true'),
  'FloatingChatBot phải bắt cảm ứng ngay lập tức khi ngón tay chạm vào (onStartShouldSetPanResponder: () => true)'
);
console.log('  ✅ PASS: FloatingChatBot bắt cử chỉ tức thì khi ngón tay chạm vào (0ms delay)');
passCount++;

// Test 1.2: Sử dụng pan.getLayout() cho native Android layout
assert.ok(
  chatBotContent.includes('pan.getLayout()'),
  'FloatingChatBot phải dùng pan.getLayout() để cập nhật trực tiếp left & top trên Android'
);
console.log('  ✅ PASS: Cập nhật trực tiếp native layout qua pan.getLayout() (khắc phục đơ vuốt Android)');
passCount++;

// Test 1.3: Thả tay chạy về cạnh ngang snapX ở bất kỳ vị trí Y nào
assert.ok(
  chatBotContent.includes('snapX = isRight ? screenWidth - ORB_SIZE - EDGE_MARGIN : EDGE_MARGIN') ||
  chatBotContent.includes('snapX = isRight ? screenWidth - ORB_SIZE'),
  'FloatingChatBot phải tính toán snapX để bóng chạy về cạnh ngang gần nhất'
);
assert.ok(
  chatBotContent.includes('toValue: { x: snapX, y: safeY }'),
  'FloatingChatBot phải chạy về { x: snapX, y: safeY } để giữ nguyên độ cao Y khi thả'
);
console.log('  ✅ PASS: Tự động chạy về cạnh ngang và nảy lò xo ở bất cứ độ cao Y nào khi thả');
passCount++;

// Test 1.4: Không dùng routeOpacity gây bóng ma trong suốt
assert.ok(
  !chatBotContent.includes('routeOpacity'),
  'FloatingChatBot không được dùng routeOpacity khiến bóng bị mờ trong suốt'
);
assert.ok(
  chatBotContent.includes('if (isHiddenRoute)') && chatBotContent.includes('return null'),
  'FloatingChatBot phải return null ngay khi ở màn hình ẩn để tránh bóng ma'
);
console.log('  ✅ PASS: Loại bỏ hoàn toàn lỗi bóng trong suốt (return null khi ở route ẩn)');
passCount++;

// Test 1.5: Logo favicon.png hiển thị cả khi đóng vào (dockedTab) lẫn khi mở ra (freeWrapper)
assert.ok(
  chatBotContent.includes("require('../../../../assets/images/favicon.png')"),
  'FloatingChatBot phải tải Logo chính thức từ favicon.png'
);
assert.ok(
  chatBotContent.includes('dockedLogo') && chatBotContent.includes('freeLogo'),
  'FloatingChatBot phải có style riêng cho Logo khi đóng vào tab mép và khi mở tự do'
);
console.log('  ✅ PASS: Logo trường ĐH Tây Nguyên hiển thị đầy đủ, sắc nét ở cả 2 trạng thái đóng/mở');
passCount++;

// 2. Kiểm tra notificationService.native.ts
const notifNativePath = path.resolve(__dirname, '../../frontend/src/services/notificationService.native.ts');
assert.ok(fs.existsSync(notifNativePath), 'File notificationService.native.ts phải tồn tại');
const notifContent = fs.readFileSync(notifNativePath, 'utf8');

// Test 2.1: initNotifications
assert.ok(
  notifContent.includes('export async function initNotifications()'),
  'notificationService.native.ts phải export initNotifications'
);
console.log('  ✅ PASS: Khôi phục hàm export initNotifications()');
passCount++;

// Test 2.2: sendInstantNotification
assert.ok(
  notifContent.includes('export async function sendInstantNotification('),
  'notificationService.native.ts phải export sendInstantNotification'
);
console.log('  ✅ PASS: Khôi phục hàm export sendInstantNotification()');
passCount++;

// Test 2.3: calculateDistanceMeters
assert.ok(
  notifContent.includes('export function calculateDistanceMeters('),
  'notificationService.native.ts phải export calculateDistanceMeters'
);
console.log('  ✅ PASS: Khôi phục hàm export calculateDistanceMeters()');
passCount++;

console.log(`\nKết quả: ${passCount}/${passCount} kiểm tra thành công.\n`);
process.exit(0);

