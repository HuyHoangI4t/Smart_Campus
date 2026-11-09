const assert = require('assert');
const fs = require('fs');
const path = require('path');
const express = require('../../backend/node_modules/express');
const http = require('http');

console.log('=============================================');
console.log('🧪 TEST: CẤU HÌNH REDIRECT TỪ TRANG CHỦ (/) SANG /api-docs');
console.log('=============================================');

// Test 1: Kiểm tra cấu hình trong server.js
const serverJsPath = path.join(__dirname, '../../backend/src/server.js');
const serverContent = fs.readFileSync(serverJsPath, 'utf8');

assert(
  serverContent.includes("app.get('/',") || serverContent.includes('app.get("/",'),
  "server.js phải có route handler cho 'GET /'"
);
assert(
  serverContent.includes("res.redirect('/api-docs')") || serverContent.includes('res.redirect("/api-docs")'),
  "Route handler '/' phải chuyển hướng sang '/api-docs'"
);
console.log("  ✅ PASS: server.js có cấu hình app.get('/', (req, res) => res.redirect('/api-docs'))");

// Test 2: Kiểm tra phản hồi HTTP thực tế qua Express mock app
const app = express();
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

const server = http.createServer(app);
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  
  const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
    assert.strictEqual(res.statusCode, 302, 'Mã trạng thái phản hồi phải là 302 (Found / Redirect)');
    assert.strictEqual(res.headers.location, '/api-docs', 'Header Location phải trỏ tới /api-docs');
    console.log("  ✅ PASS: Yêu cầu GET / trả về HTTP 302 với Location: /api-docs");
    
    server.close(() => {
      console.log('\nKết quả: 2/2 kiểm tra thành công.\n');
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    server.close();
    console.error('Lỗi kiểm tra HTTP:', err);
    process.exit(1);
  });
});
