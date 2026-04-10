"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRouter = void 0;
const express_1 = require("express");
const recommendation_service_1 = require("../services/recommendation.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.contentRouter = router;
const recommendationService = new recommendation_service_1.RecommendationService();
router.use(auth_middleware_1.requireAuthIfEnabled);
function resolveListFromBody(body) {
    if (Array.isArray(body))
        return body;
    if (body && typeof body === 'object') {
        const record = body;
        if (Array.isArray(record.items)) {
            return record.items;
        }
    }
    return body;
}
router.get('/recipes', async (_req, res) => {
    try {
        const list = await recommendationService.getStoredRecipes();
        res.json({
            code: 0,
            data: list,
        });
    }
    catch (error) {
        console.error('Get recipes failed:', error);
        res.status(500).json({
            code: 500,
            message: '读取食谱失败',
        });
    }
});
router.put('/recipes', async (req, res) => {
    try {
        const list = await recommendationService.saveStoredRecipes(resolveListFromBody(req.body));
        res.json({
            code: 0,
            data: list,
        });
    }
    catch (error) {
        res.status(400).json({
            code: 400,
            message: error?.message || '更新食谱失败',
        });
    }
});
router.get('/exercise-videos', async (_req, res) => {
    try {
        const list = await recommendationService.getStoredExerciseVideos();
        res.json({
            code: 0,
            data: list,
        });
    }
    catch (error) {
        console.error('Get exercise videos failed:', error);
        res.status(500).json({
            code: 500,
            message: '读取运动视频失败',
        });
    }
});
router.put('/exercise-videos', async (req, res) => {
    try {
        const list = await recommendationService.saveStoredExerciseVideos(resolveListFromBody(req.body));
        res.json({
            code: 0,
            data: list,
        });
    }
    catch (error) {
        res.status(400).json({
            code: 400,
            message: error?.message || '更新运动视频失败',
        });
    }
});
//# sourceMappingURL=content.route.js.map