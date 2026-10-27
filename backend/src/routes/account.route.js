const express = require('express');
const router = express.Router();
const authController = require('../controllers/account.controller');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middlewares/auth.middleware');

// Giới hạn chống tấn công Brute-Force trên cổng đăng nhập
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều yêu cầu đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau 15 phút!'
    }
});

// URL: POST /api/auth/login
router.post('/login', loginLimiter, authController.login);

// URL: GET /api/auth/me
router.get('/me', verifyToken, authController.getMe);

// URL: POST /api/auth/change-password
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
