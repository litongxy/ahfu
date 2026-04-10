import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { authTokenService } from './auth-token.service';

interface PhoneAccount {
  userId: string;
  phone: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

interface LoginResult {
  token: string;
  expiresInSeconds: number;
  user: {
    userId: string;
    phone: string;
  };
}

function resolveTokenExpirySeconds(): number | undefined {
  const raw = process.env.AUTH_TOKEN_EXPIRES_SECONDS;
  if (!raw) {
    return undefined;
  }

  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isValidPhone(phone: string): boolean {
  return /^1\d{10}$/.test(phone);
}

function buildUserId(phone: string): string {
  return `phone_${phone}`;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
}

function safeEqual(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export class PhonePasswordAuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class PhonePasswordAuthService {
  private accountsByPhone: Map<string, PhoneAccount> = new Map();
  private readonly storagePath: string;

  constructor() {
    this.storagePath = this.resolveStoragePath();
    this.loadFromDisk();
  }

  register(phoneInput: string, passwordInput: string): LoginResult {
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

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const now = Date.now();

    const account: PhoneAccount = {
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

  login(phoneInput: string, passwordInput: string): LoginResult {
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

  getAccountByUserId(userId: string): { userId: string; phone: string } | null {
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

  private createLoginResult(account: PhoneAccount): LoginResult {
    const { token, expiresInSeconds } = authTokenService.createToken({
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

  private resolveStoragePath(): string {
    const configured = process.env.PHONE_AUTH_STORE_PATH?.trim();
    if (configured) {
      return path.resolve(configured);
    }

    return path.resolve(__dirname, '../../data/phone-accounts.json');
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return;
      }

      const raw = fs.readFileSync(this.storagePath, 'utf8');
      if (!raw.trim()) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }

      for (const item of parsed) {
        if (!item || typeof item !== 'object') {
          continue;
        }

        const candidate = item as Partial<PhoneAccount>;
        if (
          typeof candidate.userId !== 'string' ||
          typeof candidate.phone !== 'string' ||
          typeof candidate.salt !== 'string' ||
          typeof candidate.passwordHash !== 'string' ||
          typeof candidate.createdAt !== 'number' ||
          typeof candidate.updatedAt !== 'number'
        ) {
          continue;
        }

        const normalizedPhone = normalizePhone(candidate.phone);
        if (!isValidPhone(normalizedPhone)) {
          continue;
        }

        const account: PhoneAccount = {
          userId: candidate.userId,
          phone: normalizedPhone,
          salt: candidate.salt,
          passwordHash: candidate.passwordHash,
          createdAt: candidate.createdAt,
          updatedAt: candidate.updatedAt,
        };

        this.accountsByPhone.set(normalizedPhone, account);
      }
    } catch (error) {
      console.warn('[phone-auth] 加载账号存储失败，将使用空账号库：', error);
      this.accountsByPhone.clear();
    }
  }

  private persistToDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
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
      fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), 'utf8');
      fs.renameSync(tempPath, this.storagePath);
    } catch (error) {
      console.warn('[phone-auth] 保存账号存储失败：', error);
    }
  }
}

export const phonePasswordAuthService = new PhonePasswordAuthService();
