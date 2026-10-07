const express = require('express');
const router = express.Router();
const authController = require('../controllers/account.controller');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middlewares/auth.middleware');

// Tạm tắt giới hạn đăng nhập khi đang dev/test
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Cho phép 500 lần thay vì 5 lần
    message: { success: false, message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút!' }
});

// URL: POST /api/auth/login
router.post('/login', loginLimiter, authController.login);

// URL: GET /api/auth/me
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
