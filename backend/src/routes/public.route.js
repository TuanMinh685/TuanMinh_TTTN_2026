const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Tra cứu thông tin hồ sơ CSKH theo Mã QR / Mã phiếu (RP-xxxxxx)
router.get('/track/:ticketCode', publicController.trackTicket);

// Khách hàng tra cứu tất cả hồ sơ CSKH theo Số điện thoại / Mã định danh Serial
router.get('/track/phone/:phone', publicController.trackByPhone);

// Khách hàng gửi đánh giá mức độ hài lòng dịch vụ CSKH (1 - 5 sao) sau khi hoàn tất
router.post('/track/:ticketCode/review', publicController.submitReview);

// Khách hàng gửi yêu cầu hỗ trợ bảo hành điện tử (e-Warranty)
router.post('/track/:ticketCode/warranty-claim', publicController.claimWarranty);

// Lấy danh sách đánh giá chất lượng dịch vụ 5 sao
router.get('/reviews', publicController.getTopReviews);
router.get('/reviews/top', publicController.getTopReviews);

module.exports = router;
