require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function enableRLS() {
  const client = await pool.connect();
  try {
    console.log('[RLS] Kích hoạt Row Level Security cho schema public...');

    const tablesRes = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `);

    const tables = tablesRes.rows.map(r => r.tablename);
    console.log(`[RLS] Tìm thấy ${tables.length} bảng:`, tables.join(', '));

    for (const table of tables) {
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);

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

      console.log(`[OK] ${table}: đã bật RLS và tạo policy.`);
    }

    const checkRes = await client.query(`
      SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
    `);

    let allEnabled = true;
    checkRes.rows.forEach(r => {
      console.log(`- ${r.tablename}: RLS = ${r.rowsecurity ? 'true' : 'false'}`);
      if (!r.rowsecurity) allEnabled = false;
    });

    if (allEnabled) {
      console.log(`[OK] Đã bật RLS cho ${checkRes.rows.length} bảng.`);
    }
  } catch (err) {
    console.error('[RLS] Lỗi:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

enableRLS();
