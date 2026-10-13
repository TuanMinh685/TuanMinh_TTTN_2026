require('dotenv').config();
const http = require('http');
const app = require('./src/app');

// Khởi chạy server test nội bộ trên port ngẫu nhiên
const server = http.createServer(app);

async function runTests() {
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;
    console.log(`\n======================================================`);
    console.log(`BẮT ĐẦU KIỂM THỬ TẤT CẢ CÁC TÍNH NĂNG CỦA HỆ THỐNG`);
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
    let sampleTicketCode = '';

    // 1. Kiểm tra Đăng nhập Admin (QUAN_LY)
    await testCase('Đăng nhập tài khoản Admin (QUAN_LY)', async () => {
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

    // 5. Kiểm tra Xem danh mục linh kiện & bảng giá công khai (/public/pricing)
    await testCase('Khách hàng xem bảng giá linh kiện công khai (/public/pricing)', async () => {
        const res = await fetch(`${baseUrl}/public/pricing`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Không lấy được bảng giá');
    });

    // 6. Kiểm tra Danh sách phiếu sửa chữa (Lễ tân/Admin) (/tickets)
    await testCase('Lễ tân/Kỹ thuật viên tải danh sách phiếu (/tickets)', async () => {
        const res = await fetch(`${baseUrl}/tickets`, {
            headers: { Authorization: `Bearer ${receptionistToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Lỗi lấy danh sách phiếu');
        if (data.data.length > 0) {
            sampleTicketCode = data.data[0].ma_phieu || data.data[0].ma_tra_cuu;
        }
    });

    // 7. Kiểm tra Tra cứu phiếu theo Mã tra cứu (/public/track/:ticketCode)
    await testCase(`Khách tra cứu tiến độ theo mã phiếu (${sampleTicketCode || 'Mẫu'})`, async () => {
        if (!sampleTicketCode) throw new Error('Không có mã phiếu mẫu để test');
        const res = await fetch(`${baseUrl}/public/track/${sampleTicketCode}`);
        const data = await res.json();
        if (!data.success || !data.data?.ma_tra_cuu) throw new Error('Không tìm thấy thông tin phiếu');
    });

    // 8. Kiểm tra Khách hàng đặt lịch hẹn online (/tickets/booking)
    await testCase('Khách hàng gửi form Đặt lịch hẹn sửa chữa (/tickets/booking)', async () => {
        const res = await fetch(`${baseUrl}/tickets/booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Khách Test Tự Động',
                phone: '0988776655',
                ngayHen: '2026-10-20',
                gioHen: '09:30',
                moTaLoi: 'Cần vệ sinh tra keo tản nhiệt và cài lại win',
                loaiDichVu: 'TAI_CUA_HANG'
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Đặt lịch thất bại');
    });

    // 9. Kiểm tra Xem danh sách lịch hẹn đặt trước (/tickets/booking)
    await testCase('Nhân viên xem danh sách lịch hẹn (/tickets/booking)', async () => {
        const res = await fetch(`${baseUrl}/tickets/booking`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Không tải được lịch hẹn');
    });

    // 10. Kiểm tra Khách hàng tiếp nhận báo hỏng qua QR (QR Intake) (/tickets/intake)
    await testCase('Khách quét QR gửi phiếu tiếp nhận máy (/tickets/intake)', async () => {
        const res = await fetch(`${baseUrl}/tickets/intake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Nguyễn Văn Test QR',
                phone: '0912345678',
                deviceName: 'Laptop Dell Inspiron 15',
                serialNumber: 'SN-TEST-888',
                issueDescription: 'Máy không lên nguồn, quạt kêu to',
                serviceType: 'OFFLINE'
            })
        });
        const data = await res.json();
        if (!data.success || !data.data?.ticketCode) throw new Error(data.message || 'Lỗi tạo phiếu QR');
    });

    // 11. Kiểm tra Tra cứu phiếu theo Số điện thoại (/public/track/phone/:phone)
    await testCase('Khách hàng tra cứu tất cả phiếu bằng Số điện thoại (/public/track/phone/...)', async () => {
        const res = await fetch(`${baseUrl}/public/track/phone/0912345678`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error(data.message || 'Lỗi tra cứu SĐT');
    });

    // 12. Kiểm tra Quản lý kho linh kiện (/tickets/parts)
    await testCase('Kỹ thuật viên / Quản lý kiểm tra tồn kho linh kiện (/tickets/parts)', async () => {
        const res = await fetch(`${baseUrl}/tickets/parts`, {
            headers: { Authorization: `Bearer ${technicianToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Lỗi lấy tồn kho');
    });

    // 13. Kiểm tra Thống kê & Báo cáo doanh thu Admin (/admin/dashboard-stats)
    await testCase('Admin tải biểu đồ doanh thu và phân bố trạng thái (/admin/dashboard-stats)', async () => {
        const res = await fetch(`${baseUrl}/admin/dashboard-stats?period=week`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (!data.success || !data.data?.revenueData) throw new Error('Lỗi tải thống kê doanh thu');
    });

    // 14. Kiểm tra Danh sách nhân viên (/admin/employees)
    await testCase('Admin xem danh sách nhân sự (/admin/employees)', async () => {
        const res = await fetch(`${baseUrl}/admin/employees`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) throw new Error('Lỗi tải nhân sự');
    });

    console.log(`\n======================================================`);
    console.log(`KẾT QUẢ KIỂM THỬ: ${passedCount} THÀNH CÔNG, ${failedCount} THẤT BẠI`);
    console.log(`======================================================\n`);

    server.close();
    process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Lỗi ngoài dự kiến:', err);
    server.close();
    process.exit(1);
});
