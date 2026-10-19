const { pool } = require('../config/db.config');
const { readSoftwarePackageRequest } = require('./ticket.service');

const trackTicket = async (ticketCode) => {
    // Lấy thông tin cơ bản
    const result = await pool.query(`
        SELECT 
            p.id, p.ma_tra_cuu, p.trang_thai, p.tong_tien, p.han_bao_hanh, p.ngay_tao, p.ngay_cap_nhat,
            k.ho_ten, k.so_dien_thoai,
            t.ten_may, t.tinh_trang_may,
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
    const softwareRequest = readSoftwarePackageRequest(ticket.tinh_trang_may);
    ticket.tinh_trang_may = softwareRequest.issueDescription;
    ticket.goi_phan_mem = softwareRequest.packages;

    // Che giấu dữ liệu (Masking)
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

    // Lấy ảnh ngoại quan
    const photosRes = await pool.query(`
        SELECT id, duong_dan_anh, loai_anh, ghi_chu, ngay_tao
        FROM hinh_anh_phieu
        WHERE phieu_sua_chua_id = $1
        ORDER BY ngay_tao ASC
    `, [ticket.id]);
    ticket.hinh_anh_ngoai_quan = photosRes.rows || [];

    // Lấy danh sách linh kiện đã thay kèm số Serial
    const partsRes = await pool.query(`
        SELECT p.id, p.so_luong, p.don_gia, p.so_serial, l.ten_linh_kien
        FROM phieu_linh_kien p
        JOIN linh_kien l ON p.linh_kien_id = l.id
        WHERE p.phieu_sua_chua_id = $1
        ORDER BY p.id ASC
    `, [ticket.id]);
    ticket.linh_kien = partsRes.rows || [];

    // 1. Sổ bảo hành điện tử (e-Warranty)
    if (ticket.han_bao_hanh) {
        const hanDate = new Date(ticket.han_bao_hanh);
        const now = new Date();
        const diffTime = hanDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalDays = 90;
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

    // 2. Chính sách ưu đãi Sinh viên toàn quốc (Giảm 15%)
    if (ticket.la_sinh_vien) {
        const discount = Math.round(Number(ticket.tong_tien || 0) * 0.15);
        ticket.uu_dai_sinh_vien = {
            la_sinh_vien: true,
            truong_hoc: ticket.truong_hoc || 'Học sinh / Sinh viên',
            ma_sinh_vien: ticket.ma_sinh_vien || '',
            ty_le_giam: '15%',
            so_tien_giam: discount,
            tien_sau_giam: Math.max(0, Number(ticket.tong_tien || 0) - discount)
        };
    } else {
        ticket.uu_dai_sinh_vien = {
            la_sinh_vien: false,
            so_tien_giam: 0,
            tien_sau_giam: Number(ticket.tong_tien || 0)
        };
    }

    // Lấy lịch sử
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
    if (res.rows.length === 0) throw new Error('Không tìm thấy phiếu!');
    const ticket = res.rows[0];

    if (ticket.han_bao_hanh && new Date(ticket.han_bao_hanh) < new Date()) {
        throw new Error('Thiết bị này đã hết thời hạn bảo hành tiêu chuẩn!');
    }

    const note = `Khách hàng yêu cầu bảo hành lại: ${issueDescription}`;
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

const approveQuote = async (ticketCode, isApproved) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query('SELECT id, trang_thai FROM phieu_sua_chua WHERE ma_tra_cuu = $1', [ticketCode]);
        if (result.rows.length === 0) throw new Error('Không tìm thấy mã tra cứu');
        
        const ticket = result.rows[0];
        if (ticket.trang_thai !== 'CHỜ_KHÁCH_CHỐT_GIÁ') {
            throw new Error('Phiếu không ở trạng thái chờ báo giá!');
        }

        const newStatus = isApproved ? 'ĐANG_SỬA' : 'HỦY';
        let note = isApproved ? 'Khách hàng ĐÃ ĐỒNG Ý báo giá.' : 'Khách hàng TỪ CHỐI báo giá.';

        if (!isApproved) {
            // Hoàn kho tự động cho các linh kiện đã tạm gắn vào phiếu báo giá
            const attachedParts = await client.query(
                'SELECT id, linh_kien_id, so_luong FROM phieu_linh_kien WHERE phieu_sua_chua_id = $1',
                [ticket.id]
            );
            if (attachedParts.rows.length > 0) {
                for (const item of attachedParts.rows) {
                    await client.query(
                        'UPDATE linh_kien SET so_luong = so_luong + $1 WHERE id = $2',
                        [item.so_luong, item.linh_kien_id]
                    );
                }
                await client.query('DELETE FROM phieu_linh_kien WHERE phieu_sua_chua_id = $1', [ticket.id]);
                await client.query(
                    'UPDATE phieu_sua_chua SET tong_tien = 0 WHERE id = $1',
                    [ticket.id]
                );
                note = 'Khách hàng TỪ CHỐI báo giá. Hệ thống đã tự động hoàn trả linh kiện về kho.';
            }
        }

        await client.query(`
            UPDATE phieu_sua_chua 
            SET trang_thai = $1, ngay_cap_nhat = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [newStatus, ticket.id]);

        await client.query(`
            INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, trang_thai_cu, trang_thai_moi, ghi_chu)
            VALUES ($1, $2, $3, $4)
        `, [ticket.id, ticket.trang_thai, newStatus, note]);

        await client.query('COMMIT');
        return { newStatus };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


const trackByPhone = async (phone) => {
    const query = `
        SELECT p.ma_tra_cuu, p.trang_thai, p.loai_dich_vu, t.ten_may, t.tinh_trang_may, p.ngay_cap_nhat
        FROM phieu_sua_chua p
        JOIN thiet_bi t ON p.thiet_bi_id = t.id
        JOIN khach_hang k ON t.khach_hang_id = k.id
        WHERE k.so_dien_thoai = $1
        ORDER BY p.ngay_tao DESC
    `;
    const { rows } = await pool.query(query, [phone]);
    return rows;
};

const submitReview = async (ticketCode, so_sao, nhan_xet) => {
    const { rows } = await pool.query('SELECT id, trang_thai FROM phieu_sua_chua WHERE ma_tra_cuu = $1', [ticketCode]);
    if (rows.length === 0) throw new Error('Không tìm thấy phiếu!');
    const ticketId = rows[0].id;
    if (rows[0].trang_thai !== 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN') throw new Error('Máy chưa giao khách, chưa thể đánh giá!');
    
    // Check if already reviewed
    const reviewCheck = await pool.query('SELECT id FROM danh_gia WHERE phieu_sua_chua_id = $1', [ticketId]);
    if (reviewCheck.rows.length > 0) throw new Error('Bạn đã đánh giá phiếu này rồi!');

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
    approveQuote,
    claimWarranty
};
