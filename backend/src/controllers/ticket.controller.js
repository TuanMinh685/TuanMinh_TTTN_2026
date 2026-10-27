const ticketService = require('../services/ticket.service');
const ticketSessionService = require('../services/ticket_session.service');
const { validationResult } = require('express-validator');

// Lễ tân / Quản lý khởi tạo phiên tiếp nhận mã QR động (init-session)
const initSession = async (req, res, next) => {
    try {
        const createdBy = req.user?.AccountID || null;
        const originUrl = req.headers.origin || process.env.CORS_ORIGIN || 'http://localhost:5173';
        const sessionData = await ticketSessionService.initQrSession({ createdBy, originUrl });

        res.status(201).json({
            success: true,
            message: 'Khởi tạo phiên tiếp nhận mã QR CSKH thành công!',
            data: sessionData
        });
    } catch (error) {
        next(error);
    }
};

// Khách hàng quét mã QR kiểm tra tính hợp lệ của phiên (session/:token)
const checkSession = async (req, res, next) => {
    try {
        const { token } = req.params;
        const session = await ticketSessionService.getQrSession(token);
        if (!session) {
            return res.status(404).json({
                success: false,
                errorCode: 'SESSION_NOT_FOUND',
                message: 'Không tìm thấy phiên tiếp nhận mã QR này!'
            });
        }

        if (session.status !== 'ACTIVE' || session.isExpired) {
            return res.status(410).json({
                success: false,
                errorCode: 'SESSION_EXPIRED_OR_USED',
                message: session.status === 'SUBMITTED'
                    ? 'Mã QR này đã được sử dụng để gửi phiếu yêu cầu CSKH!'
                    : 'Mã QR tiếp nhận đã hết hạn (quá 15 phút). Vui lòng nhờ Lễ tân cấp mã mới!',
                data: session
            });
        }

        res.status(200).json({
            success: true,
            message: 'Phiên tiếp nhận mã QR hợp lệ!',
            data: session
        });
    } catch (error) {
        next(error);
    }
};

// Khách hàng điền Form (QR Intake hoặc qua Session QR) và Bấm gửi (submit / intake)
const submitIntake = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errorCode: "VALIDATION_ERROR",
                message: "Dữ liệu nhập không hợp lệ!",
                errors: errors.array()
            });
        }

        const sessionToken = req.params.token || req.body.sessionToken || null;
        if (sessionToken) {
            const session = await ticketSessionService.getQrSession(sessionToken);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    errorCode: 'SESSION_NOT_FOUND',
                    message: 'Phiên tiếp nhận mã QR không tồn tại!'
                });
            }
            if (session.status !== 'ACTIVE' || session.isExpired) {
                return res.status(410).json({
                    success: false,
                    errorCode: 'SESSION_EXPIRED_OR_USED',
                    message: session.status === 'SUBMITTED'
                        ? 'Phiên mã QR này đã được gửi thông tin trước đó!'
                        : 'Phiên mã QR đã hết hạn!'
                });
            }
        }

        const fullName = req.body.fullName || req.body.ho_ten;
        const phone = req.body.phone || req.body.so_dien_thoai;
        const issueDescription = req.body.issueDescription || req.body.mo_ta_loi || req.body.tinh_trang_may;
        const deviceName = req.body.deviceName || req.body.ten_may || req.body.ten_thiet_bi || 'Sản phẩm / Dịch vụ cần CSKH';

        if (!fullName || !phone || !issueDescription) {
            return res.status(400).json({ 
                success: false, 
                errorCode: "VALIDATION_ERROR",
                message: "Vui lòng nhập đầy đủ Họ tên (fullName), Số điện thoại (phone) và Nội dung yêu cầu CSKH (issueDescription)!" 
            });
        }

        const result = await ticketService.submitIntake({
            ...req.body,
            fullName,
            phone,
            issueDescription,
            deviceName,
            sessionToken
        });
        
        res.status(201).json({
            success: true,
            message: "Gửi yêu cầu Chăm sóc khách hàng thành công!",
            data: {
                ticketId: result.ticketId,
                ticketCode: result.ticketCode,
                sessionToken: result.sessionToken,
                fullName: result.fullName,
                phone: result.phone,
                deviceName: result.deviceName,
                serialImei: result.serialImei,
                issueDescription: result.issueDescription,
                status: result.status || "CHỜ_KHÁM",
                submittedAt: result.createdAt || ticketSessionService.formatVietnamISO(new Date())
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

const STATUS_ALIAS_MAP = {
    PENDING: 'CHỜ_KHÁM',
    IN_PROGRESS: 'ĐANG_CHUẨN_ĐOÁN',
    DIAGNOSING: 'ĐANG_CHUẨN_ĐOÁN',
    REPAIRING: 'ĐANG_SỬA',
    COMPLETED: 'ĐÃ_SỬA_XONG',
    DELIVERED: 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
};

const ROLE_ALLOWED_STATUSES = {
    GIAM_DOC: null,
    ADMIN: null,
    QUAN_LY: null,
    LE_TAN: ['CHỜ_KHÁM', 'ĐANG_CHUẨN_ĐOÁN', 'ĐANG_SỬA', 'ĐÃ_SỬA_XONG', 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'],
    KY_THUAT_VIEN: ['CHỜ_KHÁM', 'ĐANG_CHUẨN_ĐOÁN', 'ĐANG_SỬA', 'ĐÃ_SỬA_XONG', 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN']
};

const updateTicketStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const rawStatus = req.body.trang_thai || req.body.status;
        const ghi_chu = req.body.ghi_chu || req.body.note || '';
        const userRole = req.user?.Role;
        const employeeId = req.user?.AccountID || null;

        if (!rawStatus) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp trạng thái mới (trang_thai hoặc status)!'
            });
        }

        const trang_thai = STATUS_ALIAS_MAP[rawStatus] || rawStatus;

        const allowedStatuses = ROLE_ALLOWED_STATUSES[userRole];
        if (Array.isArray(allowedStatuses) && !allowedStatuses.includes(trang_thai)) {
            return res.status(403).json({
                success: false,
                message: `Phân quyền nghiệp vụ: Chức vụ (${userRole}) không được phép chuyển hồ sơ sang trạng thái "${trang_thai.replace(/_/g, ' ')}"!`
            });
        }

        const data = await ticketService.updateTicketStatus(id, trang_thai, ghi_chu, employeeId);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ phiếu CSKH cần cập nhật!'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái hồ sơ CSKH thành công',
            data
        });
    } catch (error) {
        next(error);
    }
};

const submitBooking = async (req, res, next) => {
    try {
        const { fullName, phone, ngayHen, gioHen, moTaLoi } = req.body;
        if (!fullName || !phone || !ngayHen || !gioHen || !moTaLoi) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin đặt lịch hẹn CSKH!" });
        }
        await ticketService.submitBooking(req.body);
        res.status(201).json({ success: true, message: "Đặt lịch hẹn CSKH thành công!" });
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
                ? `Đã tiếp nhận khách đến và tự động tạo phiếu QR CSKH ${result.ticketCode}!`
                : 'Cập nhật lịch hẹn CSKH thành công',
            data: result
        });
    } catch (error) {
        next(error);
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
        res.status(201).json({ success: true, message: 'Đã lưu ảnh minh chứng thành công', data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    initSession,
    checkSession,
    getTicketPhotos,
    addTicketPhoto,
    submitIntake,
    getTickets,
    updateTicketStatus,
    submitBooking,
    getBookings,
    updateBookingStatus
};
