const publicService = require('../services/public.service');
const { getIo } = require('../config/socket.config');

const trackTicket = async (req, res, next) => {
    try {
        const { ticketCode } = req.params;
        const data = await publicService.trackTicket(ticketCode);
        
        if (!data) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn sửa chữa!' });
        }

        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

const approveQuote = async (req, res, next) => {
    try {
        const { ticketCode } = req.params;
        const { isApproved } = req.body;
        
        if (typeof isApproved !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Thiếu trạng thái đồng ý (true/false)!' });
        }

        const result = await publicService.approveQuote(ticketCode, isApproved);
        
        try {
            const io = getIo();
            io.to('receptionist_room').emit('quote_approved', {
                ticketCode,
                status: result.newStatus,
                message: isApproved ? 'Khách đã ĐỒNG Ý sửa' : 'Khách đã TỪ CHỐI sửa'
            });
        } catch (socketErr) {}

        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: result });
    } catch (err) {
        if (err.message.includes('chờ báo giá')) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next(err);
    }
};


const trackByPhone = async (req, res, next) => {
    try {
        const { phone } = req.params;
        const data = await publicService.trackByPhone(phone);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

const submitReview = async (req, res, next) => {
    try {
        const { ticketCode } = req.params;
        const { so_sao, nhan_xet } = req.body;
        const result = await publicService.submitReview(ticketCode, so_sao, nhan_xet);
        res.status(200).json({ success: true, message: 'Cảm ơn bạn đã đánh giá!', data: result });
    } catch (err) {
        next(err);
    }
};

const getTopReviews = async (req, res, next) => {
    try {
        const data = await publicService.getTopReviews();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    submitReview,
    getTopReviews,
    trackByPhone,
    trackTicket,
    approveQuote
};
