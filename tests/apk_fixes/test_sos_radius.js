/**
 * Test: Tính khoảng cách và kiểm tra bán kính cảnh báo SOS 50m
 */

const assert = require('assert');

console.log('\n=============================================');
console.log('🧪 TEST: BÁN KÍNH CẢNH BÁO SOS (50 MÉT)');
console.log('=============================================');

let passedCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Chi tiết: ${err.message}`);
  }
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Mét
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function shouldTriggerSosNotification(userCoords, alertCoords) {
  if (!userCoords || !alertCoords) return false;
  const dist = calculateDistanceMeters(
    userCoords.latitude,
    userCoords.longitude,
    alertCoords.latitude,
    alertCoords.longitude
  );
  return dist <= 50;
}

// Tọa độ Giảng đường trung tâm ĐH Tây Nguyên
const tnuCenter = { latitude: 12.653420, longitude: 108.026110 };

// 1. Tọa độ cách khoảng 25m (cùng sân trường) -> PHẢI BÁO ĐỘNG
runTest('Tín hiệu SOS cách 25m (trong bán kính 50m)', () => {
  const nearbyAlert = { latitude: 12.653600, longitude: 108.026200 };
  const dist = calculateDistanceMeters(tnuCenter.latitude, tnuCenter.longitude, nearbyAlert.latitude, nearbyAlert.longitude);
  assert(dist < 50, `Khoảng cách phải < 50m, thực tế: ${dist.toFixed(1)}m`);
  assert.strictEqual(shouldTriggerSosNotification(tnuCenter, nearbyAlert), true);
});

// 2. Tọa độ cách khoảng 150m (ở cổng trường) -> KHÔNG ĐƯỢC BÁO ĐỘNG
runTest('Tín hiệu SOS cách 150m (ngoài bán kính 50m)', () => {
  const farAlert = { latitude: 12.654700, longitude: 108.026500 };
  const dist = calculateDistanceMeters(tnuCenter.latitude, tnuCenter.longitude, farAlert.latitude, farAlert.longitude);
  assert(dist > 50, `Khoảng cách phải > 50m, thực tế: ${dist.toFixed(1)}m`);
  assert.strictEqual(shouldTriggerSosNotification(tnuCenter, farAlert), false);
});

// 3. Tọa độ ở vị trí khác (cách 2km) -> KHÔNG ĐƯỢC BÁO ĐỘNG
runTest('Tín hiệu SOS cách xa 2km', () => {
  const distantAlert = { latitude: 12.670000, longitude: 108.040000 };
  assert.strictEqual(shouldTriggerSosNotification(tnuCenter, distantAlert), false);
});

console.log(`\nKết quả: ${passedCount}/${totalCount} kiểm tra thành công.`);
if (passedCount !== totalCount) process.exit(1);

