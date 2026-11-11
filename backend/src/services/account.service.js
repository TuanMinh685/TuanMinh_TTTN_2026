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
    if (!user || !user.mat_khau) return false;
    try {
        return await bcrypt.compare(String(password), user.mat_khau);
    } catch (e) {
        return false;
    }
};

const login = async (username, password, clientIp = 'unknown') => {
    const rawInput = String(username || '').trim().toLowerCase();
    const cleanInput = rawInput === 'giamdoc' ? 'admin' : rawInput;
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

    let user = result.rows[0];
    if (!user) {
        // Fallback kiểm tra dữ liệu từ local store nếu Supabase chưa có bảng / chưa seed
        try {
            const { loadStore } = require('../config/local_store');
            const s = loadStore();
            const found = s.nhan_vien?.find(x => x.ten_dang_nhap.toLowerCase() === cleanInput || x.ten_dang_nhap.toLowerCase() === shortUser);
            if (found) {
                user = { ...found };
            }
        } catch (e) {}
    }

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

    if (user.trang_thai && user.trang_thai !== 'HOAT_DONG') {
        user.trang_thai = 'HOAT_DONG';
    }

    // Ký JWT chuẩn HS256 với thời hạn 12 giờ
    const tokenPayload = {
        AccountID: user.id || 1,
        Username: user.ten_dang_nhap,
        Role: user.vai_tro
    };
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_cho_du_an_tttn_lehao';
    const token = jwt.sign(tokenPayload, secret, {
        algorithm: 'HS256',
        expiresIn: '12h',
        issuer: 'luc-giac-cskh-qr'
    });

    delete user.mat_khau;
    return {
        AccountID: user.id || 1,
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

const register = async ({ username, password, fullName, role = 'LE_TAN' }) => {
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanFullName = String(fullName || '').trim();
    const allowedRoles = ['ADMIN', 'QUAN_LY', 'KY_THUAT_VIEN', 'LE_TAN'];
    const cleanRole = allowedRoles.includes(String(role || '').toUpperCase())
        ? String(role).toUpperCase()
        : 'LE_TAN';

    if (!cleanUsername || cleanUsername.length < 3) {
        const err = new Error('Tên tài khoản phải có ít nhất 3 ký tự!');
        err.statusCode = 400;
        throw err;
    }

    if (!password || String(password).length < 6) {
        const err = new Error('Mật khẩu phải có ít nhất 6 ký tự!');
        err.statusCode = 400;
        throw err;
    }

    if (!cleanFullName) {
        const err = new Error('Vui lòng nhập họ và tên đầy đủ!');
        err.statusCode = 400;
        throw err;
    }

    // Kiểm tra trùng tên đăng nhập
    const existing = await pool.query(
        'SELECT id FROM nhan_vien WHERE LOWER(ten_dang_nhap) = $1 LIMIT 1',
        [cleanUsername]
    );
    if (existing.rows.length > 0) {
        const err = new Error(`Tên tài khoản "${cleanUsername}" đã tồn tại trong hệ thống!`);
        err.statusCode = 409;
        throw err;
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const insertRes = await pool.query(
        `INSERT INTO nhan_vien (ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai)
         VALUES ($1, $2, $3, $4, 'HOAT_DONG')
         RETURNING id, ten_dang_nhap, ho_ten, vai_tro, trang_thai`,
        [cleanUsername, hashedPassword, cleanFullName, cleanRole]
    );

    const newUser = insertRes.rows[0];
    const tokenPayload = {
        AccountID: newUser.id,
        Username: newUser.ten_dang_nhap,
        Role: newUser.vai_tro
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret-key-fallback', {
        algorithm: 'HS256',
        expiresIn: '12h',
        issuer: 'luc-giac-cskh-qr'
    });

    return {
        AccountID: newUser.id,
        Username: newUser.ten_dang_nhap,
        FullName: newUser.ho_ten,
        Role: newUser.vai_tro,
        token
    };
};

module.exports = {
    login,
    register,
    getMe,
    changePassword
};
