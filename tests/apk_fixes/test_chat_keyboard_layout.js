/**
 * test_chat_keyboard_layout.js
 * Kiểm tra cấu hình bàn phím và giao diện gợi ý trong suốt (No BG) của ChatBotScreen
 * 
 * Đảm bảo:
 * 1. app.json có softwareKeyboardLayoutMode là "resize" cho Android.
 * 2. chat/index.tsx dùng Animated keyboardOffset cho Android và behavior="padding" cho iOS,
 *    giúp nâng thanh chat chính xác theo chiều cao bàn phím và trả về 0 khi ẩn (không để lại khoảng trắng 44px).
 * 3. FlatList có keyboardShouldPersistTaps="handled" và keyboardDismissMode="on-drag".
 * 4. ChatInputBar có đệm an toàn Math.max(insets.bottom, 16) khi đóng bàn phím và 8 khi mở bàn phím.
 * 5. Các gợi ý câu hỏi (bento grid, suggestions bar, dynamic questions) đều trong suốt (backgroundColor: "transparent", No BG).
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
  console.log('🧪 TEST: LAYOUT BÀN PHÍM & GỢI Ý CHATBOT (NO BG)');
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

  // 2. Kiểm tra chat/index.tsx dùng Animated keyboardOffset tránh lỗi 44px của Android KeyboardAvoidingView
  total++;
  if (runTest('chat/index.tsx dùng Animated keyboardOffset nâng hạ mượt mà trên Android', () => {
    const chatPath = path.join(__dirname, '../../frontend/app/(main)/chat/index.tsx');
    const content = fs.readFileSync(chatPath, 'utf8');
    assert(
      content.includes('keyboardOffset') &&
      content.includes('paddingBottom: keyboardOffset'),
      'chat/index.tsx phải dùng Animated keyboardOffset để nâng thanh chat chính xác theo chiều cao bàn phím'
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

  // 4. Kiểm tra ChatInputBar có đệm safe area chuẩn
  total++;
  if (runTest('ChatInputBar có padding safe area đáy chuẩn', () => {
    const inputPath = path.join(__dirname, '../../frontend/src/features/chat/components/ChatInputBar.tsx');
    const content = fs.readFileSync(inputPath, 'utf8');
    assert(
      content.includes('Math.max(insets.bottom, 16)'),
      'ChatInputBar phải đảm bảo khoảng cách safe area tối thiểu 16px'
    );
  })) passed++;

  // 5. Kiểm tra phần gợi ý trong suốt không nền (No BG)
  total++;
  if (runTest('Phần gợi ý (Welcome card, suggestions bar, bot chips) đều trong suốt (No BG)', () => {
    const welcomePath = path.join(__dirname, '../../frontend/src/features/chat/components/ChatWelcomeView.tsx');
    const welcomeContent = fs.readFileSync(welcomePath, 'utf8');
    assert(
      welcomeContent.includes('backgroundColor: "transparent"') &&
      welcomeContent.includes('welcomeCategoryCard'),
      'ChatWelcomeView phải có bento cards và chips trong suốt'
    );

    const chatPath = path.join(__dirname, '../../frontend/app/(main)/chat/index.tsx');
    const chatContent = fs.readFileSync(chatPath, 'utf8');
    assert(
      chatContent.includes('backgroundColor: "transparent"'),
      'chat/index.tsx thanh gợi ý ngang phải trong suốt'
    );

    const itemPath = path.join(__dirname, '../../frontend/src/features/chat/components/ChatMessageItem.tsx');
    const itemContent = fs.readFileSync(itemPath, 'utf8');
    assert(
      itemContent.includes('backgroundColor: "transparent"'),
      'ChatMessageItem câu hỏi gợi ý của bot phải trong suốt'
    );
  })) passed++;

  console.log(`\nKết quả: ${passed}/${total} kiểm tra thành công.`);
  if (passed !== total) process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { main };
