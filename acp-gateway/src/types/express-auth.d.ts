import type { AuthTokenClaims } from '../services/auth-token.service';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenClaims;
    }
  }
}

export {};
