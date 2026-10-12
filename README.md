# QR Repair Ticket System

Hệ thống tiếp nhận và theo dõi sửa chữa thiết bị bằng mã QR, dành cho khách hàng và nhân viên kỹ thuật.

## Giới thiệu

Dự án này giúp khách hàng:
- quét mã QR tại quầy hoặc đặt lịch online
- điền thông tin thiết bị và mô tả lỗi
- theo dõi tiến độ sửa chữa theo mã tra cứu
- xác nhận báo giá và gửi đánh giá sau khi hoàn tất

Dành cho nhân viên:
- quản lý phiếu sửa chữa
- cập nhật trạng thái
- thống kê số lượng, phụ tùng và lịch hẹn
- xem dashboard nội bộ

## Công nghệ sử dụng

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Real-time: Socket.IO
- Authentication: JWT

## Cấu trúc dự án

```text
TTTN-CSKH_QR/
├── backend/
│   ├── src/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── README.md
└── ...
```

## Yêu cầu môi trường

- Node.js >= 18
- npm
- PostgreSQL

## Cài đặt

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Điều chỉnh các biến môi trường trong file `.env` nếu cần.

### 2. Frontend

```bash
cd frontend
npm install
```

## Chạy ứng dụng

### Backend

```bash
cd backend
node server.js
```

### Frontend

```bash
cd frontend
npm run dev
```

Mặc định:
- Frontend: http://localhost:5173/
- Backend: http://localhost:5000/

## Một số chức năng chính

- Tiếp nhận phiếu sửa chữa via QR
- Tra cứu đơn hàng bằng mã hoặc số điện thoại
- Đặt lịch hẹn
- Đánh giá trải nghiệm sau khi sửa xong
- Dashboard quản lý cho nhân viên

## Ghi chú

Dự án này là sản phẩm thực tập tốt nghiệp với mục tiêu xây dựng hệ thống CSKH IT Support hiện đại, tự động hóa quy trình tiếp nhận và theo dõi sửa chữa thiết bị.
