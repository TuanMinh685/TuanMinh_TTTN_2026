const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db.config');

async function standardizeDatabase() {
    console.log('🔄 Đang chuẩn hóa Cơ sở dữ liệu PostgreSQL theo đề tài: Hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng...');
    try {
        // 1. Xóa hoàn toàn 2 bảng kho linh kiện & chi tiết linh kiện (không thuộc đề tài CSKH)
        await pool.query('DROP TABLE IF EXISTS phieu_linh_kien CASCADE');
        await pool.query('DROP TABLE IF EXISTS linh_kien CASCADE');
        console.log('✅ Đã xóa các bảng không liên quan: linh_kien, phieu_linh_kien');

        // 2. Xóa các cột báo giá, thu tiền, giảm giá sinh viên khỏi bảng phieu_sua_chua
        await pool.query(`
            ALTER TABLE phieu_sua_chua
            DROP COLUMN IF EXISTS tong_tien,
            DROP COLUMN IF EXISTS giam_gia_sinh_vien,
            DROP COLUMN IF EXISTS tien_sau_giam,
            DROP COLUMN IF EXISTS la_sinh_vien,
            DROP COLUMN IF EXISTS truong_hoc,
            DROP COLUMN IF EXISTS ma_sinh_vien,
            DROP COLUMN IF EXISTS phuong_thuc_thanh_toan,
            DROP COLUMN IF EXISTS ngay_thanh_toan,
            DROP COLUMN IF EXISTS ma_ultraviewer
        `);
        console.log('✅ Đã loại bỏ các cột báo giá / thanh toán / giảm giá khỏi bảng phieu_sua_chua');

        // 3. Xóa các cột giảm giá sinh viên khỏi bảng khach_hang
        await pool.query(`
            ALTER TABLE khach_hang
            DROP COLUMN IF EXISTS la_sinh_vien,
            DROP COLUMN IF EXISTS truong_hoc,
            DROP COLUMN IF EXISTS ma_sinh_vien,
            DROP COLUMN IF EXISTS diem_tich_luy,
            DROP COLUMN IF EXISTS hang_thanh_vien
        `);
        console.log('✅ Đã chuẩn hóa bảng khach_hang (chỉ lưu thông tin liên hệ CSKH)');

        // 4. Chuẩn hóa danh sách tài khoản nhân sự về 4 vai trò CSKH (Xóa ketoan, thukho, giamdoc)
        await pool.query(`DELETE FROM nhan_vien WHERE ten_dang_nhap IN ('ketoan', 'thukho', 'giamdoc')`);
        await pool.query(`UPDATE nhan_vien SET ho_ten = 'Lê Trần Tuấn Minh (Quản Trị Hệ Thống CSKH)', vai_tro = 'ADMIN' WHERE ten_dang_nhap = 'admin'`);
        await pool.query(`UPDATE nhan_vien SET ho_ten = 'Phạm Quản Lý (Trưởng Bộ Phận CSKH)', vai_tro = 'QUAN_LY' WHERE ten_dang_nhap = 'quanly'`);
        await pool.query(`UPDATE nhan_vien SET ho_ten = 'Trần Văn Hỗ Trợ (Chuyên Viên CSKH)', vai_tro = 'KY_THUAT_VIEN' WHERE ten_dang_nhap = 'kythuat'`);
        await pool.query(`UPDATE nhan_vien SET ho_ten = 'Nguyễn Thị Lễ Tân (Tiếp Nhận QR)', vai_tro = 'LE_TAN' WHERE ten_dang_nhap = 'letan'`);
        console.log('✅ Đã chuẩn hóa bảng nhan_vien theo 4 vai trò bộ phận CSKH');

        // 5. Chuyển các phiếu đang ở trạng thái CHỜ_KHÁCH_CHỐT_GIÁ sang ĐANG_CHUẨN_ĐOÁN & làm sạch nhật ký báo giá
        await pool.query(`UPDATE phieu_sua_chua SET trang_thai = 'ĐANG_CHUẨN_ĐOÁN' WHERE trang_thai = 'CHỜ_KHÁCH_CHỐT_GIÁ'`);
        await pool.query(`DELETE FROM nhat_ky_sua_chua WHERE trang_thai_moi = 'CHỜ_KHÁCH_CHỐT_GIÁ' OR ghi_chu ILIKE '%báo giá%'`);
        await pool.query(`
            UPDATE nhat_ky_sua_chua
            SET ghi_chu = 'Đã hoàn tất chăm sóc khách hàng, bàn giao hồ sơ và kích hoạt Sổ bảo hành điện tử (e-Warranty 180 ngày)'
            WHERE trang_thai_moi = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
        `);
        await pool.query(`
            UPDATE danh_gia
            SET nhan_xet = 'Dịch vụ chăm sóc khách hàng tại MYH Group rất chu đáo, quét mã QR theo dõi tiến độ và sổ bảo hành điện tử cực kỳ tiện lợi!'
            WHERE nhan_xet ILIKE '%sinh viên%' OR nhan_xet ILIKE '%KTV%'
        `);
        console.log('✅ Đã làm sạch dữ liệu hồ sơ & nhật ký xử lý theo đúng quy trình CSKH (không còn báo giá)');

        console.log('🎉 Hoàn tất chuẩn hóa Cơ sở dữ liệu Hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi chuẩn hóa DB:', error);
        process.exit(1);
    }
}

standardizeDatabase();
