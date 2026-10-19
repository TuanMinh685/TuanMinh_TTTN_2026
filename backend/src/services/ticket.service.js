const { pool } = require('../config/db.config');
const { getIo } = require('../config/socket.config');

const readSoftwarePackageRequest = (description) => {
    const text = typeof description === 'string' ? description : '';
    const marker = text.match(/\n\[SOFTWARE_PACKAGES:(\[[^\n]*\])\]$/);
    let packages = [];
    let issueDescription = text;

    if (marker) {
        try {
            const parsed = JSON.parse(marker[1]);
            if (Array.isArray(parsed)) packages = parsed;
        } catch (error) {
            console.error('Không đọc được danh sách gói phần mềm của phiếu:', error);
        }
        issueDescription = issueDescription.slice(0, marker.index);
    } else {
        const legacyPackageLines = [...text.matchAll(/^Gói phần mềm yêu cầu:\s*(.+)$/gm)];
        packages = legacyPackageLines.map(match => match[1].trim()).filter(Boolean);
    }

    issueDescription = issueDescription
        .replace(/^Gói phần mềm yêu cầu:\s*.+$/gm, '')
        .trim();

    return { issueDescription, packages };
};

const writeSoftwarePackageRequest = (description, packages) => {
    const { issueDescription } = readSoftwarePackageRequest(description);
    if (packages.length === 0) return issueDescription;
    return `${issueDescription}\n[SOFTWARE_PACKAGES:${JSON.stringify(packages)}]`;
};

const submitIntake = async (customerData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { 
            fullName, phone, zaloId, issueDescription, deviceName, serialImei, 
            loaiDichVu = 'OFFLINE', ultraviewerCode = null,
            isStudent = false, schoolName = '', studentId = '', photos = []
        } = customerData;
        let customerId = null;
        let deviceId = null;

        // 1. Tìm hoặc tạo Khách hàng (kèm thông tin Học sinh - Sinh viên)
        const userResult = await client.query(`SELECT id FROM khach_hang WHERE so_dien_thoai = $1`, [phone]);
            
        if (userResult.rows.length > 0) {
            customerId = userResult.rows[0].id;
            if (isStudent) {
                await client.query(
                    'UPDATE khach_hang SET la_sinh_vien = $1, truong_hoc = $2, ma_sinh_vien = $3 WHERE id = $4',
                    [true, schoolName || '', studentId || '', customerId]
                );
            }
        } else {
            const newUser = await client.query(`
                INSERT INTO khach_hang (ho_ten, so_dien_thoai, zalo_id, la_sinh_vien, truong_hoc, ma_sinh_vien)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [fullName, phone, zaloId || null, isStudent, schoolName || '', studentId || '']);
            customerId = newUser.rows[0].id;
        }
        
        // 2. Tạo Thiết bị mới cho khách hàng này
        const newDevice = await client.query(`
            INSERT INTO thiet_bi (khach_hang_id, ten_may, so_imei_serial, tinh_trang_may)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [customerId, deviceName, serialImei || null, issueDescription]);
        deviceId = newDevice.rows[0].id;

        // 3. Tạo Phiếu sửa chữa
        // Tạo mã ngẫu nhiên dạng RP-XXXXXX (Offline) hoặc ON-XXXXXX (Online)
        const prefix = loaiDichVu === 'ONLINE' ? 'ON-' : 'RP-';
        const ticketCode = prefix + Math.floor(100000 + Math.random() * 900000);
        
        const newTicket = await client.query(`
            INSERT INTO phieu_sua_chua (thiet_bi_id, ma_tra_cuu, loai_dich_vu, ma_ultraviewer, trang_thai)
            VALUES ($1, $2, $3, $4, 'CHỜ_KHÁM')
            RETURNING id, ma_tra_cuu, loai_dich_vu, trang_thai, ngay_tao
        `, [deviceId, ticketCode, loaiDichVu, ultraviewerCode]);

        const ticket = newTicket.rows[0];

        // 3b. Lưu ảnh ngoại quan nếu có gửi kèm lúc tiếp nhận
        if (Array.isArray(photos) && photos.length > 0) {
            for (const img of photos) {
                if (img && (img.duong_dan_anh || typeof img === 'string')) {
                    const url = typeof img === 'string' ? img : img.duong_dan_anh;
                    const loai = img.loai_anh || 'NGOAI_QUAN';
                    const ghiChu = img.ghi_chu || 'Ảnh chụp lúc tiếp nhận máy';
                    await client.query(`
                        INSERT INTO hinh_anh_phieu (phieu_sua_chua_id, duong_dan_anh, loai_anh, ghi_chu)
                        VALUES ($1, $2, $3, $4)
                    `, [ticket.id, url, loai, ghiChu]);
                }
            }
        }

        // 4. Lưu nhật ký sửa chữa
        await client.query(`
            INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, trang_thai_moi, ghi_chu)
            VALUES ($1, 'CHỜ_KHÁM', 'Khách hàng vừa tạo yêu cầu tiếp nhận qua mã QR')
        `, [ticket.id]);

        await client.query('COMMIT');

        // 5. Bắn thông báo Socket.io
        try {
            const io = getIo();
            const room = loaiDichVu === 'ONLINE' ? 'technician_room' : 'receptionist_room';
            io.to(room).emit('new_ticket', {
                ticketCode: ticket.ma_tra_cuu,
                customerName: fullName,
                deviceName: deviceName,
                issue: issueDescription,
                isOnline: loaiDichVu === 'ONLINE',
                ultraviewerCode,
                createdAt: ticket.ngay_tao
            });
            console.log(`📡 Đã gửi thông báo Realtime cho phòng ${room} về đơn ${ticket.ma_tra_cuu}`);
        } catch (socketErr) {
            console.error('Lỗi khi gửi socket event:', socketErr.message);
        }

        return { ticketCode: ticket.ma_tra_cuu };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const getAllTickets = async () => {
    const query = `
        SELECT p.id, p.ma_tra_cuu as ma_phieu, p.trang_thai, p.loai_dich_vu, p.ma_ultraviewer, p.tong_tien, p.han_bao_hanh, p.ngay_tao,
            k.ho_ten as ho_ten_khach, k.so_dien_thoai, k.la_sinh_vien, k.truong_hoc, k.ma_sinh_vien as mssv,
            t.ten_may as ten_thiet_bi, t.so_imei_serial, t.tinh_trang_may as mo_ta_loi
        FROM phieu_sua_chua p
        JOIN thiet_bi t ON p.thiet_bi_id = t.id
        JOIN khach_hang k ON t.khach_hang_id = k.id
        ORDER BY p.ngay_tao DESC
    `;
    const { rows } = await pool.query(query);
    return rows.map((ticket) => {
        const { issueDescription, packages } = readSoftwarePackageRequest(ticket.mo_ta_loi);
        return { ...ticket, mo_ta_loi: issueDescription, software_packages: packages };
    });
};

const updateTicketSoftwarePackages = async (ticketId, packages) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const ticketResult = await client.query(`
            SELECT p.id, t.id AS device_id, t.tinh_trang_may
            FROM phieu_sua_chua p
            JOIN thiet_bi t ON p.thiet_bi_id = t.id
            WHERE p.id = $1
            FOR UPDATE OF t
        `, [ticketId]);

        if (ticketResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const ticket = ticketResult.rows[0];
        const description = writeSoftwarePackageRequest(ticket.tinh_trang_may, packages);
        await client.query(
            'UPDATE thiet_bi SET tinh_trang_may = $1 WHERE id = $2',
            [description || null, ticket.device_id]
        );
        await client.query('COMMIT');
        return {
            issueDescription: readSoftwarePackageRequest(description).issueDescription,
            softwarePackages: packages
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateTicketStatus = async (id, status, ghiChu = '') => {
    const query = `
        UPDATE phieu_sua_chua 
        SET trang_thai = $1,
            ngay_cap_nhat = CURRENT_TIMESTAMP,
            han_bao_hanh = CASE
                WHEN $1 = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' AND han_bao_hanh IS NULL THEN CURRENT_TIMESTAMP + INTERVAL '180 days'
                ELSE han_bao_hanh
            END
        WHERE id = $2 
        RETURNING ma_tra_cuu
    `;
    const { rows } = await pool.query(query, [status, id]);
    
    if (rows.length > 0) {
        const defaultNoteMap = {
            'ĐANG_CHUẨN_ĐOÁN': 'Lễ tân đã chuyển thiết bị cho Kỹ thuật viên kiểm tra chuyên sâu.',
            'CHỜ_KHÁCH_CHỐT_GIÁ': 'Kỹ thuật viên đã lên phương án sửa chữa và gửi báo giá chờ khách xác nhận.',
            'ĐANG_SỬA': 'Kỹ thuật viên đang tiến hành sửa chữa / thay thế linh kiện.',
            'ĐÃ_SỬA_XONG': 'Kỹ thuật viên đã hoàn tất sửa chữa và kiểm tra chất lượng (QC).',
            'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN': 'Đã bàn giao thiết bị cho khách hàng, thu tiền và kích hoạt bảo hành điện tử 06 tháng (180 ngày).'
        };
        const noteText = (typeof ghiChu === 'string' && ghiChu.trim())
            ? ghiChu.trim()
            : (defaultNoteMap[status] || `Cập nhật trạng thái sang ${status.replace(/_/g, ' ')}`);

        await pool.query(
            `INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, trang_thai_moi, ghi_chu) VALUES ($1, $2, $3)`,
            [id, status, noteText]
        );

        // Emit event to update frontend
        try {
            const io = getIo();
            io.emit('ticket_status_changed', { ticketId: id, status });
        } catch (err) {}
    }
    
    return rows[0];
};

const submitBooking = async (bookingData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {
            fullName, phone, zaloId, ngayHen, gioHen, moTaLoi, loaiDichVu,
            isStudent = false, schoolName = '', studentId = ''
        } = bookingData;
        
        // Find or create customer
        let customerId = null;
        const userResult = await client.query('SELECT id FROM khach_hang WHERE so_dien_thoai = $1', [phone]);
        if (userResult.rows.length > 0) {
            customerId = userResult.rows[0].id;
            if (isStudent) {
                await client.query(
                    'UPDATE khach_hang SET la_sinh_vien = $1, truong_hoc = $2, ma_sinh_vien = $3 WHERE id = $4',
                    [true, schoolName || '', studentId || '', customerId]
                );
            }
        } else {
            const newUser = await client.query(
                'INSERT INTO khach_hang (ho_ten, so_dien_thoai, zalo_id, la_sinh_vien, truong_hoc, ma_sinh_vien) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [fullName, phone, zaloId || null, Boolean(isStudent), schoolName || '', studentId || '']
            );
            customerId = newUser.rows[0].id;
        }

        const newBooking = await client.query(`
            INSERT INTO lich_hen (khach_hang_id, ngay_hen, gio_hen, mo_ta_loi, loai_dich_vu, trang_thai)
            VALUES ($1, $2, $3, $4, $5, 'CHO_XAC_NHAN')
            RETURNING id
        `, [customerId, ngayHen, gioHen, moTaLoi, loaiDichVu]);

        await client.query('COMMIT');
        
        // Notify receptionist
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
        SELECT l.id, k.ho_ten as ho_ten_khach, k.so_dien_thoai, k.la_sinh_vien, k.truong_hoc, k.ma_sinh_vien as mssv,
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
        
        // Cập nhật trạng thái lịch hẹn
        const updateQuery = `
            UPDATE lich_hen 
            SET trang_thai = $1 
            WHERE id = $2 
            RETURNING khach_hang_id, mo_ta_loi, loai_dich_vu
        `;
        const result = await client.query(updateQuery, [status, id]);
        let createdTicketCode = null;
        
        // Nếu khách đã đến, tự động chuyển đổi thành Phiếu Yêu Cầu
        if (status === 'KHACH_DA_DEN' && result.rows.length > 0) {
            const booking = result.rows[0];
            
            // 1. Thêm thiết bị mới
            const tenMay = (typeof deviceName === 'string' && deviceName.trim())
                ? deviceName.trim()
                : 'Thiết bị tiếp nhận theo lịch hẹn';
            const deviceResult = await client.query(
                'INSERT INTO thiet_bi (khach_hang_id, ten_may, tinh_trang_may) VALUES ($1, $2, $3) RETURNING id',
                [booking.khach_hang_id, tenMay, booking.mo_ta_loi]
            );
            const deviceId = deviceResult.rows[0].id;
            
            // 2. Tạo mã tra cứu ngẫu nhiên
            const maTraCuu = 'RP-' + Math.floor(100000 + Math.random() * 900000);
            createdTicketCode = maTraCuu;
            
            // 3. Tạo phiếu sửa chữa
            const createdTicket = await client.query(`
                INSERT INTO phieu_sua_chua (thiet_bi_id, ma_tra_cuu, loai_dich_vu, trang_thai)
                VALUES ($1, $2, $3, 'CHỜ_KHÁM')
                RETURNING id
            `, [deviceId, maTraCuu, booking.loai_dich_vu === 'ONLINE_TUXA' ? 'ONLINE' : 'OFFLINE']);

            const newTicketId = createdTicket.rows[0]?.id;
            if (newTicketId) {
                await client.query(
                    `INSERT INTO nhat_ky_sua_chua (phieu_sua_chua_id, trang_thai_moi, ghi_chu) VALUES ($1, 'CHỜ_KHÁM', 'Tiếp nhận máy trực tiếp từ lịch hẹn đã đặt trước tại 615 Âu Cơ')`,
                    [newTicketId]
                );
            }
            
            // Emit sự kiện có phiếu mới
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


const getParts = async () => {
    const { rows } = await pool.query('SELECT * FROM linh_kien ORDER BY id ASC');
    return rows;
};

const getPublicParts = async () => {
    const { rows } = await pool.query(`
        SELECT id, ten_linh_kien, gia_ban
        FROM linh_kien
        ORDER BY ten_linh_kien ASC
    `);
    return rows;
};

const createPart = async ({ ten_linh_kien, gia_ban, so_luong }) => {
    const { rows } = await pool.query(`
        INSERT INTO linh_kien (ten_linh_kien, gia_ban, so_luong)
        VALUES ($1, $2, $3)
        RETURNING id, ten_linh_kien, gia_ban, so_luong
    `, [ten_linh_kien, gia_ban, so_luong]);
    return rows[0];
};

const updatePart = async (id, { ten_linh_kien, gia_ban, so_luong }) => {
    const { rows } = await pool.query(`
        UPDATE linh_kien
        SET ten_linh_kien = $1, gia_ban = $2, so_luong = $3
        WHERE id = $4
        RETURNING id, ten_linh_kien, gia_ban, so_luong
    `, [ten_linh_kien, gia_ban, so_luong, id]);
    return rows[0] || null;
};

const getTicketParts = async (ticketId) => {
    const query = `
        SELECT p.*, l.ten_linh_kien 
        FROM phieu_linh_kien p
        JOIN linh_kien l ON p.linh_kien_id = l.id
        WHERE p.phieu_sua_chua_id = $1
        ORDER BY p.id ASC
    `;
    const { rows } = await pool.query(query, [ticketId]);
    return rows;
};

const addPartToTicket = async (ticketId, partId, quantity, soSerial = null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Kiểm tra tồn kho và lấy giá bán
        const partResult = await client.query('SELECT gia_ban, so_luong FROM linh_kien WHERE id = $1 FOR UPDATE', [partId]);
        if (partResult.rows.length === 0) throw new Error('Không tìm thấy linh kiện');
        
        const part = partResult.rows[0];
        if (part.so_luong < quantity) throw new Error('Số lượng linh kiện trong kho không đủ');
        
        // Số Serial / IMEI (Serial Tracking)
        const serial = soSerial?.trim() || `SN-${partId}-${Math.floor(100000 + Math.random() * 900000)}`;

        // Thêm vào phieu_linh_kien
        await client.query(
            'INSERT INTO phieu_linh_kien (phieu_sua_chua_id, linh_kien_id, so_luong, don_gia, so_serial) VALUES ($1, $2, $3, $4, $5)',
            [ticketId, partId, quantity, part.gia_ban, serial]
        );
        
        // Trừ tồn kho
        await client.query('UPDATE linh_kien SET so_luong = so_luong - $1 WHERE id = $2', [quantity, partId]);
        
        // Cộng dồn vào tong_tien của phieu_sua_chua
        const addAmount = part.gia_ban * quantity;
        await client.query('UPDATE phieu_sua_chua SET tong_tien = tong_tien + $1 WHERE id = $2', [addAmount, ticketId]);
        
        await client.query('COMMIT');
        return { success: true, serial };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const removePartFromTicket = async (ticketId, partRecordId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const recResult = await client.query(
            'SELECT id, linh_kien_id, so_luong, don_gia FROM phieu_linh_kien WHERE id = $1 AND phieu_sua_chua_id = $2',
            [Number(partRecordId), Number(ticketId)]
        );
        if (recResult.rows.length === 0) {
            throw new Error('Không tìm thấy linh kiện cần gỡ trên phiếu này.');
        }
        const rec = recResult.rows[0];
        const refundAmount = Number(rec.so_luong) * Number(rec.don_gia);

        await client.query('UPDATE linh_kien SET so_luong = so_luong + $1 WHERE id = $2', [rec.so_luong, rec.linh_kien_id]);
        await client.query('DELETE FROM phieu_linh_kien WHERE id = $1 AND phieu_sua_chua_id = $2', [Number(partRecordId), Number(ticketId)]);
        await client.query('UPDATE phieu_sua_chua SET tong_tien = GREATEST(tong_tien - $1, 0) WHERE id = $2', [refundAmount, Number(ticketId)]);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
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
    getParts,
    getPublicParts,
    createPart,
    updatePart,
    getTicketParts,
    addPartToTicket,
    removePartFromTicket,
    getTicketPhotos,
    addTicketPhoto,
    submitIntake,
    getAllTickets,
    updateTicketSoftwarePackages,
    readSoftwarePackageRequest,
    updateTicketStatus,
    submitBooking,
    getAllBookings,
    updateBookingStatus
};
