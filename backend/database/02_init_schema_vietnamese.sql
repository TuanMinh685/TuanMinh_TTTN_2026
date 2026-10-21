-- ====================================================================
-- SCHEMA CƠ SỞ DỮ LIỆU CHUẨN TIẾNG VIỆT (POSTGRESQL / SUPABASE)
-- DỰ ÁN: HỆ THỐNG CSKH SỬA CHỮA MÁY TÍNH BẰNG QR CODE
-- ====================================================================

SET TIME ZONE 'Asia/Ho_Chi_Minh';

-- 1. Bảng Nhân viên & Phân quyền nội bộ (6 cấp bậc từ trên xuống)
CREATE TABLE IF NOT EXISTS nhan_vien (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(50) NOT NULL, -- 'GIAM_DOC', 'ADMIN', 'QUAN_LY', 'KE_TOAN', 'THU_KHO', 'KY_THUAT_VIEN', 'LE_TAN'
    mat_khau VARCHAR(255) NOT NULL,
    trang_thai VARCHAR(20) DEFAULT 'HOAT_DONG',
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Khách hàng
CREATE TABLE IF NOT EXISTS khach_hang (
    id SERIAL PRIMARY KEY,
    so_dien_thoai VARCHAR(20) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    zalo_id VARCHAR(100),
    la_sinh_vien BOOLEAN DEFAULT FALSE,
    truong_hoc VARCHAR(150),
    ma_sinh_vien VARCHAR(50),
    diem_thuong INT DEFAULT 0,
    diem_tich_luy INT DEFAULT 0,
    hang_thanh_vien VARCHAR(50) DEFAULT 'DONG',
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Thiết bị
CREATE TABLE IF NOT EXISTS thiet_bi (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    ten_may VARCHAR(150) NOT NULL,
    so_imei_serial VARCHAR(100),
    tinh_trang_may TEXT,
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Phiếu sửa chữa
CREATE TABLE IF NOT EXISTS phieu_sua_chua (
    id SERIAL PRIMARY KEY,
    thiet_bi_id INT REFERENCES thiet_bi(id) ON DELETE CASCADE,
    ma_tra_cuu VARCHAR(50) UNIQUE NOT NULL,
    loai_dich_vu VARCHAR(50) DEFAULT 'OFFLINE',
    ma_ultraviewer VARCHAR(100),
    trang_thai VARCHAR(50) DEFAULT 'CHỜ_KHÁM',
    tong_tien NUMERIC DEFAULT 0,
    han_bao_hanh TIMESTAMPTZ,
    la_sinh_vien BOOLEAN DEFAULT FALSE,
    truong_hoc VARCHAR(150),
    ma_sinh_vien VARCHAR(50),
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Phiên tiếp nhận QR động (init-session -> submit)
CREATE TABLE IF NOT EXISTS ticket_sessions (
    id SERIAL PRIMARY KEY,
    session_token UUID UNIQUE NOT NULL,
    ticket_id INT REFERENCES phieu_sua_chua(id) ON DELETE SET NULL,
    qr_image_base64 TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ
);

-- 6. Bảng Nhật ký sửa chữa
CREATE TABLE IF NOT EXISTS nhat_ky_sua_chua (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    nhan_vien_id INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    trang_thai_cu VARCHAR(50),
    trang_thai_moi VARCHAR(50) NOT NULL,
    ghi_chu TEXT,
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Lịch hẹn
CREATE TABLE IF NOT EXISTS lich_hen (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    ngay_hen VARCHAR(20),
    gio_hen VARCHAR(20),
    mo_ta_loi TEXT,
    thoi_gian_hen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    loai_dich_vu VARCHAR(50) DEFAULT 'TAI_CUA_HANG',
    trang_thai VARCHAR(50) DEFAULT 'CHO_XAC_NHAN',
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Kho linh kiện
CREATE TABLE IF NOT EXISTS linh_kien (
    id SERIAL PRIMARY KEY,
    ten_linh_kien VARCHAR(150) NOT NULL,
    so_luong INT DEFAULT 0 NOT NULL,
    gia_ban NUMERIC NOT NULL,
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bảng Linh kiện gắn vào Phiếu sửa chữa
CREATE TABLE IF NOT EXISTS phieu_linh_kien (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    linh_kien_id INT REFERENCES linh_kien(id) ON DELETE RESTRICT,
    so_luong INT DEFAULT 1 NOT NULL,
    don_gia NUMERIC NOT NULL,
    so_serial VARCHAR(100),
    ngay_them TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bảng Hình ảnh đính kèm phiếu sửa chữa
CREATE TABLE IF NOT EXISTS hinh_anh_phieu (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    duong_dan_anh TEXT NOT NULL,
    loai_anh VARCHAR(50),
    ghi_chu TEXT,
    ngay_tao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Bảng Đánh giá dịch vụ từ khách hàng
CREATE TABLE IF NOT EXISTS danh_gia (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    so_sao INT NOT NULL CHECK (so_sao >= 1 AND so_sao <= 5),
    nhan_xet TEXT,
    ngay_danh_gia TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
