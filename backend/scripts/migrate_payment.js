require('dotenv').config();
const { pool } = require('../src/config/db.config');

async function main() {
  await pool.query(`
    ALTER TABLE phieu_sua_chua 
    ADD COLUMN IF NOT EXISTS phuong_thuc_thanh_toan VARCHAR(50) DEFAULT 'TIEN_MAT',
    ADD COLUMN IF NOT EXISTS ngay_thanh_toan TIMESTAMPTZ;
  `);
  console.log('Migration successful: phuong_thuc_thanh_toan & ngay_thanh_toan added');

  // Cập nhật ngay_thanh_toan cho các phiếu đã giao khách trước đó
  await pool.query(`
    UPDATE phieu_sua_chua 
    SET ngay_thanh_toan = ngay_cap_nhat 
    WHERE trang_thai = 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' AND ngay_thanh_toan IS NULL;
  `);
  console.log('Updated legacy paid tickets.');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
