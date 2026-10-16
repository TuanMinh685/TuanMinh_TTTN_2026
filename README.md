# QR Repair Ticket System - HungHau IT Support

Hệ thống tiếp nhận, quản lý và theo dõi phiếu sửa chữa thiết bị công nghệ thông qua mã QR, phục vụ khách hàng đa kênh (tại quầy và từ xa) kết hợp cổng điều hành phân quyền chuyên sâu cho nhân viên kỹ thuật.

---

## 📍 Thông tin đơn vị & Liên hệ

- **Đơn vị:** HungHau IT Support - Trường Đại học Văn Hiến (HungHau Education)
- **Địa chỉ tiếp nhận:** **615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh**
- **Hotline hỗ trợ:** `(+84) 28 3860 4999` / `(028) 3860 4999`
- **Email:** `cskh@vhu.edu.vn` / `support@hunghau.vn`

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React, Recharts (thống kê doanh thu & biểu đồ trạng thái).
- **Backend:** Node.js, Express, Helmet, CORS, JWT Authentication, Express Rate Limit, Express Validator.
- **Cơ sở dữ liệu:** PostgreSQL (lưu trữ Cloud qua **Supabase Managed Postgres**).
- **Kiến trúc thời gian thực:** Polling tối ưu hóa 30 giây (tương thích Serverless Vercel), hủy interval và cờ unmount ngăn rò rỉ bộ nhớ.
- **Quét mã QR:** Camera Scanner trực tiếp qua trình duyệt (`html5-qrcode` / canvas) & in phiếu in nhiệt 80mm có mã QR tra cứu.
- **Triển khai (Deployment):** 
  - Frontend: Vercel / Local Vite.
  - Backend API: Vercel Serverless Function (`https://backend-murex-chi-18.vercel.app/api`).
  - Database: Supabase Cloud (Singapore Region `ap-southeast-1`).

---

## 👥 Phân quyền người dùng (RBAC) & Tài khoản thử nghiệm

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Khách hàng** | *(Không cần đăng nhập)* | *(Công khai)* | Quét QR tạo phiếu, đặt lịch hẹn, tra cứu bằng mã/SĐT/Camera QR, duyệt báo giá, gửi đánh giá 1-5 sao. |
| **Lễ tân** | `letan` | `123456` | Tiếp nhận máy tại quầy, duyệt/hủy lịch hẹn online, chuyển máy sang KTV, in phiếu nhiệt 80mm kèm QR. |
| **Kỹ thuật viên** | `kythuat` | `123456` | Tiếp nhận sửa chữa, chuẩn đoán lỗi, thêm linh kiện/dịch vụ, gửi báo giá cho khách duyệt, hoàn tất sửa. |
| **Quản lý / Admin**| `admin` | `123456` | Toàn quyền hệ thống: Quản lý kho linh kiện (cảnh báo tồn kho), quản lý gói dịch vụ, thống kê doanh thu & báo cáo. |

---

## 🚀 Tiến độ & Tính năng đã hoàn thành (Tuần 3: Ngày 15 - 21)

- **Ngày 15 - Phân quyền theo vai trò (RBAC) & Bảo vệ Route:**
  - Xây dựng `ProtectedRoute` kiểm tra JWT token và quyền vai trò (`LE_TAN`, `KY_THUAT_VIEN`, `QUAN_LY`, `ADMIN`).
  - Phân tách tab Dashboard linh hoạt theo vai trò: Tab Kho linh kiện, Gói phần mềm, và Thống kê doanh thu chỉ mở cho Quản lý / Admin.
  - Axios response interceptor tự động phát hiện mã lỗi `401 Unauthorized` / `403 Forbidden` để xóa session và chuyển hướng an toàn về `/login`.
- **Ngày 16 - Quy trình báo giá & Khách xác nhận sửa chữa:**
  - KTV kiểm tra máy, thêm linh kiện và công dịch vụ vào phiếu; hệ thống tự tính tổng chi phí theo thời gian thực.
  - Trang Tracking (`/track/:ticketCode`) hiển thị chi tiết hạng mục báo giá và hai nút thao tác **Đồng ý / Từ chối** (`POST /api/tickets/approve-quote`).
  - Xử lý trạng thái loading, khóa nút thao tác sau khi khách đã gửi quyết định và tự động làm mới phiếu.
- **Ngày 17 - Cập nhật tiến độ near real-time (Tối ưu Serverless):**
  - Tối ưu cho môi trường Vercel Serverless bằng cơ chế polling 30 giây thay vì WebSocket.
  - Hiển thị banner thông báo nổi bật khi trạng thái phiếu thay đổi.
  - Thiết kế dọn dẹp `clearInterval` và cờ hủy request (`active = false`) khi rời trang, ngăn ngừa triệt để tình trạng tràn bộ nhớ và race-condition.
- **Ngày 18 - Hệ thống đánh giá & Phản hồi khách hàng:**
  - Form đánh giá 1–5 sao với hỗ trợ trợ năng đầy đủ (`role="radiogroup"`, `aria-label`, phím điều hướng), cho phép gửi nhận xét chi tiết tối đa 1000 ký tự qua API `POST /api/tickets/review`.
  - Trang chủ (`/`) tích hợp khối *"Khách hàng nói gì"* tải trực tiếp top đánh giá 5 sao từ Supabase qua endpoint `GET /api/public/reviews/top`.
- **Ngày 19 - Bảng giá minh bạch & Đặt lịch hẹn nâng cao:**
  - Trang Bảng giá (`/bang-gia`) lấy dữ liệu từ `GET /api/public/pricing`, hỗ trợ tìm kiếm và lọc tức thì kèm nút dẫn trực tiếp sang đặt lịch hẹn.
  - Form đặt lịch (`/dat-lich`) nâng cấp thu thập số Zalo, ngày/giờ hẹn, chọn hình thức (Tại cửa hàng: 615 Âu Cơ / Hỗ trợ từ xa qua mạng), tiếp nhận gói phần mềm mong muốn.
  - Tab "Lịch hẹn" tại Dashboard dành riêng cho Lễ tân xác nhận hoặc từ chối lịch hẹn của khách.
- **Ngày 20 - Dịch vụ cứu dữ liệu/sửa chữa từ xa & Tra cứu đa kênh:**
  - Trang tiếp nhận sửa chữa từ xa hỗ trợ nhập mã UltraViewer/TeamViewer, chi tiết lỗi và gói cài đặt phần mềm.
  - Hệ thống tra cứu đa kênh (`/tra-cuu`):
    1. Nhập mã tra cứu (VD: `RP-648045` hoặc `HD-xxxxx`).
    2. Quét QR code trực tiếp bằng Camera điện thoại/máy tính với modal popup tiện dụng.
    3. Tra cứu lịch sử sửa chữa theo Số điện thoại khách hàng (`/public/track/phone/:phone`).
- **Ngày 21 - Kiểm thử nghiệm thu (UAT), Tài liệu & Chuyển giao:**
  - Bộ kiểm thử tự động gồm 14 test cases (`test_all_features.js`) chạy thành công 100%.
  - Mã nguồn frontend vượt qua kiểm tra tĩnh `oxlint` với 0 lỗi, 0 cảnh báo.
  - Kiểm tra build production Vite thành công sẵn sàng deploy.
  - Cập nhật tài liệu chuyển giao, sơ đồ route và hướng dẫn triển khai.

---

## 📁 Sơ đồ Route & Cấu trúc đường dẫn

### 1. Phía Khách hàng (Public Routes)
- `/` : Trang chủ giới thiệu dịch vụ, quy trình QR, địa chỉ 615 Âu Cơ và top đánh giá khách hàng.
- `/bang-gia` : Bảng giá linh kiện và dịch vụ sửa chữa công khai.
- `/dat-lich` : Đặt lịch hẹn sửa chữa (tại cửa hàng hoặc online).
- `/tra-cuu` : Tra cứu tiến độ (bằng mã phiếu, quét QR camera, hoặc số điện thoại).
- `/track/:ticketCode` : Chi tiết phiếu sửa chữa, xem tiến độ trực tiếp, duyệt báo giá, gửi đánh giá.
- `/intake` : Form quét mã QR gửi phiếu tiếp nhận máy tại quầy.

### 2. Phía Nhân viên & Quản trị (Admin Routes - Yêu cầu xác thực JWT)
- `/login` : Cổng đăng nhập phân quyền cho nhân viên.
- `/admin` : Bảng điều khiển tác nghiệp (Dashboard) bảo vệ bằng `ProtectedRoute`:
  - **Lễ tân (`LE_TAN`):** Danh sách phiếu, Tiếp nhận quầy, Lịch hẹn online, In phiếu nhiệt.
  - **Kỹ thuật viên (`KY_THUAT_VIEN`):** Danh sách máy đang xử lý, Thêm linh kiện báo giá, Cập nhật trạng thái hoàn thành.
  - **Quản lý / Admin (`QUAN_LY`, `ADMIN`):** Toàn quyền xem phiếu, Kho linh kiện cảnh báo tồn, Danh mục gói phần mềm, Quản trị nhân sự, Báo cáo thống kê doanh thu.

---

## 💻 Hướng dẫn Cài đặt & Chạy Local

### 1. Cấu hình Backend

```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\backend
npm install
Copy-Item .env.example .env
```

Mở file `backend/.env` và điền cấu hình kết nối database:
```env
PORT=5001
DATABASE_URL=postgresql://postgres.apcpimhqbgahhcemsicj:[MAT_KHAU]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
JWT_SECRET=super_secret_jwt_key_hung_hau_it_support_2026
CORS_ORIGIN=http://localhost:5173
```

Chạy Backend:
```powershell
npm start
```
Server sẽ chạy tại `http://localhost:5001/api`.

### 2. Cấu hình Frontend

```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\frontend
npm install
Copy-Item .env.example .env
```

Nội dung `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
# Hoặc trỏ trực tiếp đến Backend Cloud trên Vercel:
# VITE_API_URL=https://backend-murex-chi-18.vercel.app/api
```

Chạy Frontend:
```powershell
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`.

---

## 🧪 Kiểm tra chất lượng & Test Suite

### 1. Chạy bộ kiểm thử tự động Backend (14 API Test Cases)
```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\backend
npm test
```
*Kết quả kiểm thử bao gồm:*
- Đăng nhập xác thực 3 vai trò: Admin, Lễ tân, Kỹ thuật viên.
- Kiểm tra giải mã JWT và lấy thông tin `/auth/me`.
- Kiểm tra danh mục bảng giá công khai `/public/pricing`.
- Kiểm tra danh sách phiếu sửa chữa `/tickets`.
- Kiểm tra tra cứu phiếu theo mã `/public/track/:code`.
- Kiểm tra khách gửi đặt lịch hẹn `/tickets/booking`.
- Kiểm tra xem danh sách lịch hẹn `/tickets/booking`.
- Kiểm tra tạo phiếu tiếp nhận qua mã QR `/tickets/intake`.
- Kiểm tra tra cứu phiếu theo số điện thoại `/public/track/phone/:phone`.
- Kiểm tra quản lý kho linh kiện `/tickets/parts`.
- Kiểm tra thống kê doanh thu Admin `/admin/dashboard-stats`.
- Kiểm tra danh sách nhân viên `/admin/employees`.

### 2. Kiểm tra tĩnh & Build Frontend
```powershell
cd D:\qr-repair-system\TTTN-CSKH_QR\frontend
npm run lint    # Kiểm tra mã nguồn bằng oxlint
npm run build   # Đóng gói bản Production
```

---

## 🌐 Triển khai lên Vercel & Supabase

1. **Cơ sở dữ liệu Supabase:**
   - Tạo Project mới trên Supabase tại Region Singapore (`ap-southeast-1`).
   - Vào Settings -> Database -> Connection string để lấy chuỗi URI `DATABASE_URL`.
2. **Backend trên Vercel:**
   - Tạo file `vercel.json` định tuyến API vào `server.js` hoặc cấu hình Serverless Functions.
   - Thêm biến môi trường trên Vercel Dashboard: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
   - Triển khai lệnh: `vercel --prod`.
3. **Frontend trên Vercel:**
   - Cài đặt biến môi trường: `VITE_API_URL=https://backend-murex-chi-18.vercel.app/api`.
   - Khởi tạo build command: `npm run build`, output directory: `dist`.

---

## 🔒 Quy định an toàn thông tin

- Tuyệt đối không commit file `.env` chứa mật khẩu thực lên kho mã nguồn Git công khai.
- Mọi thao tác đổi trạng thái phiếu, thêm linh kiện và xem báo cáo bắt buộc phải gửi kèm header `Authorization: Bearer <TOKEN>`.
- Token được lưu an toàn trong trình duyệt và tự động hủy bỏ khi hết hạn hoặc gặp lỗi quyền hạn (401/403).
