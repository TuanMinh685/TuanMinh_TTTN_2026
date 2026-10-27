require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { pool } = require('./src/config/db.config');

// Khởi chạy server test nội bộ trên port ngẫu nhiên
const server = http.createServer(app);

async function runTests() {
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;
    console.log(`\n======================================================`);
    console.log(`BẮT ĐẦU KIỂM THỬ TOÀN DIỆN BACKEND <-> SUPABASE CLOUD`);
    console.log(`Server test đang chạy tại: ${baseUrl}`);
    console.log(`======================================================\n`);

    let passedCount = 0;
    let failedCount = 0;

    async function testCase(name, fn) {
        process.stdout.write(`[*] Kiểm tra: ${name}... `);
        try {
            await fn();
            console.log(`-> [THÀNH CÔNG]`);
            passedCount++;
        } catch (err) {
            console.log(`-> [THẤT BẠI]: ${err.message}`);
            failedCount++;
        }
    }

    let adminToken = '';
    let receptionistToken = '';
    let technicianToken = '';
    let qrSessionToken = '';
    let createdTicketId = null;
    let createdTicketCode = '';

    // 0. Kiểm tra kết nối trực tiếp Supabase PostgreSQL & Múi giờ Asia/Ho_Chi_Minh
    await testCase('Kết nối Supabase Pooler (6543) & Múi giờ Việt Nam (Asia/Ho_Chi_Minh)', async () => {
        const res = await pool.query("SELECT current_database() AS db, current_setting('TIMEZONE') AS tz, NOW()::text AS db_now");
        if (!pool.isCloudConnected()) {
            throw new Error('Chưa kết nối được trực tiếp tới Supabase Cloud (đang ở chế độ Fallback)');
        }
        const row = res.rows[0];
        if (!row.tz.includes('Ho_Chi_Minh') && !row.db_now.endsWith('+07')) {
            throw new Error(`Múi giờ chưa chuẩn Việt Nam: ${row.tz} (${row.db_now})`);
        }
    });

    // 1. Kiểm tra Đăng nhập Admin (ADMIN)
    await testCase('Đăng nhập tài khoản Admin (ADMIN)', async () => {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '123456' })
        });
        const data = await res.json();
        if (!data.success || !data.data?.token) throw new Error(data.message || 'Không lấy được token');
        adminToken = data.data.token;
    });

    // 2. Kiểm tra Đăng nhập Lễ tân (LE_TAN)
    await testCase('Đăng nhập tài khoản Lễ tân (LE_TAN)', async () => {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'letan', password: '123456' })
        });
        const data = await res.json();
        if (!data.success || !data.data?.token) throw new Error(data.message || 'Không lấy được token');
        receptionistToken = data.data.token;
    });

    // 3. Kiểm tra Đăng nhập Kỹ thuật viên (KY_THUAT_VIEN)
    await testCase('Đăng nhập tài khoản Kỹ thuật viên (KY_THUAT_VIEN)', async () => {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'kythuat', password: '123456' })
        });
        const data = await res.json();
        if (!data.success || !data.data?.token) throw new Error(data.message || 'Không lấy được token');
        technicianToken = data.data.token;
    });

    // 4. Kiểm tra Lấy thông tin tài khoản hiện tại (/auth/me)
    await testCase('Xác thực Token & Lấy thông tin cá nhân (/auth/me)', async () => {
        const res = await fetch(`${baseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (!data.success || data.data?.ten_dang_nhap !== 'admin') {
            throw new Error('Thông tin tài khoản không khớp');
        }
    });

    // 5. LUỒNG 1: Lễ tân tạo phiên tiếp nhận mã QR (POST /tickets/init-session)
    await testCase('Lễ tân tạo phiên tiếp nhận mã QR (POST /tickets/init-session)', async () => {
        const res = await fetch(`${baseUrl}/tickets/init-session`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${receptionistToken}` }
        });
        const data = await res.json();
        if (!data.success || !data.data?.sessionToken || !data.data?.qrImageBase64) {
            throw new Error(data.message || 'Không tạo được phiên QR');
        }
        qrSessionToken = data.data.sessionToken;

        // Kiểm tra phiên hợp lệ qua GET /tickets/session/:token
        const checkRes = await fetch(`${baseUrl}/tickets/session/${qrSessionToken}`);
        const checkData = await checkRes.json();
        if (!checkData.success || checkData.data?.status !== 'ACTIVE') {
            throw new Error('Phiên QR mới tạo không ở trạng thái ACTIVE');
        }
    });

    // 6. LUỒNG 2: Khách hàng quét mã gửi thông tin sự cố (POST /tickets/session/:token/submit)
    const testPayload = {
        fullName: 'Trần Minh Quân (Test Supabase)',
        phone: '0909123456',
        deviceName: 'MacBook Pro M2 14 inch 2023',
        serialNumber: 'SN-MAC-M2-9999',
        issueDescription: 'Sạc không vào điện, cổng Type-C chập chờn và máy nóng bất thường',
        serviceType: 'OFFLINE',
        isStudent: true,
        schoolName: 'Đại học Văn Hiến (VHU)',
        studentId: '221A010888'
    };

    await testCase('Khách hàng quét mã QR gửi thông tin sự cố (POST /tickets/session/:token/submit)', async () => {
        const res = await fetch(`${baseUrl}/tickets/session/${qrSessionToken}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });
        const data = await res.json();
        if (!data.success || !data.data?.ticketCode) {
            throw new Error(data.message || 'Lỗi gửi phiếu qua phiên QR');
        }
        createdTicketId = data.data.ticketId;
        createdTicketCode = data.data.ticketCode;

        // Rà soát dữ liệu trả về ngay khi submit
        if (data.data.fullName !== testPayload.fullName ||
            data.data.phone !== testPayload.phone ||
            data.data.deviceName !== testPayload.deviceName ||
            data.data.serialImei !== testPayload.serialNumber ||
            data.data.issueDescription !== testPayload.issueDescription) {
            throw new Error('Dữ liệu trả về từ submit bị lệch hoặc thiếu trường!');
        }
        if (!String(data.data.submittedAt).endsWith('+07:00')) {
            throw new Error(`Múi giờ submittedAt không chuẩn +07:00: ${data.data.submittedAt}`);
        }
    });

    // 7. RÀ SOÁT DỮ LIỆU MẪU TRÊN SUPABASE (Kiểm tra fullName, phone, issueDescription, serialImei, timezone)
    await testCase('Rà soát dữ liệu mẫu ghi mới trên Supabase (Không mất trường, đúng múi giờ +07:00)', async () => {
        const res = await fetch(`${baseUrl}/tickets`, {
            headers: { Authorization: `Bearer ${technicianToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Không lấy được danh sách phiếu');
        const found = data.data.find(t => t.ticketCode === createdTicketCode || t.ma_tra_cuu === createdTicketCode);
        if (!found) throw new Error(`Không tìm thấy phiếu ${createdTicketCode} trên Supabase`);
        if (found.fullName !== testPayload.fullName ||
            found.phone !== testPayload.phone ||
            found.deviceName !== testPayload.deviceName ||
            found.serialImei !== testPayload.serialNumber ||
            found.issueDescription !== testPayload.issueDescription) {
            throw new Error(`Dữ liệu đọc từ Supabase bị mất trường: ${JSON.stringify(found)}`);
        }
        if (!String(found.createdAt).endsWith('+07:00')) {
            throw new Error(`Múi giờ createdAt trên DB không chuẩn +07:00: ${found.createdAt}`);
        }
    });

    // 8. LUỒNG 3: Kỹ thuật viên tra cứu và cập nhật trạng thái thiết bị (PATCH /tickets/:id/status - updateTicketStatus)
    await testCase('Kỹ thuật viên cập nhật trạng thái thiết bị (updateTicketStatus -> ĐANG_CHUẨN_ĐOÁN -> ĐANG_SỬA)', async () => {
        const res1 = await fetch(`${baseUrl}/tickets/${createdTicketId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${technicianToken}`
            },
            body: JSON.stringify({
                trang_thai: 'ĐANG_CHUẨN_ĐOÁN',
                ghi_chu: 'KTV đã tháo máy đo nguồn IC sạc U2800 trên mainboard'
            })
        });
        const data1 = await res1.json();
        if (!data1.success || data1.data?.trang_thai !== 'ĐANG_CHUẨN_ĐOÁN') {
            throw new Error(data1.message || 'Lỗi chuyển trạng thái ĐANG_CHUẨN_ĐOÁN');
        }

        const res2 = await fetch(`${baseUrl}/tickets/${createdTicketCode}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${technicianToken}`
            },
            body: JSON.stringify({
                status: 'ĐANG_SỬA',
                note: 'Đang tiến hành thay IC nguồn Type-C và vệ sinh keo tản nhiệt'
            })
        });
        const data2 = await res2.json();
        if (!data2.success || data2.data?.status !== 'ĐANG_SỬA') {
            throw new Error(data2.message || 'Lỗi chuyển trạng thái ĐANG_SỬA');
        }
    });

    // 9. Kiểm tra Tra cứu phiếu theo Mã tra cứu (/public/track/:ticketCode)
    await testCase(`Khách hàng tra cứu tiến độ & nhật ký theo mã phiếu (${createdTicketCode})`, async () => {
        const res = await fetch(`${baseUrl}/public/track/${createdTicketCode}`);
        const data = await res.json();
        if (!data.success || data.data?.ma_tra_cuu !== createdTicketCode) {
            throw new Error('Không tìm thấy thông tin phiếu');
        }
        if (data.data.trang_thai !== 'ĐANG_SỬA') {
            throw new Error(`Trạng thái tra cứu công khai chưa cập nhật: ${data.data.trang_thai}`);
        }
        if (!Array.isArray(data.data.nhat_ky) || data.data.nhat_ky.length < 3) {
            throw new Error('Nhật ký sửa chữa không lưu đủ các bước chuyển trạng thái');
        }
    });

    // 10. Kiểm tra Tra cứu phiếu theo Số điện thoại (/public/track/phone/:phone)
    await testCase('Khách hàng tra cứu tất cả phiếu bằng Số điện thoại (/public/track/phone/...)', async () => {
        const res = await fetch(`${baseUrl}/public/track/phone/${testPayload.phone}`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
            throw new Error(data.message || 'Lỗi tra cứu SĐT');
        }
    });

    // 11. Kiểm tra Xem đánh giá chất lượng dịch vụ CSKH (/public/reviews)
    await testCase('Khách hàng xem đánh giá chất lượng dịch vụ CSKH (/public/reviews)', async () => {
        const res = await fetch(`${baseUrl}/public/reviews`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) {
            throw new Error('Không lấy được danh sách đánh giá CSKH từ Supabase');
        }
    });

    // 12. Kiểm tra Khách hàng đặt lịch hẹn online (/tickets/booking)
    await testCase('Khách hàng gửi form Đặt lịch hẹn sửa chữa (/tickets/booking)', async () => {
        const res = await fetch(`${baseUrl}/tickets/booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Khách Đặt Lịch Supabase',
                phone: '0988776655',
                ngayHen: '2026-10-22',
                gioHen: '09:30',
                moTaLoi: 'Cần vệ sinh tra keo tản nhiệt và cài lại win',
                loaiDichVu: 'TAI_CUA_HANG'
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Đặt lịch thất bại');
    });

    // 13. Kiểm tra Xem danh sách lịch hẹn đặt trước (/tickets/booking)
    await testCase('Nhân viên xem danh sách lịch hẹn (/tickets/booking)', async () => {
        const res = await fetch(`${baseUrl}/tickets/booking`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
            throw new Error('Không tải được lịch hẹn từ Supabase');
        }
    });

    // 14. Kiểm tra Thống kê & Chỉ số hài lòng CSKH Admin (/admin/dashboard-stats)
    await testCase('Admin tải thống kê tiến độ xử lý & chỉ số hài lòng CSAT (/admin/dashboard-stats)', async () => {
        const res = await fetch(`${baseUrl}/admin/dashboard-stats?period=week`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data?.statusData)) throw new Error('Lỗi tải thống kê CSKH');
    });

    // 15. Kiểm tra Danh sách nhân sự CSKH 4 vai trò (/admin/employees)
    await testCase('Admin xem danh sách nhân sự CSKH 4 vai trò (/admin/employees)', async () => {
        const res = await fetch(`${baseUrl}/admin/employees`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data) || data.data.length < 4) {
            throw new Error('Lỗi tải nhân sự CSKH trên Supabase');
        }
    });

    console.log(`\n======================================================`);
    console.log(`KẾT QUẢ KIỂM THỬ SUPABASE: ${passedCount} THÀNH CÔNG, ${failedCount} THẤT BẠI`);
    console.log(`======================================================\n`);

    server.close();
    await pool.end();
    process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Lỗi ngoài dự kiến:', err);
    server.close();
    process.exit(1);
});
