const express = require('express');
const router = express.Router();
const authController = require('../controllers/account.controller');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middlewares/auth.middleware');

// Giới hạn tần suất đăng nhập/đăng ký
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều yêu cầu đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau 15 phút!'
    }
});

router.post('/login', loginLimiter, authController.login);
router.post('/register', loginLimiter, authController.register);
router.get('/me', verifyToken, authController.getMe);
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
