import { Request, Response, NextFunction } from 'express';
import { authTokenService, AuthTokenClaims } from '../services/auth-token.service';

type RequestWithAuth = Request & { auth?: AuthTokenClaims };

function getBearerToken(headerValue?: string): string | null {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token.trim() || null;
}

export function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
  const request = req as RequestWithAuth;
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

  const claims = authTokenService.verifyToken(token);
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

export function requireAuthIfEnabled(req: Request, res: Response, next: NextFunction): void {
  const request = req as RequestWithAuth;
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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const request = req as RequestWithAuth;
  if (!request.auth?.userId) {
    res.status(401).json({
      code: 401,
      message: '请先登录',
    });
    return;
  }

  next();
}

export function resolveRequestUserId(req: Request, fallbackUserId?: string): string | null {
  const request = req as RequestWithAuth;
  if (request.auth?.userId) {
    return request.auth.userId;
  }

  if (fallbackUserId) {
    return fallbackUserId;
  }

  return null;
}

export function isUserScopeAllowed(req: Request, requestedUserId?: string): boolean {
  const request = req as RequestWithAuth;
  if (!request.auth?.userId) {
    return true;
  }

  if (!requestedUserId) {
    return true;
  }

  return request.auth.userId === requestedUserId;
}
