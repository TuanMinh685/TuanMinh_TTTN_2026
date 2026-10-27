-- =========================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU TIẾNG VIỆT (POSTGRESQL)
-- Đề tài: Xây dựng Hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng tại Tập đoàn MYH Group
-- =========================================================================

-- 1. BẢNG KHÁCH HÀNG
CREATE TABLE IF NOT EXISTS khach_hang (
    id SERIAL PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) UNIQUE NOT NULL,
    zalo_id VARCHAR(50),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG NHÂN VIÊN BỘ PHẬN CHĂM SÓC KHÁCH HÀNG (CSKH)
-- Vai trò: ADMIN (Quản trị hệ thống), QUAN_LY (Trưởng BP CSKH), LE_TAN (Lễ tân tiếp nhận QR), KY_THUAT_VIEN (Chuyên viên hỗ trợ CSKH)
CREATE TABLE IF NOT EXISTS nhan_vien (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro VARCHAR(30) DEFAULT 'KY_THUAT_VIEN',
    trang_thai VARCHAR(20) DEFAULT 'HOAT_DONG',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG SẢN PHẨM / DỊCH VỤ KHÁCH HÀNG CẦN HỖ TRỢ CSKH
CREATE TABLE IF NOT EXISTS thiet_bi (
    id SERIAL PRIMARY KEY,
    khach_hang_id INT REFERENCES khach_hang(id) ON DELETE CASCADE,
    ten_may VARCHAR(150) NOT NULL,       -- Tên sản phẩm / dịch vụ cần hỗ trợ CSKH
    so_imei_serial VARCHAR(50),          -- Mã định danh sản phẩm / Số Serial (nếu có)
    tinh_trang_may TEXT,                 -- Nội dung yêu cầu hỗ trợ / phản hồi của khách hàng
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG HỒ SƠ PHIẾU CHĂM SÓC KHÁCH HÀNG QUA MÃ QR
-- Trạng thái: CHỜ_KHÁM (Mới tiếp nhận), ĐANG_CHUẨN_ĐOÁN (Đang kiểm tra & phân loại), ĐANG_SỬA (Đang xử lý hỗ trợ), ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN (Hoàn tất CSKH & Cấp e-Warranty), YÊU_CẦU_BẢO_HÀNH
CREATE TABLE IF NOT EXISTS phieu_sua_chua (
    id SERIAL PRIMARY KEY,
    thiet_bi_id INT REFERENCES thiet_bi(id) ON DELETE CASCADE,
    ma_tra_cuu VARCHAR(50) UNIQUE NOT NULL, -- Mã định danh QR: VD RP-839400
    loai_dich_vu VARCHAR(30) DEFAULT 'OFFLINE',
    trang_thai VARCHAR(50) DEFAULT 'CHỜ_KHÁM',
    han_bao_hanh TIMESTAMP,                 -- Hạn bảo hành & hậu mãi điện tử (e-Warranty)
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG PHIÊN KHỞI TẠO MÃ QR ĐỘNG TẠI QUẦY (QR SESSION)
CREATE TABLE IF NOT EXISTS ticket_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    qr_image_base64 TEXT,
    ticket_id INT REFERENCES phieu_sua_chua(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',    -- ACTIVE, SUBMITTED, EXPIRED
    created_by INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    expires_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BẢNG HÌNH ẢNH MINH CHỨNG / HIỆN TRẠNG ĐÍNH KÈM HỒ SƠ QR
CREATE TABLE IF NOT EXISTS hinh_anh_phieu (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    duong_dan_anh TEXT NOT NULL,            -- Base64 hoặc URL ảnh minh chứng hiện trạng
    loai_anh VARCHAR(50) DEFAULT 'NGOAI_QUAN',
    ghi_chu VARCHAR(255),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG NHẬT KÝ TIẾN ĐỘ XỬ LÝ HỒ SƠ CSKH THỜI GIAN THỰC
CREATE TABLE IF NOT EXISTS nhat_ky_sua_chua (
    id SERIAL PRIMARY KEY,
    phieu_sua_chua_id INT REFERENCES phieu_sua_chua(id) ON DELETE CASCADE,
    nhan_vien_id INT REFERENCES nhan_vien(id) ON DELETE SET NULL,
    trang_thai_cu VARCHAR(50),
    trang_thai_moi VARCHAR(50) NOT NULL,
    ghi_chu TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG ĐẶT LỊCH HẸN TƯ VẤN & CHĂM SÓC KHÁCH HÀNG QUA WEB QR
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

-- 9. BẢNG ĐÁNH GIÁ MỨC ĐỘ HÀI LÒNG DỊCH VỤ CSKH (1 - 5 SAO)
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
