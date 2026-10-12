const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(requireRole('QUAN_LY', 'ADMIN')); // Chỉ dành cho Quản lý

router.get('/dashboard', adminController.getDashboard);
router.get('/employees', adminController.getEmployees);


// NEW: Dashboard stats
router.get('/dashboard-stats', async (req, res, next) => {
    try {
        const { pool } = require('../config/db.config');
        const period = req.query.period || 'week';
        if (!['week', 'month'].includes(period)) {
            return res.status(400).json({ success: false, message: 'Khoảng thống kê phải là week hoặc month.' });
        }
        
        const revenueQ = await pool.query(`
            SELECT DATE(ngay_tao) as date, SUM(tong_tien) as total_revenue
            FROM phieu_sua_chua
            WHERE trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
              AND ngay_tao >= CASE
                WHEN $1 = 'month' THEN DATE_TRUNC('month', CURRENT_DATE)
                ELSE CURRENT_DATE - 6
              END
            GROUP BY DATE(ngay_tao)
            ORDER BY DATE(ngay_tao) ASC
        `, [period]);
        
        // Status distribution
        const statusQ = await pool.query(`
            SELECT trang_thai as name, CAST(COUNT(*) AS INTEGER) as value
            FROM phieu_sua_chua
            GROUP BY trang_thai
        `);

        const partsRevenueQ = await pool.query(`
            SELECT COALESCE(SUM(pl.so_luong * pl.don_gia), 0) AS total_parts_revenue
            FROM phieu_linh_kien pl
            JOIN phieu_sua_chua p ON p.id = pl.phieu_sua_chua_id
            WHERE p.trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
              AND p.ngay_tao >= CASE
                WHEN $1 = 'month' THEN DATE_TRUNC('month', CURRENT_DATE)
                ELSE CURRENT_DATE - 6
              END
        `, [period]);

        res.status(200).json({
            success: true,
            data: {
                period,
                revenueData: revenueQ.rows,
                statusData: statusQ.rows,
                totalPartsRevenue: Number(partsRevenueQ.rows[0]?.total_parts_revenue || 0)
            }
        });
    } catch(err) {
        next(err);
    }
});

module.exports = router;
