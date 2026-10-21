const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Quản trị nhân sự & cấp phát tài khoản: Chỉ dành cho Giám Đốc, Admin và Quản Lý Cửa Hàng
router.get('/employees', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.getEmployees);
router.post('/employees', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.createEmployee);
router.patch('/employees/:id', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.updateEmployee);
router.delete('/employees/:id', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.deleteEmployee);

// Báo cáo doanh thu & thống kê: Dành cho Giám Đốc, Admin, Quản Lý và Kế Toán
router.get('/dashboard', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KE_TOAN'), adminController.getDashboard);

router.get('/dashboard-stats', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KE_TOAN'), async (req, res, next) => {
    try {
        const { pool } = require('../config/db.config');
        const period = req.query.period || 'week';
        if (!['week', 'month'].includes(period)) {
            return res.status(400).json({ success: false, message: 'Khoảng thống kê phải là week hoặc month.' });
        }
        
        const revenueQ = await pool.query(`
            WITH report_days AS (
                SELECT generate_series(
                    CASE
                        WHEN $1 = 'month' THEN DATE_TRUNC('month', CURRENT_DATE)::date
                        ELSE CURRENT_DATE - 6
                    END,
                    CURRENT_DATE,
                    INTERVAL '1 day'
                )::date AS date
            )
            SELECT TO_CHAR(d.date, 'YYYY-MM-DD') AS date, COALESCE(SUM(p.tong_tien), 0) AS total_revenue
            FROM report_days d
            LEFT JOIN phieu_sua_chua p
              ON DATE(p.ngay_tao) = d.date
             AND p.trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
            GROUP BY d.date
            ORDER BY d.date ASC
        `, [period]);
        
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

        const summaryQ = await pool.query(`
            SELECT
                COALESCE(SUM(tong_tien), 0) AS total_revenue,
                COUNT(*)::integer AS completed_tickets
            FROM phieu_sua_chua
            WHERE trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
              AND ngay_tao >= CASE
                WHEN $1 = 'month' THEN DATE_TRUNC('month', CURRENT_DATE)
                ELSE CURRENT_DATE - 6
              END
              AND ngay_tao < CURRENT_DATE + INTERVAL '1 day'
        `, [period]);

        res.status(200).json({
            success: true,
            data: {
                period,
                revenueData: revenueQ.rows,
                statusData: statusQ.rows,
                totalPartsRevenue: Number(partsRevenueQ.rows[0]?.total_parts_revenue || 0),
                totalRevenue: Number(summaryQ.rows[0]?.total_revenue || 0),
                completedTickets: Number(summaryQ.rows[0]?.completed_tickets || 0)
            }
        });
    } catch(err) {
        next(err);
    }
});

module.exports = router;
