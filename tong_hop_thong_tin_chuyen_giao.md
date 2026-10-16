# TỔNG HỢP THÔNG TIN CHUYỂN GIAO DỰ ÁN

**Dự án:** Hệ thống CSKH & Quản lý sửa chữa bằng mã QR (HungHau IT Support)  
**Địa chỉ trụ sở:** **615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh**  
**Hotline:** `(+84) 28 3860 4999` / `(028) 3860 4999`  
**Mô hình kiến trúc:** Client - Server (ReactJS 19 - NodeJS Express - Supabase PostgreSQL)  

---

## 1. TỔNG QUAN CÔNG NGHỆ (TECH STACK)

* **Frontend:** React 19, Vite, Tailwind CSS, Lucide React, Recharts (vẽ biểu đồ doanh thu & tỷ lệ trạng thái phiếu), React Router DOM v7.
* **Backend:** Node.js, Express, Helmet (bảo mật header), CORS, JSON Web Token (JWT), Express Rate Limit, Express Validator.
* **Cơ sở dữ liệu (Database):** PostgreSQL được lưu trữ và tối ưu hóa đám mây qua **Supabase Cloud** (Region Singapore `ap-southeast-1`).
* **Mô hình cập nhật tiến độ:** Cơ chế Polling 30 giây định kỳ tại trang Tracking, tự động dọn dẹp interval và gắn cờ hủy request (`active = false`) khi chuyển trang. Cơ chế này tương thích 100% với kiến trúc Serverless trên Vercel (khắc phục nhược điểm mất kết nối của WebSocket/Socket.io trên môi trường không máy chủ).
* **Quét mã QR & In ấn:** Quét mã QR trực tiếp qua Camera điện thoại/webcam máy tính (`html5-qrcode`) và hỗ trợ in phiếu tiếp nhận khổ nhiệt 80mm tích hợp mã QR tra cứu.

---

## 2. THÔNG TIN DATABASE (SUPABASE)

Toàn bộ dữ liệu của hệ thống được lưu trữ bảo mật trên đám mây của **Supabase**.

* **Loại Database:** PostgreSQL 15+.
* **Host kết nối (Connection String):**
  `postgresql://postgres.apcpimhqbgahhcemsicj:[MAT_KHAU]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
* **Các bảng (Tables) chính:**
  1. `nhan_vien` / `users`: Lưu thông tin tài khoản, mật khẩu băm bcrypt và vai trò phân quyền (`LE_TAN`, `KY_THUAT_VIEN`, `QUAN_LY`, `ADMIN`).
  2. `phieu_sua_chua`: Lưu thông tin phiếu tiếp nhận, mã tra cứu QR (`ma_tra_cuu`), tình trạng thiết bị, tiến độ xử lý, tổng tiền và trạng thái duyệt báo giá (`trang_thai_bao_gia`).
  3. `linh_kien`: Quản lý kho linh kiện, giá vốn, giá bán, số lượng tồn kho và ngưỡng cảnh báo tồn tối thiểu.
  4. `chi_tiet_phieu`: Lưu chi tiết các linh kiện, dịch vụ và phụ kiện được thêm vào từng phiếu sửa chữa.
  5. `lich_hen`: Quản lý lịch hẹn đặt trước online của khách hàng (Zalo, ngày/giờ hẹn, loại dịch vụ tại quầy hoặc từ xa, gói phần mềm yêu cầu).
  6. `danh_gia`: Lưu đánh giá 1-5 sao, nhận xét khách hàng (tối đa 1000 ký tự) và hiển thị top phản hồi tích cực lên trang chủ.

---

## 3. THÔNG TIN BACKEND & API (NODEJS / EXPRESS)

Backend chịu trách nhiệm cung cấp API RESTful, kiểm tra quyền hạn JWT và xử lý nghiệp vụ sửa chữa.

* **Trạng thái triển khai:** Đã deploy và chạy ổn định trên **Vercel Serverless Functions**.
* **Production API Base URL:**
  👉 `https://backend-murex-chi-18.vercel.app/api`
* **Cấu hình biến môi trường (`backend/.env`):**
  ```env
  PORT=5001
  DATABASE_URL=postgresql://postgres.apcpimhqbgahhcemsicj:[MAT_KHAU]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  JWT_SECRET=super_secret_jwt_key_hung_hau_it_support_2026
  CORS_ORIGIN=*
  ```
* **Danh sách các Endpoints chính:**
  - `POST /api/auth/login`: Đăng nhập cấp JWT token và vai trò người dùng.
  - `GET /api/auth/me`: Xác thực token và lấy thông tin phiên làm việc hiện tại.
  - `GET /api/public/pricing`: Lấy bảng giá niêm yết linh kiện & dịch vụ.
  - `GET /api/public/reviews/top`: Lấy danh sách top đánh giá 5 sao hiển thị lên Landing Page.
  - `POST /api/tickets/intake`: Khách hàng quét QR gửi phiếu tiếp nhận thiết bị tại quầy.
  - `POST /api/tickets/booking`: Khách hàng đặt lịch hẹn sửa chữa trực tuyến.
  - `GET /api/public/track/:code`: Tra cứu thông tin phiếu bằng mã phiếu / mã QR.
  - `GET /api/public/track/phone/:phone`: Tra cứu lịch sử phiếu sửa chữa theo số điện thoại.
  - `POST /api/tickets/approve-quote`: Khách hàng bấm Đồng ý hoặc Từ chối báo giá sửa chữa.
  - `POST /api/tickets/review`: Khách hàng gửi đánh giá và nhận xét 1-5 sao.
  - `GET /api/tickets`: Lấy danh sách phiếu sửa chữa (dành cho Lễ tân / KTV / Quản lý).
  - `POST /api/tickets/:id/items`: Kỹ thuật viên thêm linh kiện, công dịch vụ vào phiếu để báo giá.
  - `PATCH /api/tickets/:id/status`: Cập nhật tiến độ xử lý của phiếu (`MỚI TIẾP NHẬN` -> `ĐANG KIỂM TRA` -> `CHỜ DUYỆT BÁO GIÁ` -> `ĐANG SỬA CHỮA` -> `HOÀN THÀNH` -> `ĐÃ TRẢ KHÁCH`).
  - `GET /api/admin/dashboard-stats`: Thống kê doanh thu, số lượng phiếu và phân bố trạng thái.
  - `GET /api/tickets/parts`: Quản lý danh mục kho linh kiện và cảnh báo tồn kho.

---

## 4. THÔNG TIN FRONTEND & HỆ THỐNG ROUTE (REACT / VITE)

* **Cấu hình biến môi trường (`frontend/.env`):**
  ```env
  VITE_API_URL=https://backend-murex-chi-18.vercel.app/api
  ```
  *(Khi chạy Local có thể trỏ về `http://localhost:5001/api` hoặc dùng trực tiếp Cloud API của Vercel).*
* **Sơ đồ Route chi tiết:**
  - `/` : Trang chủ (Landing Page) giới thiệu quy trình sửa chữa QR, khối top đánh giá khách hàng, địa chỉ chính thức **615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM**.
  - `/bang-gia` : Bảng giá minh bạch với bộ lọc thời gian thực và nút chuyển nhanh sang đặt lịch hẹn.
  - `/dat-lich` : Đặt lịch hẹn sửa chữa nâng cao, hỗ trợ số Zalo, ngày/giờ, dịch vụ tại cửa hàng hoặc online từ xa, kèm gói cài đặt phần mềm.
  - `/tra-cuu` : Trang tra cứu đa kênh: Nhập mã phiếu, quét mã QR qua Camera máy tính/điện thoại, hoặc tra cứu theo số điện thoại.
  - `/track/:ticketCode` : Trang theo dõi tiến độ chi tiết, tích hợp Polling 30s near real-time, banner cảnh báo trạng thái, duyệt báo giá và form đánh giá 1-5 sao.
  - `/intake` : Màn hình tạo phiếu tiếp nhận máy tại quầy dành cho khách tự khai báo.
  - `/login` : Cổng đăng nhập của nhân viên với cơ chế phân quyền RBAC và xử lý phiên an toàn.
  - `/admin` : Bảng điều khiển nghiệp vụ (Dashboard) bảo vệ bởi `ProtectedRoute`:
    - **Lễ tân (`LE_TAN`):** Quản lý phiếu tiếp nhận, duyệt lịch hẹn, in phiếu nhiệt 80mm có mã QR tra cứu.
    - **Kỹ thuật viên (`KY_THUAT_VIEN`):** Xem máy phụ trách, thêm linh kiện, gửi báo giá và hoàn thành sửa chữa.
    - **Quản lý / Admin (`QUAN_LY`, `ADMIN`):** Quản lý kho cảnh báo tồn, danh mục gói phần mềm, nhân sự, báo cáo thống kê doanh thu và biểu đồ trực quan.

---

## 5. BỘ KIỂM THỬ TỰ ĐỘNG & KIỂM THỬ GIAO DIỆN

1. **Kiểm thử tự động API (Backend Test Suite):**
   - File thực thi: `backend/test_all_features.js`
   - Lệnh chạy: `npm test` tại thư mục `backend`.
   - Kết quả: **14/14 bài kiểm tra thành công tuyệt đối (0 thất bại)**:
     - Đăng nhập xác thực 3 vai trò (Admin, Lễ tân, KTV).
     - Xác thực Token & thông tin cá nhân `/auth/me`.
     - Bảng giá công khai `/public/pricing`.
     - Danh sách phiếu `/tickets`.
     - Tra cứu tiến độ theo mã phiếu `/public/track/:code`.
     - Khách gửi form đặt lịch hẹn `/tickets/booking`.
     - Nhân viên tải danh sách lịch hẹn.
     - Khách quét QR tạo phiếu tiếp nhận `/tickets/intake`.
     - Tra cứu danh sách phiếu theo số điện thoại `/public/track/phone/:phone`.
     - Quản lý kho linh kiện `/tickets/parts`.
     - Thống kê doanh thu & biểu đồ `/admin/dashboard-stats`.
     - Danh sách nhân sự `/admin/employees`.
2. **Kiểm tra cú pháp & Mã nguồn tĩnh (Linting):**
   - Công cụ: `oxlint`
   - Lệnh chạy: `npm run lint` tại thư mục `frontend`.
   - Kết quả: **0 lỗi (errors), 0 cảnh báo (warnings)** trên toàn bộ 18 files mã nguồn.
3. **Kiểm tra đóng gói bản phát hành (Build Production):**
   - Lệnh chạy: `npm run build` tại thư mục `frontend`.
   - Kết quả: Đóng gói thành công vào thư mục `dist/` mà không phát sinh lỗi.

---

## 6. KỊCH BẢN KIỂM THỬ NGHIỆM THU (UAT SCRIPT) THEO 3 VAI TRÒ

### 👤 Vai trò 1: Khách hàng (Trải nghiệm công khai)
1. Truy cập `http://localhost:5173/`:
   - Xem thông tin địa chỉ **615 Âu Cơ**, hotline và các dịch vụ nổi bật.
   - Kiểm tra khối **Khách hàng nói gì** hiển thị top đánh giá 5 sao.
2. Bấm vào menu **Bảng giá** (`/bang-gia`):
   - Nhập từ khóa tìm kiếm (VD: "RAM", "Màn hình").
   - Nhấp vào nút **Đặt lịch →** tại hàng linh kiện bất kỳ -> chuyển thẳng sang `/dat-lich` với tên dịch vụ đã được điền sẵn.
3. Gửi form Đặt lịch hẹn:
   - Điền số Zalo, ngày giờ hẹn và bấm **Xác nhận đặt lịch**.
4. Tra cứu tiến độ sửa chữa (`/tra-cuu`):
   - Thử nghiệm chức năng **Quét mã QR bằng Camera** hoặc nhập Số điện thoại để xem toàn bộ danh sách phiếu đã từng sửa chữa.
5. Theo dõi phiếu (`/track/:ticketCode`):
   - Xem banner trạng thái (tự động cập nhật mỗi 30 giây).
   - Nếu có báo giá, bấm nút **Đồng ý sửa chữa** hoặc **Từ chối báo giá**.
   - Sau khi hoàn thành, chọn 5 sao trong bộ chọn radiogroup và gửi cảm nghĩ (tối đa 1000 ký tự).

### 👩‍💼 Vai trò 2: Lễ tân (`letan` / `123456`)
1. Truy cập `http://localhost:5173/login`, đăng nhập tài khoản `letan`.
2. Kiểm tra giao diện Dashboard:
   - Tab Kho linh kiện và Thống kê doanh thu được ẩn hoàn toàn theo đúng nguyên tắc phân quyền RBAC.
3. Vào tab **Lịch hẹn**:
   - Thấy lịch hẹn mới do Khách gửi ở bước trên.
   - Nhấp nút **Xác nhận lịch** để chuyển thành phiếu tiếp nhận chính thức.
4. Chọn một phiếu sửa chữa và nhấn nút **In biên nhận**:
   - Màn hình hiển thị mẫu in nhiệt chuẩn khổ 80mm với địa chỉ **615 Âu Cơ** và mã QR tra cứu sắc nét.
5. Bấm chuyển giao máy cho Kỹ thuật viên xử lý.

### 👨‍🔧 Vai trò 3: Kỹ thuật viên (`kythuat` / `123456`)
1. Đăng xuất hoặc mở tab ẩn danh mới, đăng nhập tài khoản `kythuat`.
2. Hệ thống chuyển vào Dashboard dành riêng cho Kỹ thuật viên:
   - Xem danh sách máy được phân công sửa chữa.
3. Mở phiếu đang xử lý:
   - Nhấn **Bắt đầu kiểm tra** để chuyển trạng thái sang `ĐANG KIỂM TRA`.
   - Chọn thêm linh kiện từ kho hoặc nhập chi phí dịch vụ/công sửa.
   - Bấm **Gửi báo giá cho khách** -> Trạng thái phiếu tự động chuyển thành `CHỜ BÁO GIÁ`.
4. Sau khi khách hàng bấm duyệt trên trang Tracking:
   - Dashboard của KTV tự động nhận diện và chuyển sang giai đoạn `ĐANG SỬA CHỮA`.
   - Hoàn tất các bước kỹ thuật và nhấn **Đã sửa xong**.

### 👨‍💼 Vai trò 4: Quản lý / Admin (`admin` / `123456`)
1. Đăng nhập tài khoản `admin`.
2. Toàn quyền truy cập tất cả các tính năng nâng cao:
   - **Kho linh kiện:** Xem số lượng tồn, lọc các món hàng sắp hết (dưới ngưỡng tối thiểu) để kịp thời nhập thêm.
   - **Gói phần mềm:** Quản lý danh mục gói cài đặt (Office, Đồ họa, Diệt virus).
   - **Thống kê doanh thu:** Xem biểu đồ trực quan Recharts phân tích doanh thu 7 ngày gần nhất, tổng số phiếu hoàn thành và doanh số thực tế.

---

## 7. HƯỚNG DẪN BÀN GIAO & DEPLOY LẠI KHI CẦN

1. **Đẩy mã nguồn lên GitHub:**
   ```powershell
   cd D:\qr-repair-system\TTTN-CSKH_QR
   git add .
   git commit -m "Hoàn thiện tài liệu chuyển giao và toàn bộ tính năng tuần 3"
   git push origin main
   ```
2. **Cập nhật Backend trên Vercel:**
   - Nếu có thay đổi ở mã nguồn backend, chỉ cần chạy lệnh `vercel --prod` tại thư mục `backend` hoặc liên kết trực tiếp kho GitHub để Vercel tự động build.
3. **Cập nhật Frontend:**
   - Đảm bảo biến `VITE_API_URL` trỏ đúng địa chỉ API của Backend Vercel trước khi build bản chính thức.
