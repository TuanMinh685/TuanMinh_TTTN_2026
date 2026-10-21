const adminService = require('../services/admin.service');
const { getRoleLevel } = require('../middlewares/auth.middleware');

const VALID_ROLES = ['GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KE_TOAN', 'THU_KHO', 'KY_THUAT_VIEN', 'LE_TAN'];

const getDashboard = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
};

const getEmployees = async (req, res, next) => {
    try {
        const employees = await adminService.getEmployees();
        res.status(200).json({ success: true, data: employees });
    } catch (err) {
        next(err);
    }
};

const createEmployee = async (req, res, next) => {
    try {
        const actorRole = req.user?.Role;
        const actorLevel = getRoleLevel(actorRole);

        const { ten_dang_nhap, mat_khau, ho_ten, vai_tro } = req.body || {};
        if (!ten_dang_nhap || !mat_khau || !ho_ten || !vai_tro) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ Tên đăng nhập, Mật khẩu, Họ tên và Chức vụ!'
            });
        }

        const cleanUsername = String(ten_dang_nhap).trim().toLowerCase();
        if (!/^[a-z0-9_.-]{3,30}$/.test(cleanUsername)) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập cần từ 3-30 ký tự (chữ thường, số, dấu gạch dưới).'
            });
        }

        if (String(mat_khau).trim().length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có tối thiểu 6 ký tự.'
            });
        }

        if (!VALID_ROLES.includes(vai_tro)) {
            return res.status(400).json({
                success: false,
                message: 'Chức vụ phân quyền không hợp lệ.'
            });
        }

        const targetLevel = getRoleLevel(vai_tro);
        // Quy tắc phân quyền từ trên xuống:
        // - Giám Đốc / Admin (Level 100) được tạo mọi chức vụ.
        // - Quản Lý (Level 80) chỉ được tạo các chức vụ cấp dưới (< 80: Kế toán, Thủ kho, Kỹ thuật viên, Lễ tân).
        if (actorLevel < 100 && targetLevel >= actorLevel) {
            return res.status(403).json({
                success: false,
                message: 'Phân quyền từ trên xuống: Quản lý Cửa hàng chỉ được phép tạo tài khoản nhân sự cấp dưới (Kế toán, Thủ kho, Kỹ thuật viên, Lễ tân)!'
            });
        }

        const existing = await adminService.getEmployeeByUsername(cleanUsername);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: `Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống!`
            });
        }

        const created = await adminService.createEmployee({
            ten_dang_nhap: cleanUsername,
            mat_khau: String(mat_khau).trim(),
            ho_ten: String(ho_ten).trim(),
            vai_tro
        });

        res.status(201).json({
            success: true,
            message: `Đã tạo tài khoản nhân viên "${created.ho_ten}" (${created.vai_tro}) thành công!`,
            data: created
        });
    } catch (err) {
        next(err);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const targetId = Number(req.params.id);
        const actorId = Number(req.user?.AccountID);
        const actorRole = req.user?.Role;
        const actorLevel = getRoleLevel(actorRole);

        const targetEmp = await adminService.getEmployeeById(targetId);
        if (!targetEmp) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên.' });
        }

        const currentTargetLevel = getRoleLevel(targetEmp.vai_tro);

        // Quản lý không được sửa tài khoản của Giám đốc, Admin hoặc Quản lý khác
        if (actorLevel < 100 && currentTargetLevel >= actorLevel && targetId !== actorId) {
            return res.status(403).json({
                success: false,
                message: 'Phân quyền từ trên xuống: Bạn không có quyền chỉnh sửa hoặc khóa tài khoản của cấp Quản lý / Giám đốc!'
            });
        }

        const nextHoTen = req.body.ho_ten !== undefined ? String(req.body.ho_ten).trim() : targetEmp.ho_ten;
        const nextVaiTro = req.body.vai_tro !== undefined ? req.body.vai_tro : targetEmp.vai_tro;
        const nextTrangThai = req.body.trang_thai !== undefined ? req.body.trang_thai : targetEmp.trang_thai;
        const nextMatKhau = req.body.mat_khau;

        if (!VALID_ROLES.includes(nextVaiTro)) {
            return res.status(400).json({ success: false, message: 'Chức vụ mới không hợp lệ.' });
        }

        const nextTargetLevel = getRoleLevel(nextVaiTro);
        if (actorLevel < 100 && nextTargetLevel >= actorLevel) {
            return res.status(403).json({
                success: false,
                message: 'Phân quyền từ trên xuống: Quản lý không được phép nâng quyền nhân viên lên cấp Quản lý hoặc Giám đốc!'
            });
        }

        if (targetId === actorId && nextTrangThai !== 'HOAT_DONG') {
            return res.status(400).json({
                success: false,
                message: 'Không thể tự khóa tài khoản đang đăng nhập của chính bạn!'
            });
        }

        if (targetId === actorId && nextVaiTro !== targetEmp.vai_tro) {
            return res.status(400).json({
                success: false,
                message: 'Không thể tự hạ quyền tài khoản đang đăng nhập của chính bạn!'
            });
        }

        const updated = await adminService.updateEmployee(targetId, {
            ho_ten: nextHoTen,
            vai_tro: nextVaiTro,
            trang_thai: nextTrangThai,
            mat_khau: nextMatKhau
        });

        res.status(200).json({
            success: true,
            message: `Đã cập nhật phân quyền & hồ sơ của "${updated.ho_ten}"!`,
            data: updated
        });
    } catch (err) {
        next(err);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const targetId = Number(req.params.id);
        const actorId = Number(req.user?.AccountID);
        const actorRole = req.user?.Role;
        const actorLevel = getRoleLevel(actorRole);

        if (targetId === actorId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể tự xóa tài khoản đang đăng nhập của chính bạn!'
            });
        }

        const targetEmp = await adminService.getEmployeeById(targetId);
        if (!targetEmp) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên.' });
        }

        const targetLevel = getRoleLevel(targetEmp.vai_tro);
        if (actorLevel < 100 && targetLevel >= actorLevel) {
            return res.status(403).json({
                success: false,
                message: 'Phân quyền từ trên xuống: Quản lý chỉ được phép xóa tài khoản nhân viên cấp dưới!'
            });
        }

        const removed = await adminService.deleteEmployee(targetId);
        res.status(200).json({
            success: true,
            message: `Đã xóa tài khoản nhân viên "${removed.ho_ten}" (${removed.ten_dang_nhap}).`,
            data: removed
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboard,
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
