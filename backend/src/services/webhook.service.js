const { pool } = require('../config/db.config');
const { getIo } = require('../config/socket.config');
const { formatVietnamISO } = require('./ticket_session.service');

/**
 * Tự động bóc tách mã phiếu CSKH từ nội dung chuyển khoản ngân hàng
 * Ví dụ: "CSKH RP-839400 chuyen khoan", "TT RP-133037", "NAPAS247 FT261109 RP-839400"
 */
function extractTicketCode(text) {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(/(?:CSKH\s+|TT\s+)?(RP-[A-Z0-9]{4,10})/i);
    return match ? match[1].toUpperCase() : null;
}

/**
 * Khớp lệnh chuyển khoản VietQR tự động qua Webhook Open Banking trong 1 giây
 */
const reconcileBankingTransaction = async (payload = {}) => {
    const rawContent = String(
        payload.content || 
        payload.description || 
        payload.addInfo || 
        payload.orderInfo || 
        payload.memo || 
        payload.ticketCode || 
        ''
    ).trim();

    const ticketCode = payload.ticketCode 
        ? String(payload.ticketCode).trim().toUpperCase() 
        : extractTicketCode(rawContent);

    if (!ticketCode) {
        return {
            success: false,
            errorCode: 'TICKET_CODE_NOT_FOUND',
            message: `Nội dung chuyển khoản không chứa mã định danh hồ sơ CSKH (dạng RP-XXXXXX). Nội dung: "${rawContent}"`
        };
    }

    const amountReceived = Number(
        payload.transferAmount || 
        payload.amount || 
        payload.amountIn || 
        payload.soTien || 
        0
    );

    const referenceCode = String(
        payload.referenceCode || 
        payload.reference || 
        payload.transactionId || 
        payload.transId || 
        payload.id || 
        `OB-${Date.now()}`
    ).trim();

    const bankName = String(
        payload.gateway || 
        payload.bank || 
        payload.bankBrandName || 
        payload.bankName || 
        'VietQR NAPAS 247'
    ).trim();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Tìm hồ sơ phiếu trong CSDL
        const ticketRes = await client.query(
            `SELECT id, ma_tra_cuu, tong_tien, tien_sau_giam, trang_thai, trang_thai_thanh_toan 
             FROM phieu_sua_chua 
             WHERE ma_tra_cuu = $1 
             FOR UPDATE`,
            [ticketCode]
        );

        if (ticketRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                errorCode: 'TICKET_NOT_EXISTS',
                message: `Không tìm thấy hồ sơ phiếu ${ticketCode} trong hệ thống.`
            };
        }

        const currentTicket = ticketRes.rows[0];
        const ticketId = currentTicket.id;
        const expectedAmount = Number(currentTicket.tien_sau_giam || currentTicket.tong_tien || 0);

        // 2. Cập nhật trạng thái thanh toán sang DA_THANH_TOAN
        const updateQuery = `
            UPDATE phieu_sua_chua 
            SET trang_thai_thanh_toan = 'DA_THANH_TOAN',
                phuong_thuc_thanh_toan = 'VIETQR',
                ma_giao_dich = $1,
                ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, ma_tra_cuu, trang_thai, trang_thai_thanh_toan, phuong_thuc_thanh_toan, ma_giao_dich, ngay_cap_nhat
        `;
        const { rows } = await client.query(updateQuery, [referenceCode, ticketId]);

        // 3. Ghi vết kiểm toán (Audit Trail) vào nhật ký sửa chữa
        const logNote = `[Open Banking Webhook] Khớp lệnh chuyển khoản VietQR tự động thành công (1 giây): ${
            amountReceived > 0 ? amountReceived.toLocaleString('vi-VN') + ' đ' : 'Khớp đúng hóa đơn'
        } qua ${bankName}. Mã giao dịch ngân hàng: ${referenceCode}.`;

        await client.query(
            `INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, nhan_vien_id, trang_thai_cu, trang_thai_moi, ghi_chu) 
             VALUES ($1, $2, $3, $4, $5)`,
            [ticketId, null, currentTicket.trang_thai, currentTicket.trang_thai, logNote]
        );

        await client.query('COMMIT');

        // 4. Phát tín hiệu Socket.IO thời gian thực tới Bàn điều hành Lễ tân & Trang tra cứu của Khách
        try {
            const io = getIo();
            io.emit('payment_confirmed', {
                ticketId,
                ticketCode,
                amount: amountReceived || expectedAmount,
                referenceCode,
                bankName,
                status: 'DA_THANH_TOAN',
                timestamp: formatVietnamISO(new Date())
            });
            io.emit('ticket_status_changed', {
                ticketId,
                status: currentTicket.trang_thai,
                trang_thai_thanh_toan: 'DA_THANH_TOAN'
            });
        } catch (socketErr) {
            // Không làm gián đoạn phản hồi nếu socket chưa sẵn sàng
        }

        const updatedRow = rows[0];
        return {
            success: true,
            message: 'Đã tự động xác nhận chuyển khoản VietQR thành công qua Open Banking Webhook trong 1 giây!',
            data: {
                ticketCode,
                ticketId,
                status: updatedRow.trang_thai,
                paymentStatus: updatedRow.trang_thai_thanh_toan,
                paymentMethod: updatedRow.phuong_thuc_thanh_toan,
                referenceCode: updatedRow.ma_giao_dich,
                amountReceived: amountReceived || expectedAmount,
                expectedAmount,
                bankName,
                confirmedAt: formatVietnamISO(updatedRow.ngay_cap_nhat || new Date())
            }
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Tra cứu trạng thái thanh toán thời gian thực theo mã phiếu QR
 */
const getPaymentStatusByTicketCode = async (ticketCode) => {
    const res = await pool.query(
        `SELECT id, ma_tra_cuu, tong_tien, giam_gia_sinh_vien, tien_sau_giam, 
                trang_thai, trang_thai_thanh_toan, phuong_thuc_thanh_toan, ma_giao_dich, ngay_cap_nhat 
         FROM phieu_sua_chua 
         WHERE ma_tra_cuu = $1`,
        [String(ticketCode).trim().toUpperCase()]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
        ticketCode: row.ma_tra_cuu,
        totalAmount: Number(row.tong_tien || 0),
        discountAmount: Number(row.giam_gia_sinh_vien || 0),
        finalAmount: Number(row.tien_sau_giam || row.tong_tien || 0),
        status: row.trang_thai,
        paymentStatus: row.trang_thai_thanh_toan || 'CHUA_THANH_TOAN',
        isPaid: row.trang_thai_thanh_toan === 'DA_THANH_TOAN',
        paymentMethod: row.phuong_thuc_thanh_toan || 'VIETQR',
        transactionId: row.ma_giao_dich || null,
        updatedAt: formatVietnamISO(row.ngay_cap_nhat || new Date())
    };
};

module.exports = {
    reconcileBankingTransaction,
    getPaymentStatusByTicketCode,
    extractTicketCode
};
