const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const routes = require('./routes/index.route');
const errorHandler = require('./middlewares/error.middleware');
const { enterpriseSecurityHeaders, sanitizeRequestInput } = require('./middlewares/security.middleware');
const { pool } = require('./config/db.config');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Thiết lập HTTP security headers
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

app.use(enterpriseSecurityHeaders);

// Cấu hình CORS
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
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

// Giới hạn payload JSON (hỗ trợ ảnh chụp ngoại quan dạng Base64)
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ limit: '8mb', extended: true }));

// Làm sạch dữ liệu đầu vào (XSS, Prototype Pollution, HPP)
app.use(sanitizeRequestInput);

// Giới hạn tần suất gọi API toàn cục
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorCode: 'TOO_MANY_REQUESTS',
        message: 'Hệ thống phát hiện lưu lượng truy cập bất thường. Vui lòng thử lại sau ít phút!'
    }
});
app.use(globalLimiter);

// Kiểm tra trạng thái hoạt động của máy chủ
const healthHandler = (req, res) => {
    res.status(200).json({
        success: true,
        service: 'Luc Giac - QR Customer Care API',
        version: '2.0.0',
        status: 'HEALTHY',
        database: pool.isCloudConnected && pool.isCloudConnected() ? 'SUPABASE_POSTGRESQL_CLOUD' : 'LOCAL_STORE_FALLBACK',
        timezone: 'Asia/Ho_Chi_Minh (+07:00)',
        uptimeSeconds: Math.round(process.uptime())
    });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

app.use('/api', routes);
app.use('/', routes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        errorCode: 'ENDPOINT_NOT_FOUND',
        message: `Không tìm thấy đường dẫn API: ${req.method} ${req.originalUrl}`,
        requestId: req.requestId
    });
});

app.use(errorHandler);

module.exports = app;
