const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_FILE = path.join(__dirname, '../../data_store.json');

// Khởi tạo dữ liệu mẫu phong phú đầy đủ các trường mới
function getDefaultData() {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('123456', salt);

    return {
        nhan_vien: [
            { id: 1, ten_dang_nhap: 'admin', ho_ten: 'Quản Trị Hệ Thống', vai_tro: 'ADMIN', mat_khau: hash, trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 2, ten_dang_nhap: 'letan', ho_ten: 'Nguyễn Thị Lễ Tân', vai_tro: 'LE_TAN', mat_khau: hash, trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 3, ten_dang_nhap: 'kythuat', ho_ten: 'Trần Kỹ Thuật Viên', vai_tro: 'KY_THUAT_VIEN', mat_khau: hash, trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 4, ten_dang_nhap: 'giamdoc', ho_ten: 'Lê Tổng Giám Đốc', vai_tro: 'GIAM_DOC', mat_khau: hash, trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 5, ten_dang_nhap: 'quanly', ho_ten: 'Phạm Quản Lý Cửa Hàng', vai_tro: 'QUAN_LY', mat_khau: hash, trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 6, ten_dang_nhap: 'ketoan', ho_ten: 'Đặng Thu Ngân Kế Toán', vai_tro: 'KE_TOAN', mat_khau: hash, trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 7, ten_dang_nhap: 'thukho', ho_ten: 'Võ Thủ Kho Linh Kiện', vai_tro: 'THU_KHO', mat_khau: hash, trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-01T08:00:00Z' }
        ],
        khach_hang: [
            { id: 1, ho_ten: 'Lê Trần Tuấn Minh', so_dien_thoai: '0901234567', zalo_id: '0901234567', la_sinh_vien: true, truong_hoc: 'Trường Đại học Văn Hiến (VHU)', ma_sinh_vien: '221A010123', diem_tich_luy: 120, hang_thanh_vien: 'BAC', ngay_tao: '2026-10-10T09:00:00Z' },
            { id: 2, ho_ten: 'Trần Hoàng Bách', so_dien_thoai: '0912345678', zalo_id: '0912345678', la_sinh_vien: true, truong_hoc: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM', ma_sinh_vien: '2014589', diem_tich_luy: 85, hang_thanh_vien: 'DONG', ngay_tao: '2026-10-11T10:00:00Z' },
            { id: 3, ho_ten: 'Nguyễn Văn Khang', so_dien_thoai: '0988776655', zalo_id: '0988776655', la_sinh_vien: false, truong_hoc: '', ma_sinh_vien: '', diem_tich_luy: 200, hang_thanh_vien: 'VANG', ngay_tao: '2026-10-12T14:00:00Z' }
        ],
        thiet_bi: [
            { id: 1, khach_hang_id: 1, ten_may: 'Laptop Dell Inspiron 5510', so_imei_serial: 'SN-DELL-8823', tinh_trang_may: 'Màn hình nhấp nháy, quạt kêu to', ngay_tao: '2026-10-10T09:05:00Z' },
            { id: 2, khach_hang_id: 2, ten_may: 'MacBook Air M1 2020', so_imei_serial: 'SN-APPLE-M1-9921', tinh_trang_may: 'Bàn phím kẹt phím Space, pin chai 70%', ngay_tao: '2026-10-11T10:10:00Z' },
            { id: 3, khach_hang_id: 3, ten_may: 'Laptop Asus ROG Strix G15', so_imei_serial: 'SN-ASUS-ROG-4412', tinh_trang_may: 'Cần nâng cấp SSD 500GB và vệ sinh tra keo', ngay_tao: '2026-10-12T14:15:00Z' }
        ],
        phieu_sua_chua: [
            {
                id: 1,
                thiet_bi_id: 1,
                ma_tra_cuu: 'RP-839400',
                loai_dich_vu: 'OFFLINE',
                trang_thai: 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN',
                tong_tien: 850000,
                giam_gia_sinh_vien: 127500, // 15%
                tien_sau_giam: 722500,
                la_sinh_vien: true,
                truong_hoc: 'Trường Đại học Văn Hiến (VHU)',
                ma_sinh_vien: '221A010123',
                han_bao_hanh: '2027-01-16T12:00:00Z', // Còn hơn 80 ngày bảo hành
                ngay_tao: '2026-10-10T09:10:00Z',
                ngay_cap_nhat: '2026-10-12T11:00:00Z'
            },
            {
                id: 2,
                thiet_bi_id: 2,
                ma_tra_cuu: 'RP-648045',
                loai_dich_vu: 'OFFLINE',
                trang_thai: 'CHỜ_KHÁCH_CHỐT_GIÁ',
                tong_tien: 1200000,
                giam_gia_sinh_vien: 180000, // 15%
                tien_sau_giam: 1020000,
                la_sinh_vien: true,
                truong_hoc: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM',
                ma_sinh_vien: '2014589',
                han_bao_hanh: '2027-01-20T12:00:00Z',
                ngay_tao: '2026-10-11T10:15:00Z',
                ngay_cap_nhat: '2026-10-12T15:00:00Z'
            },
            {
                id: 3,
                thiet_bi_id: 3,
                ma_tra_cuu: 'RP-100299',
                loai_dich_vu: 'OFFLINE',
                trang_thai: 'ĐANG_SỬA',
                tong_tien: 950000,
                giam_gia_sinh_vien: 0,
                tien_sau_giam: 950000,
                la_sinh_vien: false,
                truong_hoc: '',
                ma_sinh_vien: '',
                han_bao_hanh: '2027-04-16T12:00:00Z',
                ngay_tao: '2026-10-12T14:20:00Z',
                ngay_cap_nhat: '2026-10-12T16:00:00Z'
            }
        ],
        linh_kien: [
            { id: 1, ten_linh_kien: 'Màn hình LCD Dell 15.6 inch FHD IPS', gia_ban: 1450000, so_luong: 8, ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 2, ten_linh_kien: 'Bàn phím cơ DareU EK87 Tenkeyless', gia_ban: 500000, so_luong: 15, ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 3, ten_linh_kien: 'Ổ cứng SSD NVMe Kingston 500GB Gen 4', gia_ban: 850000, so_luong: 12, ngay_tao: '2026-10-01T08:00:00Z' },
            { id: 4, ten_linh_kien: 'RAM Laptop Kingston 8GB DDR4 3200MHz', gia_ban: 450000, so_luong: 3, ngay_tao: '2026-10-01T08:00:00Z' }, // Cảnh báo tồn kho
            { id: 5, ten_linh_kien: 'Pin Laptop Dell 42Wh 3-Cell Chính Hãng', gia_ban: 650000, so_luong: 2, ngay_tao: '2026-10-01T08:00:00Z' }, // Cảnh báo tồn kho
            { id: 6, ten_linh_kien: 'Combo vệ sinh máy & tra keo gốm tản nhiệt Arctic MX-4', gia_ban: 150000, so_luong: 50, ngay_tao: '2026-10-01T08:00:00Z' }
        ],
        phieu_linh_kien: [
            { id: 1, phieu_sua_chua_id: 1, linh_kien_id: 3, so_luong: 1, don_gia: 850000, so_serial: 'SN-SSD-KST-9872134', ngay_them: '2026-10-11T09:00:00Z' },
            { id: 2, phieu_sua_chua_id: 2, linh_kien_id: 2, so_luong: 1, don_gia: 500000, so_serial: 'SN-KB-DAREU-554109', ngay_them: '2026-10-12T10:00:00Z' },
            { id: 3, phieu_sua_chua_id: 2, linh_kien_id: 5, so_luong: 1, don_gia: 650000, so_serial: 'SN-BAT-DELL-441290', ngay_them: '2026-10-12T10:05:00Z' }
        ],
        hinh_anh_phieu: [
            {
                id: 1,
                phieu_sua_chua_id: 1,
                duong_dan_anh: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
                loai_anh: 'NGOAI_QUAN_TRUOC',
                ghi_chu: 'Màn hình bị trầy nhẹ góc dưới bên phải lúc tiếp nhận tại 615 Âu Cơ',
                ngay_tao: '2026-10-10T09:12:00Z'
            },
            {
                id: 2,
                phieu_sua_chua_id: 1,
                duong_dan_anh: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
                loai_anh: 'BAN_PHIM_VO_MAY',
                ghi_chu: 'Mặt C và bàn phím còn nguyên tem niêm phong',
                ngay_tao: '2026-10-10T09:13:00Z'
            },
            {
                id: 3,
                phieu_sua_chua_id: 2,
                duong_dan_anh: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80',
                loai_anh: 'NGOAI_QUAN_CAN_MOP',
                ghi_chu: 'Vỏ nhôm bị cấn nhẹ góc trái cạnh cổng Type-C',
                ngay_tao: '2026-10-11T10:20:00Z'
            }
        ],
        lich_hen: [
            { id: 1, khach_hang_id: 1, ngay_hen: '2026-10-20', gio_hen: '09:30', moTaLoi: 'Vệ sinh tra keo tản nhiệt và cài lại Windows', loai_dich_vu: 'TAI_CUA_HANG', trang_thai: 'CHO_XAC_NHAN' },
            { id: 2, khach_hang_id: 2, ngay_hen: '2026-10-21', gio_hen: '14:00', moTaLoi: 'Hỗ trợ kiểm tra máy chạy chậm từ xa', loai_dich_vu: 'ONLINE_TUXA', trang_thai: 'CHO_XAC_NHAN' }
        ],
        nhat_ky_sua_chua: [
            { id: 1, phieu_sua_chua_id: 1, trang_thai_moi: 'CHỜ_KHÁM', ghi_chu: 'Tiếp nhận máy tại quầy 615 Âu Cơ', ngay_tao: '2026-10-10T09:10:00Z' },
            { id: 2, phieu_sua_chua_id: 1, trang_thai_moi: 'ĐANG_KIỂM_TRA', ghi_chu: 'KTV tháo máy kiểm tra bo mạch và SSD', ngay_tao: '2026-10-10T09:30:00Z' },
            { id: 3, phieu_sua_chua_id: 1, trang_thai_moi: 'CHỜ_KHÁCH_CHỐT_GIÁ', ghi_chu: 'Báo giá thay SSD NVMe 500GB giá 850.000đ (Ưu đãi SV -15%)', ngay_tao: '2026-10-10T10:00:00Z' },
            { id: 4, phieu_sua_chua_id: 1, trang_thai_moi: 'ĐANG_SỬA', ghi_chu: 'Khách hàng ĐÃ ĐỒNG Ý báo giá qua điện thoại', ngay_tao: '2026-10-10T10:15:00Z' },
            { id: 5, phieu_sua_chua_id: 1, trang_thai_moi: 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN', ghi_chu: 'Đã hoàn tất sửa chữa, kích hoạt bảo hành điện tử 90 ngày', ngay_tao: '2026-10-12T11:00:00Z' },
            { id: 6, phieu_sua_chua_id: 2, trang_thai_moi: 'CHỜ_KHÁCH_CHỐT_GIÁ', ghi_chu: 'Đã gửi báo giá thay bàn phím và pin cho khách duyệt', ngay_tao: '2026-10-12T15:00:00Z' }
        ],
        danh_gia: [
            { id: 1, phieu_sua_chua_id: 1, so_sao: 5, nhan_xet: 'Dịch vụ tại 615 Âu Cơ rất chu đáo, KTV nhiệt tình giải thích, lại có giảm giá sinh viên và bảo hành điện tử tra cứu dễ dàng!', ngay_danh_gia: '2026-10-12T11:30:00Z' },
            { id: 2, phieu_sua_chua_id: 3, so_sao: 5, nhan_xet: 'Máy sửa nhanh, theo dõi tiến độ qua mã QR tiện lợi không phải gọi điện hỏi.', ngay_danh_gia: '2026-10-13T09:00:00Z' }
        ]
    };
}

let store = null;

function loadStore() {
    if (!store) {
        if (fs.existsSync(DATA_FILE)) {
            try {
                store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            } catch (e) {
                store = getDefaultData();
            }
        } else {
            store = getDefaultData();
            saveStore();
        }
    }
    return store;
}

function saveStore() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
        console.error('Lỗi lưu data_store.json:', e);
    }
}

module.exports = {
    loadStore,
    saveStore
};
