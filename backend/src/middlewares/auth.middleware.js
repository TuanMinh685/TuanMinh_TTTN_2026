const jwt = require('jsonwebtoken');
const { pool } = require('../config/db.config');

const ROLE_HIERARCHY = {
    GIAM_DOC: 100,
    ADMIN: 100,
    QUAN_LY: 80,
    KY_THUAT_VIEN: 40,
    LE_TAN: 30,
    RECEPTIONIST: 30
};

const getRoleLevel = (role) => ROLE_HIERARCHY[role] || 0;

// Cache ngắn hạn (5 giây) trạng thái tài khoản nhân sự để vừa đảm bảo hiệu năng vừa thu hồi quyền tức thì khi khóa TK
const accountStatusCache = new Map();
const CACHE_TTL_MS = 5000;

const invalidateAccountCache = (accountId) => {
    if (accountId) {
        accountStatusCache.delete(Number(accountId));
    } else {
        accountStatusCache.clear();
    }
};

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            errorCode: 'NO_TOKEN',
            message: 'Access Denied: Không tìm thấy Token xác thực hợp lệ!'
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            errorCode: 'INVALID_TOKEN_FORMAT',
            message: 'Access Denied: Định dạng Token không hợp lệ!'
        });
    }

    try {
        // Chỉ chấp nhận thuật toán HS256 để chống tấn công giả mạo thuật toán (alg: none)
        const verified = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        const accountId = Number(verified.AccountID);
        if (accountId) {
            const now = Date.now();
            let accountRecord = accountStatusCache.get(accountId);

            if (!accountRecord || now - accountRecord.cachedAt > CACHE_TTL_MS) {
                const dbRes = await pool.query(
                    'SELECT id, ten_dang_nhap, vai_tro, trang_thai FROM nhan_vien WHERE id = $1 LIMIT 1',
                    [accountId]
                );
                accountRecord = {
                    row: dbRes.rows[0] || null,
                    cachedAt: now
                };
                accountStatusCache.set(accountId, accountRecord);
            }

            if (!accountRecord.row) {
                return res.status(401).json({
                    success: false,
                    errorCode: 'ACCOUNT_NOT_FOUND',
                    message: 'Tài khoản nhân sự không còn tồn tại trong hệ thống!'
                });
            }

            if (accountRecord.row.trang_thai !== 'HOAT_DONG') {
                return res.status(401).json({
                    success: false,
                    errorCode: 'ACCOUNT_LOCKED',
                    message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên!'
                });
            }

            // Đồng bộ vai trò mới nhất từ CSDL (phòng trường hợp vừa bị hạ quyền)
            verified.Role = accountRecord.row.vai_tro;
            verified.Username = accountRecord.row.ten_dang_nhap;
        }

        req.user = verified;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                errorCode: 'TOKEN_EXPIRED',
                message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!'
            });
        }
        return res.status(401).json({
            success: false,
            errorCode: 'INVALID_TOKEN',
            message: 'Token xác thực không hợp lệ hoặc đã bị thay đổi!'
        });
    }
};

// Middleware kiểm tra quyền hạn (RBAC) - Admin luôn có quyền tối cao từ trên xuống
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                errorCode: 'UNAUTHORIZED',
                message: 'Vui lòng đăng nhập để thực hiện thao tác này!'
            });
        }
        const userRole = req.user.Role;
        if (userRole === 'GIAM_DOC' || userRole === 'ADMIN' || roles.includes(userRole)) {
            return next();
        }
        return res.status(403).json({
            success: false,
            errorCode: 'FORBIDDEN_ROLE',
            message: `Phân quyền từ chối: Vai trò (${userRole}) không được phép thực hiện nghiệp vụ này!`
        });
    };
};

module.exports = {
    verifyToken,
    requireRole,
    ROLE_HIERARCHY,
    getRoleLevel,
    invalidateAccountCache
};
