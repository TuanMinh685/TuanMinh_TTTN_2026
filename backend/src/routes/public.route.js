const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const rateLimit = require('express-rate-limit');

const trackLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Tra cứu quá nhiều lần, thử lại sau!' }
});

router.get('/track/phone/:phone', trackLimiter, publicController.trackByPhone);
router.get('/track/:ticketCode', trackLimiter, publicController.trackTicket);
router.post('/track/:ticketCode/approve-quote', publicController.approveQuote);

router.post('/track/:ticketCode/review', publicController.submitReview);
router.get('/reviews/top', publicController.getTopReviews);

module.exports = router;
