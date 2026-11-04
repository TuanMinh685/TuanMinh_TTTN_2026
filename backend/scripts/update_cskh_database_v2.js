const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

async function updateDatabaseSchema() {
    const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
    console.log('🔄 Đang kết nối Supabase Cloud để cập nhật Database theo giao diện chức năng mới nhất...');
    console.log('Target host:', connStr.split('@')[1]);

    const pool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Cập nhật bảng phieu_sua_chua
        console.log('📦 1. Cập nhật các cột tài chính, VietQR, chi nhánh & mảng ảnh ngoại quan cho phieu_sua_chua...');
        await pool.query(`
            ALTER TABLE phieu_sua_chua
            ADD COLUMN IF NOT EXISTS tong_tien NUMERIC(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS giam_gia_sinh_vien NUMERIC(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS tien_sau_giam NUMERIC(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS trang_thai_thanh_toan VARCHAR(30) DEFAULT 'CHUA_THANH_TOAN',
            ADD COLUMN IF NOT EXISTS phuong_thuc_thanh_toan VARCHAR(30) DEFAULT 'VIETQR',
            ADD COLUMN IF NOT EXISTS ma_giao_dich VARCHAR(50),
            ADD COLUMN IF NOT EXISTS ngay_thanh_toan TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS chi_nhanh VARCHAR(150) DEFAULT '615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM',
            ADD COLUMN IF NOT EXISTS hinh_anh_ngoai_quan JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Bảng phieu_sua_chua đã được bổ sung đầy đủ cột!');

        // 2. Cập nhật bảng khach_hang
        console.log('📦 2. Cập nhật bảng khach_hang...');
        await pool.query(`
            ALTER TABLE khach_hang
            ADD COLUMN IF NOT EXISTS zalo_id VARCHAR(50),
            ADD COLUMN IF NOT EXISTS email VARCHAR(100),
            ADD COLUMN IF NOT EXISTS dia_chi VARCHAR(255);
        `);
        console.log('✅ Bảng khach_hang đã được cập nhật!');

        // 3. Tạo bảng linh_kien
        console.log('📦 3. Khởi tạo bảng linh_kien...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS linh_kien (
                id SERIAL PRIMARY KEY,
                ma_linh_kien VARCHAR(50) UNIQUE NOT NULL,
                ten_linh_kien VARCHAR(150) NOT NULL,
                loai_linh_kien VARCHAR(50) DEFAULT 'PHU_KIEN',
                don_gia NUMERIC(12,2) NOT NULL DEFAULT 0,
                thoi_gian_bao_hanh_thang INT DEFAULT 12,
                so_luong_ton INT DEFAULT 10,
                trang_thai VARCHAR(20) DEFAULT 'CON_HANG',
                ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Bảng linh_kien đã sẵn sàng!');

        // 4. Tạo bảng chi_tiet_linh_kien_phieu
        console.log('📦 4. Khởi tạo bảng chi_tiet_linh_kien_phieu (quản lý linh kiện và số Serial S/N)...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chi_tiet_linh_kien_phieu (
                id SERIAL PRIMARY KEY,
                phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
                linh_kien_id INT REFERENCES linh_kien(id) ON DELETE SET NULL,
                ten_linh_kien VARCHAR(150) NOT NULL,
                so_serial VARCHAR(100),
                don_gia NUMERIC(12,2) NOT NULL DEFAULT 0,
                so_luong INT DEFAULT 1,
                thanh_tien NUMERIC(12,2) NOT NULL DEFAULT 0,
                ngay_gan TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Bảng chi_tiet_linh_kien_phieu đã sẵn sàng!');

        // 5. Tạo bảng yeu_cau_bao_hanh (e-Warranty Claim)
        console.log('📦 5. Khởi tạo bảng yeu_cau_bao_hanh (tiếp nhận yêu cầu bảo hành lại qua mã QR)...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS yeu_cau_bao_hanh (
                id SERIAL PRIMARY KEY,
                phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
                ma_tra_cuu VARCHAR(50),
                ly_do TEXT NOT NULL,
                so_dien_thoai_lien_he VARCHAR(20),
                trang_thai VARCHAR(30) DEFAULT 'CHO_TIEP_NHAN',
                ngay_yeu_cau TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ngay_giai_quyet TIMESTAMP WITH TIME ZONE
            );
        `);
        console.log('✅ Bảng yeu_cau_bao_hanh đã sẵn sàng!');

        // 6. Nạp dữ liệu danh mục linh kiện mẫu
        console.log('📦 6. Nạp dữ liệu danh mục linh kiện chính hãng chuẩn doanh nghiệp...');
        await pool.query(`
            INSERT INTO linh_kien (ma_linh_kien, ten_linh_kien, loai_linh_kien, don_gia, thoi_gian_bao_hanh_thang, so_luong_ton)
            VALUES 
                ('LK-SSD-01', 'SSD Samsung 980 NVMe M.2 500GB', 'O_CUNG', 1250000, 36, 15),
                ('LK-RAM-01', 'RAM Kingston Fury Beast DDR4 16GB 3200MHz', 'RAM', 850000, 36, 20),
                ('LK-PIN-01', 'Pin Laptop Dell XPS 56Wh Type-C', 'PIN', 950000, 12, 8),
                ('LK-KB-01', 'Bàn phím cơ & Touchpad thay thế OEM', 'BAN_PHIM', 650000, 12, 10),
                ('LK-VS-01', 'Keo tản nhiệt Thermal Grizzly & Gói Vệ sinh máy 5S', 'DICH_VU', 150000, 6, 99)
            ON CONFLICT (ma_linh_kien) DO UPDATE 
            SET ten_linh_kien = EXCLUDED.ten_linh_kien, don_gia = EXCLUDED.don_gia;
        `);
        console.log('✅ Đã nạp danh mục linh kiện mẫu!');

        // 7. Cập nhật hồ sơ phiếu mẫu RP-839400 khớp 100% với báo cáo tốt nghiệp & ảnh minh họa
        console.log('📦 7. Chuẩn hóa hồ sơ phiếu mẫu RP-839400 (Dell XPS 13, VietQR, SSD Samsung S/N, e-Warranty 180 ngày)...');
        
        // 4 ảnh ngoại quan mẫu
        const samplePhotos = JSON.stringify([
            { label: '1. Mặt trên (A)', url: '/hinh_anh_bao_cao_moi/08_Dashboard_Modal_Quan_Ly_Anh_Ngoai_Quan.png' },
            { label: '2. Mặt đáy (B)', url: '/hinh_anh_bao_cao_moi/05_Tracking_Modal_Phong_To_Anh_Ngoai_Quan.png' },
            { label: '3. Khe tản nhiệt / Cổng IO', url: '/hinh_anh_bao_cao_moi/02_Form_Tiep_Nhan_May_Tinh_Phan_Mem_Anh_Ngoai_Quan.png' },
            { label: '4. Màn hình & Phím', url: '/hinh_anh_bao_cao_moi/04_Tracking_Ho_So_QR_Tien_Do_eWarranty.png' }
        ]);

        await pool.query(`
            UPDATE phieu_sua_chua
            SET 
                trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN',
                han_bao_hanh = CURRENT_TIMESTAMP + INTERVAL '180 days',
                tong_tien = 1250000,
                giam_gia_sinh_vien = 0,
                tien_sau_giam = 1250000,
                trang_thai_thanh_toan = 'DA_THANH_TOAN',
                phuong_thuc_thanh_toan = 'VIETQR',
                ma_giao_dich = 'VQR839400X',
                ngay_thanh_toan = CURRENT_TIMESTAMP - INTERVAL '1 day',
                chi_nhanh = 'Công ty Cổ phần Lục Giác - 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM',
                hinh_anh_ngoai_quan = $1::jsonb
            WHERE ma_tra_cuu = 'RP-839400';
        `, [samplePhotos]);

        // Gắn linh kiện SSD Samsung 980 vào phiếu RP-839400
        const ticketRes = await pool.query("SELECT id FROM phieu_sua_chua WHERE ma_tra_cuu = 'RP-839400'");
        if (ticketRes.rows.length > 0) {
            const ticketId = ticketRes.rows[0].id;

            // Xóa linh kiện cũ của phiếu nếu có
            await pool.query('DELETE FROM chi_tiet_linh_kien_phieu WHERE phieu_sua_chua_id = $1', [ticketId]);

            // Thêm linh kiện mới với Serial S/N
            await pool.query(`
                INSERT INTO chi_tiet_linh_kien_phieu (phieu_sua_chua_id, ten_linh_kien, so_serial, don_gia, so_luong, thanh_tien)
                VALUES ($1, 'SSD Samsung 980 NVMe M.2 500GB', 'S64BNX0T123456', 1250000, 1, 1250000);
            `, [ticketId]);

            // Cập nhật hoặc thêm đánh giá 5 sao
            await pool.query('DELETE FROM danh_gia WHERE phieu_sua_chua_id = $1', [ticketId]);
            await pool.query(`
                INSERT INTO danh_gia (phieu_sua_chua_id, so_sao, nhan_xet, ngay_danh_gia)
                VALUES ($1, 5, 'Dịch vụ tại Công ty Cổ phần Lục Giác rất nhanh và uy tín, quét mã QR tra cứu tiến độ và thanh toán VietQR cực kỳ tiện lợi!', CURRENT_TIMESTAMP);
            `, [ticketId]);
        }

        console.log('✅ Hoàn tất chuẩn hóa hồ sơ mẫu RP-839400!');

        // 8. Tạo Indexes tối ưu hiệu năng tra cứu
        console.log('📦 8. Tạo các Indexes tối ưu hóa tốc độ tìm kiếm...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_phieu_trang_thai ON phieu_sua_chua(trang_thai);
            CREATE INDEX IF NOT EXISTS idx_phieu_han_bh ON phieu_sua_chua(han_bao_hanh);
            CREATE INDEX IF NOT EXISTS idx_linh_kien_ma ON linh_kien(ma_linh_kien);
            CREATE INDEX IF NOT EXISTS idx_ct_phieu_id ON chi_tiet_linh_kien_phieu(phieu_sua_chua_id);
            CREATE INDEX IF NOT EXISTS idx_yeu_cau_bh_ma ON yeu_cau_bao_hanh(ma_tra_cuu);
        `);
        console.log('✅ Đã tạo các Indexes tối ưu tốc độ!');

        console.log('\n🎉🎉🎉 CHÚC MỪNG: CƠ SỞ DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ 100% THEO GIAO DIỆN CHỨC NĂNG MỚI NHẤT!');
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật cơ sở dữ liệu:', err);
        process.exit(1);
    }
}

updateDatabaseSchema();
