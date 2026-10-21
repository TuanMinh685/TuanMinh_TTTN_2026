const { pool } = require('../config/db.config');
const bcrypt = require('bcrypt');

const getDashboardStats = async () => {
    const revenueResult = await pool.query(`
        SELECT COALESCE(SUM(tong_tien), 0) as total_revenue
        FROM phieu_sua_chua
        WHERE trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
    `);

    const ticketStats = await pool.query(`
        SELECT trang_thai, COUNT(*) as count
        FROM phieu_sua_chua
        GROUP BY trang_thai
    `);

    const tickets = ticketStats.rows || [];
    const statusDistribution = tickets.map((r) => ({
        name: r.trang_thai,
        value: Number(r.count || 0)
    }));

    return {
        revenue: Number(revenueResult.rows[0]?.total_revenue || 0),
        tickets,
        revenueData: tickets,
        statusDistribution
    };
};

const getEmployees = async () => {
    const result = await pool.query(`
        SELECT id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, ngay_tao
        FROM nhan_vien
        ORDER BY ngay_tao DESC
    `);
    return result.rows;
};

const getEmployeeById = async (id) => {
    const result = await pool.query(`
        SELECT id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, ngay_tao
        FROM nhan_vien
        WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
};

const getEmployeeByUsername = async (username) => {
    const result = await pool.query(`
        SELECT id, ten_dang_nhap, ho_ten, vai_tro, trang_thai
        FROM nhan_vien
        WHERE ten_dang_nhap = $1
    `, [username]);
    return result.rows[0] || null;
};

const createEmployee = async ({ ten_dang_nhap, mat_khau, ho_ten, vai_tro }) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mat_khau, salt);
    const result = await pool.query(`
        INSERT INTO nhan_vien (ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, ngay_tao
    `, [ten_dang_nhap, hashedPassword, ho_ten, vai_tro, 'HOAT_DONG']);
    return result.rows[0];
};

const updateEmployee = async (id, { ho_ten, vai_tro, trang_thai, mat_khau }) => {
    if (mat_khau && String(mat_khau).trim().length > 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(mat_khau).trim(), salt);
        const result = await pool.query(`
            UPDATE nhan_vien SET ho_ten = $1, vai_tro = $2, trang_thai = $3, mat_khau = $4 WHERE id = $5
            RETURNING id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, ngay_tao
        `, [ho_ten, vai_tro, trang_thai, hashedPassword, id]);
        return result.rows[0] || null;
    } else {
        const result = await pool.query(`
            UPDATE nhan_vien SET ho_ten = $1, vai_tro = $2, trang_thai = $3 WHERE id = $4
            RETURNING id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, ngay_tao
        `, [ho_ten, vai_tro, trang_thai, id]);
        return result.rows[0] || null;
    }
};

const deleteEmployee = async (id) => {
    const result = await pool.query(`
        DELETE FROM nhan_vien WHERE id = $1
        RETURNING id, ten_dang_nhap, ho_ten, vai_tro
    `, [id]);
    return result.rows[0] || null;
};

module.exports = {
    getDashboardStats,
    getEmployees,
    getEmployeeById,
    getEmployeeByUsername,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
