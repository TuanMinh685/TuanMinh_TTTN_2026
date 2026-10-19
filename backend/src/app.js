const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const routes = require('./routes/index.route');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Vercel chạy qua Proxy, bắt buộc phải có dòng này để lấy đúng IP người dùng thực
app.set('trust proxy', 1);

// Kích hoạt Helmet để tự động thêm các HTTP Headers bảo mật (Chống XSS, Clickjacking...)
app.use(helmet());

// Cấu hình CORS chặt chẽ
const corsOptions = {
    origin: process.env.CORS_ORIGIN === '*' ? '*' : (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Giới hạn chung cho toàn hệ thống (Hỗ trợ polling 30s và tác nghiệp liên tục)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 1000, // Tối đa 1000 request / 15 phút / IP
    message: { success: false, message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau!' }
});
app.use('/api', globalLimiter);

app.use('/api', routes);
app.use(errorHandler);

module.exports = app;
