"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const user_profile_store_1 = require("../services/user-profile.store");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.healthRouter = router;
router.use(auth_middleware_1.requireAuth);
router.get('/profile', (req, res) => {
    const requestedUserId = req.query.userId;
    if (!(0, auth_middleware_1.isUserScopeAllowed)(req, requestedUserId)) {
        res.status(403).json({
            code: 403,
            message: '无权访问其他用户档案',
        });
        return;
    }
    const userId = (0, auth_middleware_1.resolveRequestUserId)(req, requestedUserId || undefined);
    if (!userId) {
        res.status(400).json({
            code: 400,
            message: 'userId is required',
        });
        return;
    }
    const profile = user_profile_store_1.userProfiles.get(userId);
    if (!profile) {
        res.json({
            code: 0,
            data: null,
        });
        return;
    }
    res.json({
        code: 0,
        data: profile,
    });
});
router.post('/profile', (req, res) => {
    const { userId: bodyUserId, name, age, gender, chronicDisease, allergy, symptoms, surgeryHistory, familyHistory, medicationHistory, dietHabit, exerciseHabit, sleepInfo, lastCheckup, stressLevel, healthGoals, constitutionType } = req.body;
    if (!(0, auth_middleware_1.isUserScopeAllowed)(req, bodyUserId)) {
        res.status(403).json({
            code: 403,
            message: '无权修改其他用户档案',
        });
        return;
    }
    const userId = (0, auth_middleware_1.resolveRequestUserId)(req, bodyUserId || undefined);
    if (!userId) {
        res.status(400).json({
            code: 400,
            message: 'userId is required',
        });
        return;
    }
    const profile = {
        id: `profile_${userId}`,
        userId,
        name,
        age,
        gender,
        chronicDisease: chronicDisease || [],
        allergy: allergy || [],
        symptoms: symptoms || [],
        surgeryHistory: surgeryHistory || [],
        familyHistory: familyHistory || [],
        medicationHistory: medicationHistory || [],
        dietHabit: dietHabit || '',
        exerciseHabit: exerciseHabit || '',
        sleepInfo: sleepInfo || '',
        lastCheckup: lastCheckup || '',
        stressLevel: stressLevel || 3,
        healthGoals: healthGoals || [],
        constitutionType,
    };
    user_profile_store_1.userProfiles.set(userId, profile);
    res.json({
        code: 0,
        data: profile,
    });
});
//# sourceMappingURL=health.route.js.map