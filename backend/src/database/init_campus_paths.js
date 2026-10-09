/**
 * ============================================================================
 * TƯƠNG THÍCH NGƯỢC: INIT CAMPUS PATHS
 * ============================================================================
 * Module này được giữ lại để tương thích ngược với các file import cũ.
 * Nguồn dữ liệu chính thức:
 * - Dữ liệu sẵn: src/database/seedData.js
 * - Hàm cập nhật: src/database/seeders.js
 */

const { DEFAULT_CAMPUS_PATHS } = require('./seedData');
const { seedCampusPaths } = require('./seeders');

module.exports = {
  DEFAULT_CAMPUS_PATHS,
  initCampusPaths: seedCampusPaths,
};

if (require.main === module) {
  seedCampusPaths(null, { force: true }).then(() => {
    console.log('Done initializing campus paths.');
    process.exit(0);
  }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}
