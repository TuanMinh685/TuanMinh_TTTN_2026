const webhookService = require('../services/webhook.service');
const { logSecurityEvent } = require('../utils/auditLogger');

// Xử lý webhook từ cổng thanh toán (Casso, SePay, PayOS, VietQR)
const handleBankingWebhook = async (req, res, next) => {
    try {
        const expectedSecret = (process.env.BANK_WEBHOOK_SECRET || '').trim();
        if (expectedSecret) {
            const authHeader = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
            const apiKeyHeader = String(req.headers['x-api-key'] || req.headers['secure-token'] || '').trim();
            if (authHeader !== expectedSecret && apiKeyHeader !== expectedSecret) {
                logSecurityEvent({
                    req,
                    actor: 'WEBHOOK_CLIENT',
                    role: 'EXTERNAL',
                    action: 'OPEN_BANKING_WEBHOOK_REJECTED',
                    target: 'Banking Webhook',
                    status: 'BLOCKED',
                    details: 'Từ chối webhook ngân hàng do thiếu hoặc sai secret xác thực'
                });
                return res.status(401).json({
                    error: true,
                    success: false,
                    errorCode: 'INVALID_WEBHOOK_SECRET',
                    message: 'Webhook secret không hợp lệ.'
                });
            }
        }

        const payload = req.body || {};
        
        // Ghi nhận sự kiện webhook
        logSecurityEvent({
            req,
            actor: 'WEBHOOK_CLIENT',
            role: 'EXTERNAL',
            action: 'OPEN_BANKING_WEBHOOK_RECEIVED',
            target: String(payload.ticketCode || 'VIETQR_WEBHOOK'),
            status: 'SUCCESS',
            details: `Nhận webhook ngân hàng (${req.headers['authorization'] || req.headers['x-api-key'] ? 'có header xác thực' : 'không header'})`
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
            message: 'Đã tự động khớp lệnh chuyển khoản VietQR thành công!',
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

// API mô phỏng khớp lệnh webhook để kiểm thử
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

        if (result.success) {
            logSecurityEvent({
                req,
                actor: req.user?.Username || 'staff',
                role: req.user?.Role || 'STAFF',
                action: 'MANUAL_VIETQR_CONFIRM',
                target: simulatedPayload.ticketCode,
                status: 'SUCCESS',
                details: `Nhân sự xác nhận đối soát VietQR cho phiếu ${simulatedPayload.ticketCode}`
            });
        }

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        next(error);
    }
};

// Kiểm tra trạng thái thanh toán theo mã phiếu
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
