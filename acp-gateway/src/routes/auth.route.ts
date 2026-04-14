import { Router, Request, Response } from 'express';
import { WechatAuthError, wechatAuthService } from '../services/wechat-auth.service';
import { AuthTokenClaims } from '../services/auth-token.service';
import { PhonePasswordAuthError, phonePasswordAuthService } from '../services/phone-password-auth.service';

const router = Router();
type RequestWithAuth = Request & { auth?: AuthTokenClaims };
const DEV_MINI_PROGRAM_OPEN_ID = 'dev_miniprogram_user';

function isDevLoginEnabled(): boolean {
  return process.env.ENABLE_DEV_LOGIN === 'true' || process.env.NODE_ENV !== 'production';
}

router.post('/mini-program/login', async (req: Request, res: Response) => {
  try {
    const code = req.body?.code;
    const result = await wechatAuthService.loginByCode(code);

    res.json({
      code: 0,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof WechatAuthError) {
      if (error.code === 'WECHAT_CONFIG_MISSING' && isDevLoginEnabled()) {
        console.warn('[auth] WECHAT_CONFIG_MISSING, fallback to dev mini-program login');
        res.json({
          code: 0,
          data: wechatAuthService.createDevLogin(DEV_MINI_PROGRAM_OPEN_ID),
          meta: {
            devFallback: true,
            fallbackReason: error.code,
          },
        });
        return;
      }

      res.status(error.status).json({
        code: error.status,
        message: error.message,
        errorCode: error.code,
      });
      return;
    }

    res.status(500).json({
      code: 500,
      message: '登录失败，请稍后重试',
      errorCode: 'LOGIN_ERROR',
    });
  }
});

router.post('/dev-login', (req: Request, res: Response) => {
  if (!isDevLoginEnabled()) {
    res.status(403).json({
      code: 403,
      message: '生产环境已禁用 dev-login',
      errorCode: 'DEV_LOGIN_DISABLED',
    });
    return;
  }

  const openId = req.body?.openId;
  const result = wechatAuthService.createDevLogin(openId);
  res.json({
    code: 0,
    data: result,
  });
});

router.post('/phone/register', (req: Request, res: Response) => {
  try {
    const phone = req.body?.phone;
    const password = req.body?.password;
    const result = phonePasswordAuthService.register(phone, password);

    res.json({
      code: 0,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof PhonePasswordAuthError) {
      res.status(error.status).json({
        code: error.status,
        message: error.message,
        errorCode: error.code,
      });
      return;
    }

    res.status(500).json({
      code: 500,
      message: '注册失败，请稍后重试',
      errorCode: 'PHONE_REGISTER_ERROR',
    });
  }
});

router.post('/phone/login', (req: Request, res: Response) => {
  try {
    const phone = req.body?.phone;
    const password = req.body?.password;
    const result = phonePasswordAuthService.login(phone, password);

    res.json({
      code: 0,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof PhonePasswordAuthError) {
      res.status(error.status).json({
        code: error.status,
        message: error.message,
        errorCode: error.code,
      });
      return;
    }

    res.status(500).json({
      code: 500,
      message: '登录失败，请稍后重试',
      errorCode: 'PHONE_LOGIN_ERROR',
    });
  }
});

router.get('/me', (req: Request, res: Response) => {
  const request = req as RequestWithAuth;
  if (!request.auth) {
    res.status(401).json({
      code: 401,
      message: '未登录',
    });
    return;
  }

  const phoneAccount = phonePasswordAuthService.getAccountByUserId(request.auth.userId);

  res.json({
    code: 0,
    data: {
      userId: request.auth.userId,
      openId: request.auth.openId,
      unionId: request.auth.unionId,
      phone: phoneAccount?.phone,
      exp: request.auth.exp,
    },
  });
});

export { router as authRouter };
