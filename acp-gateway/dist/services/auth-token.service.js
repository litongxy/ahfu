"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authTokenService = exports.AuthTokenService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ISSUER = 'acp-gateway';
const DEFAULT_EXPIRES_SECONDS = 7 * 24 * 60 * 60;
function encodeBase64Url(value) {
    const encoded = Buffer.isBuffer(value) ? value.toString('base64') : Buffer.from(value, 'utf8').toString('base64');
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}
function getTokenSecret() {
    return process.env.AUTH_TOKEN_SECRET || 'dev-auth-token-secret-change-me';
}
function sign(input) {
    const digest = crypto_1.default.createHmac('sha256', getTokenSecret()).update(input).digest();
    return encodeBase64Url(digest);
}
function safeEqualSignature(expected, actual) {
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const actualBuffer = Buffer.from(actual, 'utf8');
    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(expectedBuffer, actualBuffer);
}
class AuthTokenService {
    createToken(input) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const expiresInSeconds = input.expiresInSeconds && input.expiresInSeconds > 0
            ? input.expiresInSeconds
            : DEFAULT_EXPIRES_SECONDS;
        const header = {
            alg: 'HS256',
            typ: 'JWT',
        };
        const claims = {
            iss: ISSUER,
            sub: input.userId,
            userId: input.userId,
            openId: input.openId,
            unionId: input.unionId,
            iat: nowSeconds,
            exp: nowSeconds + expiresInSeconds,
        };
        const encodedHeader = encodeBase64Url(JSON.stringify(header));
        const encodedPayload = encodeBase64Url(JSON.stringify(claims));
        const signature = sign(`${encodedHeader}.${encodedPayload}`);
        const token = `${encodedHeader}.${encodedPayload}.${signature}`;
        return {
            token,
            claims,
            expiresInSeconds,
        };
    }
    verifyToken(token) {
        if (!token || typeof token !== 'string') {
            return null;
        }
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const [encodedHeader, encodedPayload, signature] = parts;
        const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
        if (!safeEqualSignature(expectedSignature, signature)) {
            return null;
        }
        try {
            const header = JSON.parse(decodeBase64Url(encodedHeader));
            if (header.alg !== 'HS256' || header.typ !== 'JWT') {
                return null;
            }
            const claims = JSON.parse(decodeBase64Url(encodedPayload));
            const nowSeconds = Math.floor(Date.now() / 1000);
            if (claims.iss !== ISSUER) {
                return null;
            }
            if (!claims.sub || !claims.userId || !claims.openId) {
                return null;
            }
            if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) {
                return null;
            }
            return claims;
        }
        catch {
            return null;
        }
    }
}
exports.AuthTokenService = AuthTokenService;
exports.authTokenService = new AuthTokenService();
//# sourceMappingURL=auth-token.service.js.map