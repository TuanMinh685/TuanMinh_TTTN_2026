-- =========================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU TIẾNG VIỆT (POSTGRESQL / SUPABASE)
-- Đề tài: Xây dựng Hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng
-- Đơn vị: Công ty Cổ phần Lục Giác (Cơ sở 615 Âu Cơ, Tân Phú, TP.HCM)
-- Sinh viên thực hiện: Lê Trần Tuấn Minh (MSSV: 221A010993)
-- GVHD: ThS. Quách Anh Dũng
-- =========================================================================

-- 1. BẢNG KHÁCH HÀNG (Lưu thông tin khách hàng liên hệ)
CREATE TABLE IF NOT EXISTS khach_hang (
    id SERIAL PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) UNIQUE NOT NULL,
    zalo_id VARCHAR(50),
    email VARCHAR(100),
    dia_chi VARCHAR(255),
    diem_thuong INT DEFAULT 0,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG NHÂN VIÊN BỘ PHẬN CHĂM SÓC KHÁCH HÀNG (CSKH) & KỸ THUẬT
-- 4 Vai trò RBAC chuẩn: ADMIN (Quản trị hệ thống), QUAN_LY (Trưởng BP CSKH), LE_TAN (Lễ tân tiếp nhận QR), KY_THUAT_VIEN (Chuyên viên hỗ trợ kỹ thuật)
CREATE TABLE IF NOT EXISTS nhan_vien (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(30) DEFAULT 'KY_THUAT_VIEN',
    trang_thai VARCHAR(20) DEFAULT 'HOAT_DONG',
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG THIẾT BỊ MÁY TÍNH / PHẦN MỀM TIẾP NHẬN
CREATE TABLE IF NOT EXISTS thiet_bi (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    ten_may VARCHAR(150) NOT NULL,              -- Tên sản phẩm / dòng máy (VD: Dell XPS 13, MacBook Pro)
    so_imei_serial VARCHAR(50),                 -- Số Serial Number / Service Tag thân máy
    tinh_trang_may TEXT,                        -- Hiện trạng lỗi tiếp nhận ban đầu
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG HỒ SƠ PHIẾU CHĂM SÓC KHÁCH HÀNG QUA MÃ QR (BẢNG TRUNG TÂM)
-- Trạng thái: CHỜ_KHÁM, ĐANG_CHUẨN_ĐOÁN, ĐANG_SỬA, HOÀN_TẤT, SẴN_SÀNG_TRẢ_MÁY, ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN, YÊU_CẦU_BẢO_HÀNH
CREATE TABLE IF NOT EXISTS phieu_sua_chua (
    id SERIAL PRIMARY KEY,
    thiet_bi_id INT REFERENCES thiet_bi(id) ON DELETE CASCADE,
    ma_tra_cuu VARCHAR(50) UNIQUE NOT NULL,     -- Khóa định danh mã QR: VD RP-839400
    loai_dich_vu VARCHAR(30) DEFAULT 'OFFLINE',  -- OFFLINE (tại quầy) | ONLINE (đặt lịch từ xa)
    trang_thai VARCHAR(50) DEFAULT 'CHỜ_KHÁM',
    han_bao_hanh TIMESTAMP WITH TIME ZONE,      -- Sổ bảo hành điện tử e-Warranty 180 ngày
    tong_tien NUMERIC(12,2) DEFAULT 0,          -- Tổng chi phí sửa chữa / linh kiện
    giam_gia_sinh_vien NUMERIC(12,2) DEFAULT 0, -- Ưu đãi sinh viên (-15%)
    tien_sau_giam NUMERIC(12,2) DEFAULT 0,      -- Số tiền thực thu sau chiết khấu
    trang_thai_thanh_toan VARCHAR(30) DEFAULT 'CHUA_THANH_TOAN', -- CHUA_THANH_TOAN | DA_THANH_TOAN
    phuong_thuc_thanh_toan VARCHAR(30) DEFAULT 'VIETQR',        -- VIETQR | TIEN_MAT | CHUYEN_KHOAN
    ma_giao_dich VARCHAR(50),                   -- Mã giao dịch đối soát VietQR
    ngay_thanh_toan TIMESTAMP WITH TIME ZONE,
    chi_nhanh VARCHAR(150) DEFAULT 'Công ty Cổ phần Lục Giác - 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM',
    hinh_anh_ngoai_quan JSONB DEFAULT '[]'::jsonb, -- Mảng 4 góc ảnh ngoại quan (Mặt A, Mặt B, Cổng IO, Phím/Màn hình)
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG PHIÊN KHỞI TẠO MÃ QR ĐỘNG TẠI QUẦY (KIOSK QR SESSION)
CREATE TABLE IF NOT EXISTS ticket_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    qr_image_base64 TEXT,
    ticket_id INT REFERENCES phieu_sua_chua(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',       -- ACTIVE, SUBMITTED, EXPIRED
    created_by INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. BẢNG HÌNH ẢNH NGOẠI QUAN / BIÊN BẢN CHỤP LÚC TIẾP NHẬN
CREATE TABLE IF NOT EXISTS hinh_anh_phieu (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    duong_dan_anh TEXT NOT NULL,               -- URL hoặc Base64 ảnh ngoại quan
    loai_anh VARCHAR(50) DEFAULT 'NGOAI_QUAN',
    ghi_chu VARCHAR(255),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG NHẬT KÝ TIẾN ĐỘ XỬ LÝ HỒ SƠ CSKH THỜI GIAN THỰC (SMART POLLING AUDIT)
CREATE TABLE IF NOT EXISTS nhat_ky_sua_chua (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    nhan_vien_id INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    trang_thai_cu VARCHAR(50),
    trang_thai_moi VARCHAR(50) NOT NULL,
    ghi_chu TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG ĐẶT LỊCH HẸN CSKH TRỰC TUYẾN QUA WEB QR
CREATE TABLE IF NOT EXISTS lich_hen (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    thoi_gian_hen TIMESTAMP WITH TIME ZONE,
    loai_dich_vu VARCHAR(30) DEFAULT 'TAI_CUA_HANG',
    trang_thai VARCHAR(30) DEFAULT 'CHO_XAC_NHAN', -- CHO_XAC_NHAN, DA_XAC_NHAN, KHACH_DA_DEN, HUY
    ngay_hen VARCHAR(20) NOT NULL,
    gio_hen VARCHAR(20) NOT NULL,
    mo_ta_loi TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. BẢNG ĐÁNH GIÁ MỨC ĐỘ HÀI LÒNG KHÁCH HÀNG (1 - 5 SAO & CSAT)
CREATE TABLE IF NOT EXISTS danh_gia (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT UNIQUE REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    so_sao INT CHECK (so_sao >= 1 AND so_sao <= 5),
    nhan_xet TEXT,
    ngay_danh_gia TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. BẢNG YÊU CẦU BẢO HÀNH LẠI TRỰC TUYẾN (E-WARRANTY CLAIM)
CREATE TABLE IF NOT EXISTS yeu_cau_bao_hanh (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    ma_tra_cuu VARCHAR(50),
    ly_do TEXT NOT NULL,
    so_dien_thoai_lien_he VARCHAR(20),
    trang_thai VARCHAR(30) DEFAULT 'CHO_TIEP_NHAN', -- CHO_TIEP_NHAN, DANG_XU_LY, DA_XU_LY
    ngay_yeu_cau TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ngay_giai_quyet TIMESTAMP WITH TIME ZONE
);

-- 11. BẢNG DANH MỤC LINH KIỆN THAY THẾ CHÍNH HÃNG
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

-- 12. BẢNG CHI TIẾT LINH KIỆN GẮN THEO PHIẾU KÈM SỐ SERIAL (S/N)
CREATE TABLE IF NOT EXISTS chi_tiet_linh_kien_phieu (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    linh_kien_id INT REFERENCES linh_kien(id) ON DELETE SET NULL,
    ten_linh_kien VARCHAR(150) NOT NULL,
    so_serial VARCHAR(100),                     -- Số Serial linh kiện chính hãng để đối soát e-Warranty
    don_gia NUMERIC(12,2) NOT NULL DEFAULT 0,
    so_luong INT DEFAULT 1,
    thanh_tien NUMERIC(12,2) NOT NULL DEFAULT 0,
    ngay_gan TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TẠO INDEXES TỐI ƯU HÓA TRA CỨU QR VÀ BÁO CÁO
CREATE INDEX IF NOT EXISTS idx_phieu_ma_tra_cuu ON phieu_sua_chua(ma_tra_cuu);
CREATE INDEX IF NOT EXISTS idx_khach_hang_sdt ON khach_hang(so_dien_thoai);
CREATE INDEX IF NOT EXISTS idx_phieu_trang_thai ON phieu_sua_chua(trang_thai);
CREATE INDEX IF NOT EXISTS idx_phieu_han_bh ON phieu_sua_chua(han_bao_hanh);
CREATE INDEX IF NOT EXISTS idx_linh_kien_ma ON linh_kien(ma_linh_kien);
CREATE INDEX IF NOT EXISTS idx_ct_phieu_id ON chi_tiet_linh_kien_phieu(phieu_sua_chua_id);
CREATE INDEX IF NOT EXISTS idx_yeu_cau_bh_ma ON yeu_cau_bao_hanh(ma_tra_cuu);
