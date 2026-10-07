# KỊCH BẢN DEMO LUỒNG LÀM VIỆC (QUÉT MÃ QR)

Dưới đây là kịch bản demo cách hệ thống vận hành trơn tru giữa 3 nhân vật: **Khách hàng**, **Lễ tân** và **Kỹ thuật viên**.

## 🔹 TÀI KHOẢN DEMO ĐÃ TẠO
Bạn có thể sử dụng các tài khoản này để đăng nhập vào **Cổng KTV** (http://localhost:5173/login) để test luồng:
1. **Lễ tân:** Tên đăng nhập: `letan` | Mật khẩu: `123456`
2. **Kỹ thuật viên:** Tên đăng nhập: `kythuat` | Mật khẩu: `123456`
3. **Quản lý (đã có):** Tên đăng nhập: `admin` | Mật khẩu: `123456`

---

## 🔹 KỊCH BẢN VẬN HÀNH THỰC TẾ

### 1. Góc độ KHÁCH HÀNG (Anh Khang - Sinh viên)
* **Bối cảnh:** Laptop của Khang bị hư bàn phím, Khang mang máy đến Tòa nhà Lục Giác.
* **Hành động:** 
  1. Khang bước vào, thấy mã QR to đùng đặt trên quầy Lễ tân.
  2. Khang lấy điện thoại ra quét mã QR bằng Zalo/Camera (Mã QR này sẽ dẫn tới link `http://localhost:5173/intake`).
  3. Khang tự nhập thông tin vào form trên điện thoại: "Nguyễn Văn Khang", "0901234567", mô tả "Bàn phím bị liệt nút Space". 
  4. Bấm "GỬI YÊU CẦU". Hệ thống hiển thị: *"Đã tạo phiếu thành công! Mã phiếu của bạn là: HD-12345"*.

### 2. Góc độ LỄ TÂN (Chị Tân)
* **Bối cảnh:** Lễ tân đang ngồi trực máy tính tại quầy, đã đăng nhập sẵn tài khoản `letan`.
* **Hành động:**
  1. Ngay khi Khang vừa bấm "Gửi" trên điện thoại, màn hình máy tính của chị Tân phát ra âm thanh "Ting!" báo hiệu có khách mới.
  2. Bảng điều khiển (Dashboard) của Lễ tân hiển thị phiếu **HD-12345** với trạng thái **MỚI TIẾP NHẬN**.
  3. Chị Tân mỉm cười nói: *"Chào em Khang, chị đã nhận được thông tin sửa bàn phím của em. Em cho chị mượn máy nhé!"*.
  4. Lễ tân nhận máy, dán một miếng sticker nhỏ ghi "HD-12345" lên máy.
  5. Trên phần mềm, Lễ tân bấm nút **"CHUYỂN KỸ THUẬT"** và gán máy này cho anh Kỹ thuật viên tên Trần Kỹ Thuật.

### 3. Góc độ KỸ THUẬT VIÊN (Anh Thuật)
* **Bối cảnh:** Kỹ thuật viên đang ở trong phòng kỹ thuật (bên trong), đã đăng nhập tài khoản `kythuat`.
* **Hành động:**
  1. Màn hình của anh Thuật thông báo: *"Có 1 máy mới được chuyển đến từ Lễ tân"*.
  2. Anh Thuật cầm cái laptop có dán sticker HD-12345 mà Lễ tân vừa đưa vào phòng.
  3. Anh mở phiếu HD-12345 trên phần mềm, bấm nút **"ĐANG KIỂM TRA"** để bắt đầu tháo máy ra xem.
  4. *(Khách hàng Khang lúc này ngồi ngoài sảnh lấy điện thoại ra xem link Tracking, thấy trạng thái máy mình đang là "Đang kiểm tra" nên rất yên tâm).*
  5. Sau khi thay bàn phím xong, anh Thuật bấm nút **"ĐÃ HOÀN THÀNH"**.
  6. Hệ thống tự động đẩy thông báo ra màn hình của Lễ tân. Lễ tân gọi Khang ra nhận lại máy.

---

### 💡 Ưu điểm của luồng này:
* **Khách hàng** không phải đứng khai báo rườm rà hay đọc số điện thoại thành tiếng ở nơi đông người (rất bảo mật).
* **Lễ tân** không phải gõ máy tính nhập liệu thay khách, chỉ việc nhận máy và điều phối -> Rút ngắn thời gian phục vụ mỗi khách từ 3 phút xuống còn 10 giây.
* **Kỹ thuật viên** biết chính xác mình cần sửa máy nào, máy đó bị lỗi gì ngay trên màn hình.
* Toàn bộ quá trình diễn ra **thời gian thực (Real-time)** nhờ công nghệ Socket.io mà chúng ta đã tích hợp!
