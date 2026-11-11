const { Pool } = require('pg');
const { executeMockQuery } = require('./query_evaluator');

let realPool = null;
let isPgAvailable = null;

try {
  realPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  realPool.on('error', (err) => {
    // Không làm crash server khi pool mất kết nối
    isPgAvailable = false;
  });
} catch (e) {
  isPgAvailable = false;
}

const isConnectionFailure = (err) => {
  if (!err) return false;
  if (err.name === 'AggregateError') return true;
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '57P01', '08006'].includes(err.code)) return true;
  if (err.message && (
    err.message.includes('not found') || 
    err.message.includes('ENOTFOUND') || 
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('ETIMEDOUT') ||
    err.message.includes('tenant') ||
    err.message.includes('Connection terminated') ||
    err.message.includes('timeout expired')
  )) return true;
  return false;
};

const smartQuery = async (text, params) => {
  if (isPgAvailable !== false && realPool && process.env.DATABASE_URL) {
    try {
      const res = await realPool.query(text, params);
      isPgAvailable = true;
      return res;
    } catch (err) {
      if (isConnectionFailure(err)) {
        if (isPgAvailable !== false) {
          console.warn('⚠️ Supabase Cloud tạm dừng hoặc mạng gián đoạn. Tự động chuyển sang chế độ dữ liệu dự phòng (Local Resilience Store).');
          isPgAvailable = false;
        }
      } else {
        throw err;
      }
    }
  }

  // Fallback to local store
  return executeMockQuery(text, params);
};

const smartConnect = async () => {
  if (isPgAvailable !== false && realPool) {
    try {
      const client = await realPool.connect();
      await client.query("SET TIME ZONE 'Asia/Ho_Chi_Minh'").catch(() => {});
      isPgAvailable = true;
      return client;
    } catch (err) {
      if (isConnectionFailure(err)) {
        isPgAvailable = false;
      } else {
        throw err;
      }
    }
  }

  // Trả về mock client tương thích transaction
  return {
    query: async (text, params) => smartQuery(text, params),
    release: () => {}
  };
};

const pool = {
  query: smartQuery,
  connect: smartConnect,
  isCloudConnected: () => isPgAvailable === true,
  end: async () => {
    if (realPool) await realPool.end().catch(() => {});
  }
};

const connectDB = async () => {
  try {
    await smartQuery("SET TIME ZONE 'Asia/Ho_Chi_Minh'");
    const res = await smartQuery("SELECT current_database() AS db, current_setting('TIMEZONE') AS tz, NOW() AS now");
    if (isPgAvailable) {
      console.log(`✅ Đã kết nối trực tiếp Supabase PostgreSQL Cloud (DB: ${res.rows[0]?.db} | Timezone: ${res.rows[0]?.tz})!`);
    } else {
      console.log('✅ Hệ thống dữ liệu đã sẵn sàng phục vụ (Local Resilience Store)!');
    }

    // Tự động khởi tạo & đồng bộ bảng nhan_vien cùng 4 tài khoản mặc định (mật khẩu 123456)
    try {
      const hash123456 = '$2b$10$2onTZ.SM4KAAikmPd678XOEjmmntsJtGFuzE9oeSRqDP0W0tts8ni';
      await smartQuery(`
        CREATE TABLE IF NOT EXISTS nhan_vien (
          id SERIAL PRIMARY KEY,
          ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
          mat_khau VARCHAR(255) NOT NULL,
          ho_ten VARCHAR(100) NOT NULL,
          vai_tro VARCHAR(30) DEFAULT 'KY_THUAT_VIEN',
          trang_thai VARCHAR(20) DEFAULT 'HOAT_DONG',
          ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await smartQuery(`
        INSERT INTO nhan_vien (ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai)
        VALUES 
          ('admin', '${hash123456}', 'Lê Trần Tuấn Minh (Quản Trị Hệ Thống)', 'ADMIN', 'HOAT_DONG'),
          ('letan', '${hash123456}', 'Nguyễn Thị Lễ Tân (Tiếp Nhận QR)', 'LE_TAN', 'HOAT_DONG'),
          ('kythuat', '${hash123456}', 'Trần Văn Hỗ Trợ (Kỹ Thuật CSKH)', 'KY_THUAT_VIEN', 'HOAT_DONG'),
          ('quanly', '${hash123456}', 'Phạm Quản Lý (Trưởng BP CSKH)', 'QUAN_LY', 'HOAT_DONG')
        ON CONFLICT (ten_dang_nhap) DO UPDATE 
        SET mat_khau = EXCLUDED.mat_khau, trang_thai = 'HOAT_DONG';
      `);
      console.log('✅ Đã đồng bộ 4 tài khoản demo (admin, letan, kythuat, quanly) với mật khẩu 123456!');
    } catch (seedErr) {
      console.warn('⚠️ Ghi chú đồng bộ tài khoản:', seedErr.message);
    }
  } catch (err) {
    console.error('Lỗi khởi tạo DB:', err.message);
  }
};

module.exports = {
  pool,
  connectDB
};
