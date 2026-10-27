const { pool } = require('../config/db.config');

const trackTicket = async (ticketCode) => {
    const result = await pool.query(`
        SELECT 
            p.id, p.ma_tra_cuu, p.trang_thai, p.loai_dich_vu, p.han_bao_hanh, p.ngay_tao, p.ngay_cap_nhat,
            k.ho_ten, k.so_dien_thoai,
            t.ten_may, t.so_imei_serial, t.tinh_trang_may,
            EXISTS (
                SELECT 1
                FROM danh_gia d
                WHERE d.phieu_sua_chua_id = p.id
            ) AS da_danh_gia
        FROM phieu_sua_chua p
        JOIN thiet_bi t ON p.thiet_bi_id = t.id
        JOIN khach_hang k ON t.khach_hang_id = k.id
        WHERE p.ma_tra_cuu = $1
    `, [ticketCode]);

    if (result.rows.length === 0) return null;

    const ticket = result.rows[0];
    const cleanIssue = String(ticket.tinh_trang_may || '').trim();
    ticket.tinh_trang_may = cleanIssue;
    ticket.mo_ta_loi = cleanIssue;
    ticket.ten_thiet_bi = ticket.ten_may;

    // Che giấu dữ liệu cá nhân (Masking)
    const maskName = (name) => {
        if (!name) return '';
        const parts = name.split(' ');
        if (parts.length === 1) return name.substring(0, 1) + '***';
        return parts[0] + ' ' + parts.slice(1).map(p => p.substring(0, 1) + '***').join(' ');
    };
    
    const maskPhone = (phone) => {
        if (!phone || phone.length < 10) return phone;
        return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
    };

    ticket.ho_ten = maskName(ticket.ho_ten);
    ticket.so_dien_thoai = maskPhone(ticket.so_dien_thoai);

    // Lấy ảnh minh chứng hiện trạng
    const photosRes = await pool.query(`
        SELECT id, duong_dan_anh, loai_anh, ghi_chu, ngay_tao
        FROM hinh_anh_phieu
        WHERE phieu_sua_chua_id = $1
        ORDER BY ngay_tao ASC
    `, [ticket.id]);
    ticket.hinh_anh_ngoai_quan = photosRes.rows || [];

    // Sổ bảo hành điện tử (e-Warranty)
    if (ticket.han_bao_hanh) {
        const hanDate = new Date(ticket.han_bao_hanh);
        const now = new Date();
        const diffTime = hanDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalDays = 180;
        const remainPercent = Math.max(0, Math.min(100, Math.round((diffDays / totalDays) * 100)));
        ticket.bao_hanh = {
            han_bao_hanh: ticket.han_bao_hanh,
            so_ngay_con_lai: Math.max(0, diffDays),
            con_han: diffDays > 0,
            ti_le_con_lai: remainPercent,
            trang_thai_text: diffDays > 0 ? `Còn ${diffDays} ngày bảo hành` : 'Đã hết hạn bảo hành'
        };
    } else {
        ticket.bao_hanh = null;
    }

    // Lấy lịch sử nhật ký xử lý CSKH
    const historyResult = await pool.query(`
        SELECT trang_thai_moi, ghi_chu, ngay_tao
        FROM nhat_ky_sua_chua
        WHERE phieu_sua_chua_id = $1
        ORDER BY ngay_tao DESC
    `, [ticket.id]);

    ticket.nhat_ky = historyResult.rows;

    // Ẩn ID nội bộ
    delete ticket.id;

    return ticket;
};

const claimWarranty = async (ticketCode, issueDescription) => {
    const res = await pool.query('SELECT id, thiet_bi_id, han_bao_hanh, trang_thai FROM phieu_sua_chua WHERE ma_tra_cuu = $1', [ticketCode]);
    if (res.rows.length === 0) throw new Error('Không tìm thấy hồ sơ phiếu CSKH!');
    const ticket = res.rows[0];

    if (ticket.han_bao_hanh && new Date(ticket.han_bao_hanh) < new Date()) {
        throw new Error('Hồ sơ này đã hết thời hạn bảo hành tiêu chuẩn!');
    }

    const note = `Khách hàng gửi yêu cầu hỗ trợ bảo hành: ${issueDescription}`;
    await pool.query(`
        UPDATE phieu_sua_chua
        SET trang_thai = $1, ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE id = $2
    `, ['YÊU_CẦU_BẢO_HÀNH', ticket.id]);

    await pool.query(`
        INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, trang_thai_moi, ghi_chu)
        VALUES ($1, 'YÊU_CẦU_BẢO_HÀNH', $2)
    `, [ticket.id, note]);

    return { ticketCode, status: 'YÊU_CẦU_BẢO_HÀNH' };
};

const trackByPhone = async (phone) => {
    const query = `
        SELECT p.ma_tra_cuu, p.trang_thai, p.loai_dich_vu, p.han_bao_hanh, t.ten_may, t.so_imei_serial, t.tinh_trang_may, p.ngay_cap_nhat
        FROM phieu_sua_chua p
        JOIN thiet_bi t ON p.thiet_bi_id = t.id
        JOIN khach_hang k ON t.khach_hang_id = k.id
        WHERE k.so_dien_thoai = $1
           OR UPPER(COALESCE(t.so_imei_serial, '')) = UPPER($1)
           OR UPPER(p.ma_tra_cuu) = UPPER($1)
        ORDER BY p.ngay_tao DESC
    `;
    const { rows } = await pool.query(query, [phone]);
    return rows.map(row => ({
        ...row,
        tinh_trang_may: String(row.tinh_trang_may || '').trim()
    }));
};

const submitReview = async (ticketCode, so_sao, nhan_xet) => {
    const { rows } = await pool.query('SELECT id, trang_thai FROM phieu_sua_chua WHERE ma_tra_cuu = $1', [ticketCode]);
    if (rows.length === 0) throw new Error('Không tìm thấy phiếu!');
    const ticketId = rows[0].id;
    if (rows[0].trang_thai !== 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' && rows[0].trang_thai !== 'ĐÃ_SỬA_XONG') {
        throw new Error('Hồ sơ chưa hoàn tất xử lý, chưa thể đánh giá!');
    }
    
    const reviewCheck = await pool.query('SELECT id FROM danh_gia WHERE phieu_sua_chua_id = $1', [ticketId]);
    if (reviewCheck.rows.length > 0) throw new Error('Bạn đã đánh giá hồ sơ này rồi!');

    const result = await pool.query(
        'INSERT INTO danh_gia (phieu_sua_chua_id, so_sao, nhan_xet) VALUES ($1, $2, $3) RETURNING *',
        [ticketId, so_sao, nhan_xet]
    );
    return result.rows[0];
};

const getTopReviews = async () => {
    const { rows } = await pool.query(`
        SELECT d.so_sao, d.nhan_xet, d.ngay_danh_gia, k.ho_ten
        FROM danh_gia d
        JOIN phieu_sua_chua p ON d.phieu_sua_chua_id = p.id
        JOIN thiet_bi t ON p.thiet_bi_id = t.id
        JOIN khach_hang k ON t.khach_hang_id = k.id
        WHERE d.so_sao >= 4
        ORDER BY d.ngay_danh_gia DESC
        LIMIT 5
    `);
    return rows;
};

module.exports = {
    submitReview,
    getTopReviews,
    trackByPhone,
    trackTicket,
    claimWarranty
};
