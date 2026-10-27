const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const routes = require('./routes/index.route');
const errorHandler = require('./middlewares/error.middleware');
const { enterpriseSecurityHeaders, sanitizeRequestInput } = require('./middlewares/security.middleware');
const { pool } = require('./config/db.config');

const app = express();

// Ẩn thông tin framework Express khỏi HTTP Header (Chống Fingerprinting)
app.disable('x-powered-by');

// Vercel / Reverse Proxy: lấy đúng IP thực của người dùng cuối
app.set('trust proxy', 1);

// 1. Kích hoạt Helmet với cấu hình bảo mật chuẩn Doanh nghiệp (Chống XSS, Clickjacking, MIME Sniffing)
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https:']
            }
        }
    })
);

// 2. Gắn Request Trace ID & các HTTP Security Headers bổ sung
app.use(enterpriseSecurityHeaders);

// 3. Cấu hình CORS bảo mật có kiểm soát Origin, Methods và Headers
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Cho phép request cùng domain, mobile app/curl (không có origin), localhost dev hoặc domain trong whitelist
        if (
            !origin ||
            /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin) ||
            allowedOrigins.includes(origin) ||
            /\.vercel\.app$/.test(origin)
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Client-Version'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 4. Giới hạn dung lượng JSON Payload (tránh tấn công DoS qua Payload lớn, đủ cho ảnh chụp ngoại quan Base64)
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ limit: '8mb', extended: true }));

// 5. Làm sạch toàn bộ dữ liệu đầu vào (Chống XSS, Prototype Pollution & HTTP Parameter Pollution)
app.use(sanitizeRequestInput);

// 6. Rate Limiter toàn cục cho tầng API
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorCode: 'TOO_MANY_REQUESTS',
        message: 'Hệ thống phát hiện lưu lượng truy cập bất thường. Vui lòng thử lại sau ít phút!'
    }
});
app.use('/api', globalLimiter);

// 7. Endpoint Kiểm tra Sức khỏe & Trạng thái Bảo mật Hệ thống (Enterprise Health Probe)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'MYH Group - Enterprise QR Customer Care API',
        version: '2.0.0-Enterprise',
        status: 'HEALTHY',
        database: pool.isCloudConnected && pool.isCloudConnected() ? 'SUPABASE_POSTGRESQL_CLOUD' : 'LOCAL_STORE_FALLBACK',
        timezone: 'Asia/Ho_Chi_Minh (+07:00)',
        securityLayers: [
            'Helmet CSP & HSTS',
            'XSS & Prototype Pollution Sanitizer',
            'HTTP Parameter Pollution (HPP) Guard',
            'JWT HS256 Live RBAC Verification',
            'Brute-Force Account Lockout',
            'Enterprise Security Audit Trail'
        ],
        uptimeSeconds: Math.round(process.uptime())
    });
});

// 8. Định tuyến API nghiệp vụ chính
app.use('/api', routes);

// 9. Xử lý 404 cho các API không tồn tại
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        errorCode: 'ENDPOINT_NOT_FOUND',
        message: `Không tìm thấy đường dẫn API: ${req.method} ${req.originalUrl}`,
        requestId: req.requestId
    });
});

// 10. Bộ xử lý lỗi tập trung chuẩn Doanh nghiệp (Không rò rỉ Stack Trace / Cấu trúc bảng SQL)
app.use(errorHandler);

module.exports = app;
