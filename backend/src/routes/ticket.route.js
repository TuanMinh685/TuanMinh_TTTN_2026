const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ticketController = require('../controllers/ticket.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const { validateTicketIntakeInput, validateBookingInput } = require('../middlewares/security.middleware');

// Giới hạn tần suất gửi form từ trang công khai
const publicSubmissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Hệ thống phát hiện quá nhiều yêu cầu gửi liên tiếp. Vui lòng thử lại sau ít phút!'
    }
});

// Phiên QR tạm tại quầy
router.post(
    '/init-session',
    verifyToken,
    requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'LE_TAN', 'KY_THUAT_VIEN'),
    ticketController.initSession
);
router.get('/session/:token', ticketController.checkSession);
router.post('/session/:token/submit', publicSubmissionLimiter, validateTicketIntakeInput, ticketController.submitIntake);

// Tạo phiếu trực tiếp qua cổng QR công khai
router.post('/intake', publicSubmissionLimiter, validateTicketIntakeInput, ticketController.submitIntake);

// Đặt lịch hẹn & quản lý lịch hẹn
router.post('/booking', publicSubmissionLimiter, validateBookingInput, ticketController.submitBooking);
router.get('/booking', verifyToken, ticketController.getBookings);
router.patch('/booking/:id/status', verifyToken, ticketController.updateBookingStatus);

// Danh sách phiếu & cập nhật tiến độ
router.get('/', verifyToken, ticketController.getTickets);
router.patch('/:id/status', verifyToken, ticketController.updateTicketStatus);

// Gửi thông báo nhắc khách hàng
router.post(
    '/:id/notify-zalo',
    verifyToken,
    requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'LE_TAN', 'KY_THUAT_VIEN'),
    ticketController.sendZaloNotification
);

// Xác nhận thanh toán tại quầy (tiền mặt hoặc VietQR)
router.post(
    '/:id/confirm-payment',
    verifyToken,
    requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'LE_TAN', 'KY_THUAT_VIEN'),
    ticketController.confirmPayment
);

// Ảnh hiện trạng đính kèm phiếu
router.get('/:id/photos', verifyToken, ticketController.getTicketPhotos);
router.post('/:id/photos', verifyToken, ticketController.addTicketPhoto);

module.exports = router;
