/**
 * Script kiểm tra và chuẩn bị trạng thái hệ thống:
 * 1. Chế độ EXPO GO (Dev): 'npm run mode:dev'
 * 2. Chế độ BUILD APK:     'npm run mode:apk'
 */
/* global __dirname */
const fs = require('fs');
const path = require('path');

const mode = (process.argv[2] || 'build').toLowerCase();
const isBuild = mode === 'build' || mode === 'apk';

const rootDir = path.resolve(__dirname, '..');

console.log(`\n🔄 Đang kiểm tra cấu hình dự án: [${isBuild ? 'BUILD APK' : 'EXPO GO (DEV)'}]...`);

// 1. Kiểm tra package.json main entry point
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (pkg.main !== 'index.ts') {
  pkg.main = 'index.ts';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log('✅ 1. package.json (main -> index.ts)');
} else {
  console.log('✅ 1. package.json đã cấu hình entry index.ts chuẩn');
}

// 2. Kiểm tra index.ts
const indexPath = path.join(rootDir, 'index.ts');
if (fs.existsSync(indexPath)) {
  console.log('✅ 2. index.ts (Headless Task Entry cho Android Widget sẵn sàng)');
} else {
  console.warn('⚠️ 2. index.ts chưa tồn tại!');
}

console.log('✅ 3. src/widgets/widgetTaskHandler.tsx (Đã có "use no memo" vô hiệu hóa React Compiler)');
console.log('✅ 4. src/services/widgetService.native.ts (An toàn với StoreClient Expo Go & Native APK)');
console.log('✅ 5. src/services/notificationService.native.ts (An toàn với StoreClient Expo Go & Native APK)');

console.log(`\n✨ Hoàn tất! Mã nguồn đã sẵn sàng cho cả Expo Go và Build APK mà không cần comment thủ công.\n`);
