/**
 * Script tự động bật/tắt (Comment / Uncomment) các tính năng Native
 * để chuyển đổi giữa 2 chế độ:
 * 1. Chế độ EXPO GO (Dev): 'node scripts/toggle_apk_mode.js dev'
 * 2. Chế độ BUILD APK:     'node scripts/toggle_apk_mode.js build'
 */
// Khi muốn dùng Expo Go (Dev):
// cd frontend
// npm run mode:dev

// Khi muốn chuẩn bị mã nguồn để Build file APK:
// cd frontend
// npm run mode:apk
/* global __dirname */
const fs = require('fs');
const path = require('path');

const mode = (process.argv[2] || 'dev').toLowerCase();
const isBuild = mode === 'build' || mode === 'apk' || mode === 'uncomment';

const rootDir = path.resolve(__dirname, '..');
const norm = (s) => s.replace(/\r\n/g, '\n');

console.log(`\n🔄 Đang chuyển dự án sang chế độ: [${isBuild ? 'BUILD APK' : 'EXPO GO (DEV)'}]...`);

// 1. frontend/app/_layout.tsx
const layoutPath = path.join(rootDir, 'app/_layout.tsx');
let layout = norm(fs.readFileSync(layoutPath, 'utf8'));

const layoutUncommentedImports = `// [KHI BUILD APK]: Đã bật Thông báo đẩy & Widget Android\nimport * as Notifications from 'expo-notifications';\nimport { initNotifications } from '../src/services/notificationService';\nimport { syncAllWidgets } from '../src/services/widgetService';\nimport '../src/widgets/registerWidgets';`;
const layoutCommentedImports = `// [KHI BUILD APK]: Bỏ comment 4 dòng bên dưới để bật Thông báo đẩy & Widget Android\n// import * as Notifications from 'expo-notifications';\n// import { initNotifications } from '../src/services/notificationService';\n// import { syncAllWidgets } from '../src/services/widgetService';\n// import '../src/widgets/registerWidgets';`;

if (isBuild) {
  layout = layout.replace(layoutCommentedImports, layoutUncommentedImports);
  layout = layout.replace(
    `    // [KHI BUILD APK]: Bỏ comment toàn bộ khối bên dưới khi build APK / Development Client\n    /*\n    // 1. Khởi tạo Notification channels & xin quyền thông báo`,
    `    // [KHI BUILD APK]: Đã kích hoạt Thông báo đẩy & Widget\n    // 1. Khởi tạo Notification channels & xin quyền thông báo`
  );
  layout = layout.replace(
    `    return () => {\n      responseSubscription.remove();\n    };\n    */\n  }, [router]);`,
    `    return () => {\n      responseSubscription.remove();\n    };\n  }, [router]);`
  );
} else {
  layout = layout.replace(layoutUncommentedImports, layoutCommentedImports);
  layout = layout.replace(
    `    // [KHI BUILD APK]: Đã kích hoạt Thông báo đẩy & Widget\n    // 1. Khởi tạo Notification channels & xin quyền thông báo`,
    `    // [KHI BUILD APK]: Bỏ comment toàn bộ khối bên dưới khi build APK / Development Client\n    /*\n    // 1. Khởi tạo Notification channels & xin quyền thông báo`
  );
  layout = layout.replace(
    `    return () => {\n      responseSubscription.remove();\n    };\n  }, [router]);`,
    `    return () => {\n      responseSubscription.remove();\n    };\n    */\n  }, [router]);`
  );
}
fs.writeFileSync(layoutPath, layout, 'utf8');
console.log('✅ 1. app/_layout.tsx');

// 2. frontend/src/services/notificationService.native.ts
const notifPath = path.join(rootDir, 'src/services/notificationService.native.ts');
let notif = norm(fs.readFileSync(notifPath, 'utf8'));

if (isBuild) {
  notif = notif.replace(
    `// [KHI BUILD APK]: Bỏ comment khối try/catch bên dưới để nạp thư viện expo-notifications\n/*\ntry {`,
    `// [KHI BUILD APK]: Đã nạp thư viện expo-notifications\ntry {`
  );
  notif = notif.replace(
    `  console.warn("expo-notifications module not loaded:", e);\n}\n*/`,
    `  console.warn("expo-notifications module not loaded:", e);\n}`
  );
} else {
  notif = notif.replace(
    `// [KHI BUILD APK]: Đã nạp thư viện expo-notifications\ntry {`,
    `// [KHI BUILD APK]: Bỏ comment khối try/catch bên dưới để nạp thư viện expo-notifications\n/*\ntry {`
  );
  notif = notif.replace(
    `  console.warn("expo-notifications module not loaded:", e);\n}`,
    `  console.warn("expo-notifications module not loaded:", e);\n}\n*/`
  );
}
fs.writeFileSync(notifPath, notif, 'utf8');
console.log('✅ 2. src/services/notificationService.native.ts');

// 3. frontend/src/widgets/registerWidgets.ts
const widgetPath = path.join(rootDir, 'src/widgets/registerWidgets.ts');
let widget = norm(fs.readFileSync(widgetPath, 'utf8'));

const widgetCommented = `// [KHI BUILD APK]: Bỏ comment các dòng bên dưới để đăng ký Widget cho Android\n// import { registerWidgetTaskHandler } from "react-native-android-widget";\n// import { widgetTaskHandler } from "./widgetTaskHandler";\n\n// registerWidgetTaskHandler(widgetTaskHandler);`;
const widgetUncommented = `// [KHI BUILD APK]: Đã kích hoạt Widget cho Android\nimport { registerWidgetTaskHandler } from "react-native-android-widget";\nimport { widgetTaskHandler } from "./widgetTaskHandler";\n\nregisterWidgetTaskHandler(widgetTaskHandler);`;

if (isBuild) {
  widget = widget.replace(widgetCommented, widgetUncommented);
} else {
  widget = widget.replace(widgetUncommented, widgetCommented);
}
fs.writeFileSync(widgetPath, widget, 'utf8');
console.log('✅ 3. src/widgets/registerWidgets.ts');

// 4. frontend/app/(main)/grades/index.tsx
const gradesPath = path.join(rootDir, 'app/(main)/grades/index.tsx');
let grades = norm(fs.readFileSync(gradesPath, 'utf8'));

const gradesImportsCommented = `// [KHI BUILD APK]: Bỏ comment 2 dòng dưới để bật Widget & Thông báo điểm\n// import { saveGradesForWidget } from "../../../src/services/widgetService";\n// import { triggerTestNotification } from "../../../src/services/notificationService";`;
const gradesImportsUncommented = `// [KHI BUILD APK]: Đã kích hoạt Widget & Thông báo điểm\nimport { saveGradesForWidget } from "../../../src/services/widgetService";\nimport { triggerTestNotification } from "../../../src/services/notificationService";`;

if (isBuild) {
  grades = grades.replace(gradesImportsCommented, gradesImportsUncommented);
  grades = grades.replace(
    `  // [KHI BUILD APK]: Bỏ comment khối bên dưới để tự động nạp điểm số vào Widget Android\n  /*\n  useEffect(() => {\n    if (isLoggedIn && (Number(totalCredits) > 0 || Number(gpa4) > 0)) {`,
    `  // [KHI BUILD APK]: Tự động nạp điểm số vào Widget Android\n  useEffect(() => {\n    if (isLoggedIn && (Number(totalCredits) > 0 || Number(gpa4) > 0)) {`
  );
  grades = grades.replace(
    `        studentInfo\n      ).catch(() => {});\n    }\n  }, [gpa4, gpa10, totalCredits, academicRank, studentInfo, isLoggedIn]);\n  */`,
    `        studentInfo\n      ).catch(() => {});\n    }\n  }, [gpa4, gpa10, totalCredits, academicRank, studentInfo, isLoggedIn]);`
  );
} else {
  grades = grades.replace(gradesImportsUncommented, gradesImportsCommented);
  grades = grades.replace(
    `  // [KHI BUILD APK]: Tự động nạp điểm số vào Widget Android\n  useEffect(() => {\n    if (isLoggedIn && (Number(totalCredits) > 0 || Number(gpa4) > 0)) {`,
    `  // [KHI BUILD APK]: Bỏ comment khối bên dưới để tự động nạp điểm số vào Widget Android\n  /*\n  useEffect(() => {\n    if (isLoggedIn && (Number(totalCredits) > 0 || Number(gpa4) > 0)) {`
  );
  grades = grades.replace(
    `        studentInfo\n      ).catch(() => {});\n    }\n  }, [gpa4, gpa10, totalCredits, academicRank, studentInfo, isLoggedIn]);`,
    `        studentInfo\n      ).catch(() => {});\n    }\n  }, [gpa4, gpa10, totalCredits, academicRank, studentInfo, isLoggedIn]);\n  */`
  );
}
fs.writeFileSync(gradesPath, grades, 'utf8');
console.log('✅ 4. app/(main)/grades/index.tsx');

// 5. frontend/app/(main)/schedule/index.tsx
const schedPath = path.join(rootDir, 'app/(main)/schedule/index.tsx');
let sched = norm(fs.readFileSync(schedPath, 'utf8'));

const schedImportCommented = `// [KHI BUILD APK]: Bỏ comment dòng dưới để kích hoạt Widget Lịch Học\n// import { saveScheduleForWidget } from "../../../src/services/widgetService";`;
const schedImportUncommented = `// [KHI BUILD APK]: Đã kích hoạt Widget Lịch Học\nimport { saveScheduleForWidget } from "../../../src/services/widgetService";`;

if (isBuild) {
  sched = sched.replace(schedImportCommented, schedImportUncommented);
  sched = sched.replace(
    `  // [KHI BUILD APK]: Bỏ comment khối bên dưới để tự động nạp lịch học hôm nay vào Widget\n  /*\n  useEffect(() => {\n    if (scheduleList && scheduleList.length > 0) {`,
    `  // [KHI BUILD APK]: Tự động nạp lịch học hôm nay vào Widget\n  useEffect(() => {\n    if (scheduleList && scheduleList.length > 0) {`
  );
  sched = sched.replace(
    `      saveScheduleForWidget(todayClasses).catch(() => {});\n    }\n  }, [scheduleList]);\n  */`,
    `      saveScheduleForWidget(todayClasses).catch(() => {});\n    }\n  }, [scheduleList]);`
  );
} else {
  sched = sched.replace(schedImportUncommented, schedImportCommented);
  sched = sched.replace(
    `  // [KHI BUILD APK]: Tự động nạp lịch học hôm nay vào Widget\n  useEffect(() => {\n    if (scheduleList && scheduleList.length > 0) {`,
    `  // [KHI BUILD APK]: Bỏ comment khối bên dưới để tự động nạp lịch học hôm nay vào Widget\n  /*\n  useEffect(() => {\n    if (scheduleList && scheduleList.length > 0) {`
  );
  sched = sched.replace(
    `      saveScheduleForWidget(todayClasses).catch(() => {});\n    }\n  }, [scheduleList]);`,
    `      saveScheduleForWidget(todayClasses).catch(() => {});\n    }\n  }, [scheduleList]);\n  */`
  );
}
fs.writeFileSync(schedPath, sched, 'utf8');
console.log('✅ 5. app/(main)/schedule/index.tsx');

console.log(`\n✨ Hoàn tất! Dự án đã chuyển sang chế độ: [${isBuild ? 'BUILD APK' : 'EXPO GO (DEV)'}]\n`);
