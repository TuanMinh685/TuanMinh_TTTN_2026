const crypto = require('crypto');

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Làm sạch chuỗi đầu vào: Chống XSS, Null-byte Injection nhưng giữ nguyên Data URL ảnh hợp lệ (data:image/...)
 */
function sanitizeString(value) {
    if (typeof value !== 'string') return value;

    // Cho phép chuỗi base64 hình ảnh hợp lệ (data:image/jpeg;base64,...)
    if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(value)) {
        return value.trim();
    }

    return value
        .replace(/\0/g, '') // Loại bỏ Null-byte
        .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '') // Loại bỏ cặp thẻ <script>
        .replace(/<\s*\/?\s*(script|iframe|object|embed|applet|meta|link|style)[^>]*>/gi, '') // Loại bỏ thẻ HTML nguy hiểm
        .replace(/javascript\s*:/gi, '')
        .replace(/vbscript\s*:/gi, '')
        .replace(/data\s*:\s*text\/html/gi, '')
        .replace(/\bon(error|load|click|mouseover|focus|blur|submit|change|keyup|keydown)\s*=/gi, '')
        .trim();
}

/**
 * Đệ quy làm sạch Object / Array (Chống Prototype Pollution & XSS)
 */
function sanitizeObject(obj, depth = 0) {
    if (depth > 8 || obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.slice(0, 50).map(item => sanitizeObject(item, depth + 1));
    }

    if (typeof obj === 'object') {
        const cleaned = {};
        for (const key of Object.keys(obj)) {
            if (DANGEROUS_KEYS.has(key)) continue;
            cleaned[key] = sanitizeObject(obj[key], depth + 1);
        }
        return cleaned;
    }

    return obj;
}

/**
 * 1. Middleware gắn Request Trace ID & HTTP Security Headers chuẩn Doanh nghiệp
 */
function enterpriseSecurityHeaders(req, res, next) {
    const requestId = req.headers['x-request-id'] || (crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`);
    req.requestId = requestId;

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');

    next();
}

/**
 * 2. Middleware chống HTTP Parameter Pollution (HPP) và làm sạch dữ liệu đầu vào (XSS / Prototype Pollution)
 */
function sanitizeRequestInput(req, res, next) {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        if (req.params && typeof req.params === 'object') {
            for (const key of Object.keys(req.params)) {
                if (typeof req.params[key] === 'string') {
                    req.params[key] = sanitizeString(req.params[key]);
                }
            }
        }
        if (req.query && typeof req.query === 'object') {
            for (const key of Object.keys(req.query)) {
                const val = req.query[key];
                // Chống HPP: Nếu kẻ tấn công truyền ?period=week&period=month (mảng), chỉ lấy phần tử đầu tiên
                const singleVal = Array.isArray(val) ? val[0] : val;
                if (typeof singleVal === 'string') {
                    req.query[key] = sanitizeString(singleVal);
                }
            }
        }
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * 3. Kiểm tra hợp lệ dữ liệu tạo hồ sơ QR CSKH (/tickets/intake & /tickets/session/:token/submit)
 */
function validateTicketIntakeInput(req, res, next) {
    const { fullName, phone, deviceName, serialImei, serialNumber, issueDescription, photos } = req.body || {};

    if (!fullName || String(fullName).trim().length < 2 || String(fullName).trim().length > 100) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_FULLNAME',
            message: 'Họ và tên khách hàng phải từ 2 đến 100 ký tự.'
        });
    }

    const cleanPhone = String(phone || '').replace(/[\s.-]/g, '');
    if (!/^(0|\+84)[0-9]{8,10}$/.test(cleanPhone)) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_PHONE',
            message: 'Số điện thoại không hợp lệ (Vui lòng nhập SĐT Việt Nam 9–11 chữ số).'
        });
    }
    req.body.phone = cleanPhone;

    if (!deviceName || String(deviceName).trim().length < 2 || String(deviceName).trim().length > 150) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_DEVICE_NAME',
            message: 'Tên thiết bị máy tính / phần mềm cần hỗ trợ phải từ 2 đến 150 ký tự.'
        });
    }

    const serialVal = serialImei || serialNumber || '';
    if (serialVal && String(serialVal).trim().length > 80) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_SERIAL',
            message: 'Mã định danh Serial / Service Tag không được vượt quá 80 ký tự.'
        });
    }

    if (!issueDescription || String(issueDescription).trim().length < 3 || String(issueDescription).trim().length > 1500) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_ISSUE_DESCRIPTION',
            message: 'Mô tả sự cố máy tính / yêu cầu phần mềm phải từ 3 đến 1500 ký tự.'
        });
    }

    if (photos !== undefined) {
        if (!Array.isArray(photos) || photos.length > 10) {
            return res.status(400).json({
                success: false,
                errorCode: 'INVALID_PHOTOS',
                message: 'Tối đa đính kèm 10 ảnh minh chứng hiện trạng cho mỗi hồ sơ.'
            });
        }
    }

    next();
}

/**
 * 4. Kiểm tra hợp lệ dữ liệu Đặt lịch hẹn CSKH (/tickets/booking)
 */
function validateBookingInput(req, res, next) {
    const { fullName, phone, ngayHen, gioHen, moTaLoi } = req.body || {};

    if (!fullName || String(fullName).trim().length < 2 || String(fullName).trim().length > 100) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_FULLNAME',
            message: 'Họ và tên khách hàng phải từ 2 đến 100 ký tự.'
        });
    }

    const cleanPhone = String(phone || '').replace(/[\s.-]/g, '');
    if (!/^(0|\+84)[0-9]{8,10}$/.test(cleanPhone)) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_PHONE',
            message: 'Số điện thoại đặt lịch không hợp lệ.'
        });
    }
    req.body.phone = cleanPhone;

    if (!ngayHen || !gioHen) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_DATETIME',
            message: 'Vui lòng chọn đầy đủ Ngày hẹn và Giờ hẹn.'
        });
    }

    if (!moTaLoi || String(moTaLoi).trim().length < 3 || String(moTaLoi).trim().length > 1000) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_DESCRIPTION',
            message: 'Mô tả nội dung cần hỗ trợ phải từ 3 đến 1000 ký tự.'
        });
    }

    next();
}

module.exports = {
    enterpriseSecurityHeaders,
    sanitizeRequestInput,
    validateTicketIntakeInput,
    validateBookingInput
};
