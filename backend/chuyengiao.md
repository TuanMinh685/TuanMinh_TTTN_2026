# TÀI LIỆU CHUYỂN GIAO: BACKEND HỆ THỐNG CSKH SỬA CHỮA MÁY TÍNH BẰNG QR
**Người thực hiện:** Lê Nhựt Hào
**Ngày chuyển giao:** 03/10/2026

Tài liệu này tổng hợp toàn bộ các tính năng, kỹ thuật và tài nguyên của hệ thống Backend đã hoàn thiện 100%, sẵn sàng bàn giao cho đội Frontend và Mobile App để tiến hành ghép nối.

---

## 1. THÔNG TIN HỆ THỐNG (TECH STACK)
- **Ngôn ngữ & Nền tảng:** Node.js, Express.js.
- **Cơ sở dữ liệu (Cloud):** PostgreSQL trên Supabase.
- **Máy chủ triển khai (Hosting):** Vercel (Serverless).
- **Cơ chế bảo mật:** JWT (JSON Web Token), `bcrypt` (mã hóa mật khẩu), `express-rate-limit` (chống DDoS).

---

## 2. TÀI NGUYÊN ĐÃ ĐƯỢC TRIỂN KHAI THỰC TẾ
- **API URL (Production):** `https://tttn-backend-qr.vercel.app`
- **Mã nguồn (GitHub):** `https://github.com/LEHAOK5/TTTN-Backend-QR.git`
- **Tài khoản test hệ thống:** 
  - Lễ tân: `letan` / Mật khẩu: `123456`
  - Kỹ thuật viên: `kythuat` / Mật khẩu: `123456`
  - Admin: `admin` / Mật khẩu: `123456`

---

## 3. CÁC TÍNH NĂNG VÀ API ĐÃ HOÀN THIỆN
Toàn bộ luồng tiếp nhận Yêu cầu sửa chữa qua mã QR đã được lập trình hoàn chỉnh với các đường link API sau:

### 3.1. Phân quyền và Bảo mật
- Lập trình Middleware `verifyToken`: Bắt buộc người dùng nội bộ (Lễ tân, KTV) phải có Token mới được gọi API.
- Lập trình Middleware `requireRole`: Ngăn chặn việc Lễ tân gọi nhầm chức năng của KTV.
- **API Đăng nhập (`POST /api/auth/login`):** Dùng để Frontend cấp Token (Thời hạn 24 giờ) cho Nhân viên khi họ vào ca trực.

### 3.2. Luồng Khởi tạo QR Code (Quầy Lễ tân)
- **API Khởi tạo Phiên QR (`POST /api/tickets/init-session`):** 
  - Yêu cầu: Quyền Lễ tân hoặc Admin.
  - Chức năng: Backend sinh ra một mã định danh duy nhất (`sessionToken`), mã này sẽ được Frontend ép vào hình ảnh QR Code. Mã có giới hạn thời gian sống (15 phút) để tránh bị copy.

### 3.3. Luồng Khách hàng Tự phục vụ (Quét QR)
- **API Kiểm tra Phiên (`GET /api/tickets/session/:token`):**
  - Chức năng: Khi khách hàng dùng điện thoại quét mã QR, API này sẽ kiểm tra xem mã QR có còn hạn hay không, ngăn chặn việc quét lại mã cũ của ngày hôm qua.
- **API Cung cấp Danh mục Thiết bị (`GET /api/devices`):**
  - Chức năng: Trả về danh sách hãng máy tính/điện thoại từ Database để hiển thị dạng Dropdown List trên điện thoại khách hàng.
- **API Nộp phiếu Báo lỗi (`POST /api/tickets/session/:token/submit`):**
  - Chức năng: Bóc tách thông tin khách hàng gõ trên điện thoại (Họ tên, SĐT, Mô tả lỗi) và ghi thẳng vào Supabase với trạng thái `PENDING` (Chờ xử lý).

### 3.4. Hệ thống Tường lửa bảo vệ
- Đã cài đặt chặn SPAM (Rate Limit) tại API Submit của Khách hàng: Giới hạn 10 lần gửi trong 10 phút. Nếu cố tình phá hoại bằng cách bấm gửi liên tục, Backend sẽ báo lỗi `429 Too Many Requests`.

---

## 4. HƯỚNG DẪN CẤU HÌNH CHO TEAM (ENVIRONMENT VARIABLES)
Nếu các bạn trong team muốn kéo code này về chạy trên máy tính cá nhân (localhost), bắt buộc phải tạo file `.env` ở thư mục `backend/` và điền 3 biến môi trường sau:

```env
PORT=3000
# Link Database của Supabase
DATABASE_URL="postgres://postgres.xxx:mật_khẩu_supabase@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
# Mã bí mật để ký Token (Tuyệt đối không tiết lộ)
JWT_SECRET="lucgiac_secret_key_12345"
# Cho phép Frontend gọi API
CORS_ORIGIN="*"
```

---
*Tài liệu này được biên soạn nhằm đảm bảo quá trình tích hợp giữa Backend, Frontend và Mobile diễn ra suôn sẻ, không gặp xung đột về dữ liệu.*
