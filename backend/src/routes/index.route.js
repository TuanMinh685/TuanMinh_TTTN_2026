const express = require('express');
const router = express.Router();

const authRoute = require('./account.route');
const ticketRoute = require('./ticket.route');
const publicRoute = require('./public.route');
const adminRoute = require('./admin.route');

// Định tuyến API cốt lõi
router.use('/auth', authRoute);
router.use('/tickets', ticketRoute);
router.use('/public', publicRoute);
router.use('/admin', adminRoute);

module.exports = router;
