const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

async function cleanUnusedDatabase() {
    const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
    console.log('🔄 Đang kết nối Supabase Cloud để kiểm tra và dọn dẹp các bảng không sử dụng...');
    
    const pool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Kiểm tra danh sách bảng trước khi xóa
        const beforeRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('📋 Danh sách bảng HIỆN TẠI trong Supabase:', beforeRes.rows.map(r => r.table_name));

        // 2. Xóa các bảng tiếng Anh cũ dư thừa không còn sử dụng
        console.log('🗑️ Tiến hành DROP các bảng tiếng Anh dư thừa (accounts, customers, devices, tickets)...');
        await pool.query('DROP TABLE IF EXISTS tickets CASCADE;');
        await pool.query('DROP TABLE IF EXISTS devices CASCADE;');
        await pool.query('DROP TABLE IF EXISTS customers CASCADE;');
        await pool.query('DROP TABLE IF EXISTS accounts CASCADE;');
        console.log('✅ Đã xóa sạch 4 bảng dư thừa: tickets, devices, customers, accounts!');

        // 3. Kiểm tra danh sách bảng sau khi xóa
        const afterRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('\n✨ Danh sách bảng CHUẨN XÁC sau khi dọn dẹp:');
        afterRes.rows.forEach((r, idx) => {
            console.log(`  ${idx + 1}. ${r.table_name}`);
        });

        await pool.end();
        console.log('\n🎉 Hoàn tất dọn dẹp cơ sở dữ liệu Supabase!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi khi dọn dẹp DB:', err);
        process.exit(1);
    }
}

cleanUnusedDatabase();
