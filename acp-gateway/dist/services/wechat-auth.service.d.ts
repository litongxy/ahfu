interface LoginResult {
    token: string;
    expiresInSeconds: number;
    user: {
        userId: string;
        openId: string;
        unionId?: string;
    };
}
export declare class WechatAuthError extends Error {
    status: number;
    code: string;
    constructor(message: string, status: number, code: string);
}
export declare class WechatAuthService {
    loginByCode(code: string): Promise<LoginResult>;
    createDevLogin(openId?: string): LoginResult;
}
export declare const wechatAuthService: WechatAuthService;
export {};
//# sourceMappingURL=wechat-auth.service.d.ts.map