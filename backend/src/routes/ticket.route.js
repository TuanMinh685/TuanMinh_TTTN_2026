const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// LUỒNG 1: Lễ tân khởi tạo phiên tiếp nhận mã QR động (POST /api/tickets/init-session)
router.post(
    '/init-session',
    verifyToken,
    requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'LE_TAN', 'KY_THUAT_VIEN'),
    ticketController.initSession
);

// LUỒNG 2: Khách hàng quét mã QR kiểm tra phiên & gửi thông tin sự cố
router.get('/session/:token', ticketController.checkSession);
router.post('/session/:token/submit', ticketController.submitIntake);

// Khách hàng tạo phiếu qua cổng QR cố định (QR Intake)
router.post('/intake', ticketController.submitIntake);

// Đặt lịch hẹn CSKH trước
router.post('/booking', ticketController.submitBooking);
router.get('/booking', verifyToken, ticketController.getBookings);
router.patch('/booking/:id/status', verifyToken, ticketController.updateBookingStatus);

// Nhân viên xem danh sách & cập nhật trạng thái phiếu
router.get('/', verifyToken, ticketController.getTickets);
router.patch('/:id/status', verifyToken, ticketController.updateTicketStatus);

// Quản lý kho linh kiện & thêm linh kiện (có số Serial) vào phiếu sửa chữa
router.get('/parts', verifyToken, requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'THU_KHO', 'KY_THUAT_VIEN'), ticketController.getParts);
router.post('/parts', verifyToken, requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'THU_KHO'), ticketController.createPart);
router.patch('/parts/:id', verifyToken, requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'THU_KHO'), ticketController.updatePart);
router.get('/:id/parts', verifyToken, ticketController.getTicketParts);
router.post('/:id/parts', verifyToken, requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'KY_THUAT_VIEN'), ticketController.addPartToTicket);
router.delete('/:id/parts/:partRecordId', verifyToken, requireRole('ADMIN', 'GIAM_DOC', 'QUAN_LY', 'KY_THUAT_VIEN'), ticketController.removePartFromTicket);

// Quản lý ảnh ngoại quan lúc nhận máy (Chống tráo đồ / khiếu nại)
router.get('/:id/photos', verifyToken, ticketController.getTicketPhotos);
router.post('/:id/photos', verifyToken, ticketController.addTicketPhoto);

module.exports = router;
