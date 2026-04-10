"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.acpProtocol = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
const acp_parser_1 = require("./protocol/acp-parser");
const session_manager_1 = require("./protocol/session-manager");
const chat_route_1 = require("./routes/chat.route");
const auth_route_1 = require("./routes/auth.route");
const config_route_1 = require("./routes/config.route");
const health_route_1 = require("./routes/health.route");
const report_route_1 = require("./routes/report.route");
const route_config_route_1 = require("./routes/route-config.route");
const media_route_1 = require("./routes/media.route");
const content_route_1 = require("./routes/content.route");
const auth_middleware_1 = require("./middleware/auth.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const acpProtocol = new acp_parser_1.ACPProtocol(process.env.ACP_VERSION || '1.0');
exports.acpProtocol = acpProtocol;
let sessionManager;
async function initServer() {
    let redis = null;
    try {
        redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            lazyConnect: true,
        });
        await redis.connect();
        console.log('✅ Redis connected');
    }
    catch (e) {
        console.log('⚠️ Redis not available, using in-memory sessions');
        redis = null;
    }
    exports.sessionManager = sessionManager = new session_manager_1.SessionManager(redis, parseInt(process.env.ACP_SESSION_EXPIRE_MINUTES || '30'));
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
                scriptSrcAttr: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:", "https://i0.hdslb.com", "https://i1.hdslb.com", "https://i2.hdslb.com", "https://i3.hdslb.com", "https://i4.hdslb.com"],
                connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
                frameSrc: ["'self'", "https://player.bilibili.com", "https://www.bilibili.com"],
            },
        },
    }));
    app.use((0, cors_1.default)({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../pages')));
    app.use(express_1.default.static(path_1.default.join(__dirname, '../..')));
    app.use(auth_middleware_1.authenticateRequest);
    app.use((req, res, next) => {
        req.acpProtocol = acpProtocol;
        req.sessionManager = sessionManager;
        next();
    });
    app.use('/acp/auth', auth_route_1.authRouter);
    app.use('/acp/chat', chat_route_1.chatRouter);
    app.use('/acp/config', config_route_1.configRouter);
    app.use('/acp/health', health_route_1.healthRouter);
    app.use('/acp/report', report_route_1.reportRouter);
    app.use('/acp/routes', route_config_route_1.routeConfigRouter);
    app.use('/acp/media', media_route_1.mediaRouter);
    app.use('/acp/content', content_route_1.contentRouter);
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.use((err, req, res, next) => {
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
//# sourceMappingURL=index.js.map