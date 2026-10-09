/**
 * ============================================================================
 * TƯƠNG THÍCH NGƯỢC: SEED 37 ĐỊA ĐIỂM
 * ============================================================================
 * Module này được giữ lại để tương thích ngược với các file import cũ.
 * Nguồn dữ liệu chính thức:
 * - Dữ liệu sẵn: src/database/seedData.js
 * - Hàm cập nhật: src/database/seeders.js
 */

const { TAY_NGUYEN_CAMPUS_LOCATIONS } = require('./seedData');
const { seedMapLocations } = require('./seeders');

module.exports = {
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  seedLocations: seedMapLocations,
};

if (require.main === module) {
  seedMapLocations(null, { force: true }).then(() => {
    console.log('Done seeding 37 locations.');
    process.exit(0);
  }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}