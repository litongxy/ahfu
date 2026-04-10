"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const report_service_1 = require("../services/report.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.reportRouter = router;
router.use(auth_middleware_1.requireAuth);
const MOJIBAKE_FILENAME_PATTERN = /[\uFFFDÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŒœŠšŽžƒˆ˜†‡•–—‘’‚“”„…‰‹›€™]/;
function decodeUploadOriginalName(originalName) {
    if (!originalName)
        return originalName;
    const needsDecode = MOJIBAKE_FILENAME_PATTERN.test(originalName);
    if (!needsDecode)
        return originalName;
    try {
        const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
        if (!decoded)
            return originalName;
        return decoded;
    }
    catch {
        return originalName;
    }
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.resolve(__dirname, '../../uploads/reports');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `report-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('只支持 PDF、JPG、PNG 格式'));
        }
    }
});
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const requestedUserId = req.query.userId || req.body.userId;
        if (!(0, auth_middleware_1.isUserScopeAllowed)(req, requestedUserId)) {
            return res.status(403).json({
                code: 403,
                message: '无权上传到其他用户账号',
            });
        }
        const userId = (0, auth_middleware_1.resolveRequestUserId)(req, requestedUserId || undefined);
        if (!userId) {
            return res.status(400).json({
                code: 400,
                message: 'userId is required',
            });
        }
        if (!req.file) {
            return res.status(400).json({
                code: 400,
                message: '请上传文件',
            });
        }
        const originalName = decodeUploadOriginalName(req.file.originalname);
        const report = await report_service_1.reportService.uploadAndAnalyze(userId, req.file.path, originalName);
        res.json({
            code: 0,
            data: {
                reportId: report.id,
                status: report.status,
                anomalyCount: report.anomalyCount,
                indicators: report.indicators,
                aiAnalysis: report.aiAnalysis,
                extractedText: report.extractedText,
            },
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '上传失败',
        });
    }
});
router.get('/history', async (req, res) => {
    try {
        const requestedUserId = req.query.userId;
        if (!(0, auth_middleware_1.isUserScopeAllowed)(req, requestedUserId)) {
            return res.status(403).json({
                code: 403,
                message: '无权查看其他用户历史',
            });
        }
        const userId = (0, auth_middleware_1.resolveRequestUserId)(req, requestedUserId || undefined);
        if (!userId) {
            return res.status(400).json({
                code: 400,
                message: 'userId is required',
            });
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const reports = await report_service_1.reportService.getReportHistory(userId, page, pageSize);
        res.json({
            code: 0,
            data: {
                list: reports,
                total: reports.length,
                page,
                pageSize,
            },
        });
    }
    catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            code: 500,
            message: '获取历史失败',
        });
    }
});
router.get('/:reportId', async (req, res) => {
    try {
        const request = req;
        const { reportId } = req.params;
        const report = await report_service_1.reportService.getReport(reportId);
        if (!report) {
            return res.status(404).json({
                code: 404,
                message: '报告不存在',
            });
        }
        if (request.auth?.userId && report.userId !== request.auth.userId) {
            return res.status(403).json({
                code: 403,
                message: '无权查看其他用户报告',
            });
        }
        res.json({
            code: 0,
            data: report,
        });
    }
    catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({
            code: 500,
            message: '获取报告失败',
        });
    }
});
router.get('/:reportId/download', async (req, res) => {
    try {
        const request = req;
        const { reportId } = req.params;
        const report = await report_service_1.reportService.getReport(reportId);
        if (!report) {
            return res.status(404).json({
                code: 404,
                message: '报告不存在',
            });
        }
        if (request.auth?.userId && report.userId !== request.auth.userId) {
            return res.status(403).json({
                code: 403,
                message: '无权下载其他用户报告',
            });
        }
        const pdfPath = await report_service_1.reportService.generatePDFReport(reportId);
        if (!pdfPath || !fs_1.default.existsSync(pdfPath)) {
            return res.status(404).json({
                code: 404,
                message: 'PDF报告不存在',
            });
        }
        res.download(pdfPath, `体检报告分析_${reportId}.pdf`);
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '下载失败',
        });
    }
});
router.post('/analyze/:reportId', async (req, res) => {
    try {
        const request = req;
        const { reportId } = req.params;
        const report = await report_service_1.reportService.getReport(reportId);
        if (!report) {
            return res.status(404).json({
                code: 404,
                message: '报告不存在',
            });
        }
        if (request.auth?.userId && report.userId !== request.auth.userId) {
            return res.status(403).json({
                code: 403,
                message: '无权分析其他用户报告',
            });
        }
        const result = await report_service_1.reportService.reAnalyze(reportId);
        res.json({
            code: 0,
            data: result,
        });
    }
    catch (error) {
        console.error('Analyze error:', error);
        res.status(500).json({
            code: 500,
            message: '分析失败',
        });
    }
});
//# sourceMappingURL=report.route.js.map