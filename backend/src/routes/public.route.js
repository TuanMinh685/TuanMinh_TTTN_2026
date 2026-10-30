const express = require('express');
const router = express.Router();
const os = require('os');
const publicController = require('../controllers/public.controller');

// Lấy IP mạng nội bộ của máy chủ để sinh mã QR cho điện thoại quét được qua LAN Wi-Fi
router.get('/network-ip', (req, res) => {
    const ifaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    for (const name of Object.keys(ifaces)) {
        for (const net of ifaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                break;
            }
        }
    }
    res.json({
        success: true,
        ip: localIp,
        frontendUrl: `http://${localIp}:5173`
    });
});

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
