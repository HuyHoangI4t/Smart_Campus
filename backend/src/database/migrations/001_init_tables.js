/**
 * ============================================================================
 * TƯƠNG THÍCH NGƯỢC: MIGRATION 001 INIT TABLES
 * ============================================================================
 * Module này được giữ lại để tương thích ngược.
 * Định nghĩa bảng chính thức hiện được quản lý tập trung tại: src/database/tables.js
 */

const { createAllTables } = require('../tables');

module.exports = {
  up: createAllTables,
};
