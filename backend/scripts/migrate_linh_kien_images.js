require('dotenv').config({ path: 'd:/qr-repair-system/TTTN-CSKH_QR/backend/.env' });
const { pool } = require('../src/config/db.config.js');

const IMAGES = {
  1: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80', // RAM Kingston
  2: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80', // RAM Samsung DDR5
  3: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80', // SSD Kingston NV2
  4: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80', // SSD Samsung 980 Pro
  5: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80', // Pin Dell
  6: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80', // Màn hình 15.6 IPS
  7: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', // Phím Asus TUF
  8: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', // Arctic MX-4
  9: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80', // Sạc Macbook Type-C
  10: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80', // RAM Corsair 32GB
  11: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80', // RAM Crucial 16GB
  12: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=600&q=80', // SSD Kingston A400
  13: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80', // SSD Crucial P3
  14: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80', // SSD Samsung 990 Pro
  15: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80', // Pin Asus
  16: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80', // Pin Lenovo Thinkpad
  17: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80', // Pin HP Pavilion
  18: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80', // Pin Macbook Air
  19: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80', // Màn hình 14.0
  20: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80', // Màn hình 15.6 2K 165Hz
  21: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80', // Hàn bản lề
  22: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', // Phím Dell Inspiron
  23: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', // Phím Thinkpad
  24: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80', // Sạc Type-C 65W GaN
  25: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80', // Sạc Dell 65W chân kim
  26: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', // Thermal Grizzly
  27: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80', // Quạt tản nhiệt
  28: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80', // Cài Win 10/11 Pro
  29: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80', // Office 365
  30: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', // Adobe 2024
  31: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=600&q=80'  // Cứu dữ liệu ổ cứng
};

async function seed() {
  console.log('Cập nhật hình ảnh vào bảng linh_kien...');
  for (const [id, url] of Object.entries(IMAGES)) {
    await pool.query('UPDATE linh_kien SET hinh_anh = $1 WHERE id = $2', [url, Number(id)]);
  }
  console.log('✅ Đã cập nhật xong hình ảnh cho toàn bộ 31 linh kiện!');
  
  // Verify
  const check = await pool.query('SELECT count(*) as count FROM linh_kien WHERE hinh_anh IS NOT NULL');
  console.log('Số lượng linh kiện đã có hình ảnh:', check.rows[0].count);
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
