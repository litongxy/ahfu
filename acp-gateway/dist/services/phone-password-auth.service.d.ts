interface LoginResult {
    token: string;
    expiresInSeconds: number;
    user: {
        userId: string;
        phone: string;
    };
}
export declare class PhonePasswordAuthError extends Error {
    status: number;
    code: string;
    constructor(message: string, status: number, code: string);
}
export declare class PhonePasswordAuthService {
    private accountsByPhone;
    private readonly storagePath;
    constructor();
    register(phoneInput: string, passwordInput: string): LoginResult;
    login(phoneInput: string, passwordInput: string): LoginResult;
    getAccountByUserId(userId: string): {
        userId: string;
        phone: string;
    } | null;
    private createLoginResult;
    private resolveStoragePath;
    private loadFromDisk;
    private persistToDisk;
}
export declare const phonePasswordAuthService: PhonePasswordAuthService;
export {};
//# sourceMappingURL=phone-password-auth.service.d.ts.map