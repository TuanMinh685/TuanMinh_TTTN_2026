const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db.config');
const { getIo } = require('../config/socket.config');

const CMS_FILE_PATH = path.join(__dirname, '../config/cms_config.json');
let cmsTableReady = false;

const DEFAULT_CMS_CONFIG = {
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
    brand: {
        companyName: 'CÔNG TY CỔ PHẦN LỤC GIÁC',
        badgeText: 'TRUNG TÂM CSKH & SỬA CHỮA • CÔNG TY CỔ PHẦN LỤC GIÁC',
        logoUrl: '/img/logo-luc-giac.png',
        hotline: '(028) 3860 4999',
        email: 'info@lucgiac.vn',
        address: '615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh',
        website: 'lucgiac.vn',
        footerDescription: 'Hệ thống tiếp nhận thiết bị máy tính, theo dõi tiến độ kiểm tra - sửa chữa và tra cứu bảo hành điện tử qua mã QR thuộc Công ty Cổ phần Lục Giác.',
        showPromoBanner: false,
        promoBannerText: 'Miễn phí kiểm tra lỗi phần cứng & phần mềm tại quầy 615 Âu Cơ.'
    },
    hero: {
        titleLine1: 'Dịch Vụ Sửa Chữa & Chăm Sóc Khách Hàng',
        titleHighlight: 'Theo Dõi Tiến Độ & Bảo Hành Qua Mã QR',
        description: 'Tiếp nhận thiết bị nhanh chóng, theo dõi tiến độ kiểm tra phần cứng, xử lý phần mềm và tra cứu thời hạn bảo hành điện tử ngay trên mã QR.',
        bannerImageUrl: '',
        showBannerImage: false,
        kioskTitle: 'Mã QR Quầy Tiếp Nhận',
        kioskBranch: '615 Âu Cơ'
    },
    pillarsSectionTitle: 'Quy Trình Tiếp Nhận & Theo Dõi Qua Mã QR',
    pillarsSectionSubtitle: 'Mỗi thiết bị khi tiếp nhận được cấp một mã QR riêng để theo dõi trạng thái xử lý và thời hạn bảo hành.',
    pillars: [
        {
            step: '01',
            icon: 'laptop',
            title: 'Quét QR Tiếp Nhận Máy & Ảnh Ngoại Quan',
            desc: 'Quét mã QR tại quầy để điền thông tin sự cố máy tính / phần mềm và đính kèm ảnh chụp ngoại quan khi bàn giao.'
        },
        {
            step: '02',
            icon: 'clock',
            title: 'Theo Dõi Tiến Độ Kiểm Tra & Sửa Chữa',
            desc: 'Dùng mã QR trên biên nhận 80mm để xem trực tiếp từng bước kiểm tra phần cứng và xử lý sự cố phần mềm.'
        },
        {
            step: '03',
            icon: 'shield',
            title: 'Quản Lý Bảo Hành Điện Tử',
            desc: 'Thông tin bảo hành 06 tháng (180 ngày) và số Serial linh kiện được lưu trực tiếp trên mã QR, thuận tiện tra cứu khi cần hỗ trợ.'
        },
        {
            step: '04',
            icon: 'star',
            title: 'Đánh Giá Chất Lượng Dịch Vụ',
            desc: 'Sau khi nhận lại thiết bị, khách hàng có thể chấm điểm 1–5 sao và gửi nhận xét về bộ phận CSKH.'
        }
    ],
    servicesSectionTitle: 'Danh Mục Dịch Vụ Máy Tính & Phần Mềm',
    servicesSectionSubtitle: 'Các hạng mục tiếp nhận đều được cấp mã QR theo dõi, lưu ảnh hiện trạng và kích hoạt bảo hành điện tử.',
    services: [
        {
            id: 'srv-1',
            icon: 'desktop',
            imageUrl: '',
            tag: 'Phần cứng Laptop & PC',
            title: 'Kiểm Tra & Sửa Chữa Phần Cứng',
            desc: 'Kiểm tra và xử lý lỗi Mainboard, nguồn, màn hình, bàn phím, bản lề và tản nhiệt cho Laptop Dell, HP, Asus, Lenovo, MacBook & PC.',
            priceHint: 'Miễn phí kiểm tra • Báo giá trước khi sửa',
            serviceParam: 'Kiểm tra & Sửa chữa phần cứng Máy tính / Laptop'
        },
        {
            id: 'srv-2',
            icon: 'disc',
            imageUrl: '',
            tag: 'Hệ điều hành & Phần mềm',
            title: 'Cài Đặt & Khắc Phục Sự Cố Phần Mềm',
            desc: 'Xử lý lỗi Windows 10/11, macOS, Microsoft Office, phần mềm kế toán - đồ họa và các lỗi hệ thống thường gặp.',
            priceHint: 'Từ 150.000đ • Bảo hành phần mềm',
            serviceParam: 'Cài đặt & Khắc phục sự cố Phần mềm / Hệ điều hành'
        },
        {
            id: 'srv-3',
            icon: 'zap',
            imageUrl: '',
            tag: 'Nâng cấp linh kiện',
            title: 'Nâng Cấp SSD, RAM & Linh Kiện Chính Hãng',
            desc: 'Tư vấn nâng cấp ổ cứng SSD NVMe, RAM, Pin, Sạc chính hãng. Số Serial linh kiện được lưu trong hồ sơ bảo hành QR.',
            priceHint: 'Bảo hành điện tử 06–36 tháng',
            serviceParam: 'Nâng cấp SSD / RAM & Linh kiện máy tính'
        },
        {
            id: 'srv-4',
            icon: 'lock',
            imageUrl: '',
            tag: 'Dữ liệu & Bảo mật',
            title: 'Cứu Dữ Liệu, Sao Lưu & Diệt Virus',
            desc: 'Khôi phục dữ liệu ổ cứng/SSD lỗi phân vùng, sao lưu dữ liệu an toàn và xử lý virus, mã độc.',
            priceHint: 'Cam kết bảo mật dữ liệu',
            serviceParam: 'Cứu dữ liệu, Sao lưu & Diệt Virus bảo mật'
        },
        {
            id: 'srv-5',
            icon: 'globe',
            imageUrl: '',
            tag: 'Mạng nội bộ & Máy in',
            title: 'Khắc Phục Lỗi Mạng LAN/Wi-Fi & Máy In',
            desc: 'Cài đặt Driver máy in, chia sẻ máy in nội bộ, xử lý mất kết nối Wi-Fi/Bluetooth và cổng USB/HDMI.',
            priceHint: 'Xử lý lấy liền trong 30 phút',
            serviceParam: 'Khắc phục lỗi Mạng, Driver & Thiết bị ngoại vi'
        },
        {
            id: 'srv-6',
            icon: 'shield',
            imageUrl: '',
            tag: 'Bảo dưỡng & Hậu mãi',
            title: 'Bảo Dưỡng Định Kỳ & Vệ Sinh Laptop',
            desc: 'Vệ sinh laptop, tra keo tản nhiệt, kiểm tra tình trạng ổ cứng và hỗ trợ bảo hành ưu tiên qua mã QR.',
            priceHint: 'Combo vệ sinh & tra keo: 150.000đ',
            serviceParam: 'Bảo dưỡng định kỳ & Hỗ trợ bảo hành'
        }
    ]
};

const mergeCmsConfig = (parsed = {}) => ({
    ...DEFAULT_CMS_CONFIG,
    ...parsed,
    brand: { ...DEFAULT_CMS_CONFIG.brand, ...(parsed.brand || {}) },
    hero: { ...DEFAULT_CMS_CONFIG.hero, ...(parsed.hero || {}) },
    pillars: Array.isArray(parsed.pillars) && parsed.pillars.length > 0 ? parsed.pillars : DEFAULT_CMS_CONFIG.pillars,
    services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : DEFAULT_CMS_CONFIG.services
});

const readLocalCmsFile = () => {
    try {
        if (fs.existsSync(CMS_FILE_PATH)) {
            const raw = fs.readFileSync(CMS_FILE_PATH, 'utf8');
            return mergeCmsConfig(JSON.parse(raw));
        }
    } catch (err) {
        console.warn('Không đọc được cms_config.json:', err.message);
    }
    return null;
};

const writeLocalCmsFile = (config) => {
    try {
        fs.writeFileSync(CMS_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
        // Bỏ qua nếu môi trường deploy chỉ cho phép đọc ổ đĩa
    }
};

const ensureCmsTable = async () => {
    if (cmsTableReady) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cau_hinh_cms (
                id INT PRIMARY KEY DEFAULT 1,
                du_lieu JSONB NOT NULL,
                nguoi_cap_nhat VARCHAR(100) DEFAULT 'system',
                ngay_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        cmsTableReady = true;
    } catch (err) {
        console.warn('Chưa khởi tạo được bảng cau_hinh_cms:', err.message);
    }
};

const saveCmsToDb = async (config, actor) => {
    await ensureCmsTable();
    await pool.query(
        `INSERT INTO cau_hinh_cms (id, du_lieu, nguoi_cap_nhat, ngay_cap_nhat)
         VALUES (1, $1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE
         SET du_lieu = EXCLUDED.du_lieu,
             nguoi_cap_nhat = EXCLUDED.nguoi_cap_nhat,
             ngay_cap_nhat = CURRENT_TIMESTAMP`,
        [JSON.stringify(config), actor]
    );
};

const getCmsConfig = async () => {
    try {
        await ensureCmsTable();
        const { rows } = await pool.query(
            'SELECT du_lieu, nguoi_cap_nhat, ngay_cap_nhat FROM cau_hinh_cms WHERE id = 1'
        );
        if (rows.length > 0 && rows[0].du_lieu) {
            const rawData = typeof rows[0].du_lieu === 'string'
                ? JSON.parse(rows[0].du_lieu)
                : rows[0].du_lieu;
            return mergeCmsConfig({
                ...rawData,
                updatedBy: rawData.updatedBy || rows[0].nguoi_cap_nhat,
                updatedAt: rawData.updatedAt || rows[0].ngay_cap_nhat
            });
        }
    } catch (err) {
        console.warn('Không đọc được cấu hình CMS từ CSDL, dùng bản dự phòng:', err.message);
    }

    const localConfig = readLocalCmsFile();
    if (localConfig) return localConfig;

    return JSON.parse(JSON.stringify(DEFAULT_CMS_CONFIG));
};

const updateCmsConfig = async (newConfig = {}, actor = 'admin') => {
    const current = await getCmsConfig();
    const merged = {
        ...current,
        ...newConfig,
        brand: { ...current.brand, ...(newConfig.brand || {}) },
        hero: { ...current.hero, ...(newConfig.hero || {}) },
        pillars: Array.isArray(newConfig.pillars) ? newConfig.pillars : current.pillars,
        services: Array.isArray(newConfig.services) ? newConfig.services : current.services,
        updatedAt: new Date().toISOString(),
        updatedBy: actor
    };

    try {
        await saveCmsToDb(merged, actor);
    } catch (err) {
        console.warn('Lỗi lưu cấu hình CMS lên CSDL:', err.message);
    }
    writeLocalCmsFile(merged);

    try {
        const io = getIo();
        io.emit('cms_config_updated', merged);
    } catch (err) {}

    return merged;
};

const resetCmsConfig = async (actor = 'admin') => {
    const fresh = {
        ...JSON.parse(JSON.stringify(DEFAULT_CMS_CONFIG)),
        updatedAt: new Date().toISOString(),
        updatedBy: actor
    };

    try {
        await saveCmsToDb(fresh, actor);
    } catch (err) {
        console.warn('Lỗi khôi phục cấu hình CMS trên CSDL:', err.message);
    }
    writeLocalCmsFile(fresh);

    try {
        const io = getIo();
        io.emit('cms_config_updated', fresh);
    } catch (err) {}

    return fresh;
};

module.exports = {
    getCmsConfig,
    updateCmsConfig,
    resetCmsConfig,
    DEFAULT_CMS_CONFIG
};
