const cmsService = require('../services/cms.service');
const { logSecurityEvent } = require('../utils/auditLogger');

const getPublicCmsConfig = (req, res, next) => {
    try {
        const config = cmsService.getCmsConfig();
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        next(error);
    }
};

const updateCmsConfig = (req, res, next) => {
    try {
        const actor = req.user?.Username || 'admin';
        const updated = cmsService.updateCmsConfig(req.body || {}, actor);

        logSecurityEvent({
            req,
            actor,
            role: req.user?.Role || 'ADMIN',
            action: 'CMS_CONFIG_UPDATE',
            target: 'Client UI & Images Configuration',
            status: 'SUCCESS',
            details: `Quản trị viên "${actor}" cập nhật cấu hình giao diện, hình ảnh và nội dung Client`
        });

        res.status(200).json({
            success: true,
            message: 'Đã lưu cấu hình giao diện Client (Hình ảnh, Text, Dịch vụ) lên Backend thành công!',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

const resetCmsConfig = (req, res, next) => {
    try {
        const actor = req.user?.Username || 'admin';
        const restored = cmsService.resetCmsConfig(actor);

        res.status(200).json({
            success: true,
            message: 'Đã khôi phục cấu hình giao diện Client về mặc định!',
            data: restored
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPublicCmsConfig,
    updateCmsConfig,
    resetCmsConfig
};
