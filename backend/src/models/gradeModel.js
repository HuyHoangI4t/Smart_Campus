const db = require('../config/db');

/**
 * Grade Model - Tương tác dữ liệu bảng student_grades
 */
const GradeModel = {
  /**
   * Lưu hoặc cập nhật điểm học tập theo MSSV và học kỳ
   */
  async upsertGrade(mssv, semester, year, subjects, summary, studentInfo = null) {
    const query = `
      INSERT INTO student_grades (mssv, semester, academic_year, subjects_json, summary_json, student_info_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        subjects_json = VALUES(subjects_json),
        summary_json = VALUES(summary_json),
        student_info_json = VALUES(student_info_json),
        updated_at = NOW()
    `;
    const [result] = await db.query(query, [
      mssv,
      semester,
      year,
      JSON.stringify(subjects || []),
      JSON.stringify(summary || {}),
      JSON.stringify(studentInfo || {})
    ]);
    return result;
  },

  /**
   * Lấy điểm theo MSSV và học kỳ
   */
  async getByMssvAndSemester(mssv, semester, year) {
    const query = `
      SELECT * FROM student_grades 
      WHERE mssv = ? AND semester = ? AND academic_year = ?
      ORDER BY updated_at DESC LIMIT 1
    `;
    const [rows] = await db.query(query, [mssv, semester, year]);
    return rows[0] || null;
  },

  /**
   * Lấy toàn bộ lịch sử điểm của MSSV
   */
  async getAllByMssv(mssv) {
    const query = `
      SELECT * FROM student_grades 
      WHERE mssv = ?
      ORDER BY academic_year DESC, semester DESC
    `;
    const [rows] = await db.query(query, [mssv]);
    return rows;
  }
};

module.exports = GradeModel;
