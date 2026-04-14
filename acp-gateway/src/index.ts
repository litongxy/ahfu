import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import path from 'path';
import { ACPProtocol } from './protocol/acp-parser';
import { SessionManager } from './protocol/session-manager';
import { chatRouter } from './routes/chat.route';
import { authRouter } from './routes/auth.route';
import { configRouter } from './routes/config.route';
import { healthRouter } from './routes/health.route';
import { reportRouter } from './routes/report.route';
import { routeConfigRouter } from './routes/route-config.route';
import { mediaRouter } from './routes/media.route';
import { contentRouter } from './routes/content.route';
import { authenticateRequest } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const acpProtocol = new ACPProtocol(process.env.ACP_VERSION || '1.0');

let sessionManager: SessionManager;

async function initServer() {
  let redis: Redis | null = null;
  
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
    });
    await redis.connect();
    console.log('✅ Redis connected');
  } catch (e) {
    console.log('⚠️ Redis not available, using in-memory sessions');
    redis = null;
  }

  sessionManager = new SessionManager(
    redis,
    parseInt(process.env.ACP_SESSION_EXPIRE_MINUTES || '30')
  );

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
        scriptSrcAttr: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "https://i0.hdslb.com", "https://i1.hdslb.com", "https://i2.hdslb.com", "https://i3.hdslb.com", "https://i4.hdslb.com"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
        frameSrc: ["'self'", "https://player.bilibili.com", "https://www.bilibili.com"],
        "upgrade-insecure-requests": null,
      },
    },
    strictTransportSecurity: false,
  }));
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
  }));
  app.use(express.json({ limit: '10mb' }));

  app.get('/', (req: Request, res: Response) => {
    res.redirect('/chat.html');
  });
  
  app.use(express.static(path.join(__dirname, '../../pages')));
  app.use(express.static(path.join(__dirname, '../..')));
  app.use(authenticateRequest);

  app.use((req: Request, res: Response, next: NextFunction) => {
    (req as Request & { acpProtocol: ACPProtocol }).acpProtocol = acpProtocol;
    (req as Request & { sessionManager: SessionManager }).sessionManager = sessionManager;
    next();
  });

  app.use('/acp/auth', authRouter);
  app.use('/acp/chat', chatRouter);
  app.use('/acp/config', configRouter);
  app.use('/acp/health', healthRouter);
  app.use('/acp/report', reportRouter);
  app.use('/acp/routes', routeConfigRouter);
  app.use('/acp/media', mediaRouter);
  app.use('/acp/content', contentRouter);

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });

  app.listen(PORT, () => {
    console.log(`✅ ACP Gateway running on http://localhost:${PORT}`);
    console.log(`📖 Scenes: http://localhost:${PORT}/acp/config/scenes`);
    console.log(`📖 Quick Questions: http://localhost:${PORT}/acp/config/quick-questions`);
    console.log(`💬 Chat: POST http://localhost:${PORT}/acp/chat`);
  });
}

initServer();

export { acpProtocol, sessionManager };
