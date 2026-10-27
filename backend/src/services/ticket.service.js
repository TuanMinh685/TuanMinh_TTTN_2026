const { pool } = require('../config/db.config');
const { getIo } = require('../config/socket.config');
const { formatVietnamISO, markQrSessionSubmitted } = require('./ticket_session.service');

const submitIntake = async (customerData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { 
            fullName, phone, zaloId, issueDescription,
            deviceName, serialImei, serialNumber,
            loaiDichVu, serviceType,
            photos = [],
            sessionToken = null
        } = customerData;

        const resolvedFullName = String(fullName || customerData.ho_ten || '').trim();
        const resolvedPhone = String(phone || customerData.so_dien_thoai || '').trim();
        const resolvedIssue = String(issueDescription || customerData.mo_ta_loi || customerData.tinh_trang_may || '').trim();
        const resolvedDeviceName = String(deviceName || customerData.ten_may || customerData.ten_thiet_bi || 'Sản phẩm / Dịch vụ cần CSKH').trim();
        const resolvedSerial = (serialImei || serialNumber || customerData.so_imei_serial || '').trim() || null;
        const resolvedServiceType = (loaiDichVu || serviceType || 'OFFLINE').toUpperCase();

        let customerId = null;
        let deviceId = null;

        // 1. Tìm hoặc tạo Khách hàng
        const userResult = await client.query(`SELECT id FROM khach_hang WHERE so_dien_thoai = $1`, [resolvedPhone]);
            
        if (userResult.rows.length > 0) {
            customerId = userResult.rows[0].id;
            if (resolvedFullName) {
                await client.query(
                    'UPDATE khach_hang SET ho_ten = $1 WHERE id = $2',
                    [resolvedFullName, customerId]
                );
            }
        } else {
            const newUser = await client.query(`
                INSERT INTO khach_hang (ho_ten, so_dien_thoai, zalo_id)
                VALUES ($1, $2, $3)
                RETURNING id
            `, [resolvedFullName, resolvedPhone, zaloId || null]);
            customerId = newUser.rows[0].id;
        }
        
        // 2. Tạo bản ghi Sản phẩm / Dịch vụ cần hỗ trợ CSKH
        const newDevice = await client.query(`
            INSERT INTO thiet_bi (khach_hang_id, ten_may, so_imei_serial, tinh_trang_may)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [customerId, resolvedDeviceName, resolvedSerial, resolvedIssue]);
        deviceId = newDevice.rows[0].id;

        // 3. Tạo Hồ sơ phiếu CSKH & cấp Mã QR định danh RP-XXXXXX
        const ticketCode = 'RP-' + Math.floor(100000 + Math.random() * 900000);
        
        const newTicket = await client.query(`
            INSERT INTO phieu_sua_chua (thiet_bi_id, ma_tra_cuu, loai_dich_vu, trang_thai)
            VALUES ($1, $2, $3, 'CHỜ_KHÁM')
            RETURNING id, ma_tra_cuu, loai_dich_vu, trang_thai, ngay_tao
        `, [deviceId, ticketCode, resolvedServiceType]);

        const ticket = newTicket.rows[0];

        // 3b. Nếu gửi từ phiên QR động (init-session), cập nhật trạng thái phiên sang SUBMITTED
        if (sessionToken) {
            await markQrSessionSubmitted(sessionToken, ticket.id, client);
        }

        // 3c. Lưu ảnh minh chứng hiện trạng nếu có gửi kèm lúc tiếp nhận
        if (Array.isArray(photos) && photos.length > 0) {
            for (const img of photos) {
                if (img && (img.duong_dan_anh || typeof img === 'string')) {
                    const url = typeof img === 'string' ? img : img.duong_dan_anh;
                    const loai = img.loai_anh || 'NGOAI_QUAN';
                    const ghiChu = img.ghi_chu || 'Ảnh minh chứng lúc tiếp nhận hồ sơ QR';
                    await client.query(`
                        INSERT INTO hinh_anh_phieu (phieu_sua_chua_id, duong_dan_anh, loai_anh, ghi_chu)
                        VALUES ($1, $2, $3, $4)
                    `, [ticket.id, url, loai, ghiChu]);
                }
            }
        }

        // 4. Lưu nhật ký tiến độ xử lý CSKH
        const logNote = sessionToken
            ? `Khách hàng vừa quét mã QR phiên (${sessionToken.slice(0, 8)}...) và gửi yêu cầu CSKH`
            : 'Khách hàng vừa khởi tạo hồ sơ yêu cầu Chăm sóc khách hàng qua mã QR';
        await client.query(`
            INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, trang_thai_moi, ghi_chu)
            VALUES ($1, $2, $3)
        `, [ticket.id, 'CHỜ_KHÁM', logNote]);

        await client.query('COMMIT');

        const createdAtVN = formatVietnamISO(ticket.ngay_tao || new Date());

        // 5. Bắn thông báo Socket.io
        try {
            const io = getIo();
            io.to('receptionist_room').emit('new_ticket', {
                ticketCode: ticket.ma_tra_cuu,
                customerName: resolvedFullName,
                deviceName: resolvedDeviceName,
                issue: resolvedIssue,
                createdAt: createdAtVN
            });
        } catch (socketErr) {}

        return {
            ticketId: ticket.id,
            ticketCode: ticket.ma_tra_cuu,
            sessionToken: sessionToken || null,
            fullName: resolvedFullName,
            phone: resolvedPhone,
            deviceName: resolvedDeviceName,
            serialImei: resolvedSerial,
            issueDescription: resolvedIssue,
            loaiDichVu: resolvedServiceType,
            status: ticket.trang_thai,
            createdAt: createdAtVN
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const getAllTickets = async () => {
    const query = `
        SELECT p.id, p.ma_tra_cuu as ma_phieu, p.ma_tra_cuu, p.trang_thai, p.loai_dich_vu, p.han_bao_hanh, p.ngay_tao, p.ngay_cap_nhat,
            k.ho_ten as ho_ten_khach, k.so_dien_thoai,
            t.ten_may as ten_thiet_bi, t.so_imei_serial, t.tinh_trang_may as mo_ta_loi
        FROM phieu_sua_chua p
        JOIN thiet_bi t ON p.thiet_bi_id = t.id
        JOIN khach_hang k ON t.khach_hang_id = k.id
        ORDER BY p.ngay_tao DESC
    `;
    const { rows } = await pool.query(query);
    return rows.map((ticket) => {
        const issueDescription = String(ticket.mo_ta_loi || '').trim();
        const ngayTaoVN = ticket.ngay_tao ? formatVietnamISO(ticket.ngay_tao) : null;
        const ngayCapNhatVN = ticket.ngay_cap_nhat ? formatVietnamISO(ticket.ngay_cap_nhat) : ngayTaoVN;
        return {
            ...ticket,
            ma_tra_cuu: ticket.ma_tra_cuu || ticket.ma_phieu,
            mo_ta_loi: issueDescription,
            ngay_tao: ngayTaoVN,
            ngay_cap_nhat: ngayCapNhatVN,
            ticketCode: ticket.ma_tra_cuu || ticket.ma_phieu,
            fullName: ticket.ho_ten_khach,
            phone: ticket.so_dien_thoai,
            deviceName: ticket.ten_thiet_bi,
            serialImei: ticket.so_imei_serial || null,
            issueDescription,
            status: ticket.trang_thai,
            createdAt: ngayTaoVN,
            updatedAt: ngayCapNhatVN
        };
    });
};

const updateTicketStatus = async (idOrCode, status, ghiChu = '', employeeId = null) => {
    const isNumericId = /^\d+$/.test(String(idOrCode).trim());
    const lookupRes = isNumericId
        ? await pool.query('SELECT id, ma_tra_cuu, trang_thai FROM phieu_sua_chua WHERE id = $1', [Number(idOrCode)])
        : await pool.query('SELECT id, ma_tra_cuu, trang_thai FROM phieu_sua_chua WHERE ma_tra_cuu = $1', [String(idOrCode).trim()]);

    if (lookupRes.rows.length === 0) {
        return null;
    }

    const currentTicket = lookupRes.rows[0];
    const ticketId = currentTicket.id;
    const previousStatus = currentTicket.trang_thai;

    const query = `
        UPDATE phieu_sua_chua 
        SET trang_thai = $1::varchar,
            ngay_cap_nhat = CURRENT_TIMESTAMP,
            han_bao_hanh = CASE
                WHEN $1::varchar IN ('ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN', 'ĐÃ_SỬA_XONG') AND han_bao_hanh IS NULL THEN CURRENT_TIMESTAMP + INTERVAL '180 days'
                ELSE han_bao_hanh
            END
        WHERE id = $2 
        RETURNING id, ma_tra_cuu, trang_thai, ngay_cap_nhat, han_bao_hanh
    `;
    const { rows } = await pool.query(query, [status, ticketId]);
    
    if (rows.length > 0) {
        const defaultNoteMap = {
            'ĐANG_CHUẨN_ĐOÁN': 'Bộ phận Lễ tân đã tiếp nhận và phân loại hồ sơ yêu cầu CSKH.',
            'ĐANG_SỬA': 'Chuyên viên Chăm sóc khách hàng đang trực tiếp xử lý yêu cầu hỗ trợ.',
            'ĐÃ_SỬA_XONG': 'Chuyên viên đã xử lý xong yêu cầu hỗ trợ của khách hàng.',
            'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN': 'Đã hoàn tất hỗ trợ CSKH, bàn giao hồ sơ và kích hoạt Sổ bảo hành điện tử (e-Warranty 06 tháng).'
        };
        const noteText = (typeof ghiChu === 'string' && ghiChu.trim())
            ? ghiChu.trim()
            : (defaultNoteMap[status] || `Cập nhật trạng thái hồ sơ sang ${status.replace(/_/g, ' ')}`);

        await pool.query(
            `INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, nhan_vien_id, trang_thai_cu, trang_thai_moi, ghi_chu) VALUES ($1, $2, $3, $4, $5)`,
            [ticketId, employeeId || null, previousStatus, status, noteText]
        );

        try {
            const io = getIo();
            io.emit('ticket_status_changed', { ticketId, status });
        } catch (err) {}
    }

    const updatedRow = rows[0] || currentTicket;
    const updatedAtVN = formatVietnamISO(updatedRow.ngay_cap_nhat || new Date());

    return {
        id: ticketId,
        ma_tra_cuu: updatedRow.ma_tra_cuu || currentTicket.ma_tra_cuu,
        ticketCode: updatedRow.ma_tra_cuu || currentTicket.ma_tra_cuu,
        previousStatus,
        trang_thai: status,
        status,
        ngay_cap_nhat: updatedAtVN,
        updatedAt: updatedAtVN,
        han_bao_hanh: updatedRow.han_bao_hanh ? formatVietnamISO(updatedRow.han_bao_hanh) : null
    };
};

const submitBooking = async (bookingData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {
            fullName, phone, zaloId, ngayHen, gioHen, moTaLoi, loaiDichVu
        } = bookingData;
        
        let customerId = null;
        const userResult = await client.query('SELECT id FROM khach_hang WHERE so_dien_thoai = $1', [phone]);
        if (userResult.rows.length > 0) {
            customerId = userResult.rows[0].id;
        } else {
            const newUser = await client.query(
                'INSERT INTO khach_hang (ho_ten, so_dien_thoai, zalo_id) VALUES ($1, $2, $3) RETURNING id',
                [fullName, phone, zaloId || null]
            );
            customerId = newUser.rows[0].id;
        }

        const newBooking = await client.query(`
            INSERT INTO lich_hen (khach_hang_id, ngay_hen, gio_hen, mo_ta_loi, loai_dich_vu, trang_thai)
            VALUES ($1, $2, $3, $4, $5, 'CHO_XAC_NHAN')
            RETURNING id
        `, [customerId, ngayHen, gioHen, moTaLoi, loaiDichVu || 'TAI_CUA_HANG']);

        await client.query('COMMIT');
        
        try {
            const io = getIo();
            io.to('receptionist_room').emit('new_booking', {
                bookingId: newBooking.rows[0].id,
                customerName: fullName,
                date: ngayHen,
                time: gioHen
            });
        } catch (err) {}

        return { bookingId: newBooking.rows[0].id };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const getAllBookings = async () => {
    const query = `
        SELECT l.id, k.ho_ten as ho_ten_khach, k.so_dien_thoai,
               l.ngay_hen, l.gio_hen, l.mo_ta_loi, l.loai_dich_vu, l.trang_thai
        FROM lich_hen l
        JOIN khach_hang k ON l.khach_hang_id = k.id
        ORDER BY l.ngay_hen ASC, l.gio_hen ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const updateBookingStatus = async (id, status, deviceName = '') => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const updateQuery = `
            UPDATE lich_hen 
            SET trang_thai = $1 
            WHERE id = $2 
            RETURNING khach_hang_id, mo_ta_loi, loai_dich_vu
        `;
        const result = await client.query(updateQuery, [status, id]);
        let createdTicketCode = null;
        
        if (status === 'KHACH_DA_DEN' && result.rows.length > 0) {
            const booking = result.rows[0];
            
            const tenMay = (typeof deviceName === 'string' && deviceName.trim())
                ? deviceName.trim()
                : 'Hồ sơ tiếp nhận theo lịch hẹn CSKH';
            const deviceResult = await client.query(
                'INSERT INTO thiet_bi (khach_hang_id, ten_may, tinh_trang_may) VALUES ($1, $2, $3) RETURNING id',
                [booking.khach_hang_id, tenMay, booking.mo_ta_loi]
            );
            const deviceId = deviceResult.rows[0].id;
            
            const maTraCuu = 'RP-' + Math.floor(100000 + Math.random() * 900000);
            createdTicketCode = maTraCuu;
            
            const createdTicket = await client.query(`
                INSERT INTO phieu_sua_chua (thiet_bi_id, ma_tra_cuu, loai_dich_vu, trang_thai)
                VALUES ($1, $2, 'OFFLINE', 'CHỜ_KHÁM')
                RETURNING id
            `, [deviceId, maTraCuu]);

            const newTicketId = createdTicket.rows[0]?.id;
            if (newTicketId) {
                await client.query(
                    `INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, trang_thai_moi, ghi_chu) VALUES ($1, $2, $3)`,
                    [newTicketId, 'CHỜ_KHÁM', 'Tiếp nhận khách hàng trực tiếp từ lịch hẹn CSKH đã đặt trước']
                );
            }
            
            try {
                const io = getIo();
                io.to('receptionist_room').emit('new_ticket_receptionist', { ma_phieu: maTraCuu });
            } catch (err) {}
        }
        
        await client.query('COMMIT');

        try {
            const io = getIo();
            io.emit('booking_status_changed', { bookingId: id, status });
        } catch (err) {}
        
        return { success: true, ticketCode: createdTicketCode };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const getTicketPhotos = async (ticketId) => {
    const { rows } = await pool.query(`
        SELECT id, phieu_sua_chua_id, duong_dan_anh, loai_anh, ghi_chu, ngay_tao
        FROM hinh_anh_phieu
        WHERE phieu_sua_chua_id = $1
        ORDER BY ngay_tao ASC
    `, [ticketId]);
    return rows;
};

const addTicketPhoto = async (ticketId, { duong_dan_anh, loai_anh, ghi_chu }) => {
    const { rows } = await pool.query(`
        INSERT INTO hinh_anh_phieu (phieu_sua_chua_id, duong_dan_anh, loai_anh, ghi_chu)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [ticketId, duong_dan_anh, loai_anh || 'NGOAI_QUAN', ghi_chu || '']);
    return rows[0];
};

module.exports = {
    getTicketPhotos,
    addTicketPhoto,
    submitIntake,
    getAllTickets,
    updateTicketStatus,
    submitBooking,
    getAllBookings,
    updateBookingStatus
};
