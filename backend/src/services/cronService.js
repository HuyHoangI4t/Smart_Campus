const cron = require('node-cron');
const newsService = require('./newsService');
const studentSyncService = require('./studentSyncService');

let lastSyncTime = null;
let lastSyncStats = null;

/**
 * Thực hiện một lượt đồng bộ toàn diện từ cổng trường ĐH Tây Nguyên (TTN) vào MySQL
 */
async function runFullSync(triggerSource = 'AUTOMATED_CRON') {
  const startTime = new Date();
  console.log(`\n⏳ [Cron Sync] Bắt đầu đồng bộ dữ liệu từ trường TTN (${triggerSource}) lúc ${startTime.toLocaleTimeString('vi-VN')}...`);

  try {
    // 1. Đồng bộ Thông báo & Tin tức từ RSS trường vào bảng news_cache
    const [liveAnnouncements, liveNews] = await Promise.all([
      newsService.fetchAnnouncementsFromRss(),
      newsService.fetchNewsFromRss()
    ]);

    const savedAnnouncements = await newsService.saveItemsToDb(liveAnnouncements);
    const savedNews = await newsService.saveItemsToDb(liveNews);

    // 2. Đồng bộ Điểm và Thời khóa biểu của toàn bộ sinh viên đang hoạt động trong hệ thống
    const studentSyncResult = await studentSyncService.syncAllActiveStudents();

    lastSyncTime = new Date();
    lastSyncStats = {
      triggerSource,
      lastSyncTime,
      announcementsCount: liveAnnouncements.length,
      savedAnnouncements,
      newsCount: liveNews.length,
      savedNews,
      studentsTotal: studentSyncResult.total,
      syncedGrades: studentSyncResult.syncedGrades,
      syncedSchedules: studentSyncResult.syncedSchedules
    };

    console.log(`✅ [Cron Sync] Hoàn thành đồng bộ thành công!`);
    console.log(`   - Thông báo SV: ${liveAnnouncements.length} bài (đã lưu DB: ${savedAnnouncements})`);
    console.log(`   - Tin tức TTN: ${liveNews.length} bài (đã lưu DB: ${savedNews})`);
    console.log(`   - Sinh viên: ${studentSyncResult.total} tài khoản (Điểm: ${studentSyncResult.syncedGrades}, TKB: ${studentSyncResult.syncedSchedules})`);
    return lastSyncStats;
  } catch (error) {
    console.error(`❌ [Cron Sync] Lỗi trong quá trình đồng bộ:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Khởi động các tiến trình chạy nền tự động 3 lần / ngày (06:00, 12:00, 18:00 giờ Việt Nam)
 */
function startCronJobs() {
  // Lịch chạy 3 lần 1 ngày: 06:00 sáng, 12:00 trưa, 18:00 chiều tối
  const cronExpression = '0 6,12,18 * * *';

  cron.schedule(
    cronExpression,
    async () => {
      console.log('⏰ [Cron Trigger] Kích hoạt lịch đồng bộ tự động 3 lần/ngày (06h, 12h, 18h)...');
      await runFullSync('SCHEDULED_3X_DAILY');
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh'
    }
  );

  console.log('📅 [Cron Service] Đã kích hoạt lịch tự động cào dữ liệu từ trường: 3 lần/ngày (06:00, 12:00, 18:00 Asia/Ho_Chi_Minh)');

  // Chạy đồng bộ một lần ban đầu (sau 5 giây khởi động) để đảm bảo MySQL luôn có cache mới nhất
  setTimeout(() => {
    runFullSync('INITIAL_STARTUP_CACHE').catch(() => {});
  }, 5000);
}

function getSyncStatus() {
  return {
    lastSyncTime,
    lastSyncStats,
    schedule: '06:00, 12:00, 18:00 hàng ngày (Asia/Ho_Chi_Minh)',
    frequency: '3 lần / ngày'
  };
}

module.exports = {
  startCronJobs,
  runFullSync,
  getSyncStatus
};
