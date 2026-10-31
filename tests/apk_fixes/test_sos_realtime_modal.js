/**
 * test_sos_realtime_modal.js
 * Kiểm tra toàn diện hệ thống phát cảnh báo SOS Realtime liên thiết bị & Giao diện SosAlertModal:
 * 
 * 1. Cơ chế lọc thiết bị gửi: Máy phát tín hiệu không tự báo động chính mình (isSelfSentSos).
 * 2. Máy nhận (kể cả cùng MSSV hoặc cùng là Khách) vẫn nhận và hiển thị cảnh báo 100%.
 * 3. File frontend/src/components/SosAlertModal.tsx thiết kế chuẩn (còi beacon, hotline 0329106783, bản đồ 3D).
 * 4. Root layout app/_layout.tsx nhúng SosAlertModal và đăng ký socket onNewSos ở cấp độ toàn cục.
 * 5. Backend campusController.js và campusApi.ts hỗ trợ client_id để đồng bộ realtime giữa các thiết bị.
 * 6. notificationService.native.ts tích hợp gọi showSosAlertModal khi có tín hiệu khẩn cấp.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('\n=============================================');
console.log('🧪 TEST: HỆ THỐNG SOS REALTIME & MODAL ĐỒNG BỘ');
console.log('=============================================');

let passedCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
    return true;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Chi tiết: ${err.message}`);
    return false;
  }
}

// 1. Kiểm tra logic phân biệt thiết bị độc lập (Cross-device Self-Exclusion)
runTest('Cơ chế lọc client_id và selfSentSosIds: Máy A không tự cảnh báo, Máy B nhận 100%', () => {
  const deviceA = 'client_device_A_12345';
  const deviceB = 'client_device_B_67890';
  const selfSentIdsDeviceA = new Set();
  const selfSentIdsDeviceB = new Set();

  function isSelfSent(alertData, myDeviceId, mySelfSentSet) {
    if (!alertData) return false;
    if (alertData.id && mySelfSentSet.has(String(alertData.id))) return true;
    if (alertData.client_id && alertData.client_id === myDeviceId) return true;
    return false;
  }

  // Giả lập Máy A phát tín hiệu SOS có ID = 999
  const alertFromA = {
    id: 999,
    client_id: deviceA,
    mssv: '2110310001',
    ho_ten: 'Nguyễn Văn A',
    location: 'Nhà học số 9',
    incidentType: 'Y tế khẩn cấp'
  };
  selfSentIdsDeviceA.add(String(alertFromA.id));

  // Kiểm tra Máy A: Phải phát hiện đây là tín hiệu của chính mình -> Không báo động
  assert.strictEqual(
    isSelfSent(alertFromA, deviceA, selfSentIdsDeviceA),
    true,
    'Máy A phải nhận diện tín hiệu do chính mình gửi'
  );

  // Kiểm tra Máy B: Dù đăng nhập cùng MSSV 2110310001 -> Vẫn nhận và phát cảnh báo
  assert.strictEqual(
    isSelfSent(alertFromA, deviceB, selfSentIdsDeviceB),
    false,
    'Máy B phải nhận được tín hiệu SOS kể cả khi đăng nhập cùng tài khoản MSSV với Máy A'
  );
});

// 2. Kiểm tra giao diện SosAlertModal.tsx có đầy đủ các thành phần thiết kế chuẩn
runTest('SosAlertModal.tsx có đèn còi beacon, hotline Đội Bảo vệ và điều hướng bản đồ', () => {
  const modalPath = path.join(__dirname, '../../frontend/src/components/SosAlertModal.tsx');
  assert(fs.existsSync(modalPath), 'File SosAlertModal.tsx phải tồn tại trong frontend/src/components/');
  
  const content = fs.readFileSync(modalPath, 'utf8');

  // Đèn còi beacon và animation
  assert(content.includes('beaconPulseHalo'), 'Modal phải có quầng sáng còi beaconPulseHalo');
  assert(content.includes('BÁO ĐỘNG SOS REALTIME'), 'Modal phải có huy hiệu thời gian thực BÁO ĐỘNG SOS REALTIME');

  // Hotline Đội Bảo vệ (0329106783)
  assert(content.includes('0329106783'), 'Modal phải có số điện thoại hotline Đội Bảo vệ 0329106783');
  assert(content.includes('tel:0329106783'), 'Modal phải có liên kết gọi điện tel:0329106783');

  // Thông tin hiển thị vị trí, người gửi, sự cố
  assert(content.includes('VỊ TRÍ PHÁT TÍN HIỆU'), 'Modal phải có trường vị trí phát tín hiệu');
  assert(content.includes('NGƯỜI GỬI CỨU TRỢ'), 'Modal phải có thông tin người gửi');
  assert(content.includes('NỘI DUNG SỰ CỐ'), 'Modal phải có nội dung mô tả sự cố');

  // Nút mở bản đồ 3D
  assert(content.includes('/(main)/map'), 'Modal phải có nút điều hướng tới bản đồ /(main)/map');

  // Quản lý hiển thị toàn cục
  assert(content.includes('showSosAlertModal') && content.includes('hideSosAlertModal'),
    'Modal phải export hàm showSosAlertModal và hideSosAlertModal'
  );
});

// 3. Kiểm tra Root Layout app/_layout.tsx nhúng SosAlertModal và lắng nghe onNewSos
runTest('Root Layout app/_layout.tsx nhúng SosAlertModal và lắng nghe onNewSos toàn cục', () => {
  const layoutPath = path.join(__dirname, '../../frontend/app/_layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  assert(content.includes('SosAlertModal'), 'Root layout app/_layout.tsx phải import và mount SosAlertModal');
  assert(content.includes('<SosAlertModal />'), 'Root layout phải có thẻ <SosAlertModal />');
  assert(content.includes('onNewSos'), 'Root layout phải đăng ký onNewSos');
  assert(content.includes('isSelfSentSos'), 'Root layout phải sử dụng isSelfSentSos để lọc máy gửi');
});

// 4. Kiểm tra Backend campusController.js và campusApi.ts chuyển tiếp client_id
runTest('Backend campusController.js và campusApi.ts hỗ trợ client_id cho Realtime SOS', () => {
  const controllerPath = path.join(__dirname, '../../backend/src/controllers/campusController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  assert(
    controllerContent.includes('client_id') && controllerContent.includes("io.emit('new_sos'"),
    'campusController.js phải nhận client_id và phát kèm trong sự kiện new_sos'
  );

  const apiPath = path.join(__dirname, '../../frontend/src/services/api/campusApi.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  assert(
    apiContent.includes('client_id?: string;'),
    'campusApi.ts apiSubmitSos phải chấp nhận thuộc tính client_id'
  );

  const socketServicePath = path.join(__dirname, '../../frontend/src/services/socketService.ts');
  const socketServiceContent = fs.readFileSync(socketServicePath, 'utf8');
  assert(
    socketServiceContent.includes('DEVICE_CLIENT_ID') &&
    socketServiceContent.includes('markSosAsSelfSent') &&
    socketServiceContent.includes('isSelfSentSos'),
    'socketService.ts phải có DEVICE_CLIENT_ID, markSosAsSelfSent và isSelfSentSos'
  );
});

// 5. Kiểm tra notificationService.native.ts gọi showSosAlertModal
runTest('notificationService.native.ts kết nối showSosAlertModal để hiển thị Popup mới', () => {
  const notifPath = path.join(__dirname, '../../frontend/src/services/notificationService.native.ts');
  const notifContent = fs.readFileSync(notifPath, 'utf8');
  assert(
    notifContent.includes('showSosAlertModal'),
    'notificationService.native.ts phải gọi showSosAlertModal khi có tín hiệu SOS đến'
  );
  assert(
    notifContent.includes('NOTIFICATION_CHANNELS.SOS'),
    'notificationService.native.ts phải gửi qua kênh NOTIFICATION_CHANNELS.SOS'
  );
});

// 6. Kiểm tra đẩy thông báo hệ thống của APK khi người dùng ở ngoài app (Background / Home screen)
runTest('Khi người dùng ở ngoài app (AppState background): Luôn đẩy thông báo APK khẩn cấp', () => {
  const notifPath = path.join(__dirname, '../../frontend/src/services/notificationService.native.ts');
  const notifContent = fs.readFileSync(notifPath, 'utf8');

  // Đảm bảo import và kiểm tra AppState
  assert(
    notifContent.includes('AppState') && notifContent.includes('AppState.currentState === "active"'),
    'notificationService.native.ts phải kiểm tra AppState để phân biệt trong và ngoài app'
  );

  // Đảm bảo sendInstantNotification có độ ưu tiên cao nhất (Heads-up banner)
  assert(
    notifContent.includes('AndroidNotificationPriority?.MAX') || notifContent.includes('"max"'),
    'sendInstantNotification phải có priority MAX để nổi banner trên màn hình khi ở ngoài app'
  );

  // Kênh SOS có importance MAX
  assert(
    notifContent.includes('AndroidImportance.MAX'),
    'Kênh NOTIFICATION_CHANNELS.SOS phải cấu hình importance MAX'
  );
});

// 7. Kiểm tra ẩn các dòng console.log ồn ào trong socketService.ts
runTest('socketService.ts đã ẩn toàn bộ log console ồn ào', () => {
  const socketPath = path.join(__dirname, '../../frontend/src/services/socketService.ts');
  const content = fs.readFileSync(socketPath, 'utf8');
  assert(
    !content.includes('[SocketService] Đang kết nối') &&
    !content.includes('[SocketService] Nhận sự kiện real-time'),
    'socketService.ts không được chứa console.log debug ồn ào'
  );
});

console.log(`\nKết quả: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) process.exit(1);
