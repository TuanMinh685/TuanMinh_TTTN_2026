-- =========================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU TIẾNG VIỆT (POSTGRESQL)
-- Dự án: Hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng - MYH Group (HungHau IT Support)
-- =========================================================================

-- 1. BẢNG KHÁCH HÀNG
CREATE TABLE IF NOT EXISTS khach_hang (
    id SERIAL PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) UNIQUE NOT NULL,
    zalo_id VARCHAR(50),
    la_sinh_vien BOOLEAN DEFAULT FALSE, -- Có phải Học sinh - Sinh viên không (Giảm 15%)
    truong_hoc VARCHAR(150),            -- Tên trường học (Đại học, Cao đẳng, THPT toàn quốc)
    ma_sinh_vien VARCHAR(50),           -- Mã số sinh viên / học sinh (MSSV)
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG NHÂN VIÊN (Giám đốc, Quản lý, Kế toán, Thủ kho, KTV, Lễ tân)
CREATE TABLE IF NOT EXISTS nhan_vien (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(30) DEFAULT 'KY_THUAT_VIEN', -- ADMIN, GIAM_DOC, QUAN_LY, KE_TOAN, THU_KHO, KY_THUAT_VIEN, LE_TAN
    trang_thai VARCHAR(20) DEFAULT 'HOAT_DONG',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG THIẾT BỊ CỦA KHÁCH
CREATE TABLE IF NOT EXISTS thiet_bi (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    ten_may VARCHAR(100) NOT NULL,
    so_imei_serial VARCHAR(50),
    tinh_trang_may TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG KHO LINH KIỆN & BẢNG GIÁ VẬT TƯ
CREATE TABLE IF NOT EXISTS linh_kien (
    id SERIAL PRIMARY KEY,
    ten_linh_kien VARCHAR(150) NOT NULL,
    gia_ban DECIMAL(12, 2) NOT NULL DEFAULT 0,
    so_luong INT NOT NULL DEFAULT 0,
    hinh_anh TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG PHIẾU SỬA CHỮA & CHĂM SÓC KHÁCH HÀNG (HỒ SƠ MÃ QR)
CREATE TABLE IF NOT EXISTS phieu_sua_chua (
    id SERIAL PRIMARY KEY,
    thiet_bi_id INT REFERENCES thiet_bi(id) ON DELETE CASCADE,
    ma_tra_cuu VARCHAR(50) UNIQUE NOT NULL, -- Mã định danh QR: VD RP-839400
    loai_dich_vu VARCHAR(30) DEFAULT 'OFFLINE',
    trang_thai VARCHAR(50) DEFAULT 'CHỜ_KHÁM',
    la_sinh_vien BOOLEAN DEFAULT FALSE, -- Có áp dụng trợ giá Học sinh - Sinh viên toàn quốc (-15%)
    truong_hoc VARCHAR(150),
    ma_sinh_vien VARCHAR(50),
    han_bao_hanh TIMESTAMP, -- Hạn bảo hành điện tử (e-Warranty)
    tong_tien DECIMAL(12, 2) DEFAULT 0,
    phuong_thuc_thanh_toan VARCHAR(50), -- TIEN_MAT, CHUYEN_KHOAN_VIETQR, THE_POS
    ngay_thanh_toan TIMESTAMP,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5b. BẢNG HÌNH ẢNH NGOẠI QUAN LÚC NHẬN MÁY (Chống khiếu nại trầy xước / tráo linh kiện)
CREATE TABLE IF NOT EXISTS hinh_anh_phieu (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    duong_dan_anh TEXT NOT NULL, -- Base64 hoặc URL ảnh ngoại quan
    loai_anh VARCHAR(50) DEFAULT 'NGOAI_QUAN', -- NGOAI_QUAN, TEM_NIEM_PHONG, SAU_SUA_CHUA
    ghi_chu VARCHAR(255),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BẢNG CHI TIẾT LINH KIỆN ĐÃ DÙNG TRONG PHIẾU (Serial Tracking)
CREATE TABLE IF NOT EXISTS phieu_linh_kien (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    linh_kien_id INT REFERENCES linh_kien(id) ON DELETE RESTRICT,
    so_luong INT NOT NULL DEFAULT 1,
    don_gia DECIMAL(12, 2) NOT NULL,
    so_serial VARCHAR(100), -- Mã Serial / Barcode của linh kiện thay thế
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG LỊCH SỬ / NHẬT KÝ TIẾN ĐỘ XỬ LÝ REALTIME
CREATE TABLE IF NOT EXISTS nhat_ky_sua_chua (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    nhan_vien_id INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    trang_thai_cu VARCHAR(50),
    trang_thai_moi VARCHAR(50) NOT NULL,
    ghi_chu TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG ĐẶT LỊCH HẸN TRƯỚC QUA WEB QR
CREATE TABLE IF NOT EXISTS lich_hen (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    ngay_hen DATE NOT NULL,
    gio_hen VARCHAR(20) NOT NULL,
    mo_ta_loi TEXT,
    loai_dich_vu VARCHAR(30) DEFAULT 'TAI_CUA_HANG',
    trang_thai VARCHAR(30) DEFAULT 'CHO_XAC_NHAN', -- CHO_XAC_NHAN, DA_XAC_NHAN, KHACH_DA_DEN, HUY
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. BẢNG ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ CSKH (Reviews)
CREATE TABLE IF NOT EXISTS danh_gia (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT UNIQUE REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    so_sao INT CHECK (so_sao >= 1 AND so_sao <= 5),
    nhan_xet TEXT,
    ngay_danh_gia TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ĐÁNH INDEX TỐI ƯU TỐC ĐỘ TRA CỨU MÃ QR & SỐ ĐIỆN THOẠI
CREATE INDEX IF NOT EXISTS idx_phieu_ma_tra_cuu ON phieu_sua_chua(ma_tra_cuu);
CREATE INDEX IF NOT EXISTS idx_khach_hang_sdt ON khach_hang(so_dien_thoai);
