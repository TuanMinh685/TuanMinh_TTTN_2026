require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixFunctionSecurity() {
  const client = await pool.connect();
  try {
    console.log('🔄 Bắt đầu khắc phục các cảnh báo bảo mật function trên Supabase...');

    // 1. Thu hồi quyền EXECUTE của PUBLIC, anon, authenticated trên sync_auth_users_to_nhan_vien
    await client.query(`
      REVOKE EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() FROM PUBLIC;
      REVOKE EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() FROM anon;
      REVOKE EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() FROM authenticated;
      GRANT EXECUTE ON FUNCTION public.sync_auth_users_to_nhan_vien() TO postgres, service_role;
      ALTER FUNCTION public.sync_auth_users_to_nhan_vien() SET search_path = public, auth, pg_temp;
    `);
    console.log('✅ Đã bảo mật function sync_auth_users_to_nhan_vien: search_path cố định & thu hồi quyền anon/authenticated.');

    // 2. Thu hồi quyền EXECUTE của PUBLIC, anon, authenticated trên sync_nhan_vien_to_auth_users
    await client.query(`
      REVOKE EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() FROM PUBLIC;
      REVOKE EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() FROM anon;
      REVOKE EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() FROM authenticated;
      GRANT EXECUTE ON FUNCTION public.sync_nhan_vien_to_auth_users() TO postgres, service_role;
      ALTER FUNCTION public.sync_nhan_vien_to_auth_users() SET search_path = public, auth, pg_temp;
    `);
    console.log('✅ Đã bảo mật function sync_nhan_vien_to_auth_users: search_path cố định & thu hồi quyền anon/authenticated.');

    // Kiểm tra lại cấu hình
    const verifyRes = await client.query(`
      SELECT proname, prosecdef, proconfig
      FROM pg_proc
      WHERE proname IN ('sync_nhan_vien_to_auth_users', 'sync_auth_users_to_nhan_vien');
    `);

    console.log('\n--- KẾT QUẢ CẤU HÌNH SEARCH_PATH SAU KHI SỬA ---');
    verifyRes.rows.forEach(r => {
      console.log(`- ${r.proname}: search_path = ${JSON.stringify(r.proconfig)}`);
    });

  } catch (err) {
    console.error('❌ Lỗi khi cập nhật bảo mật function:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixFunctionSecurity();
