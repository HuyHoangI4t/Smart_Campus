const db = require('../config/db');

const userModel = {
  async findByMssv(mssv) {
    const [rows] = await db.query('SELECT * FROM users WHERE mssv = ?', [mssv]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findAll({ search, role } = {}) {
    let sql = 'SELECT id, mssv, ho_ten, email, role, so_dien_thoai, lop, khoa, avatar, created_at FROM users';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(mssv LIKE ? OR ho_ten LIKE ? OR email LIKE ? OR lop LIKE ? OR khoa LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async countTotal() {
    const [[row]] = await db.query('SELECT COUNT(*) AS total FROM users');
    return row.total;
  },

  async countStudents() {
    const [[row]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'sinh_vien' OR role IS NULL");
    return row.total;
  },

  async create(user) {
    const [result] = await db.query(`
      INSERT INTO users (mssv, ho_ten, email, password, role, so_dien_thoai, lop, khoa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.mssv,
      user.ho_ten || user.fullName || '',
      user.email,
      user.password,
      user.role || 'sinh_vien',
      user.so_dien_thoai || '',
      user.lop || 'Kỹ thuật phần mềm K23',
      user.khoa || 'Công nghệ Thông tin'
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.ho_ten !== undefined) { fields.push('ho_ten = ?'); params.push(data.ho_ten); }
    if (data.email !== undefined) { fields.push('email = ?'); params.push(data.email); }
    if (data.role !== undefined) { fields.push('role = ?'); params.push(data.role); }
    if (data.so_dien_thoai !== undefined) { fields.push('so_dien_thoai = ?'); params.push(data.so_dien_thoai); }
    if (data.lop !== undefined) { fields.push('lop = ?'); params.push(data.lop); }
    if (data.khoa !== undefined) { fields.push('khoa = ?'); params.push(data.khoa); }
    if (data.password !== undefined) { fields.push('password = ?'); params.push(data.password); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = userModel;
