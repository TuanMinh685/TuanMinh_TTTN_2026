const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Quản trị nhân sự & cấp phát tài khoản CSKH: Chỉ dành cho Admin và Trưởng bộ phận CSKH (Quản lý)
router.get('/employees', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.getEmployees);
router.post('/employees', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.createEmployee);
router.patch('/employees/:id', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.updateEmployee);
router.delete('/employees/:id', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.deleteEmployee);

// Thống kê hiệu suất xử lý hồ sơ QR & chỉ số hài lòng khách hàng (CSAT)
router.get('/dashboard', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.getDashboard);
router.get('/dashboard-stats', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.getDashboard);

module.exports = router;
