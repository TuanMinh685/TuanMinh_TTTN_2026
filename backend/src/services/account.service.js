const { pool } = require('../config/db.config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Bộ theo dõi chống dò mật khẩu (Brute-Force Lockout: Khóa tạm thời 15 phút nếu nhập sai 5 lần liên tiếp)
const failedLoginMap = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const checkBruteForce = (key) => {
    const record = failedLoginMap.get(key);
    if (!record) return null;
    if (Date.now() > record.resetAt) {
        failedLoginMap.delete(key);
        return null;
    }
    if (record.count >= MAX_FAILED_ATTEMPTS) {
        const waitSeconds = Math.ceil((record.resetAt - Date.now()) / 1000);
        return waitSeconds;
    }
    return null;
};

const recordFailedAttempt = (key) => {
    const now = Date.now();
    const record = failedLoginMap.get(key);
    if (!record || now > record.resetAt) {
        failedLoginMap.set(key, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    } else {
        record.count += 1;
    }
};

const clearFailedAttempts = (key) => {
    failedLoginMap.delete(key);
};

const verifyUserPassword = async (user, password) => {
    let isMatch = await bcrypt.compare(password, user.mat_khau);
    if (!isMatch && process.env.NODE_ENV !== 'production') {
        // Hỗ trợ mật khẩu demo tiêu chuẩn trong môi trường thực tập / kiểm thử
        if (password === '123456') {
            isMatch = true;
        } else if (user.ten_dang_nhap === 'quanly' && password === 'QuanLy@2026') {
            isMatch = true;
        }
    }
    return isMatch;
};

const login = async (username, password, clientIp = 'unknown') => {
    const cleanInput = String(username || '').trim().toLowerCase();
    const shortUser = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
    const throttleKey = `${clientIp}:${shortUser}`;

    const lockedWaitSeconds = checkBruteForce(throttleKey);
    if (lockedWaitSeconds) {
        const err = new Error(`Tài khoản tạm khóa bảo mật do nhập sai nhiều lần. Vui lòng thử lại sau ${lockedWaitSeconds} giây.`);
        err.code = 'BRUTE_FORCE_LOCKED';
        throw err;
    }

    const result = await pool.query(`
        SELECT id, ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai
        FROM nhan_vien
        WHERE LOWER(ten_dang_nhap) = $1 OR LOWER(ten_dang_nhap) = $2
        LIMIT 1
    `, [cleanInput, shortUser]);

    const user = result.rows[0];
    if (!user) {
        recordFailedAttempt(throttleKey);
        return null;
    }

    const isMatch = await verifyUserPassword(user, String(password));
    if (!isMatch) {
        recordFailedAttempt(throttleKey);
        return null;
    }

    clearFailedAttempts(throttleKey);

    if (user.trang_thai !== 'HOAT_DONG') {
        throw new Error('Tài khoản đã bị khóa');
    }

    // Ký JWT chuẩn HS256 với thời hạn 12 giờ
    const tokenPayload = {
        AccountID: user.id,
        Username: user.ten_dang_nhap,
        Role: user.vai_tro
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '12h',
        issuer: 'hunghau-cskh-qr'
    });

    delete user.mat_khau;
    return {
        AccountID: user.id,
        Username: user.ten_dang_nhap,
        FullName: user.ho_ten,
        Role: user.vai_tro,
        token
    };
};

const getMe = async (accountId) => {
    const result = await pool.query(`
        SELECT id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, ngay_tao
        FROM nhan_vien
        WHERE id = $1
    `, [accountId]);

    return result.rows[0];
};

const changePassword = async (accountId, currentPassword, newPassword) => {
    const result = await pool.query(`
        SELECT id, ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai
        FROM nhan_vien
        WHERE id = $1
        LIMIT 1
    `, [accountId]);

    const user = result.rows[0];
    if (!user) {
        throw new Error('Không tìm thấy tài khoản nhân sự.');
    }

    const isMatch = await verifyUserPassword(user, String(currentPassword || ''));
    if (!isMatch) {
        const err = new Error('Mật khẩu hiện tại không chính xác!');
        err.statusCode = 400;
        throw err;
    }

    const hashedNew = await bcrypt.hash(String(newPassword).trim(), 10);
    await pool.query('UPDATE nhan_vien SET mat_khau = $1 WHERE id = $2', [hashedNew, accountId]);
    return true;
};

module.exports = {
    login,
    getMe,
    changePassword
};
