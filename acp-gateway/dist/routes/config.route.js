"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = void 0;
const express_1 = require("express");
const quick_questions_service_1 = require("../services/quick-questions.service");
const router = (0, express_1.Router)();
exports.configRouter = router;
router.get('/quick-questions', (req, res) => {
    const limitParam = req.query.limit;
    let limit = 500;
    if (typeof limitParam === 'string') {
        const parsed = parseInt(limitParam, 10);
        if (Number.isFinite(parsed)) {
            limit = Math.min(Math.max(parsed, 1), 500);
        }
    }
    res.json({
        code: 0,
        data: quick_questions_service_1.quickQuestionsService.getQuestions(limit),
    });
});
router.get('/scenes', (req, res) => {
    const scenes = [
        { id: 'diet', name: '饮食健康', nameEn: 'Diet Health', enabled: true },
        { id: 'exercise', name: '运动健身', nameEn: 'Exercise', enabled: true },
        { id: 'psychology', name: '心理健康', nameEn: 'Psychology', enabled: true },
        { id: 'sleep', name: '睡眠健康', nameEn: 'Sleep Health', enabled: true },
        { id: 'anti-aging', name: '抗衰养生', nameEn: 'Anti-Aging', enabled: true },
        { id: 'disease', name: '疾病防控', nameEn: 'Disease Prevention', enabled: true },
        { id: 'tcm', name: '中医养生', nameEn: 'TCM', enabled: true },
        { id: 'brand', name: '同仁堂文化', nameEn: 'Brand Culture', enabled: true },
        { id: 'report', name: '报告分析', nameEn: 'Report Analysis', enabled: true },
        { id: 'chat', name: '闲聊', nameEn: 'Chat', enabled: true },
    ];
    res.json({
        code: 0,
        data: scenes,
    });
});
//# sourceMappingURL=config.route.js.map