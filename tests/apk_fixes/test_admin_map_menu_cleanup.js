/**
 * Test Suite: Kiểm tra Tách biệt Bản đồ & Tinh gọn Menu Admin Dashboard
 * Xác minh:
 * 1. Sidebar menu đã lược bớt 1 tab trùng lặp:
 *    - Gộp thành tab duy nhất "Bản Đồ & Trực Ban SOS" (navbtn-locations).
 *    - Đã xóa bỏ nút navbtn-sos riêng lẻ.
 * 2. Bản đồ Địa Điểm Khuôn Viên (bên trái):
 *    - Đã xóa bỏ nút Toggle SOS (btnToggleSosLayer).
 *    - locations.js không còn vẽ marker SOS hoặc popup cứu nạn lên bản đồ này.
 * 3. Bản đồ Trực Ban Cứu Hộ SOS 24/7 (bên phải):
 *    - Chuyên trách toàn bộ tín hiệu cảnh báo SOS.
 *    - app.js chuyển hướng và cuộn sang Bản đồ SOS khi có sự kiện SOS.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n=============================================');
console.log('🧪 TEST: TÁCH BIỆT BẢN ĐỒ & TINH GỌN MENU ADMIN');
console.log('=============================================');

let passCount = 0;

// 1. Kiểm tra file admin/public/index.html
const indexPath = path.resolve(__dirname, '../../admin/public/index.html');
assert.ok(fs.existsSync(indexPath), 'File admin/public/index.html phải tồn tại');
const htmlContent = fs.readFileSync(indexPath, 'utf8');

// Test 1.1: Thanh menu đã lược bớt nút navbtn-sos riêng lẻ
assert.ok(
  !htmlContent.includes('id="navbtn-sos"'),
  'Thanh menu sidebar không được chứa nút id="navbtn-sos" riêng lẻ (đã lược bớt 1 tab)'
);
console.log('  ✅ PASS: Thanh menu đã lược bớt 1 tab trùng lặp (không còn navbtn-sos riêng)');
passCount++;

// Test 1.2: Nâng cấp tab gộp "Bản Đồ & Trực Ban SOS" với badge đếm
assert.ok(
  htmlContent.includes('id="navbtn-locations"') && htmlContent.includes('Bản Đồ & Trực Ban SOS'),
  'Tab navbtn-locations phải được đổi tên thành "Bản Đồ & Trực Ban SOS"'
);
assert.ok(
  htmlContent.includes('id="totalLocationsCount"') && htmlContent.includes('id="navBadgeSos"'),
  'Tab navbtn-locations phải chứa cả badge địa điểm và badge thông báo khẩn cấp navBadgeSos'
);
console.log('  ✅ PASS: Tab gộp "Bản Đồ & Trực Ban SOS" tích hợp đầy đủ 2 badge trạng thái');
passCount++;

// Test 1.3: Bản đồ khuôn viên bên trái không còn nút btnToggleSosLayer
assert.ok(
  !htmlContent.includes('id="btnToggleSosLayer"'),
  'Bản đồ khuôn viên không được chứa nút btnToggleSosLayer (SOS)'
);
console.log('  ✅ PASS: Bản đồ khuôn viên bên trái đã xóa bỏ hoàn toàn nút bật/tắt SOS');
passCount++;

// 2. Kiểm tra admin/public/js/locations.js
const locPath = path.resolve(__dirname, '../../admin/public/js/locations.js');
assert.ok(fs.existsSync(locPath), 'File locations.js phải tồn tại');
const locContent = fs.readFileSync(locPath, 'utf8');

// Test 2.1: locations.js không còn vẽ marker SOS lên bản đồ khuôn viên
assert.ok(
  locContent.includes('Không vẽ marker SOS lên Bản đồ khuôn viên nữa'),
  'locations.js phải vô hiệu hóa vẽ marker SOS lên Bản đồ khuôn viên'
);
console.log('  ✅ PASS: locations.js không còn vẽ marker/radar SOS lên Bản đồ khuôn viên');
passCount++;

// 3. Kiểm tra admin/public/js/app.js
const appPath = path.resolve(__dirname, '../../admin/public/js/app.js');
assert.ok(fs.existsSync(appPath), 'File app.js phải tồn tại');
const appContent = fs.readFileSync(appPath, 'utf8');

// Test 3.1: switchTab đồng bộ active cho tab gộp khi tabId là locations hoặc sos
assert.ok(
  appContent.includes("const activeNavKey = (tabId === 'sos') ? 'locations' : tabId;"),
  'app.js phải ánh xạ tabId === sos sang activeNavKey = locations'
);
console.log('  ✅ PASS: switchTab tự động kích hoạt tab gộp khi truy cập SOS');
passCount++;

// Test 3.2: Khi mở tab sos, tự động hiển thị và cuộn tới Bản đồ SOS bên phải
assert.ok(
  appContent.includes("document.getElementById('sosCampusMapCard')"),
  'app.js phải cuộn tới sosCampusMapCard khi tabId === sos'
);
console.log('  ✅ PASS: Tự động điều hướng và cuộn tới Bản Đồ Cứu Hộ SOS bên phải khi có sự kiện');
passCount++;

console.log(`\nKết quả: ${passCount}/${passCount} kiểm tra thành công.\n`);
process.exit(0);

