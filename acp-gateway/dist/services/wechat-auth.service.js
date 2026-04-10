"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wechatAuthService = exports.WechatAuthService = exports.WechatAuthError = void 0;
const auth_token_service_1 = require("./auth-token.service");
class WechatAuthError extends Error {
    constructor(message, status, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.WechatAuthError = WechatAuthError;
function resolveWechatConfig() {
    const appId = process.env.WECHAT_APP_ID ||
        process.env.WECHAT_MINI_APP_ID ||
        process.env.WECHAT_MINIPROGRAM_APPID;
    const appSecret = process.env.WECHAT_APP_SECRET ||
        process.env.WECHAT_MINI_APP_SECRET ||
        process.env.WECHAT_MINIPROGRAM_SECRET;
    if (!appId || !appSecret) {
        throw new WechatAuthError('服务端未配置微信小程序密钥，请设置 WECHAT_APP_ID / WECHAT_APP_SECRET', 500, 'WECHAT_CONFIG_MISSING');
    }
    return { appId, appSecret };
}
function resolveTokenExpirySeconds() {
    const raw = process.env.AUTH_TOKEN_EXPIRES_SECONDS;
    if (!raw) {
        return undefined;
    }
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
function buildUserId(openId) {
    return `wx_${openId}`;
}
async function fetchCode2Session(code) {
    const { appId, appSecret } = resolveWechatConfig();
    const params = new URLSearchParams({
        appid: appId,
        secret: appSecret,
        js_code: code,
        grant_type: 'authorization_code',
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`, {
            method: 'GET',
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new WechatAuthError('微信登录服务暂时不可用，请稍后重试', 502, 'WECHAT_UPSTREAM_ERROR');
        }
        return await response.json();
    }
    catch (error) {
        if (error instanceof WechatAuthError) {
            throw error;
        }
        throw new WechatAuthError('请求微信登录服务失败，请稍后重试', 502, 'WECHAT_NETWORK_ERROR');
    }
    finally {
        clearTimeout(timeout);
    }
}
class WechatAuthService {
    async loginByCode(code) {
        const cleanCode = typeof code === 'string' ? code.trim() : '';
        if (!cleanCode) {
            throw new WechatAuthError('code 不能为空', 400, 'INVALID_CODE');
        }
        const sessionData = await fetchCode2Session(cleanCode);
        if (sessionData.errcode) {
            throw new WechatAuthError(`微信登录失败：${sessionData.errmsg || sessionData.errcode}`, 401, 'WECHAT_LOGIN_FAILED');
        }
        if (!sessionData.openid) {
            throw new WechatAuthError('微信登录返回数据不完整', 502, 'WECHAT_RESPONSE_INVALID');
        }
        const userId = buildUserId(sessionData.openid);
        const { token, expiresInSeconds } = auth_token_service_1.authTokenService.createToken({
            userId,
            openId: sessionData.openid,
            unionId: sessionData.unionid,
            expiresInSeconds: resolveTokenExpirySeconds(),
        });
        return {
            token,
            expiresInSeconds,
            user: {
                userId,
                openId: sessionData.openid,
                unionId: sessionData.unionid,
            },
        };
    }
    createDevLogin(openId) {
        const normalizedOpenId = (openId || '').trim() || `dev_openid_${Date.now()}`;
        const userId = buildUserId(normalizedOpenId);
        const { token, expiresInSeconds } = auth_token_service_1.authTokenService.createToken({
            userId,
            openId: normalizedOpenId,
            expiresInSeconds: resolveTokenExpirySeconds(),
        });
        return {
            token,
            expiresInSeconds,
            user: {
                userId,
                openId: normalizedOpenId,
            },
        };
    }
}
exports.WechatAuthService = WechatAuthService;
exports.wechatAuthService = new WechatAuthService();
//# sourceMappingURL=wechat-auth.service.js.map