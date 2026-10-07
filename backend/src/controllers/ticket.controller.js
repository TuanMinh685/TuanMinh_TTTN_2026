const ticketService = require('../services/ticket.service');
const { validationResult } = require('express-validator');

// Khách hàng điền Form (QR Intake) và Bấm gửi
const submitIntake = async (req, res, next) => {
    try {
        // Kiểm tra lỗi Validation trước
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errorCode: "VALIDATION_ERROR",
                message: "Dữ liệu nhập không hợp lệ!",
                errors: errors.array()
            });
        }

        const { fullName, phone, zaloId, issueDescription, deviceName, serialImei } = req.body;
        
        if (!fullName || !phone || !issueDescription || !deviceName) {
            return res.status(400).json({ 
                success: false, 
                errorCode: "VALIDATION_ERROR",
                message: "Vui lòng nhập đầy đủ Tên, Số điện thoại, Tên máy và Mô tả lỗi!" 
            });
        }

        const result = await ticketService.submitIntake(req.body);
        
        res.status(201).json({
            success: true,
            message: "Gửi yêu cầu tiếp nhận sửa chữa thành công!",
            data: {
                ticketCode: result.ticketCode,
                status: "CHỜ_KHÁM",
                submittedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

const getTickets = async (req, res, next) => {
    try {
        const tickets = await ticketService.getAllTickets();
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        next(error);
    }
};

const updateTicketStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { trang_thai } = req.body;
        await ticketService.updateTicketStatus(id, trang_thai);
        res.status(200).json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        next(error);
    }
};

const submitBooking = async (req, res, next) => {
    try {
        const { fullName, phone, zaloId, ngayHen, gioHen, moTaLoi, loaiDichVu } = req.body;
        if (!fullName || !phone || !ngayHen || !gioHen || !moTaLoi) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin đặt lịch!" });
        }
        await ticketService.submitBooking(req.body);
        res.status(201).json({ success: true, message: "Đặt lịch thành công!" });
    } catch (error) {
        next(error);
    }
};

const getBookings = async (req, res, next) => {
    try {
        const bookings = await ticketService.getAllBookings();
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        next(error);
    }
};

const updateBookingStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { trang_thai } = req.body;
        await ticketService.updateBookingStatus(id, trang_thai);
        res.status(200).json({ success: true, message: 'Cập nhật lịch hẹn thành công' });
    } catch (error) {
        next(error);
    }
};


const getParts = async (req, res, next) => {
    try {
        const data = await ticketService.getParts();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

const getTicketParts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await ticketService.getTicketParts(id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

const addPartToTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { partId, quantity } = req.body;
        await ticketService.addPartToTicket(id, partId, quantity);
        res.status(200).json({ success: true, message: 'Đã thêm linh kiện thành công' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getParts,
    getTicketParts,
    addPartToTicket,
    submitIntake,
    getTickets,
    updateTicketStatus,
    submitBooking,
    getBookings,
    updateBookingStatus
};
