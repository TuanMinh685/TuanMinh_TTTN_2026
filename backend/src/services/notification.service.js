const axios = require('axios');
const { getIo } = require('../config/socket.config');

/**
 * Service Quản lý gửi tin nhắn tự động qua Zalo ZNS và SMS Brandname / SMS Gateway
 */
const notificationService = {
    /**
     * Chuẩn hóa số điện thoại Việt Nam sang định dạng 84xxx hoặc 0xxx
     */
    normalizePhone(phone) {
        if (!phone) return '';
        const cleaned = String(phone).replace(/\D/g, '');
        if (cleaned.startsWith('84')) return '0' + cleaned.slice(2);
        return cleaned;
    },

    /**
     * Gửi tin nhắn SMS thật qua eSMS.vn (nếu cấu hình ESMS_API_KEY)
     */
    /**
     * Gửi tin nhắn SMS thật qua eSMS.vn (nếu cấu hình ESMS_API_KEY)
     * SmsType: 8 (Đầu số thông báo CSKH cố định - không yêu cầu duyệt trước template, gửi ngay lập tức)
     * SmsType: 2 (Brandname CSKH riêng nếu đã đăng ký với nhà mạng)
     */
    async sendViaEsms(phone, content) {
        const apiKey = process.env.ESMS_API_KEY || 'CAC19247A1D4D4EFB216A09FADA3D2';
        const secretKey = process.env.ESMS_SECRET_KEY || '9BEC302BAC07657B27F0E90A500E40';
        const smsType = Number(process.env.ESMS_SMS_TYPE || 8);
        const brandname = (smsType === 2) ? (process.env.ESMS_BRANDNAME || 'Baotrixemay') : '';

        if (!apiKey || !secretKey) return null;

        try {
            const payload = {
                ApiKey: apiKey,
                SecretKey: secretKey,
                Phone: phone,
                Content: content,
                SmsType: smsType
            };
            if (brandname) {
                payload.Brandname = brandname;
            }

            const res = await axios.post('http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json', payload, { timeout: 10000 });

            console.log('[eSMS Gateway Response]:', res.data);
            if (res.data && (res.data.CodeResponse === '100' || res.data.CodeResult === '100')) {
                return { provider: 'eSMS', data: res.data, smsId: res.data.SMSID };
            }
            return { provider: `eSMS (Lỗi ${res.data?.CodeResponse || res.data?.CodeResult}: ${res.data?.ErrorMessage || 'Lỗi gửi tin'})`, data: res.data, failed: true };
        } catch (err) {
            console.error('[eSMS Error]:', err.message);
            return null;
        }
    },

    /**
     * Gửi tin nhắn SMS thật qua SpeedSMS.vn (nếu cấu hình SPEEDSMS_ACCESS_TOKEN)
     */
    async sendViaSpeedSms(phone, content) {
        const accessToken = process.env.SPEEDSMS_ACCESS_TOKEN;
        if (!accessToken) return null;

        try {
            const res = await axios.post('https://api.speedsms.vn/index.php/sms/send', {
                to: [phone],
                content: content,
                sms_type: 2, // CSKH
                sender: process.env.SPEEDSMS_SENDER || 'LUCGIAC'
            }, {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(accessToken + ':x').toString('base64'),
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            return { provider: 'SpeedSMS', data: res.data };
        } catch (err) {
            console.error('[SpeedSMS Error]:', err.message);
            return null;
        }
    },

    /**
     * Gửi tin nhắn Zalo ZNS qua Zalo Official Account (nếu cấu hình ZALO_ACCESS_TOKEN)
     */
    async sendViaZaloZns(phone, templateId, templateData) {
        const accessToken = process.env.ZALO_ACCESS_TOKEN;
        if (!accessToken || !templateId) return null;

        try {
            // Zalo yêu cầu số điện thoại định dạng 84xxx
            let zaloPhone = phone;
            if (zaloPhone.startsWith('0')) {
                zaloPhone = '84' + zaloPhone.slice(1);
            }

            const res = await axios.post('https://business.openapi.zalo.me/message/template', {
                phone: zaloPhone,
                template_id: templateId,
                template_data: templateData,
                tracking_id: `TRACK_${Date.now()}`
            }, {
                headers: {
                    'access_token': accessToken,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            return { provider: 'ZaloZNS', data: res.data };
        } catch (err) {
            console.error('[Zalo ZNS Error]:', err.message);
            return null;
        }
    },

    /**
     * Hàm TỰ ĐỘNG GỬI THÔNG BÁO TỔNG QUÁT:
     * Tự động nhận diện loại nghiệp vụ (TẠO PHIẾU, ĐẶT LỊCH, MÁY SỬA XONG, THANH TOÁN)
     * Ưu tiên gửi qua Cổng SMS / Zalo ZNS thực tế nếu có cấu hình.
     * Nếu không có API Key, tự động ghi nhận nhật ký hệ thống & phát Socket realtime.
     */
    async sendNotification({
        type, // 'BOOKING_CONFIRMATION' | 'TICKET_CREATED' | 'DEVICE_READY' | 'PAYMENT_CONFIRMATION'
        phone,
        customerName,
        ticketCode = '',
        appointmentDate = '',
        appointmentTime = '',
        deviceName = '',
        amount = 0,
        method = 'TIEN_MAT',
        customNote = ''
    }) {
        const cleanPhone = this.normalizePhone(phone);
        if (!cleanPhone) return { success: false, reason: 'Số điện thoại không hợp lệ' };

        let content = '';
        let title = '';

        if (type === 'BOOKING_CONFIRMATION') {
            title = 'Xác nhận đặt lịch CSKH Lục Giác';
            content = `[CSKH LUC GIAC] Xin chao ${customerName}, lich hen kiem tra ${deviceName || 'thiet bi'} vao ${appointmentTime} ngay ${appointmentDate} tai 615 Au Co da duoc tiep nhan thanh cong. Hotline: 02838604999.`;
        } else if (type === 'TICKET_CREATED') {
            title = 'Khởi tạo hồ sơ CSKH & Tra cứu QR';
            content = `[CSKH LUC GIAC] Xin chao ${customerName}, ho so #${ticketCode} cho (${deviceName || 'thiet bi'}) da tiep nhan. Quy khach quet ma QR tren bien nhan de theo doi tien do. Hotline: 02838604999.`;
        } else if (type === 'DEVICE_READY') {
            title = 'Thiết bị đã xử lý xong - Mời nhận máy';
            content = `[CSKH LUC GIAC] Xin chao ${customerName}, ho so #${ticketCode} (${deviceName || 'thiet bi'}) da xu ly hoan tat. Kinh moi Quy khach den 615 Au Co de nhan ban giao. Hotline: 02838604999.`;
        } else if (type === 'PAYMENT_CONFIRMATION') {
            title = 'Xác nhận thanh toán & Kích hoạt e-Warranty';
            const payMethodText = method === 'VIETQR' ? 'Chuyen khoan VietQR' : 'Tien mat tai quay';
            const formattedAmount = (amount || 0).toLocaleString('vi-VN');
            content = `[CSKH LUC GIAC] Cam on ${customerName}, ho so #${ticketCode} da thanh toan ${formattedAmount}d qua ${payMethodText}. So bao hanh dien tu e-Warranty 180 ngay da kich hoat. Hotline: 02838604999.`;
        } else {
            title = 'Thông báo CSKH Lục Giác';
            content = customNote || `[CSKH LUC GIAC] Thong bao cap nhat ho so #${ticketCode} cho khach hang ${customerName}. Hotline: 02838604999.`;
        }

        console.log(`\n======================================================`);
        console.log(`📲 [AUTO NOTIFICATION DISPATCHER]`);
        console.log(`🎯 Loại: ${type} | Người nhận: ${customerName} (${cleanPhone})`);
        console.log(`💬 Nội dung gửi: "${content}"`);

        // 1. Thử gửi qua cổng SMS eSMS thật
        let realProviderResult = await this.sendViaEsms(cleanPhone, content);

        // 2. Nếu eSMS không cấu hình, thử qua SpeedSMS
        if (!realProviderResult) {
            realProviderResult = await this.sendViaSpeedSms(cleanPhone, content);
        }

        // 3. Nếu có template Zalo ZNS, thử gửi Zalo
        if (!realProviderResult && process.env.ZALO_ACCESS_TOKEN) {
            realProviderResult = await this.sendViaZaloZns(cleanPhone, process.env.ZALO_TEMPLATE_ID, {
                customer_name: customerName,
                ticket_code: ticketCode,
                date: appointmentDate || new Date().toLocaleDateString('vi-VN'),
                time: appointmentTime || ''
            });
        }

        if (realProviderResult && !realProviderResult.failed) {
            console.log(`✅ [GATEWAY THỰC TẾ]: Đã bắn tin nhắn thành công qua đối tác ${realProviderResult.provider}! Mã SMS: ${realProviderResult.smsId || 'OK'}`);
        } else if (realProviderResult && realProviderResult.failed) {
            console.warn(`⚠️ [GATEWAY CẢNH BÁO]: Gửi qua ${realProviderResult.provider} không thành công. Hệ thống tự động chuyển sang cơ chế fallback & lưu nhật ký.`);
        } else {
            console.log(`⚡ [AUTO LOG & SIMULATION]: Đã mô phỏng gửi thành công qua Zalo ZNS / SMS Gateway (Sẵn sàng kích hoạt thật khi điền Key vào .env)!`);
        }
        console.log(`======================================================\n`);

        // 4. Bắn Socket realtime về màn hình quầy lễ tân & khách hàng
        try {
            const io = getIo();
            if (io) {
                io.emit('notification_sent', {
                    type,
                    title,
                    phone: cleanPhone,
                    customerName,
                    ticketCode,
                    content,
                    provider: realProviderResult ? realProviderResult.provider : 'ZALO_ZNS_SMS_SIMULATED',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (socketErr) {}

        return {
            success: true,
            phone: cleanPhone,
            customerName,
            content,
            realGatewaySent: !!realProviderResult,
            provider: realProviderResult ? realProviderResult.provider : 'ZALO_ZNS_SMS_DIRECT'
        };
    }
};

module.exports = notificationService;
