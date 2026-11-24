-- Khởi tạo schema cơ sở dữ liệu PostgreSQL cho hệ thống CSKH qua mã QR

-- Bảng khách hàng
CREATE TABLE IF NOT EXISTS khach_hang (
    id SERIAL PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) UNIQUE NOT NULL,
    zalo_id VARCHAR(50),
    email VARCHAR(100),
    dia_chi VARCHAR(255),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng nhân viên và phân quyền (ADMIN, QUAN_LY, LE_TAN, KY_THUAT_VIEN)
CREATE TABLE IF NOT EXISTS nhan_vien (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(30) DEFAULT 'KY_THUAT_VIEN',
    trang_thai VARCHAR(20) DEFAULT 'HOAT_DONG',
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng thiết bị tiếp nhận
CREATE TABLE IF NOT EXISTS thiet_bi (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    ten_may VARCHAR(150) NOT NULL,
    so_imei_serial VARCHAR(50),
    tinh_trang_may TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng hồ sơ phiếu tiếp nhận & bảo hành QR
CREATE TABLE IF NOT EXISTS phieu_sua_chua (
    id SERIAL PRIMARY KEY,
    thiet_bi_id INT REFERENCES thiet_bi(id) ON DELETE CASCADE,
    ma_tra_cuu VARCHAR(50) UNIQUE NOT NULL,
    loai_dich_vu VARCHAR(30) DEFAULT 'OFFLINE',
    trang_thai VARCHAR(50) DEFAULT 'CHỜ_KHÁM',
    han_bao_hanh TIMESTAMP WITH TIME ZONE,
    tong_tien NUMERIC(12,2) DEFAULT 0,
    giam_gia_sinh_vien NUMERIC(12,2) DEFAULT 0,
    tien_sau_giam NUMERIC(12,2) DEFAULT 0,
    trang_thai_thanh_toan VARCHAR(30) DEFAULT 'CHUA_THANH_TOAN',
    phuong_thuc_thanh_toan VARCHAR(30) DEFAULT 'VIETQR',
    ma_giao_dich VARCHAR(50),
    ngay_thanh_toan TIMESTAMP WITH TIME ZONE,
    chi_nhanh VARCHAR(150) DEFAULT 'Công ty Cổ phần Lục Giác - 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM',
    hinh_anh_ngoai_quan JSONB DEFAULT '[]'::jsonb,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng phiên QR tạm tại quầy
CREATE TABLE IF NOT EXISTS ticket_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    qr_image_base64 TEXT,
    ticket_id INT REFERENCES phieu_sua_chua(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_by INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng hình ảnh hiện trạng đính kèm phiếu
CREATE TABLE IF NOT EXISTS hinh_anh_phieu (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    duong_dan_anh TEXT NOT NULL,
    loai_anh VARCHAR(50) DEFAULT 'NGOAI_QUAN',
    ghi_chu VARCHAR(255),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng nhật ký tiến độ xử lý phiếu
CREATE TABLE IF NOT EXISTS nhat_ky_sua_chua (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    nhan_vien_id INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    trang_thai_cu VARCHAR(50),
    trang_thai_moi VARCHAR(50) NOT NULL,
    ghi_chu TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đặt lịch hẹn trước
CREATE TABLE IF NOT EXISTS lich_hen (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    thoi_gian_hen TIMESTAMP WITH TIME ZONE,
    loai_dich_vu VARCHAR(30) DEFAULT 'TAI_CUA_HANG',
    trang_thai VARCHAR(30) DEFAULT 'CHO_XAC_NHAN',
    ngay_hen VARCHAR(20) NOT NULL,
    gio_hen VARCHAR(20) NOT NULL,
    mo_ta_loi TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đánh giá khách hàng (1-5 sao)
CREATE TABLE IF NOT EXISTS danh_gia (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT UNIQUE REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    so_sao INT CHECK (so_sao >= 1 AND so_sao <= 5),
    nhan_xet TEXT,
    ngay_danh_gia TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng cấu hình giao diện Client (CMS)
CREATE TABLE IF NOT EXISTS cau_hinh_cms (
    id INT PRIMARY KEY DEFAULT 1,
    du_lieu JSONB NOT NULL,
    nguoi_cap_nhat VARCHAR(100) DEFAULT 'system',
    ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phieu_ma_tra_cuu ON phieu_sua_chua(ma_tra_cuu);
CREATE INDEX IF NOT EXISTS idx_khach_hang_sdt ON khach_hang(so_dien_thoai);
CREATE INDEX IF NOT EXISTS idx_phieu_trang_thai ON phieu_sua_chua(trang_thai);
CREATE INDEX IF NOT EXISTS idx_phieu_han_bh ON phieu_sua_chua(han_bao_hanh);
