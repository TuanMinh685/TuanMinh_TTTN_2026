# TỔNG HỢP THÔNG TIN CHUYỂN GIAO DỰ ÁN
**Dự án:** Hệ thống CSKH & Quản lý sửa chữa bằng mã QR (HungHau IT Support)
**Mô hình hoạt động:** Client - Server (ReactJS - NodeJS - PostgreSQL)

---

## 1. TỔNG QUAN CÔNG NGHỆ (TECH STACK)
*   **Frontend:** ReactJS (Vite), TailwindCSS, Recharts (Vẽ biểu đồ), React Router DOM.
*   **Backend:** NodeJS, ExpressJS, CORS, JWT (Xác thực).
*   **Cơ sở dữ liệu (Database):** PostgreSQL (Lưu trữ đám mây qua **Supabase**).
*   **Triển khai (Deployment):** Máy chủ **Vercel** (Dành cho Backend Serverless).

---

## 2. THÔNG TIN DATABASE (SUPABASE)
Toàn bộ dữ liệu của hệ thống không lưu trên máy tính cá nhân mà đang được lưu trữ bảo mật trên đám mây của **Supabase**.
*   **Loại Database:** PostgreSQL.
*   **Chuỗi kết nối (Connection String):**
    `postgresql://postgres.apcpimhqbgahhcemsicj:[MẬT_KHẨU]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
*   **Các bảng (Tables) chính:**
    1.  `users`: Lưu tài khoản nhân viên (Admin, Quản lý, Lễ tân, Kỹ thuật viên).
    2.  `phieu_sua_chua`: Lưu thông tin vé sửa chữa/bảo hành của khách hàng (Ticket).
    3.  `linh_kien`: Quản lý kho linh kiện, giá cả, số lượng tồn.
    4.  `lich_hen`: Quản lý khách hàng đặt lịch hẹn online.
    5.  `danh_gia`: Lưu đánh giá (Rating/Feedback) và điểm tích lũy của khách hàng.

---

## 3. THÔNG TIN BACKEND (NODEJS / EXPRESS)
Backend chịu trách nhiệm giao tiếp với Database, tính toán logic và cung cấp API cho Frontend.

*   **Tình trạng:** Đã được đóng gói và **Deploy thành công lên Vercel**.
*   **Production API URL (Link API hoạt động chính thức):**
    👉 `https://backend-murex-chi-18.vercel.app/api`
*   **Cấu trúc biến môi trường (`backend/.env`):**
    ```env
    PORT=5000
    DATABASE_URL=postgresql://[TÀI_KHOẢN]:[MẬT_KHẨU]@[HOST]/postgres
    JWT_SECRET=super_secret_jwt_key_cho_du_an_tttn_lehao
    CORS_ORIGIN=*
    ```
*   **Lưu ý quan trọng trên Vercel:** Do Vercel là môi trường Serverless (Hàm không máy chủ), tính năng WebSocket (`Socket.io`) đã được vô hiệu hóa để tránh gây lỗi tràn bộ nhớ / timeout. Các tính năng cập nhật thời gian thực (Real-time) thay vào đó có thể áp dụng cơ chế Polling hoặc Supabase Realtime nếu cần thiết trong tương lai.

---

## 4. THÔNG TIN FRONTEND (REACT / VITE)
Frontend là giao diện người dùng, nơi khách hàng tương tác và nhân viên quản lý.

*   **Lệnh khởi chạy (Local):** `npm run dev` (Chạy ở cổng mặc định `http://localhost:5173`).
*   **Cấu trúc biến môi trường (`frontend/.env`):**
    ```env
    VITE_API_URL=https://backend-murex-chi-18.vercel.app/api
    ```
    *(Ghi chú: Frontend sẽ tự động đọc biến này để kết nối với Backend trên Vercel. Nhờ vậy, máy local không cần bật Backend bằng tay nữa).*
*   **Hệ thống Routing (Đường dẫn trang):**
    *   `/` : Trang chủ (Home/Landing Page).
    *   `/dat-lich` : Khách hàng đặt lịch hẹn.
    *   `/tra-cuu` : Khách hàng tra cứu trạng thái sửa chữa, thanh toán.
    *   `/intake` : Form quét mã QR tạo phiếu (dành cho Khách tại quầy).
    *   `/login` : Cổng đăng nhập của Nhân viên / Quản lý.
    *   `/admin` : Bảng điều khiển (Dashboard) của nhân viên. Tùy theo vai trò (Role) đăng nhập sẽ hiển thị tính năng khác nhau:
        *   **Lễ Tân:** Chăm sóc khách, Nhận máy, Quản lý lịch hẹn.
        *   **Kỹ Thuật Viên:** Bấm nút "Sửa", Thêm linh kiện báo giá.
        *   **Quản Lý / Admin:** Xem toàn bộ tính năng và Biểu đồ thống kê doanh thu.

---

## 5. HƯỚNG DẪN KIỂM THỬ (TESTING) NHANH
1. **Dành cho Khách hàng:** Truy cập `http://localhost:5173/`, thử bấm "Gửi Yêu Cầu Sửa Chữa" hoặc "Đặt Lịch".
2. **Dành cho Nhân viên:** 
    * Mở Tab ẩn danh, truy cập `http://localhost:5173/login`.
    * Đăng nhập tài khoản Lễ tân -> Xác nhận lịch hẹn hoặc chuyển máy cho Kỹ thuật.
    * Đăng nhập tài khoản Kỹ thuật -> Tiến hành "Sửa Xong" và Thêm phụ kiện.
    * Đăng nhập tài khoản Quản lý -> Vào Tab "Thống Kê Doanh Thu" kiểm tra tiền và biểu đồ.
3. **Cập nhật Vercel (Nếu sau này sửa Backend):**
    * Mở Terminal chạy lệnh `npx vercel --prod`
    * Hoặc Push Code lên Github (nếu đã liên kết Vercel Github) để hệ thống tự động Deploy bản mới nhất.
