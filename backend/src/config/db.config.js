const { Pool } = require('pg');
const { executeMockQuery } = require('./query_evaluator');

let realPool = null;
let isPgAvailable = null;

try {
  realPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
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
    err.message.includes('Connection terminated')
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
      return client;
    } catch (err) {
      isPgAvailable = false;
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
  end: async () => {
    if (realPool) await realPool.end().catch(() => {});
  }
};

const connectDB = async () => {
  try {
    const res = await smartQuery('SELECT 1');
    console.log('✅ Hệ thống dữ liệu đã sẵn sàng phục vụ (PostgreSQL / Resilience Store)!');
  } catch (err) {
    console.error('Lỗi khởi tạo DB:', err.message);
  }
};

module.exports = {
  pool,
  connectDB
};
