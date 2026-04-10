import { Request, Response, NextFunction } from 'express';
export declare function authenticateRequest(req: Request, res: Response, next: NextFunction): void;
export declare function requireAuthIfEnabled(req: Request, res: Response, next: NextFunction): void;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function resolveRequestUserId(req: Request, fallbackUserId?: string): string | null;
export declare function isUserScopeAllowed(req: Request, requestedUserId?: string): boolean;
//# sourceMappingURL=auth.middleware.d.ts.map