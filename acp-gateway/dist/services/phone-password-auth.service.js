"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.phonePasswordAuthService = exports.PhonePasswordAuthService = exports.PhonePasswordAuthError = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auth_token_service_1 = require("./auth-token.service");
function resolveTokenExpirySeconds() {
    const raw = process.env.AUTH_TOKEN_EXPIRES_SECONDS;
    if (!raw) {
        return undefined;
    }
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
function normalizePhone(phone) {
    return phone.replace(/\D/g, '');
}
function isValidPhone(phone) {
    return /^1\d{10}$/.test(phone);
}
function buildUserId(phone) {
    return `phone_${phone}`;
}
function hashPassword(password, salt) {
    return crypto_1.default.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
}
function safeEqual(expected, actual) {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(actual, 'hex');
    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(expectedBuffer, actualBuffer);
}
class PhonePasswordAuthError extends Error {
    constructor(message, status, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.PhonePasswordAuthError = PhonePasswordAuthError;
class PhonePasswordAuthService {
    constructor() {
        this.accountsByPhone = new Map();
        this.storagePath = this.resolveStoragePath();
        this.loadFromDisk();
    }
    register(phoneInput, passwordInput) {
        const phone = normalizePhone(typeof phoneInput === 'string' ? phoneInput.trim() : '');
        const password = typeof passwordInput === 'string' ? passwordInput.trim() : '';
        if (!isValidPhone(phone)) {
            throw new PhonePasswordAuthError('手机号格式不正确', 400, 'INVALID_PHONE');
        }
        if (password.length < 6) {
            throw new PhonePasswordAuthError('密码长度不能少于 6 位', 400, 'INVALID_PASSWORD');
        }
        if (this.accountsByPhone.has(phone)) {
            throw new PhonePasswordAuthError('该手机号已注册，请直接登录', 409, 'PHONE_ALREADY_REGISTERED');
        }
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        const passwordHash = hashPassword(password, salt);
        const now = Date.now();
        const account = {
            userId: buildUserId(phone),
            phone,
            salt,
            passwordHash,
            createdAt: now,
            updatedAt: now,
        };
        this.accountsByPhone.set(phone, account);
        this.persistToDisk();
        return this.createLoginResult(account);
    }
    login(phoneInput, passwordInput) {
        const phone = normalizePhone(typeof phoneInput === 'string' ? phoneInput.trim() : '');
        const password = typeof passwordInput === 'string' ? passwordInput.trim() : '';
        if (!isValidPhone(phone)) {
            throw new PhonePasswordAuthError('手机号格式不正确', 400, 'INVALID_PHONE');
        }
        if (!password) {
            throw new PhonePasswordAuthError('密码不能为空', 400, 'PASSWORD_REQUIRED');
        }
        const account = this.accountsByPhone.get(phone);
        if (!account) {
            throw new PhonePasswordAuthError('手机号或密码错误', 401, 'INVALID_CREDENTIALS');
        }
        const inputHash = hashPassword(password, account.salt);
        if (!safeEqual(account.passwordHash, inputHash)) {
            throw new PhonePasswordAuthError('手机号或密码错误', 401, 'INVALID_CREDENTIALS');
        }
        account.updatedAt = Date.now();
        this.accountsByPhone.set(phone, account);
        this.persistToDisk();
        return this.createLoginResult(account);
    }
    getAccountByUserId(userId) {
        if (!userId || !userId.startsWith('phone_')) {
            return null;
        }
        const phone = userId.slice('phone_'.length);
        const account = this.accountsByPhone.get(phone);
        if (!account) {
            return null;
        }
        return {
            userId: account.userId,
            phone: account.phone,
        };
    }
    createLoginResult(account) {
        const { token, expiresInSeconds } = auth_token_service_1.authTokenService.createToken({
            userId: account.userId,
            openId: `phone_${account.phone}`,
            expiresInSeconds: resolveTokenExpirySeconds(),
        });
        return {
            token,
            expiresInSeconds,
            user: {
                userId: account.userId,
                phone: account.phone,
            },
        };
    }
    resolveStoragePath() {
        const configured = process.env.PHONE_AUTH_STORE_PATH?.trim();
        if (configured) {
            return path_1.default.resolve(configured);
        }
        return path_1.default.resolve(__dirname, '../../data/phone-accounts.json');
    }
    loadFromDisk() {
        try {
            if (!fs_1.default.existsSync(this.storagePath)) {
                return;
            }
            const raw = fs_1.default.readFileSync(this.storagePath, 'utf8');
            if (!raw.trim()) {
                return;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return;
            }
            for (const item of parsed) {
                if (!item || typeof item !== 'object') {
                    continue;
                }
                const candidate = item;
                if (typeof candidate.userId !== 'string' ||
                    typeof candidate.phone !== 'string' ||
                    typeof candidate.salt !== 'string' ||
                    typeof candidate.passwordHash !== 'string' ||
                    typeof candidate.createdAt !== 'number' ||
                    typeof candidate.updatedAt !== 'number') {
                    continue;
                }
                const normalizedPhone = normalizePhone(candidate.phone);
                if (!isValidPhone(normalizedPhone)) {
                    continue;
                }
                const account = {
                    userId: candidate.userId,
                    phone: normalizedPhone,
                    salt: candidate.salt,
                    passwordHash: candidate.passwordHash,
                    createdAt: candidate.createdAt,
                    updatedAt: candidate.updatedAt,
                };
                this.accountsByPhone.set(normalizedPhone, account);
            }
        }
        catch (error) {
            console.warn('[phone-auth] 加载账号存储失败，将使用空账号库：', error);
            this.accountsByPhone.clear();
        }
    }
    persistToDisk() {
        try {
            const dir = path_1.default.dirname(this.storagePath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            const snapshot = Array.from(this.accountsByPhone.values()).map((account) => ({
                userId: account.userId,
                phone: account.phone,
                salt: account.salt,
                passwordHash: account.passwordHash,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
            }));
            const tempPath = `${this.storagePath}.tmp`;
            fs_1.default.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), 'utf8');
            fs_1.default.renameSync(tempPath, this.storagePath);
        }
        catch (error) {
            console.warn('[phone-auth] 保存账号存储失败：', error);
        }
    }
}
exports.PhonePasswordAuthService = PhonePasswordAuthService;
exports.phonePasswordAuthService = new PhonePasswordAuthService();
//# sourceMappingURL=phone-password-auth.service.js.map