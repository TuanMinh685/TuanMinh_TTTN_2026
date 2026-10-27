const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Tra cứu thông tin sửa chữa theo Mã QR / Mã phiếu (RP-xxxxxx)
router.get('/track/:ticketCode', publicController.trackTicket);

// Khách hàng đồng ý hoặc từ chối báo giá ngay trên hồ sơ QR
router.post('/track/:ticketCode/approve-quote', publicController.approveQuote);

// Khách hàng tra cứu tất cả phiếu по Số điện thoại / IMEI / Serial
router.get('/track/phone/:phone', publicController.trackByPhone);

// Khách hàng gửi đánh giá dịch vụ CSKH sau khi hoàn tất
router.post('/track/:ticketCode/review', publicController.submitReview);

// Khách hàng gửi yêu cầu bảo hành điện tử (e-Warranty)
router.post('/track/:ticketCode/warranty-claim', publicController.claimWarranty);

// Lấy danh sách đánh giá chất lượng dịch vụ 5 sao
router.get('/reviews', publicController.getTopReviews);

module.exports = router;
