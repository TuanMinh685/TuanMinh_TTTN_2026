const crypto = require('crypto');
const QRCode = require('qrcode');
const { pool } = require('../config/db.config');

const formatVietnamISO = (dateInput = new Date()) => {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return new Date().toISOString();
    const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().replace('Z', '+07:00');
};

const generateQRCode = async (data) => {
    try {
        const qrCodeBase64 = await QRCode.toDataURL(data);
        return qrCodeBase64;
    } catch (err) {
        console.error('Lỗi khi tạo mã QR:', err);
        throw err;
    }
};

const initQrSession = async ({ createdBy = null, originUrl = 'http://localhost:5173' } = {}) => {
    const sessionToken = crypto.randomUUID();
    const ttlSeconds = Number(process.env.QR_SESSION_TTL) || 900; // Mặc định 15 phút (900s)
    const expiresAtDate = new Date(Date.now() + ttlSeconds * 1000);
    const intakeUrl = `${String(originUrl).replace(/\/$/, '')}/tiep-nhan?session=${sessionToken}`;
    const qrImageBase64 = await generateQRCode(intakeUrl);

    const { rows } = await pool.query(`
        INSERT INTO ticket_sessions (session_token, qr_image_base64, status, expires_at, created_by)
        VALUES ($1, $2, 'ACTIVE', $3, $4)
        RETURNING id, session_token, qr_image_base64, status, expires_at, created_at
    `, [sessionToken, qrImageBase64, expiresAtDate.toISOString(), createdBy]);

    const session = rows[0] || {
        id: null,
        session_token: sessionToken,
        qr_image_base64: qrImageBase64,
        status: 'ACTIVE',
        expires_at: expiresAtDate.toISOString(),
        created_at: new Date().toISOString()
    };

    return {
        sessionId: session.id,
        sessionToken: session.session_token,
        status: session.status,
        ttlSeconds,
        createdAt: formatVietnamISO(session.created_at || new Date()),
        expiresAt: formatVietnamISO(session.expires_at || expiresAtDate),
        intakeUrl,
        qrImageBase64: session.qr_image_base64
    };
};

const getQrSession = async (sessionToken) => {
    const { rows } = await pool.query(`
        SELECT id, session_token, ticket_id, status, expires_at, submitted_at, created_at
        FROM ticket_sessions
        WHERE session_token = $1
    `, [sessionToken]);

    if (rows.length === 0) return null;

    const session = rows[0];
    const isExpired = session.expires_at && new Date(session.expires_at) < new Date();
    const effectiveStatus = session.status === 'ACTIVE' && isExpired ? 'EXPIRED' : session.status;

    return {
        sessionId: session.id,
        sessionToken: session.session_token,
        ticketId: session.ticket_id,
        status: effectiveStatus,
        isExpired,
        createdAt: session.created_at ? formatVietnamISO(session.created_at) : null,
        expiresAt: session.expires_at ? formatVietnamISO(session.expires_at) : null,
        submittedAt: session.submitted_at ? formatVietnamISO(session.submitted_at) : null
    };
};

const markQrSessionSubmitted = async (sessionToken, ticketId, client = pool) => {
    const { rows } = await client.query(`
        UPDATE ticket_sessions
        SET status = 'SUBMITTED',
            ticket_id = $1,
            submitted_at = CURRENT_TIMESTAMP
        WHERE session_token = $2
        RETURNING id, session_token, ticket_id, status, submitted_at
    `, [ticketId, sessionToken]);
    return rows[0] || null;
};

module.exports = {
    formatVietnamISO,
    generateQRCode,
    initQrSession,
    getQrSession,
    markQrSessionSubmitted
};
