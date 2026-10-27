const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// LUỒNG 1: Lễ tân / CSKH khởi tạo phiên tiếp nhận mã QR động (POST /api/tickets/init-session)
router.post(
    '/init-session',
    verifyToken,
    requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'LE_TAN', 'KY_THUAT_VIEN'),
    ticketController.initSession
);

// LUỒNG 2: Khách hàng quét mã QR kiểm tra phiên & gửi thông tin yêu cầu CSKH
router.get('/session/:token', ticketController.checkSession);
router.post('/session/:token/submit', ticketController.submitIntake);

// Khách hàng tạo phiếu CSKH qua cổng QR cố định (QR Intake)
router.post('/intake', ticketController.submitIntake);

// Đặt lịch hẹn tư vấn & CSKH trước
router.post('/booking', ticketController.submitBooking);
router.get('/booking', verifyToken, ticketController.getBookings);
router.patch('/booking/:id/status', verifyToken, ticketController.updateBookingStatus);

// Nhân viên CSKH xem danh sách & cập nhật trạng thái hồ sơ QR
router.get('/', verifyToken, ticketController.getTickets);
router.patch('/:id/status', verifyToken, ticketController.updateTicketStatus);

// Quản lý ảnh minh chứng hiện trạng đính kèm hồ sơ QR
router.get('/:id/photos', verifyToken, ticketController.getTicketPhotos);
router.post('/:id/photos', verifyToken, ticketController.addTicketPhoto);

module.exports = router;
