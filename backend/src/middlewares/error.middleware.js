const { logSecurityEvent } = require('../utils/auditLogger');

const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR][RequestID: ${req?.requestId || 'N/A'}]`, err.message || err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi máy chủ nội bộ.';

    // Xử lý Payload quá lớn (Body-Parser)
    if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Dung lượng dữ liệu hoặc hình ảnh tải lên vượt quá giới hạn cho phép (Tối đa 8MB).';
    }

    // Xử lý JSON không hợp lệ
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'Định dạng dữ liệu JSON gửi lên không hợp lệ.';
    }

    // Che giấu tuyệt đối lỗi SQL / PostgreSQL nội bộ để chống tấn công dò cấu trúc bảng (SQL Error Enumeration)
    if (err.number || err.code === 'EREQUEST' || err.code === 'ELOGIN' || (typeof err.code === 'string' && err.code.length === 5)) {
        statusCode = 500;
        message = 'Hệ thống cơ sở dữ liệu từ chối yêu cầu hoặc dữ liệu không hợp lệ. Vui lòng thử lại.';
        logSecurityEvent({
            req,
            action: 'DATABASE_QUERY_ERROR',
            target: req?.originalUrl || 'DB',
            status: 'ERROR',
            details: `Mã lỗi SQL nội bộ đã được ẩn bảo mật (${err.code})`
        });
    }

    res.status(statusCode).json({
        success: false,
        errorCode: err.errorCode || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
        message,
        requestId: req?.requestId
    });
};

module.exports = errorHandler;
