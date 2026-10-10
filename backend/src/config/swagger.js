const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

// Lấy danh sách tệp route tường minh để tương thích 100% trên Windows và Linux (tránh lỗi glob path)
const routesDir = path.resolve(__dirname, '../routes');
const routeFiles = fs.existsSync(routesDir)
  ? fs.readdirSync(routesDir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => path.join(routesDir, file).split(path.sep).join('/'))
  : [];

const serverFile = path.resolve(__dirname, '../server.js').split(path.sep).join('/');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartCampus API - Trường Đại học Tây Nguyên',
      version: '1.0.0',
      description: `
### Tài liệu API & Cổng Thử Nghiệm Tương Tác (Interactive Swagger UI)
Hệ thống **Smart Campus Đại học Tây Nguyên** hỗ trợ tích hợp đa nền tảng:
- 📱 **Ứng dụng di động (Mobile App - React Native / Expo)**: Tra cứu điểm, thời khóa biểu, bản đồ số 37 điểm, chỉ đường thông minh, phản ánh sinh viên và cứu trợ khẩn cấp SOS.
- 💻 **Trang quản trị (Admin Portal Web)**: Giám sát KPI, quản lý người dùng, duyệt phản ánh, trực ban cứu nạn SOS, chỉnh sửa bản đồ & mạng lưới lối đi nội bộ.
- 🔄 **Tiến trình tự động (Automated Cron Jobs)**: Đồng bộ tin tức, thông báo từ cổng trường TTN.

---
#### 🔑 Hướng dẫn xác thực (Authentication):
1. Gọi API \`POST /api/auth/login\` với tài khoản Admin hoặc Sinh viên để nhận JWT Token.
2. Nhấn nút **Authorize 🔓** ở góc trên bên phải, dán chuỗi Token vào và bấm **Authorize**.
3. Bạn có thể bấm **"Try it out"** và thực thi trực tiếp toàn bộ API có quyền bảo vệ trên giao diện này.
      `,
      contact: {
        name: 'Đội ngũ Kỹ thuật SmartCampus TTN',
        email: 'admin@ttn.edu.vn',
        url: 'https://www.ttn.edu.vn',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Máy chủ phát triển cục bộ (Localhost:5000)',
      },
      {
        url: 'http://192.168.1.20:5000',
        description: 'Mạng nội bộ trường / Wi-Fi LAN (Mobile Testing)',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Xác thực tài khoản, đăng nhập, đăng ký, OTP email và khôi phục mật khẩu' },
      { name: 'Student', description: 'Tra cứu bảng điểm, thời khóa biểu, CRUD lịch học tự tạo, hồ sơ sinh viên' },
      { name: 'Campus', description: 'Bản đồ khuôn viên, tọa độ 37 tòa nhà, đường đi nội bộ, phản hồi và SOS' },
      { name: 'News', description: 'Tin tức, thông báo và tài liệu đính kèm từ cổng đào tạo Đại học Tây Nguyên' },
      { name: 'General', description: 'Thông báo chung và tiện ích hệ thống' },
      { name: 'Admin', description: 'Quản trị viên (Người dùng, Địa điểm bản đồ, Đường đi, Cảnh báo SOS, Phản hồi)' },
      { name: 'System', description: 'Kiểm tra trạng thái server và tiến trình đồng bộ dữ liệu (Cron Job)' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập mã JWT Token nhận được từ API /api/auth/login (không cần gõ tiền tố Bearer)',
        },
      },
      schemas: {
        // --- AUTH SCHEMAS ---
        LoginRequest: {
          type: 'object',
          required: ['mssv', 'password'],
          properties: {
            mssv: { type: 'string', example: '23103023', description: 'Mã số sinh viên (MSSV) hoặc email' },
            password: { type: 'string', example: '123456', description: 'Mật khẩu' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['mssv', 'password'],
          properties: {
            mssv: { type: 'string', example: '23103023', description: 'Mã số sinh viên' },
            password: { type: 'string', example: '123456', description: 'Mật khẩu đăng nhập' },
            fullName: { type: 'string', example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' },
            email: { type: 'string', example: '23103023@sv.ttn.edu.vn', description: 'Email sinh viên nhận OTP' },
          },
        },
        RegisterVerifyRequest: {
          type: 'object',
          required: ['mssv', 'otpCode'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            otpCode: { type: 'string', example: '123456', description: 'Mã OTP gồm 6 chữ số gửi qua email' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            currentPassword: { type: 'string', example: '123456' },
            newPassword: { type: 'string', example: 'NewPass@2026' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['mssv'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            email: { type: 'string', example: '23103023@sv.ttn.edu.vn' },
          },
        },
        VerifyOtpRequest: {
          type: 'object',
          required: ['mssv', 'otpCode'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            otpCode: { type: 'string', example: '123456' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['mssv', 'newPassword'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            newPassword: { type: 'string', example: 'NewPass@2026' },
            otpCode: { type: 'string', example: '123456' },
            token: { type: 'string', example: '' },
          },
        },

        // --- STUDENT SCHEMAS ---
        GradesRequest: {
          type: 'object',
          required: ['mssv'],
          properties: {
            mssv: { type: 'string', example: '23103023', description: 'Mã số sinh viên (MSSV)' },
            dk: { type: 'string', example: '10', description: 'Đợt / Kỳ học (tùy chọn)' },
          },
        },
        ScheduleRequest: {
          type: 'object',
          required: ['mssv'],
          properties: {
            mssv: { type: 'string', example: '23103023', description: 'Mã số sinh viên (MSSV)' },
            dk: { type: 'string', example: '10', description: 'Đợt / Kỳ học (tùy chọn)' },
          },
        },
        CustomScheduleRequest: {
          type: 'object',
          required: ['ten_hp', 'thu', 'tiet', 'phong'],
          properties: {
            mssv: { type: 'string', example: '23103023', description: 'MSSV sở hữu lịch (nếu bỏ trống lấy từ token)' },
            ten_hp: { type: 'string', example: 'Thực hành Lập trình di động', description: 'Tên học phần / Ca thực hành' },
            thu: { type: 'string', example: 'Thứ 6', description: 'Thứ trong tuần (Thứ 2 - Thứ 7, CN)' },
            tiet: { type: 'string', example: 'Tiết 7-10', description: 'Tiết học (vd: Tiết 1-4, Tiết 7-10)' },
            phong: { type: 'string', example: '9.2.04', description: 'Mã phòng học (hệ thống tự sinh chỉ đường)' },
            giang_vien: { type: 'string', example: 'TS. Hoàng Minh', description: 'Tên giảng viên hướng dẫn' },
            ghi_chu: { type: 'string', example: 'Mang laptop và cáp kết nối', description: 'Ghi chú thêm cho buổi học' },
            loai_lich: {
              type: 'string',
              enum: ['dot_xuat', 'hoc_bu', 'kiem_tra', 'khac'],
              example: 'dot_xuat',
              description: 'Phân loại: Thực hành đột xuất, Học bù, Kiểm tra / Thi, Khác',
            },
          },
        },
        ProfileUpdateRequest: {
          type: 'object',
          properties: {
            mssv: { type: 'string', example: '23103023' },
            email: { type: 'string', example: '23103023@sv.ttn.edu.vn' },
            so_dien_thoai: { type: 'string', example: '0987654321' },
            avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg' },
          },
        },

        // --- CAMPUS SCHEMAS ---
        FeedbackRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            title: { type: 'string', example: 'Góp ý cơ sở vật chất' },
            content: { type: 'string', example: 'Phòng học 9.2.04 máy chiếu bị mờ, cần hỗ trợ kỹ thuật.' },
            category: { type: 'string', example: 'facility', description: 'facility, teaching, canteen, security, procedure, other' },
            rating: { type: 'integer', example: 5, description: 'Đánh giá mức độ hài lòng (1 - 5 sao)' },
          },
        },
        SosRequest: {
          type: 'object',
          required: ['location', 'message'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            location: { type: 'string', example: 'Nhà học số 9, Tầng 2' },
            message: { type: 'string', example: 'Cần hỗ trợ y tế khẩn cấp tại phòng 9.2.04!' },
            latitude: { type: 'number', example: 12.6515 },
            longitude: { type: 'number', example: 108.0245 },
            phone: { type: 'string', example: '0987654321' },
          },
        },

        // --- ADMIN SCHEMAS ---
        AdminUserCreateRequest: {
          type: 'object',
          required: ['mssv', 'password'],
          properties: {
            mssv: { type: 'string', example: '23103099' },
            ho_ten: { type: 'string', example: 'Trần Văn B' },
            email: { type: 'string', example: '23103099@sv.ttn.edu.vn' },
            password: { type: 'string', example: '123456' },
            role: { type: 'string', example: 'sinh_vien', enum: ['sinh_vien', 'admin'] },
            so_dien_thoai: { type: 'string', example: '0987654321' },
            lop: { type: 'string', example: 'Kỹ thuật phần mềm K23' },
            khoa: { type: 'string', example: 'Công nghệ Thông tin' },
          },
        },
        AdminUserUpdateRequest: {
          type: 'object',
          properties: {
            ho_ten: { type: 'string', example: 'Trần Văn B' },
            email: { type: 'string', example: '23103099@sv.ttn.edu.vn' },
            role: { type: 'string', example: 'sinh_vien', enum: ['sinh_vien', 'admin'] },
            so_dien_thoai: { type: 'string', example: '0987654321' },
            lop: { type: 'string', example: 'Kỹ thuật phần mềm K23' },
            khoa: { type: 'string', example: 'Công nghệ Thông tin' },
            password: { type: 'string', example: '', description: 'Bỏ trống nếu không muốn đổi mật khẩu' },
          },
        },
        LocationRequest: {
          type: 'object',
          required: ['name', 'category', 'lat', 'lng'],
          properties: {
            name: { type: 'string', example: 'Nhà học số 9 (Khoa KHTN & Công nghệ)' },
            category: { type: 'string', example: 'Giảng đường', description: 'Giảng đường, Phòng ban, Tiện ích, Thư viện, Ký túc xá, Cổng trường' },
            building: { type: 'string', example: 'Nhà 9' },
            floor: { type: 'string', example: 'Tầng 1 - 4' },
            description: { type: 'string', example: 'Gồm các phòng thực hành máy tính và CNTT' },
            lat: { type: 'number', example: 12.650893, description: 'Vĩ độ GPS' },
            lng: { type: 'number', example: 108.024225, description: 'Kinh độ GPS' },
            icon: { type: 'string', example: 'book-open' },
            color: { type: 'string', example: '#2563EB' },
          },
        },
        PathRequest: {
          type: 'object',
          required: ['name', 'coordinates'],
          properties: {
            name: { type: 'string', example: 'Lối đi Nhà 9 sang Nhà 2' },
            type: { type: 'string', example: 'walkway', enum: ['walkway', 'road', 'branch'] },
            coordinates: {
              type: 'string',
              example: '[[12.6508, 108.0241], [12.6510, 108.0243]]',
              description: 'Chuỗi JSON tọa độ danh sách các điểm mốc GPS',
            },
          },
        },
        NotificationRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', example: 'Thông báo nghỉ học ngày lễ' },
            content: { type: 'string', example: 'Toàn thể sinh viên được nghỉ học theo thông báo của Nhà trường.' },
            type: { type: 'string', example: 'info', enum: ['info', 'academic', 'urgent', 'event'] },
            sender: { type: 'string', example: 'Phòng Đào Tạo' },
            date: { type: 'string', example: '10/10/2026' },
          },
        },
        StatusUpdateRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', example: 'Đã giải quyết', description: 'Trạng thái mới' },
          },
        },
      },
    },
  },
  apis: [serverFile, ...routeFiles],
};

const specs = swaggerJsdoc(options);

const customCss = `
  .swagger-ui .topbar { background-color: #132F73; border-bottom: 3px solid #F59E0B; }
  .swagger-ui .topbar .topbar-wrapper img { content: url('https://upload.wikimedia.org/wikipedia/vi/4/4b/Logo_Tr%C6%B0%E1%BB%9Dng_%C4%90%E1%BA%A1i_h%E1%BB%8Dc_T%C3%A2y_Nguy%C3%AAn.png'); height: 42px; }
  .swagger-ui .info { margin: 24px 0; }
  .swagger-ui .info .title { color: #132F73; font-weight: 800; }
  .swagger-ui .btn.authorize { background-color: #132F73; color: #fff; border-color: #132F73; border-radius: 8px; font-weight: 700; }
  .swagger-ui .btn.authorize svg { fill: #fff; }
  .swagger-ui .opblock.opblock-get { border-color: #2563EB; background: rgba(37, 99, 235, 0.04); }
  .swagger-ui .opblock.opblock-post { border-color: #10B981; background: rgba(16, 185, 129, 0.04); }
  .swagger-ui .opblock.opblock-put { border-color: #F59E0B; background: rgba(245, 158, 11, 0.04); }
  .swagger-ui .opblock.opblock-delete { border-color: #EF4444; background: rgba(239, 68, 68, 0.04); }
  .swagger-ui .opblock-tag { font-size: 16px; font-weight: 700; border-bottom: 2px solid #E2E8F0; padding: 12px 0; }
`;

function setupSwagger(app) {
  // Trả về OpenAPI JSON trực tiếp
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Giao diện Swagger UI tương tác với các cấu hình tối ưu
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss,
      customSiteTitle: 'SmartCampus API Docs - ĐH Tây Nguyên',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
      },
    })
  );

  console.log('📄 Swagger UI sẵn sàng tại: http://localhost:5000/api-docs');
}

module.exports = setupSwagger;
