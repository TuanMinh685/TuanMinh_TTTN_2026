const { pool } = require('../config/db.config');
const { getIo } = require('../config/socket.config');

const submitIntake = async (customerData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { fullName, phone, zaloId, issueDescription, deviceName, serialImei, loaiDichVu = 'OFFLINE', ultraviewerCode = null } = customerData;
        let customerId = null;
        let deviceId = null;

        // 1. Tìm hoặc tạo Khách hàng
        const userResult = await client.query(`SELECT id FROM khach_hang WHERE so_dien_thoai = $1`, [phone]);
            
        if (userResult.rows.length > 0) {
            customerId = userResult.rows[0].id;
        } else {
            const newUser = await client.query(`
                INSERT INTO khach_hang (ho_ten, so_dien_thoai, zalo_id)
                VALUES ($1, $2, $3)
                RETURNING id
            `, [fullName, phone, zaloId || null]);
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
        SELECT p.id, p.ma_tra_cuu as ma_phieu, p.trang_thai, p.tong_tien, k.ho_ten as ho_ten_khach, k.so_dien_thoai, t.tinh_trang_may as mo_ta_loi
        FROM phieu_sua_chua p
        JOIN thiet_bi t ON p.thiet_bi_id = t.id
        JOIN khach_hang k ON t.khach_hang_id = k.id
        ORDER BY p.ngay_tao DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const updateTicketStatus = async (id, status) => {
    const query = `
        UPDATE phieu_sua_chua 
        SET trang_thai = $1 
        WHERE id = $2 
        RETURNING ma_tra_cuu
    `;
    const { rows } = await pool.query(query, [status, id]);
    
    if (rows.length > 0) {
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
        const { fullName, phone, zaloId, ngayHen, gioHen, moTaLoi, loaiDichVu } = bookingData;
        
        // Find or create customer
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
        SELECT l.id, k.ho_ten as ho_ten_khach, k.so_dien_thoai, l.ngay_hen, l.gio_hen, l.mo_ta_loi, l.loai_dich_vu, l.trang_thai
        FROM lich_hen l
        JOIN khach_hang k ON l.khach_hang_id = k.id
        ORDER BY l.ngay_hen ASC, l.gio_hen ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const updateBookingStatus = async (id, status) => {
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
        
        // Nếu khách đã đến, tự động chuyển đổi thành Phiếu Yêu Cầu
        if (status === 'KHACH_DA_DEN' && result.rows.length > 0) {
            const booking = result.rows[0];
            
            // 1. Thêm thiết bị mới (tạm dùng tên mặc định)
            const deviceResult = await client.query(
                'INSERT INTO thiet_bi (khach_hang_id, ten_may, tinh_trang_may) VALUES ($1, $2, $3) RETURNING id',
                [booking.khach_hang_id, 'Thiết bị (Từ lịch hẹn)', booking.mo_ta_loi]
            );
            const deviceId = deviceResult.rows[0].id;
            
            // 2. Tạo mã tra cứu ngẫu nhiên
            const maTraCuu = 'RP-' + Math.floor(100000 + Math.random() * 900000);
            
            // 3. Tạo phiếu sửa chữa
            await client.query(`
                INSERT INTO phieu_sua_chua (thiet_bi_id, ma_tra_cuu, loai_dich_vu, trang_thai)
                VALUES ($1, $2, $3, 'CHỜ_KHÁM')
            `, [deviceId, maTraCuu, booking.loai_dich_vu === 'ONLINE_TUXA' ? 'ONLINE' : 'OFFLINE']);
            
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
        
        return true;
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

const getTicketParts = async (ticketId) => {
    const query = `
        SELECT p.*, l.ten_linh_kien 
        FROM phieu_linh_kien p
        JOIN linh_kien l ON p.linh_kien_id = l.id
        WHERE p.phieu_sua_chua_id = $1
    `;
    const { rows } = await pool.query(query, [ticketId]);
    return rows;
};

const addPartToTicket = async (ticketId, partId, quantity) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Kiểm tra tồn kho và lấy giá bán
        const partResult = await client.query('SELECT gia_ban, so_luong FROM linh_kien WHERE id = $1', [partId]);
        if (partResult.rows.length === 0) throw new Error('Không tìm thấy linh kiện');
        
        const part = partResult.rows[0];
        if (part.so_luong < quantity) throw new Error('Số lượng linh kiện trong kho không đủ');
        
        // Thêm vào phieu_linh_kien
        await client.query(
            'INSERT INTO phieu_linh_kien (phieu_sua_chua_id, linh_kien_id, so_luong, don_gia) VALUES ($1, $2, $3, $4)',
            [ticketId, partId, quantity, part.gia_ban]
        );
        
        // Trừ tồn kho
        await client.query('UPDATE linh_kien SET so_luong = so_luong - $1 WHERE id = $2', [quantity, partId]);
        
        // Cộng dồn vào tong_tien của phieu_sua_chua
        const addAmount = part.gia_ban * quantity;
        await client.query('UPDATE phieu_sua_chua SET tong_tien = tong_tien + $1 WHERE id = $2', [addAmount, ticketId]);
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getParts,
    getTicketParts,
    addPartToTicket,
    submitIntake,
    getAllTickets,
    updateTicketStatus,
    submitBooking,
    getAllBookings,
    updateBookingStatus
};
