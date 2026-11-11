const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Cổng Webhook tiếp nhận biến động số dư chuyển khoản Open Banking
router.post('/banking', webhookController.handleBankingWebhook);

// Cổng mô phỏng khớp lệnh nhanh (phục vụ Demo đồ án trực tiếp)
router.post('/banking/simulate', webhookController.simulateBankingWebhook);

// Tra cứu trạng thái thanh toán thời gian thực theo mã phiếu
router.get('/banking/status/:ticketCode', webhookController.checkPaymentStatus);

module.exports = router;
