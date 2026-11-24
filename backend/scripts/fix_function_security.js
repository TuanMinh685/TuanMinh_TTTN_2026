require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixFunctionSecurity() {
  const client = await pool.connect();
  try {
    console.log('[DB] Cập nhật search_path và quyền EXECUTE cho các function...');

    await client.query(`
      REVOKE EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() FROM PUBLIC;
      REVOKE EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() FROM anon;
      REVOKE EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() FROM authenticated;
      GRANT EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() TO postgres, service_role;
      ALTER FUNCTION public.sync_auth_users_to_nhan_vien() SET search_path = public, auth, pg_temp;
    `);
    console.log('[OK] Đã cập nhật sync_auth_users_to_nhan_vien.');

    await client.query(`
      REVOKE EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() FROM PUBLIC;
      REVOKE EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() FROM anon;
      REVOKE EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() FROM authenticated;
      GRANT EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() TO postgres, service_role;
      ALTER FUNCTION public.sync_nhan_vien_to_auth_users() SET search_path = public, auth, pg_temp;
    `);
    console.log('[OK] Đã cập nhật sync_nhan_vien_to_auth_users.');

    const verifyRes = await client.query(`
      SELECT proname, prosecdef, proconfig
      FROM pg_proc
      WHERE proname IN ('sync_nhan_vien_to_auth_users', 'sync_auth_users_to_nhan_vien');
    `);

    verifyRes.rows.forEach(r => {
      console.log(`- ${r.proname}: search_path = ${JSON.stringify(r.proconfig)}`);
    });

  } catch (err) {
    console.error('[DB] Lỗi:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixFunctionSecurity();
