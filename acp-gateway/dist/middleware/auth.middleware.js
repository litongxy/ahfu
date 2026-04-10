"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = authenticateRequest;
exports.requireAuthIfEnabled = requireAuthIfEnabled;
exports.requireAuth = requireAuth;
exports.resolveRequestUserId = resolveRequestUserId;
exports.isUserScopeAllowed = isUserScopeAllowed;
const auth_token_service_1 = require("../services/auth-token.service");
function getBearerToken(headerValue) {
    if (!headerValue) {
        return null;
    }
    const [scheme, token] = headerValue.split(' ');
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
        return null;
    }
    return token.trim() || null;
}
function authenticateRequest(req, res, next) {
    const request = req;
    const authorization = req.header('Authorization');
    if (!authorization) {
        next();
        return;
    }
    const token = getBearerToken(authorization);
    if (!token) {
        res.status(401).json({
            code: 401,
            message: 'Authorization 头格式错误，请使用 Bearer Token',
        });
        return;
    }
    const claims = auth_token_service_1.authTokenService.verifyToken(token);
    if (!claims) {
        res.status(401).json({
            code: 401,
            message: '登录已失效，请重新登录',
        });
        return;
    }
    request.auth = claims;
    next();
}
function requireAuthIfEnabled(req, res, next) {
    const request = req;
    const strictMode = process.env.AUTH_STRICT_MODE === 'true';
    if (!strictMode) {
        next();
        return;
    }
    if (!request.auth?.userId) {
        res.status(401).json({
            code: 401,
            message: '请先登录',
        });
        return;
    }
    next();
}
function requireAuth(req, res, next) {
    const request = req;
    if (!request.auth?.userId) {
        res.status(401).json({
            code: 401,
            message: '请先登录',
        });
        return;
    }
    next();
}
function resolveRequestUserId(req, fallbackUserId) {
    const request = req;
    if (request.auth?.userId) {
        return request.auth.userId;
    }
    if (fallbackUserId) {
        return fallbackUserId;
    }
    return null;
}
function isUserScopeAllowed(req, requestedUserId) {
    const request = req;
    if (!request.auth?.userId) {
        return true;
    }
    if (!requestedUserId) {
        return true;
    }
    return request.auth.userId === requestedUserId;
}
//# sourceMappingURL=auth.middleware.js.map