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
        const { trang_thai, ghi_chu } = req.body;
        const data = await ticketService.updateTicketStatus(id, trang_thai, ghi_chu);
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data });
    } catch (error) {
        next(error);
    }
};

const updateTicketSoftwarePackages = async (req, res, next) => {
    try {
        const ticketId = Number(req.params.id);
        const packages = req.body?.packages;
        if (!Number.isSafeInteger(ticketId) || ticketId < 1) {
            return res.status(400).json({ success: false, message: 'Mã phiếu không hợp lệ.' });
        }
        if (!Array.isArray(packages) || packages.length > 20 ||
            packages.some((item) => typeof item !== 'string' || !item.trim() || item.trim().length > 120)) {
            return res.status(400).json({ success: false, message: 'Danh sách gói phần mềm không hợp lệ.' });
        }

        const uniquePackages = [...new Set(packages.map(item => item.trim()))];
        const result = await ticketService.updateTicketSoftwarePackages(ticketId, uniquePackages);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu sửa chữa.' });
        }

        res.status(200).json({
            success: true,
            message: 'Đã cập nhật các gói phần mềm cho phiếu.',
            data: result
        });
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
        const { trang_thai, ten_thiet_bi } = req.body;
        const result = await ticketService.updateBookingStatus(id, trang_thai, ten_thiet_bi);
        res.status(200).json({
            success: true,
            message: result?.ticketCode
                ? `Đã tiếp nhận khách đến và tự động tạo phiếu ${result.ticketCode}!`
                : 'Cập nhật lịch hẹn thành công',
            data: result
        });
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

const validatePartInput = ({ ten_linh_kien, gia_ban, so_luong }) => {
    if (typeof ten_linh_kien !== 'string' || ten_linh_kien.trim().length === 0 || ten_linh_kien.trim().length > 150) {
        return 'Tên linh kiện phải có từ 1 đến 150 ký tự.';
    }
    if (!Number.isFinite(gia_ban) || gia_ban < 0) {
        return 'Giá bán phải là số không âm.';
    }
    if (!Number.isSafeInteger(so_luong) || so_luong < 0) {
        return 'Số lượng tồn phải là số nguyên không âm.';
    }
    return null;
};

const createPart = async (req, res, next) => {
    try {
        const name = req.body.ten_linh_kien;
        const part = {
            ten_linh_kien: typeof name === 'string' ? name.trim() : name,
            gia_ban: req.body.gia_ban,
            so_luong: req.body.so_luong
        };
        const validationMessage = validatePartInput(part);
        if (validationMessage) {
            return res.status(400).json({ success: false, message: validationMessage });
        }

        const data = await ticketService.createPart(part);
        res.status(201).json({ success: true, message: 'Đã thêm linh kiện vào kho.', data });
    } catch (err) {
        next(err);
    }
};

const updatePart = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ success: false, message: 'Mã linh kiện không hợp lệ.' });
        }

        const name = req.body.ten_linh_kien;
        const part = {
            ten_linh_kien: typeof name === 'string' ? name.trim() : name,
            gia_ban: req.body.gia_ban,
            so_luong: req.body.so_luong
        };
        const validationMessage = validatePartInput(part);
        if (validationMessage) {
            return res.status(400).json({ success: false, message: validationMessage });
        }

        const data = await ticketService.updatePart(id, part);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy linh kiện.' });
        }

        res.status(200).json({ success: true, message: 'Đã cập nhật kho và bảng giá.', data });
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
        const { partId, quantity, so_serial } = req.body;
        if (!Number.isSafeInteger(Number(partId)) || Number(partId) < 1 || !Number.isSafeInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Linh kiện và số lượng phải hợp lệ.' });
        }
        const result = await ticketService.addPartToTicket(id, Number(partId), quantity, so_serial);
        res.status(200).json({ success: true, message: 'Đã thêm linh kiện và lưu mã Serial thành công', data: result });
    } catch (err) {
        next(err);
    }
};

const getTicketPhotos = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await ticketService.getTicketPhotos(id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

const addTicketPhoto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { duong_dan_anh, loai_anh, ghi_chu } = req.body;
        if (!duong_dan_anh || typeof duong_dan_anh !== 'string') {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đường dẫn hoặc dữ liệu ảnh.' });
        }
        const data = await ticketService.addTicketPhoto(id, { duong_dan_anh, loai_anh, ghi_chu });
        res.status(201).json({ success: true, message: 'Đã lưu ảnh ngoại quan thành công', data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getParts,
    createPart,
    updatePart,
    getTicketParts,
    addPartToTicket,
    getTicketPhotos,
    addTicketPhoto,
    submitIntake,
    getTickets,
    updateTicketStatus,
    updateTicketSoftwarePackages,
    submitBooking,
    getBookings,
    updateBookingStatus
};
