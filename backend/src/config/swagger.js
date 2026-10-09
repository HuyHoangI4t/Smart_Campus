const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartCampus API - Đại học Tây Nguyên',
      version: '1.0.0',
      description: 'Tài liệu API và giao diện thử nghiệm tương tác cho hệ thống Smart Campus - Đại học Tây Nguyên (LTDDDNT). Hỗ trợ đầy đủ phân hệ Sinh viên, Bản đồ số, Tin tức, và Quản trị viên.',
      contact: {
        name: 'Smart Campus Team',
        email: 'huyhoangpro187@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Máy chủ phát triển cục bộ (Local Development Server)',
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
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['mssv', 'password'],
          properties: {
            mssv: { type: 'string', example: '23103023', description: 'Mã số sinh viên (MSSV) hoặc email' },
            password: { type: 'string', example: '123456', description: 'Mật khẩu' },
          },
        },
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
        FeedbackRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            title: { type: 'string', example: 'Góp ý cơ sở vật chất' },
            content: { type: 'string', example: 'Phòng học 9.2.04 máy chiếu bị mờ, cần hỗ trợ kỹ thuật.' },
          },
        },
        SosRequest: {
          type: 'object',
          required: ['location', 'message'],
          properties: {
            mssv: { type: 'string', example: '23103023' },
            location: { type: 'string', example: 'Nhà học số 9, Tầng 2' },
            message: { type: 'string', example: 'Cần hỗ trợ y tế khẩn cấp tại phòng 9.2.04!' },
          },
        },
        LocationRequest: {
          type: 'object',
          required: ['name', 'category', 'latitude', 'longitude'],
          properties: {
            name: { type: 'string', example: 'Nhà học số 9 (Khoa KHTN & Công nghệ)' },
            category: { type: 'string', example: 'giang_duong' },
            latitude: { type: 'number', example: 12.65688 },
            longitude: { type: 'number', example: 108.02672 },
            description: { type: 'string', example: 'Tòa nhà gồm các phòng thực hành máy tính và CNTT' },
            image_url: { type: 'string', example: '' },
          },
        },
        NotificationRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', example: 'Thông báo nghỉ học ngày lễ' },
            content: { type: 'string', example: 'Toàn thể sinh viên được nghỉ học theo thông báo của Nhà trường.' },
            type: { type: 'string', example: 'chung' },
          },
        },
      },
    },
  },
  apis: [
    path.resolve(__dirname, '../server.js').replace(/\\/g, '/'),
    path.resolve(__dirname, '../routes/*.js').replace(/\\/g, '/'),
  ],
};

const specs = swaggerJsdoc(options);

function setupSwagger(app) {
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('📄 Swagger UI bắt đầu tại http://localhost:5000/api-docs');
}

module.exports = setupSwagger;
