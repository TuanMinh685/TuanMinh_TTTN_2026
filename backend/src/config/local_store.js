const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data_store.json');

const INITIAL_STORE = {
    nhan_vien: [
        { id: 1, ten_dang_nhap: 'giamdoc', ho_ten: 'Lê Trần Tuấn Minh (Giám Đốc)', vai_tro: 'GIAM_DOC', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 2, ten_dang_nhap: 'admin', ho_ten: 'Ban Giám Đốc Hệ Thống', vai_tro: 'ADMIN', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 3, ten_dang_nhap: 'quanly', ho_ten: 'Nguyễn Đức Quản Lý (Cửa Hàng Trưởng)', vai_tro: 'QUAN_LY', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 4, ten_dang_nhap: 'ketoan', ho_ten: 'Phạm Thị Thu Ngân (Kế Toán)', vai_tro: 'KE_TOAN', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 5, ten_dang_nhap: 'thukho', ho_ten: 'Võ Hoàng Thủ Kho (Quản Kho Linh Kiện)', vai_tro: 'THU_KHO', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 6, ten_dang_nhap: 'kythuat', ho_ten: 'Trần Văn Kỹ Thuật (KTV Phần Cứng)', vai_tro: 'KY_THUAT_VIEN', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 7, ten_dang_nhap: 'letan', ho_ten: 'Nguyễn Thị Lễ Tân (CSKH Tại Quầy)', vai_tro: 'LE_TAN', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' }
    ],
    linh_kien: [
        { id: 1, ten_linh_kien: 'RAM Kingston Fury Beast 8GB DDR4 3200MHz', gia_ban: 650000, so_luong: 25 },
        { id: 2, ten_linh_kien: 'RAM Samsung 16GB DDR5 4800MHz Laptop', gia_ban: 1250000, so_luong: 15 },
        { id: 3, ten_linh_kien: 'Ổ cứng SSD Kingston NV2 500GB PCIe 4.0 NVMe', gia_ban: 950000, so_luong: 20 },
        { id: 4, ten_linh_kien: 'Ổ cứng SSD Samsung 980 Pro 1TB NVMe M.2', gia_ban: 2150000, so_luong: 10 },
        { id: 5, ten_linh_kien: 'Pin Laptop Dell Inspiron 15 3511 / 3520 Zin Chính Hãng', gia_ban: 850000, so_luong: 12 },
        { id: 6, ten_linh_kien: 'Màn hình Laptop 15.6 inch FHD IPS 144Hz Chống Chói', gia_ban: 1850000, so_luong: 8 },
        { id: 7, ten_linh_kien: 'Bàn phím Laptop Asus TUF Gaming Có LED RGB', gia_ban: 550000, so_luong: 14 },
        { id: 8, ten_linh_kien: 'Keo tản nhiệt Arctic MX-4 & Vệ sinh máy chuyên sâu', gia_ban: 150000, so_luong: 100 },
        { id: 9, ten_linh_kien: 'Sạc Laptop Macbook Type-C 67W Zin Chuẩn PD', gia_ban: 1100000, so_luong: 9 },
        { id: 10, ten_linh_kien: 'RAM Corsair Vengeance 32GB (2x16GB) DDR4 3200MHz', gia_ban: 1950000, so_luong: 10 },
        { id: 11, ten_linh_kien: 'RAM Crucial 16GB DDR4 3200MHz Sodimm Laptop', gia_ban: 850000, so_luong: 20 },
        { id: 12, ten_linh_kien: 'Ổ cứng SSD Kingston A400 240GB SATA 3 (Nâng cấp máy cũ)', gia_ban: 450000, so_luong: 30 },
        { id: 13, ten_linh_kien: 'Ổ cứng SSD Crucial P3 Plus 1TB PCIe Gen4 NVMe', gia_ban: 1750000, so_luong: 12 },
        { id: 14, ten_linh_kien: 'Ổ cứng SSD Samsung 990 Pro 2TB Siêu Tốc Độ Cao', gia_ban: 4200000, so_luong: 5 },
        { id: 15, ten_linh_kien: 'Pin Laptop Asus Zenbook / Vivobook 42Wh Zin', gia_ban: 820000, so_luong: 10 },
        { id: 16, ten_linh_kien: 'Pin Laptop Lenovo Thinkpad T480 / T490 / E14', gia_ban: 890000, so_luong: 8 },
        { id: 17, ten_linh_kien: 'Pin Laptop HP Pavilion 14 / 15 HT03XL Zin', gia_ban: 790000, so_luong: 14 },
        { id: 18, ten_linh_kien: 'Pin Laptop Macbook Air M1 / M2 Zin Hãng', gia_ban: 1650000, so_luong: 7 },
        { id: 19, ten_linh_kien: 'Màn hình Laptop 14.0 inch FHD IPS Siêu Sáng Slim 30 Pin', gia_ban: 1450000, so_luong: 10 },
        { id: 20, ten_linh_kien: 'Màn hình Laptop 15.6 inch 2K QHD 165Hz Chuyên Đồ Họa', gia_ban: 2650000, so_luong: 5 },
        { id: 21, ten_linh_kien: 'Hàn gia cố bản lề bung bể vỏ laptop (Bảo hành vĩnh viễn)', gia_ban: 250000, so_luong: 50 },
        { id: 22, ten_linh_kien: 'Bàn phím Laptop Dell Inspiron / Vostro LED Trắng', gia_ban: 450000, so_luong: 15 },
        { id: 23, ten_linh_kien: 'Bàn phím Laptop Lenovo Thinkpad Gõ Êm Chống Tràn Nước', gia_ban: 590000, so_luong: 10 },
        { id: 24, ten_linh_kien: 'Sạc Laptop Type-C 65W Đa Năng GaN (Dell, HP, Asus, Lenovo)', gia_ban: 490000, so_luong: 25 },
        { id: 25, ten_linh_kien: 'Sạc Laptop Dell 65W Chân Kim Nhỏ 4.5x3.0mm Zin', gia_ban: 350000, so_luong: 20 },
        { id: 26, ten_linh_kien: 'Vệ sinh tra keo tản nhiệt gốm Thermal Grizzly Kryonaut (Gaming)', gia_ban: 250000, so_luong: 40 },
        { id: 27, ten_linh_kien: 'Thay quạt tản nhiệt Laptop Dell / Asus / Acer kêu rè rè', gia_ban: 350000, so_luong: 15 },
        { id: 28, 'ten_linh_kien': 'Cài đặt Windows 10 / 11 Pro Bản Quyền + Đủ Driver & Font', gia_ban: 100000, so_luong: 100 },
        { id: 29, 'ten_linh_kien': 'Bộ phần mềm Văn phòng Office 365 + PDF + Gõ Tiếng Việt', gia_ban: 80000, so_luong: 100 },
        { id: 30, 'ten_linh_kien': 'Cài đặt trọn bộ đồ họa Adobe 2024 (Photoshop, Illustrator, Premiere)', gia_ban: 150000, so_luong: 50 },
        { id: 31, 'ten_linh_kien': 'Cứu dữ liệu ổ cứng bị Bad Sector / Format nhầm / Xóa nhầm', gia_ban: 350000, so_luong: 30 }
    ],
    khach_hang: [],
    thiet_bi: [],
    phieu_sua_chua: [],
    phieu_linh_kien: [],
    nhat_ky_sua_chua: [],
    lich_hen: [],
    danh_gia: [],
    hinh_anh_phieu: []
};

let memoryStore = null;

function loadStore() {
    if (memoryStore) return memoryStore;
    try {
        if (fs.existsSync(STORE_PATH)) {
            const raw = fs.readFileSync(STORE_PATH, 'utf-8');
            memoryStore = JSON.parse(raw);
        } else {
            memoryStore = { ...INITIAL_STORE };
            saveStore();
        }
    } catch (e) {
        memoryStore = { ...INITIAL_STORE };
    }
    return memoryStore;
}

function saveStore() {
    if (!memoryStore) return;
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
    } catch (e) {}
}

module.exports = {
    loadStore,
    saveStore
};
