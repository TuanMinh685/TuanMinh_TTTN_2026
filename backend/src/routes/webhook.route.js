const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Webhook tiếp nhận giao dịch chuyển khoản ngân hàng
router.post('/banking', webhookController.handleBankingWebhook);

// Xác nhận thanh toán VietQR từ quầy thu ngân (yêu cầu đăng nhập nhân viên)
router.post(
    '/banking/simulate',
    verifyToken,
    requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'LE_TAN', 'KY_THUAT_VIEN'),
    webhookController.simulateBankingWebhook
);

// Kiểm tra trạng thái thanh toán theo mã phiếu
router.get('/banking/status/:ticketCode', webhookController.checkPaymentStatus);

module.exports = router;
