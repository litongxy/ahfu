export interface AuthTokenClaims {
    iss: 'acp-gateway';
    sub: string;
    userId: string;
    openId: string;
    unionId?: string;
    iat: number;
    exp: number;
}
interface CreateTokenInput {
    userId: string;
    openId: string;
    unionId?: string;
    expiresInSeconds?: number;
}
export declare class AuthTokenService {
    createToken(input: CreateTokenInput): {
        token: string;
        claims: AuthTokenClaims;
        expiresInSeconds: number;
    };
    verifyToken(token: string): AuthTokenClaims | null;
}
export declare const authTokenService: AuthTokenService;
export {};
//# sourceMappingURL=auth-token.service.d.ts.map