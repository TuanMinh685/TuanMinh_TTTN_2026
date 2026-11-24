const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const cmsController = require('../controllers/cms.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Cấu hình nội dung trang chủ (CMS)
router.get('/cms-config', cmsController.getPublicCmsConfig);
router.put('/cms-config', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), cmsController.updateCmsConfig);
router.post('/cms-config/reset', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), cmsController.resetCmsConfig);

// Quản lý tài khoản nhân sự
router.get('/employees', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.getEmployees);
router.post('/employees', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.createEmployee);
router.patch('/employees/:id', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.updateEmployee);
router.delete('/employees/:id', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.deleteEmployee);

// Thống kê tổng quan & đánh giá
router.get('/dashboard', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.getDashboard);
router.get('/dashboard-stats', requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY'), adminController.getDashboard);

// Nhật ký thao tác hệ thống
router.get('/audit-logs', requireRole('ADMIN', 'GIAM_DOC'), adminController.getSecurityAuditLogs);

module.exports = router;
