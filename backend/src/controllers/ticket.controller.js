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
            message: 'Khởi tạo phiên tiếp nhận mã QR thành công!',
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
                    ? 'Mã QR này đã được sử dụng để gửi phiếu sửa chữa!'
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
        const deviceName = req.body.deviceName || req.body.ten_may || req.body.ten_thiet_bi || 'Thiết bị tiếp nhận qua QR';

        if (!fullName || !phone || !issueDescription) {
            return res.status(400).json({ 
                success: false, 
                errorCode: "VALIDATION_ERROR",
                message: "Vui lòng nhập đầy đủ Họ tên (fullName), Số điện thoại (phone) và Mô tả sự cố (issueDescription)!" 
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
            message: "Gửi yêu cầu tiếp nhận sửa chữa thành công!",
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
    WAITING_QUOTE: 'CHỜ_KHÁCH_CHỐT_GIÁ',
    REPAIRING: 'ĐANG_SỬA',
    COMPLETED: 'ĐÃ_SỬA_XONG',
    DELIVERED: 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN',
    CANCELLED: 'KHÁCH_TỪ_CHỐI_SỬA'
};

const ROLE_ALLOWED_STATUSES = {
    GIAM_DOC: null, // Toàn quyền mọi trạng thái
    ADMIN: null,    // Toàn quyền mọi trạng thái
    QUAN_LY: null,  // Toàn quyền mọi trạng thái
    LE_TAN: ['CHỜ_KHÁM', 'ĐANG_CHUẨN_ĐOÁN', 'ĐANG_SỬA', 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN', 'KHÁCH_TỪ_CHỐI_SỬA'],
    KY_THUAT_VIEN: ['ĐANG_CHUẨN_ĐOÁN', 'CHỜ_KHÁCH_CHỐT_GIÁ', 'ĐANG_SỬA', 'ĐÃ_SỬA_XONG'],
    KE_TOAN: ['ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN']
};

const updateTicketStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const rawStatus = req.body.trang_thai || req.body.status;
        const ghi_chu = req.body.ghi_chu || req.body.note || '';
        const phuong_thuc_thanh_toan = req.body.phuong_thuc_thanh_toan || req.body.paymentMethod || null;
        const customTongTien = req.body.tong_tien !== undefined ? req.body.tong_tien : req.body.amount;
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
                message: `Phân quyền nghiệp vụ: Chức vụ (${userRole}) không được phép chuyển phiếu sang trạng thái "${trang_thai.replace(/_/g, ' ')}"!`
            });
        }

        const data = await ticketService.updateTicketStatus(id, trang_thai, ghi_chu, employeeId, phuong_thuc_thanh_toan, customTongTien);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu sửa chữa cần cập nhật!'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data
        });
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
            so_luong: req.body.so_luong,
            hinh_anh: req.body.hinh_anh || null
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
            so_luong: req.body.so_luong,
            hinh_anh: req.body.hinh_anh || null
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

const removePartFromTicket = async (req, res, next) => {
    try {
        const { id, partRecordId } = req.params;
        const result = await ticketService.removePartFromTicket(id, partRecordId);
        res.status(200).json({ success: true, message: 'Đã gỡ linh kiện khỏi phiếu và hoàn trả kho.', data: result });
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
    initSession,
    checkSession,
    getParts,
    createPart,
    updatePart,
    getTicketParts,
    addPartToTicket,
    removePartFromTicket,
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
