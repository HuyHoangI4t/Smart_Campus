const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartCampus API',
      version: '1.0.0',
      description: 'API documentation and interactive testing interface for LTDDDNT Node.js backend connected with MySQL (smartcampus) using mssv.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['mssv', 'password'],
          properties: {
            mssv: { type: 'string', example: '', description: 'Mã số sinh viên (MSSV)' },
            password: { type: 'string', example: '', description: 'Mật khẩu' }
          }
        },
        GradesRequest: {
          type: 'object',
          required: ['mssv'],
          properties: {
            mssv: { type: 'string', example: '', description: 'Mã số sinh viên (MSSV)' },
            dk: { type: 'string', example: '10', description: 'Đợt / Kỳ học' }
          }
        },
        ScheduleRequest: {
          type: 'object',
          required: ['mssv'],
          properties: {
            mssv: { type: 'string', example: '', description: 'Mã số sinh viên (MSSV)' },
            dk: { type: 'string', example: '10', description: 'Đợt / Kỳ học' }
          }
        },
        FeedbackRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            mssv: { type: 'string', example: '' },
            title: { type: 'string', example: 'Góp ý cơ sở vật chất' },
            content: { type: 'string', example: 'Phòng học A201 máy chiếu bị hỏng.' }
          }
        },
        SosRequest: {
          type: 'object',
          required: ['location', 'message'],
          properties: {
            mssv: { type: 'string', example: '' },
            location: { type: 'string', example: 'Thư viện tầng 2' },
            message: { type: 'string', example: 'Cần hỗ trợ y tế khẩn cấp!' }
          }
        }
      }
    }
  },
  apis: ['./src/server.js', './src/routes/*.js'],
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
