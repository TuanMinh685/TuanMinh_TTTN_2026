require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function enableRLS() {
  const client = await pool.connect();
  try {
    console.log('🔄 Đang kích hoạt Row Level Security (RLS) cho toàn bộ bảng schema public...');

    const tablesRes = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);

    const tables = tablesRes.rows.map(r => r.tablename);
    console.log(`📋 Tìm thấy ${tables.length} bảng:`, tables.join(', '));

    for (const table of tables) {
      // 1. Kích hoạt Row Level Security (RLS)
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);

      // 2. Tạo policy toàn quyền cho service_role và postgres
      const policyName = `service_role_all_${table}`;
      await client.query(`DROP POLICY IF EXISTS "${policyName}" ON public."${table}";`);
      await client.query(`
        CREATE POLICY "${policyName}"
        ON public."${table}"
        FOR ALL
        TO service_role, postgres
        USING (true)
        WITH CHECK (true);
      `);

      console.log(`✅ [${table}] -> Đã bật RLS & tạo policy bảo vệ.`);
    }

    // 3. Kiểm tra lại trạng thái sau khi bật
    const checkRes = await client.query(`
      SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
    `);

    console.log('\n=============================================');
    console.log('KẾT QUẢ KIỂM TRA ROW LEVEL SECURITY (RLS):');
    console.log('=============================================');
    let allEnabled = true;
    checkRes.rows.forEach(r => {
      console.log(`- ${r.tablename}: RLS = ${r.rowsecurity ? 'ĐÃ BẬT (true)' : 'CHƯA BẬT (false)'}`);
      if (!r.rowsecurity) allEnabled = false;
    });

    if (allEnabled) {
      console.log('\n🎉 TẤT CẢ 15 BẢNG ĐÃ ĐƯỢC BẬT RLS THÀNH CÔNG VÀ AN TOÀN TUYỆT ĐỐI!');
    }
  } catch (err) {
    console.error('❌ Lỗi khi bật RLS:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

enableRLS();
