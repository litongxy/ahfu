"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const wechat_auth_service_1 = require("../services/wechat-auth.service");
const phone_password_auth_service_1 = require("../services/phone-password-auth.service");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.post('/mini-program/login', async (req, res) => {
    try {
        const code = req.body?.code;
        const result = await wechat_auth_service_1.wechatAuthService.loginByCode(code);
        res.json({
            code: 0,
            data: result,
        });
    }
    catch (error) {
        if (error instanceof wechat_auth_service_1.WechatAuthError) {
            res.status(error.status).json({
                code: error.status,
                message: error.message,
                errorCode: error.code,
            });
            return;
        }
        res.status(500).json({
            code: 500,
            message: '登录失败，请稍后重试',
            errorCode: 'LOGIN_ERROR',
        });
    }
});
router.post('/dev-login', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const enableDevLogin = process.env.ENABLE_DEV_LOGIN === 'true';
    if (isProduction && !enableDevLogin) {
        res.status(403).json({
            code: 403,
            message: '生产环境已禁用 dev-login',
            errorCode: 'DEV_LOGIN_DISABLED',
        });
        return;
    }
    const openId = req.body?.openId;
    const result = wechat_auth_service_1.wechatAuthService.createDevLogin(openId);
    res.json({
        code: 0,
        data: result,
    });
});
router.post('/phone/register', (req, res) => {
    try {
        const phone = req.body?.phone;
        const password = req.body?.password;
        const result = phone_password_auth_service_1.phonePasswordAuthService.register(phone, password);
        res.json({
            code: 0,
            data: result,
        });
    }
    catch (error) {
        if (error instanceof phone_password_auth_service_1.PhonePasswordAuthError) {
            res.status(error.status).json({
                code: error.status,
                message: error.message,
                errorCode: error.code,
            });
            return;
        }
        res.status(500).json({
            code: 500,
            message: '注册失败，请稍后重试',
            errorCode: 'PHONE_REGISTER_ERROR',
        });
    }
});
router.post('/phone/login', (req, res) => {
    try {
        const phone = req.body?.phone;
        const password = req.body?.password;
        const result = phone_password_auth_service_1.phonePasswordAuthService.login(phone, password);
        res.json({
            code: 0,
            data: result,
        });
    }
    catch (error) {
        if (error instanceof phone_password_auth_service_1.PhonePasswordAuthError) {
            res.status(error.status).json({
                code: error.status,
                message: error.message,
                errorCode: error.code,
            });
            return;
        }
        res.status(500).json({
            code: 500,
            message: '登录失败，请稍后重试',
            errorCode: 'PHONE_LOGIN_ERROR',
        });
    }
});
router.get('/me', (req, res) => {
    const request = req;
    if (!request.auth) {
        res.status(401).json({
            code: 401,
            message: '未登录',
        });
        return;
    }
    const phoneAccount = phone_password_auth_service_1.phonePasswordAuthService.getAccountByUserId(request.auth.userId);
    res.json({
        code: 0,
        data: {
            userId: request.auth.userId,
            openId: request.auth.openId,
            unionId: request.auth.unionId,
            phone: phoneAccount?.phone,
            exp: request.auth.exp,
        },
    });
});
//# sourceMappingURL=auth.route.js.map