# QR Repair Ticket System

Hệ thống tiếp nhận và theo dõi phiếu sửa chữa thiết bị qua QR, gồm giao diện khách hàng và cổng làm việc cho nhân viên.

## Công nghệ

- Frontend: React 19, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL
- Đăng nhập: JWT

## Yêu cầu

- Node.js 20.19+ hoặc 22.12+ (Vite 8 yêu cầu các phiên bản này)
- npm
- PostgreSQL và database có schema tương thích với backend

## Cài đặt trên Windows PowerShell

### 1. Cấu hình backend

```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\backend
npm install
Copy-Item .env.example .env
```

Mở `backend\.env`, đặt `DATABASE_URL` tới PostgreSQL của bạn và thay `JWT_SECRET` bằng một giá trị ngẫu nhiên, riêng cho môi trường đó. Không dùng thông tin database hoặc JWT secret của production trong môi trường chia sẻ.

Backend hiện truy vấn các bảng tiếng Việt, ví dụ `nhan_vien`, `phieu_sua_chua`, `thiet_bi` và `khach_hang`. File `backend\database\01_init_schema_english.sql` định nghĩa một schema tiếng Anh khác, nên không tương thích trực tiếp với các truy vấn backend hiện tại. Cần dùng schema đúng với code trước khi chạy các API; không chạy file SQL này lên database production.

### 2. Cấu hình frontend

Mở một terminal PowerShell khác:

```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\frontend
npm install
Copy-Item .env.example .env
```

Giá trị local mặc định trong `frontend\.env.example` gọi backend tại `http://localhost:5001/api`. Nếu đổi port backend, cập nhật `VITE_API_URL` tương ứng. Sau khi sửa `.env`, khởi động lại Vite.

### 3. Chạy ứng dụng

Terminal backend:

```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\backend
$env:PORT = "5001"
npm start
```

Terminal frontend:

```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\frontend
npm run dev
```

Truy cập frontend tại http://localhost:5173 và backend API tại http://localhost:5001/api. Cổng đăng nhập nhân viên ở đường dẫn `/login`; cần tài khoản có sẵn trong database để đăng nhập.

Khi deploy, đặt `VITE_API_URL` thành URL API của backend và đặt `CORS_ORIGIN` ở backend thành URL frontend đã deploy. Không dùng URL local trong môi trường production.

## Kiểm tra

```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\frontend
npm run lint
npm run build
```

Backend hiện chưa có bộ test tự động được cấu hình. `npm test` chưa chạy test nghiệp vụ.

## An toàn thông tin

- Không commit `.env`, `.env.vercel`, token, mật khẩu hoặc thông tin kết nối database.
- Chỉ đưa giá trị giả lập vào các file `.env.example`.
- Nếu một secret đã từng được đẩy lên remote, hãy thu hồi/thay secret đó ở nhà cung cấp và cập nhật môi trường deploy. Xóa file ở commit mới không xóa secret khỏi lịch sử Git.

## Tính năng chính

- Tiếp nhận phiếu sửa chữa và đặt lịch
- Tra cứu tiến độ theo mã phiếu hoặc số điện thoại
- Cập nhật phiếu và quản lý từ cổng nhân viên
- Duyệt báo giá và gửi đánh giá
