const crypto = require('crypto');

// Lưu tối đa 200 bản ghi nhật ký hoạt động gần nhất trong bộ nhớ
const MAX_AUDIT_LOGS = 200;
const auditLogs = [
    {
        id: 'audit-init-1',
        timestamp: new Date().toISOString(),
        actor: 'SYSTEM',
        role: 'SYSTEM',
        action: 'SYSTEM_INIT',
        target: 'Backend API',
        ip: '127.0.0.1',
        status: 'SUCCESS',
        details: 'Khởi tạo hệ thống ghi nhận nhật ký thao tác.'
    }
];

function getClientIp(req) {
    if (!req) return 'unknown';
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        return String(forwarded).split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

function logSecurityEvent({ req, actor, role, action, target, status = 'SUCCESS', details = '' }) {
    try {
        const entry = {
            id: crypto.randomUUID ? crypto.randomUUID() : `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T') + '+07:00',
            actor: actor || req?.user?.Username || 'GUEST',
            role: role || req?.user?.Role || 'PUBLIC',
            action: String(action || 'UNKNOWN_ACTION'),
            target: String(target || '-'),
            ip: getClientIp(req),
            status,
            details: String(details || '').slice(0, 500)
        };
        auditLogs.unshift(entry);
        if (auditLogs.length > MAX_AUDIT_LOGS) {
            auditLogs.length = MAX_AUDIT_LOGS;
        }
        return entry;
    } catch (err) {
        console.error('Audit log error:', err.message);
        return null;
    }
}

function getAuditLogs(limit = 100) {
    return auditLogs.slice(0, Math.min(Number(limit) || 100, MAX_AUDIT_LOGS));
}

module.exports = {
    logSecurityEvent,
    getAuditLogs,
    getClientIp
};
