const express = require('express');
const router = express.Router();
const os = require('os');
const publicController = require('../controllers/public.controller');
const cmsController = require('../controllers/cms.controller');

// Cấu hình nội dung trang chủ công khai
router.get('/cms-config', cmsController.getPublicCmsConfig);

// Trả về IP LAN khi chạy local để tạo QR quét trên điện thoại cùng mạng Wi-Fi
router.get('/network-ip', (req, res) => {
    const origin = req.headers.origin || req.headers.referer;
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return res.json({
            success: true,
            ip: 'public',
            frontendUrl: origin.replace(/\/$/, '')
        });
    }

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
        frontendUrl: origin ? origin.replace(/\/$/, '') : `http://${localIp}:5173`
    });
});

// Tra cứu phiếu theo mã QR / mã phiếu
router.get('/track/:ticketCode', publicController.trackTicket);

// Tra cứu phiếu theo SĐT, Serial hoặc mã phiếu
router.get('/track/phone/:phone', publicController.trackByPhone);

// Gửi đánh giá 1-5 sao sau khi hoàn tất
router.post('/track/:ticketCode/review', publicController.submitReview);

// Gửi yêu cầu hỗ trợ bảo hành
router.post('/track/:ticketCode/warranty-claim', publicController.claimWarranty);

// Danh sách đánh giá nổi bật
router.get('/reviews', publicController.getTopReviews);
router.get('/reviews/top', publicController.getTopReviews);

module.exports = router;
