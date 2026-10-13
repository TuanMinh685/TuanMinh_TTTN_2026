# KẾ HOẠCH CHUẨN HÓA TÔNG MÀU UI (DỰA THEO HUNGHAU.VN)

Mục tiêu: Đưa hệ thống web nội bộ thoát khỏi thiết kế "Dark App" (nặng nề, tối màu) sang phong cách "Corporate Web" (sáng sủa, chuyên nghiệp, đồng bộ 100% với Brand Identity của HungHau).

## 1. BẢNG MÀU THƯƠNG HIỆU (BRAND PALETTE)
Cần định nghĩa lại 3 mã màu cốt lõi trong cấu hình CSS (Tailwind):

* **Màu Xanh Dương (Brand Blue): `#0b5b9c`**
  * *Áp dụng:* Chữ tiêu đề lớn (Heading), đường kẻ nhấn, màu nền của Footer.
* **Màu Xanh Lá Cây (Brand Green): `#4ba145`**
  * *Áp dụng:* Nút bấm kêu gọi hành động (Call-to-Action như nút "Cổng KTV", "Gửi Phiếu"), đường viền phân cách.
* **Màu Cam Đậm (Brand Orange): `#f26522`**
  * *Áp dụng:* Hiệu ứng rê chuột (Hover) vào các menu trên thanh điều hướng, các text tạo điểm nhấn.
* **Màu Nền (Background): `#ffffff` (Trắng) & `#f8f9fa` (Xám nhạt)**
  * *Áp dụng:* Giữ không gian thoáng đãng, dễ đọc.

## 2. QUY HOẠCH LẠI BỐ CỤC (LAYOUT COMPONENTS)

### A. Thanh Điều Hướng (Header / Navbar)
* **Hiện tại:** Đang dùng nền Xanh đậm (`#0d457b`), chữ trắng. Trông giống phần mềm quản trị hơn là web công ty.
* **Sửa thành:** 
  * Nền **Màu Trắng**.
  * Chữ Menu **Màu Xám Đậm** (`text-slate-600`).
  * Hover chuột vào menu chữ sẽ chuyển sang **Màu Cam (`#f26522`)**.
  * Có một đường kẻ line siêu mỏng màu xám ở mép dưới để tạo ranh giới.

### B. Chân Trang (Footer)
* **Hiện tại:** Xanh đậm nguyên khối chưa chuẩn mã màu.
* **Sửa thành:**
  * Giữ nền Xanh Dương nhưng dùng đúng mã sáng hơn (`#0b5b9c`).
  * Mép viền trên cùng (border-top) đổi thành một đường kẻ dày màu **Xanh Lá Cây**.

### C. Các Nút Bấm & Giao Diện Form (Buttons & Forms)
* Tất cả nút bấm chính chuyển sang **Màu Xanh Lá Cây**, bo góc tròn và có hiệu ứng đổ bóng (Shadow) nhẹ, tạo cảm giác nổi bật.
* Các tiêu đề form (H1, H2) ưu tiên dùng **Màu Xanh Dương chuẩn**.
