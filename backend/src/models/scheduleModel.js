const db = require('../config/db');

/**
 * Schedule Model - Tương tác dữ liệu bảng student_schedules
 */
const ScheduleModel = {
  /**
   * Lưu hoặc cập nhật thời khóa biểu theo MSSV và tuần/học kỳ
   */
  async upsertSchedule(mssv, semester, year, week, scheduleData, studentInfo = null) {
    const query = `
      INSERT INTO student_schedules (mssv, semester, academic_year, week_number, schedule_json, student_info_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        schedule_json = VALUES(schedule_json),
        student_info_json = VALUES(student_info_json),
        updated_at = NOW()
    `;
    const [result] = await db.query(query, [
      mssv,
      semester,
      year,
      week || 1,
      JSON.stringify(scheduleData || []),
      JSON.stringify(studentInfo || {})
    ]);
    return result;
  },

  /**
   * Lấy thời khóa biểu theo MSSV, học kỳ, tuần
   */
  async getByMssv(mssv, semester, year, week) {
    let query = `SELECT * FROM student_schedules WHERE mssv = ?`;
    const params = [mssv];

    if (semester && year) {
      query += ` AND semester = ? AND academic_year = ?`;
      params.push(semester, year);
    }
    if (week) {
      query += ` AND week_number = ?`;
      params.push(week);
    }
    query += ` ORDER BY updated_at DESC LIMIT 1`;

    const [rows] = await db.query(query, params);
    return rows[0] || null;
  }
};

module.exports = ScheduleModel;
