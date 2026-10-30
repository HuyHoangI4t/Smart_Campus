/**
 * test_chat_keyboard_layout.js
 * Kiểm tra cấu hình bàn phím của ChatBotScreen trên Android
 * 
 * Đảm bảo:
 * 1. app.json có softwareKeyboardLayoutMode là "resize" để Android tự đẩy layout lên tự nhiên.
 * 2. KeyboardAvoidingView trên Android dùng behavior={undefined} để tránh xung đột double-height
 *    khiến thanh nhập liệu bị co giật hoặc thụt xuống dưới khi đóng bàn phím.
 * 3. ChatInputBar tự động điều chỉnh paddingBottom theo sự kiện bàn phím.
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

  // 2. Kiểm tra chat/index.tsx không bị xung đột double-resize trên Android
  total++;
  if (runTest('chat/index.tsx không gán behavior="height" trên Android', () => {
    const chatPath = path.join(__dirname, '../../frontend/app/(main)/chat/index.tsx');
    const content = fs.readFileSync(chatPath, 'utf8');
    assert(
      content.includes('behavior={Platform.OS === "ios" ? "padding" : undefined}'),
      'KeyboardAvoidingView trên Android phải để behavior là undefined khi AndroidManifest đã bật adjustResize'
    );
  })) passed++;

  // 3. Kiểm tra ChatInputBar có listener bàn phím mượt mà
  total++;
  if (runTest('ChatInputBar có keyboard listener co giãn padding', () => {
    const inputPath = path.join(__dirname, '../../frontend/src/features/chat/components/ChatInputBar.tsx');
    const content = fs.readFileSync(inputPath, 'utf8');
    assert(
      content.includes('keyboardDidShow') && content.includes('keyboardDidHide'),
      'ChatInputBar phải theo dõi keyboardDidShow và keyboardDidHide để set paddingBottom'
    );
  })) passed++;

  console.log(`\nKết quả: ${passed}/${total} kiểm tra thành công.`);
  if (passed !== total) process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { main };
