const webhookService = require('../services/webhook.service');
const { logSecurityEvent } = require('../utils/auditLogger');

// Xử lý Webhook chuẩn từ các cổng Open Banking (Casso, SePay, PayOS, VietQR Hub, v.v.)
const handleBankingWebhook = async (req, res, next) => {
    try {
        const payload = req.body || {};
        
        // Log sự kiện nhận Webhook để kiểm toán bảo mật
        logSecurityEvent({
            eventType: 'OPEN_BANKING_WEBHOOK_RECEIVED',
            ip: req.ip || req.connection?.remoteAddress,
            details: {
                headers: req.headers['authorization'] ? 'Present' : 'None',
                contentLength: req.headers['content-length']
            }
        });

        const result = await webhookService.reconcileBankingTransaction(payload);

        if (!result.success) {
            return res.status(400).json({
                error: true,
                success: false,
                errorCode: result.errorCode,
                message: result.message
            });
        }

        // Trả về cấu trúc JSON chuẩn ngân hàng (Mã 00 = Thành công)
        res.status(200).json({
            error: false,
            success: true,
            code: '00',
            message: 'Đã tự động khớp lệnh chuyển khoản VietQR thành công trong 1 giây!',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

// API mô phỏng khớp lệnh Webhook tự động (Dành cho việc Demo bảo vệ & Kiểm thử)
const simulateBankingWebhook = async (req, res, next) => {
    try {
        const { ticketCode, amount, bankName, referenceCode } = req.body;
        
        if (!ticketCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã hồ sơ ticketCode (Ví dụ: RP-839400)'
            });
        }

        const simulatedPayload = {
            ticketCode: String(ticketCode).trim().toUpperCase(),
            amount: Number(amount) || 0,
            referenceCode: referenceCode || `FT26${Date.now().toString().slice(-8)}`,
            gateway: bankName || 'MBBank - NAPAS 247',
            content: `CSKH ${ticketCode} chuyen khoan Napas247`
        };

        const result = await webhookService.reconcileBankingTransaction(simulatedPayload);

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        next(error);
    }
};

// Kiểm tra trạng thái thanh toán thời gian thực theo mã phiếu
const checkPaymentStatus = async (req, res, next) => {
    try {
        const { ticketCode } = req.params;
        const statusData = await webhookService.getPaymentStatusByTicketCode(ticketCode);

        if (!statusData) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thông tin phiếu ${ticketCode}`
            });
        }

        res.status(200).json({
            success: true,
            data: statusData
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleBankingWebhook,
    simulateBankingWebhook,
    checkPaymentStatus
};
