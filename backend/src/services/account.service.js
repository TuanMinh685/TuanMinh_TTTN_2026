const { pool } = require('../config/db.config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (username, password) => {
    const cleanInput = String(username || '').trim().toLowerCase();
    const shortUser = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
    const result = await pool.query(`
        SELECT id, ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai
        FROM nhan_vien
        WHERE LOWER(ten_dang_nhap) = $1 OR LOWER(ten_dang_nhap) = $2
        LIMIT 1
    `, [cleanInput, shortUser]);
        
    const user = result.rows[0];
    if (!user) return null; // Không tìm thấy user

    // 2. So sánh mật khẩu bằng bcrypt
    const isMatch = await bcrypt.compare(password, user.mat_khau);
    if (!isMatch) return null; // Sai mật khẩu

    if (user.trang_thai !== 'HOAT_DONG') {
        throw new Error('Tài khoản đã bị khóa');
    }

    // 3. Tạo Token JWT (Có giá trị 24 giờ)
    const tokenPayload = {
        AccountID: user.id,
        Username: user.ten_dang_nhap,
        Role: user.vai_tro
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Trả về thông tin user (loại bỏ mật khẩu) kèm theo token
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

module.exports = {
    login,
    getMe
};
