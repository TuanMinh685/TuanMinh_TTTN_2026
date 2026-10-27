const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data_store.json');

const INITIAL_STORE = {
    nhan_vien: [
        { id: 1, ten_dang_nhap: 'admin', ho_ten: 'Lê Trần Tuấn Minh (Quản Trị Hệ Thống CSKH)', vai_tro: 'ADMIN', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 2, ten_dang_nhap: 'quanly', ho_ten: 'Nguyễn Đức Quản Lý (Trưởng Bộ Phận CSKH)', vai_tro: 'QUAN_LY', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 3, ten_dang_nhap: 'kythuat', ho_ten: 'Trần Văn Hỗ Trợ (Chuyên Viên CSKH)', vai_tro: 'KY_THUAT_VIEN', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' },
        { id: 4, ten_dang_nhap: 'letan', ho_ten: 'Nguyễn Thị Lễ Tân (Tiếp Nhận QR)', vai_tro: 'LE_TAN', mat_khau: '$2b$10$8u4nqyS5X7oTqI7H9yW0xed0PkWv3VjI4V5q2H6fO6y7V9k3H5vOe', trang_thai: 'HOAT_DONG', ngay_tao: '2026-10-10T08:00:00.000Z' }
    ],
    khach_hang: [],
    thiet_bi: [],
    phieu_sua_chua: [],
    nhat_ky_sua_chua: [],
    lich_hen: [],
    danh_gia: [],
    hinh_anh_phieu: [],
    ticket_sessions: []
};

let memoryStore = null;

function loadStore() {
    if (memoryStore) return memoryStore;
    try {
        if (fs.existsSync(STORE_PATH)) {
            const raw = fs.readFileSync(STORE_PATH, 'utf-8');
            memoryStore = JSON.parse(raw);
            delete memoryStore.linh_kien;
            delete memoryStore.phieu_linh_kien;
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
        delete memoryStore.linh_kien;
        delete memoryStore.phieu_linh_kien;
        fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
    } catch (e) {}
}

module.exports = {
    loadStore,
    saveStore
};
