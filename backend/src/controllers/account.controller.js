const authService = require('../services/account.service');
const { logSecurityEvent, getClientIp } = require('../utils/auditLogger');

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                errorCode: 'VALIDATION_ERROR',
                message: 'Vui lòng nhập tài khoản và mật khẩu'
            });
        }

        const clientIp = getClientIp(req);
        const account = await authService.login(username, password, clientIp);

        if (!account) {
            logSecurityEvent({
                req,
                actor: String(username).trim(),
                role: 'UNAUTHENTICATED',
                action: 'LOGIN_FAILED',
                target: 'Auth Portal',
                status: 'WARNING',
                details: `Đăng nhập thất bại cho tài khoản "${username}"`
            });
            return res.status(401).json({
                success: false,
                errorCode: 'UNAUTHORIZED',
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác!'
            });
        }

        logSecurityEvent({
            req,
            actor: account.Username,
            role: account.Role,
            action: 'LOGIN_SUCCESS',
            target: `Account #${account.AccountID}`,
            status: 'SUCCESS',
            details: `Nhân sự "${account.FullName}" (${account.Role}) đăng nhập thành công`
        });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            data: {
                accountId: account.AccountID,
                username: account.Username,
                fullName: account.FullName,
                role: account.Role,
                token: account.token
            }
        });
    } catch (error) {
        if (error.code === 'BRUTE_FORCE_LOCKED') {
            logSecurityEvent({
                req,
                actor: String(req.body?.username || 'UNKNOWN'),
                role: 'UNAUTHENTICATED',
                action: 'BRUTE_FORCE_BLOCKED',
                target: 'Auth Portal',
                status: 'BLOCKED',
                details: error.message
            });
            return res.status(429).json({
                success: false,
                errorCode: 'TOO_MANY_ATTEMPTS',
                message: error.message
            });
        }
        if (error.message === 'Tài khoản đã bị khóa') {
            logSecurityEvent({
                req,
                actor: String(req.body?.username || 'UNKNOWN'),
                role: 'LOCKED_USER',
                action: 'LOGIN_LOCKED_ACCOUNT',
                target: 'Auth Portal',
                status: 'BLOCKED',
                details: 'Cố gắng đăng nhập vào tài khoản đang bị khóa'
            });
            return res.status(403).json({
                success: false,
                errorCode: 'FORBIDDEN',
                message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản lý!'
            });
        }
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const accountId = req.user.AccountID;
        const profile = await authService.getMe(accountId);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
        }
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const accountId = req.user.AccountID;
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.'
            });
        }

        if (String(newPassword).trim().length < 6 || String(newPassword).trim().length > 64) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có độ dài từ 6 đến 64 ký tự.'
            });
        }

        await authService.changePassword(accountId, currentPassword, newPassword);

        logSecurityEvent({
            req,
            actor: req.user.Username,
            role: req.user.Role,
            action: 'PASSWORD_CHANGE',
            target: `Account #${accountId}`,
            status: 'SUCCESS',
            details: 'Nhân sự tự cập nhật mật khẩu cá nhân thành công (Bcrypt Hash)'
        });

        res.status(200).json({
            success: true,
            message: 'Đã đổi mật khẩu bảo mật thành công!'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    getMe,
    changePassword
};
