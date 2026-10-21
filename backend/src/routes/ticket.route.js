const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');

const submitLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 phút
    max: 10, // Tối đa 10 yêu cầu
    message: { success: false, message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 10 phút!' }
});

const validateSubmit = [
    check('fullName').isLength({ max: 100 }).withMessage('Tên không được vượt quá 100 ký tự'),
    check('phone').isLength({ max: 20 }).withMessage('Số điện thoại không hợp lệ'),
    check('issueDescription').isLength({ max: 1000 }).withMessage('Mô tả lỗi quá dài')
];

// Khách hàng quét mã QR Cố định và điền form (QR Intake)
router.post('/intake', submitLimiter, validateSubmit, ticketController.submitIntake);

// API cho nhân sự nội bộ (Yêu cầu đăng nhập)
router.get('/', verifyToken, ticketController.getTickets);
router.patch('/:id/status', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'LE_TAN', 'KY_THUAT_VIEN', 'KE_TOAN'), ticketController.updateTicketStatus);
router.patch('/:id/software-packages', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KY_THUAT_VIEN'), ticketController.updateTicketSoftwarePackages);

// API Booking (Lịch hẹn): Lễ tân, Quản lý, Giám đốc
router.post('/booking', submitLimiter, ticketController.submitBooking);
router.get('/booking', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'LE_TAN'), ticketController.getBookings);
router.patch('/booking/:id/status', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'LE_TAN'), ticketController.updateBookingStatus);

// Inventory & Photo routes
router.get('/parts', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'THU_KHO', 'KY_THUAT_VIEN', 'LE_TAN', 'KE_TOAN'), ticketController.getParts);
router.post('/parts', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'THU_KHO'), ticketController.createPart);
router.patch('/parts/:id', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'THU_KHO'), ticketController.updatePart);
router.get('/:id/parts', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'THU_KHO', 'KY_THUAT_VIEN', 'LE_TAN', 'KE_TOAN'), ticketController.getTicketParts);
router.post('/:id/parts', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KY_THUAT_VIEN'), ticketController.addPartToTicket);
router.delete('/:id/parts/:partRecordId', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KY_THUAT_VIEN'), ticketController.removePartFromTicket);
router.get('/:id/photos', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KY_THUAT_VIEN', 'LE_TAN', 'KE_TOAN'), ticketController.getTicketPhotos);
router.post('/:id/photos', verifyToken, requireRole('GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KY_THUAT_VIEN', 'LE_TAN'), ticketController.addTicketPhoto);

module.exports = router;
