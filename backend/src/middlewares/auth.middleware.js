const jwt = require('jsonwebtoken');

const ROLE_HIERARCHY = {
    GIAM_DOC: 100,
    ADMIN: 100,
    QUAN_LY: 80,
    KE_TOAN: 60,
    THU_KHO: 50,
    KY_THUAT_VIEN: 40,
    LE_TAN: 30,
    RECEPTIONIST: 30
};

const getRoleLevel = (role) => ROLE_HIERARCHY[role] || 0;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Access Denied: Không tìm thấy Token xác thực!' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: Định dạng Token không hợp lệ!' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token Expired: Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!' });
        }
        return res.status(403).json({ success: false, message: 'Invalid Token: Token không hợp lệ hoặc đã bị chỉnh sửa!' });
    }
};

// Middleware kiểm tra quyền hạn (Role) - Giám đốc & Admin luôn có quyền tối cao từ trên xuống
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ success: false, message: 'Forbidden: Bạn không có quyền truy cập API này!' });
        }
        const userRole = req.user.Role;
        if (userRole === 'GIAM_DOC' || userRole === 'ADMIN' || roles.includes(userRole)) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: `Phân quyền từ chối: Chức vụ (${userRole}) không được phép thực hiện nghiệp vụ này!`
        });
    };
};

module.exports = {
    verifyToken,
    requireRole,
    ROLE_HIERARCHY,
    getRoleLevel
};
