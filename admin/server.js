const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const API_URL = process.env.API_URL || 'http://localhost:5000';

app.use(cors());

// Cung cấp biến môi trường trực tiếp cho Client Browser qua /env.js
app.get(['/env.js', '/portal/env.js'], (req, res) => {
  res.type('application/javascript');
  res.send(`window.__ENV__ = ${JSON.stringify({ API_URL, PORT })};`);
});

// Phục vụ các tài nguyên tĩnh trong thư mục public (cả đường dẫn gốc và /portal)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/portal', express.static(path.join(__dirname, 'public')));

// Định tuyến SPA: chuyển các request còn lại về index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('\n======================================================');
  console.log(`🎓 [Admin Portal] đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔗 [API Backend] kết nối tới: ${API_URL}`);
  console.log('======================================================\n');
});
