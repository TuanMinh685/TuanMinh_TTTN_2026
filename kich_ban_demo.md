# KỊCH BẢN DEMO LUỒNG LÀM VIỆC & NGHIỆM THU (UAT)

Tài liệu hướng dẫn kịch bản chạy demo thực tế hệ thống **HungHau IT Support - 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh** với sự phối hợp nhịp nhàng giữa **Khách hàng**, **Lễ tân**, **Kỹ thuật viên** và **Quản lý**.

---

## 🔹 TÀI KHOẢN TRẢI NGHIỆM (DEMO ACCOUNTS)

Đăng nhập vào Cổng nhân viên tại địa chỉ: `http://localhost:5173/login`

| Vai trò | Tên đăng nhập | Mật khẩu | Phạm vi tác vụ chính |
| :--- | :--- | :--- | :--- |
| **Lễ tân** | `letan` | `123456` | Tiếp nhận máy quầy, duyệt lịch hẹn, in phiếu nhiệt 80mm có QR. |
| **Kỹ thuật viên** | `kythuat` | `123456` | Tiếp nhận sửa, thêm linh kiện báo giá, hoàn tất sửa chữa. |
| **Quản lý / Admin**| `admin` | `123456` | Xem kho linh kiện cảnh báo tồn, gói phần mềm, thống kê doanh thu. |

---

## 🔹 KỊCH BẢN THỰC CHIẾN TỪNG BƯỚC

### Giai đoạn 1: Khách hàng tìm hiểu & Đặt lịch trước
1. Khách hàng truy cập trang chủ `http://localhost:5173/`:
   - Xem thông tin địa chỉ tiếp nhận: **615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM**.
   - Xem khối **Khách hàng nói gì** hiển thị top đánh giá 5 sao uy tín.
2. Khách mở trang **Bảng giá** (`/bang-gia`):
   - Nhập tìm kiếm "SSD" hoặc "Vệ sinh tra keo tản nhiệt".
   - Bấm nút **Đặt lịch →** trên dòng dịch vụ mong muốn.
3. Form Đặt lịch (`/dat-lich`):
   - Hệ thống tự động điền sẵn tên dịch vụ vừa chọn.
   - Khách nhập Tên: "Nguyễn Văn Khang", SĐT: "0901234567", Số Zalo: "0901234567", chọn ngày giờ hẹn và hình thức "Tại cửa hàng: 615 Âu Cơ".
   - Bấm **Xác nhận đặt lịch**.

---

### Giai đoạn 2: Khách mang máy đến quầy & Lễ tân tiếp nhận
1. Khách đến sảnh hỗ trợ tại **615 Âu Cơ**, có thể quét mã QR tiếp nhận tại quầy (`/intake`).
2. **Lễ tân** đăng nhập tài khoản `letan`:
   - Mở tab **Lịch hẹn**: Thấy lịch hẹn của anh Khang vừa gửi. Bấm **Xác nhận lịch** để chuyển thành phiếu chính thức.
   - Tại danh sách phiếu, Lễ tân bấm nút **In biên nhận**:
     - Phiếu in nhiệt 80mm xuất hiện chuẩn format hóa đơn nhiệt, có logo HungHau, địa chỉ 615 Âu Cơ, thông tin lỗi và **mã QR tra cứu trực tiếp**.
   - Lễ tân dán sticker mã phiếu lên lưng laptop và bấm **Chuyển Kỹ thuật viên**.

---

### Giai đoạn 3: Kỹ thuật viên kiểm tra & Báo giá trực tuyến
1. **Kỹ thuật viên** đăng nhập tài khoản `kythuat`:
   - Dashboard hiển thị máy vừa nhận từ Lễ tân.
   - KTV bấm **Bắt đầu kiểm tra** để cập nhật trạng thái phiếu sang `ĐANG KIỂM TRA`.
   - Sau khi kiểm tra, KTV phát hiện cần thay bàn phím và tra keo:
     - Chọn linh kiện "Bàn phím Laptop" từ kho và thêm công dịch vụ.
     - Hệ thống tự động tính tổng tiền.
     - KTV bấm **Gửi báo giá cho khách** -> Trạng thái phiếu thành `CHỜ BÁO GIÁ`.

---

### Giai đoạn 4: Khách tra cứu tiến độ & Xác nhận báo giá
1. Khách hàng mở trang tra cứu `http://localhost:5173/tra-cuu`:
   - Khách có thể **Quét mã QR trên phiếu in nhiệt bằng camera điện thoại/laptop**, hoặc nhập mã phiếu, hoặc nhập số điện thoại `0901234567` để xem toàn bộ lịch sử máy.
2. Trang chi tiết phiếu (`/track/:ticketCode`):
   - Nhờ cơ chế **Polling 30 giây tối ưu Serverless**, màn hình tự động hiển thị banner thông báo: *"Đã có báo giá mới cho thiết bị của bạn"*.
   - Khách xem bảng chi tiết linh kiện và chi phí.
   - Khách bấm nút **Đồng ý sửa chữa**:
     - Hệ thống gửi request `POST /api/tickets/approve-quote`.
     - Nút duyệt tự động khóa để tránh click đúp, trang thái lập tức chuyển sang đã xác nhận.

---

### Giai đoạn 5: Hoàn tất sửa chữa & Đánh giá chất lượng
1. Kỹ thuật viên tiến hành thay thế và bấm **Đã sửa xong**.
2. Lễ tân gọi khách kiểm tra máy và bàn giao.
3. Trên trang Tracking của khách:
   - Trạng thái cập nhật `ĐÃ HOÀN THÀNH`.
   - Form **Đánh giá dịch vụ** mở ra: Khách chọn 5 sao (hỗ trợ điều hướng bàn phím / trợ năng chuẩn), nhập lời khen: *"Dịch vụ rất nhanh, minh bạch báo giá rõ ràng!"* và bấm **Gửi đánh giá**.
   - Đánh giá được lưu vào cơ sở dữ liệu Supabase và sẽ xuất hiện trên mục "Khách hàng nói gì" của trang chủ.

---

### Giai đoạn 6: Quản lý tổng hợp & Xem báo cáo doanh thu
1. Quản trị viên đăng nhập tài khoản `admin`:
   - Vào tab **Kho linh kiện**: Kiểm tra số lượng tồn kho tự động trừ đi sau khi KTV xuất linh kiện sửa máy; các mặt hàng dưới ngưỡng tối thiểu sẽ nổi bật cảnh báo đỏ.
   - Vào tab **Thống kê**: Xem biểu đồ Recharts phân tích doanh thu tăng trưởng và số lượng phiếu hoàn thành trong tuần.
