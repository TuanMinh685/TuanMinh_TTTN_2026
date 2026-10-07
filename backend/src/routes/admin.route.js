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
        
        // Revenue by last 7 days
        const revenueQ = await pool.query(`
            SELECT DATE(ngay_tao) as date, SUM(tong_tien) as total_revenue
            FROM phieu_sua_chua
            WHERE trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
              AND ngay_tao >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(ngay_tao)
            ORDER BY DATE(ngay_tao) ASC
        `);
        
        // Status distribution
        const statusQ = await pool.query(`
            SELECT trang_thai as name, CAST(COUNT(*) AS INTEGER) as value
            FROM phieu_sua_chua
            GROUP BY trang_thai
        `);

        res.status(200).json({
            success: true,
            data: {
                revenueData: revenueQ.rows,
                statusData: statusQ.rows
            }
        });
    } catch(err) {
        next(err);
    }
});

module.exports = router;
