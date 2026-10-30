/**
 * test_chat_keyboard_layout.js
 * Kiểm tra cấu hình bàn phím của ChatBotScreen trên Android và iOS
 * 
 * Đảm bảo:
 * 1. app.json có softwareKeyboardLayoutMode là "resize" cho Android.
 * 2. KeyboardAvoidingView dùng behavior="padding" để đảm bảo thanh chat không bao giờ
 *    bị bàn phím ảo che lấp trên cả Android và iOS.
 * 3. FlatList có keyboardShouldPersistTaps="handled" và keyboardDismissMode="on-drag"
 *    để khi cuộn hoặc bấm gợi ý bàn phím đóng mở mượt mà.
 * 4. ChatInputBar lưu trữ cachedBottomInset để ngăn chặn thanh nhập liệu bị thụt sát đáy
 *    (mất padding safe area) sau khi đóng bàn phím trên MIUI/HyperOS/Android.
 * 5. ChatInputBar có TextInput onFocus và onBlur đồng bộ cùng keyboard listeners.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

function runTest(description, testFn) {
  try {
    testFn();
    console.log(`  ✅ PASS: ${description}`);
    return true;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`         ${err.message}`);
    return false;
  }
}

function main() {
  console.log('\n=============================================');
  console.log('🧪 TEST: LAYOUT BÀN PHÍM CHATBOT (ANDROID & IOS)');
  console.log('=============================================');
  let passed = 0;
  let total = 0;

  // 1. Kiểm tra app.json có softwareKeyboardLayoutMode: "resize"
  total++;
  if (runTest('app.json có cấu hình resize bàn phím cho Android', () => {
    const appJsonPath = path.join(__dirname, '../../frontend/app.json');
    const content = fs.readFileSync(appJsonPath, 'utf8');
    const parsed = JSON.parse(content);
    assert.strictEqual(
      parsed.expo?.android?.softwareKeyboardLayoutMode,
      'resize',
      'softwareKeyboardLayoutMode phải là "resize"'
    );
  })) passed++;

  // 2. Kiểm tra chat/index.tsx dùng behavior="padding" chống che khuất bàn phím
  total++;
  if (runTest('chat/index.tsx dùng behavior="padding" nâng view trên bàn phím', () => {
    const chatPath = path.join(__dirname, '../../frontend/app/(main)/chat/index.tsx');
    const content = fs.readFileSync(chatPath, 'utf8');
    assert(
      content.includes('behavior="padding"'),
      'KeyboardAvoidingView phải dùng behavior="padding" để không bị che khuất thanh chat'
    );
  })) passed++;

  // 3. Kiểm tra chat/index.tsx có dismiss on-drag và handled taps
  total++;
  if (runTest('chat/index.tsx FlatList có keyboardShouldPersistTaps và dismiss on-drag', () => {
    const chatPath = path.join(__dirname, '../../frontend/app/(main)/chat/index.tsx');
    const content = fs.readFileSync(chatPath, 'utf8');
    assert(
      content.includes('keyboardShouldPersistTaps="handled"') &&
      content.includes('keyboardDismissMode="on-drag"'),
      'FlatList phải có keyboardShouldPersistTaps="handled" và keyboardDismissMode="on-drag"'
    );
  })) passed++;

  // 4. Kiểm tra ChatInputBar có lưu cachedBottomInset chống tụt thanh nhập liệu
  total++;
  if (runTest('ChatInputBar có cachedBottomInset bảo toàn safe area khi tắt bàn phím', () => {
    const inputPath = path.join(__dirname, '../../frontend/src/features/chat/components/ChatInputBar.tsx');
    const content = fs.readFileSync(inputPath, 'utf8');
    assert(
      content.includes('cachedBottomInset') && content.includes('effectiveBottomInset'),
      'ChatInputBar phải có cachedBottomInset để bảo lưu insets.bottom sau khi ẩn bàn phím'
    );
  })) passed++;

  // 5. Kiểm tra ChatInputBar có đầy đủ keyboard listeners và focus/blur handlers
  total++;
  if (runTest('ChatInputBar có keyboard listeners và onFocus/onBlur an toàn', () => {
    const inputPath = path.join(__dirname, '../../frontend/src/features/chat/components/ChatInputBar.tsx');
    const content = fs.readFileSync(inputPath, 'utf8');
    assert(
      content.includes('keyboardDidShow') &&
      content.includes('keyboardDidHide') &&
      content.includes('onFocus') &&
      content.includes('onBlur'),
      'ChatInputBar phải kết hợp cả keyboard listener và onFocus/onBlur để tránh kẹt trạng thái'
    );
  })) passed++;

  console.log(`\nKết quả: ${passed}/${total} kiểm tra thành công.`);
  if (passed !== total) process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { main };
