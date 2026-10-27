const { pool } = require('../config/db.config');
const bcrypt = require('bcrypt');

const getDashboardStats = async () => {
    const ticketStats = await pool.query(`
        SELECT trang_thai, COUNT(*) as count
        FROM phieu_sua_chua
        GROUP BY trang_thai
    `);

    const reviewStats = await pool.query(`
        SELECT COUNT(*) as total_reviews, COALESCE(ROUND(AVG(so_sao), 1), 5.0) as avg_rating
        FROM danh_gia
    `);

    const tickets = ticketStats.rows || [];
    const totalTickets = tickets.reduce((sum, r) => sum + Number(r.count || 0), 0);
    const completedTickets = tickets
        .filter(r => r.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' || r.trang_thai === 'ĐÃ_SỬA_XONG')
        .reduce((sum, r) => sum + Number(r.count || 0), 0);

    const statusDistribution = tickets.map((r) => ({
        name: r.trang_thai,
        value: Number(r.count || 0)
    }));

    return {
        totalTickets,
        completedTickets,
        totalReviews: Number(reviewStats.rows[0]?.total_reviews || 0),
        avgRating: Number(reviewStats.rows[0]?.avg_rating || 5.0),
        tickets,
        statusData: statusDistribution,
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
