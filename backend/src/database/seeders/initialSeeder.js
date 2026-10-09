/**
 * ============================================================================
 * TƯƠNG THÍCH NGƯỢC: INITIAL SEEDER
 * ============================================================================
 * Module này được giữ lại để tương thích ngược.
 * Logic seeder chính thức hiện được quản lý tập trung tại: src/database/seeders.js
 */

const { seedAdminUser } = require('../seeders');

module.exports = {
  run: seedAdminUser,
};
