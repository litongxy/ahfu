"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const uuid_1 = require("uuid");
class SessionManager {
    constructor(redis = null, sessionExpireMinutes = 30) {
        this.redis = redis;
        this.sessions = new Map();
        this.sessionExpireSeconds = sessionExpireMinutes * 60;
    }
    getKey(sessionId) {
        return `acp:session:${sessionId}`;
    }
    async create(userId, scene) {
        const session = {
            id: this.generateSessionId(),
            userId,
            scene,
            history: [],
            context: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.sessions.set(session.id, session);
        return session;
    }
    async get(sessionId) {
        const session = this.sessions.get(sessionId);
        return session || null;
    }
    async update(sessionId, data) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        const updated = {
            ...session,
            ...data,
            updatedAt: Date.now(),
        };
        this.sessions.set(sessionId, updated);
        return updated;
    }
    async addMessage(sessionId, role, content) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.history.push({
            role,
            content,
            timestamp: Date.now(),
        });
        session.updatedAt = Date.now();
        this.sessions.set(sessionId, session);
        return session;
    }
    async extend(sessionId) {
        // In-memory mode: no-op
    }
    async delete(sessionId) {
        this.sessions.delete(sessionId);
    }
    async getOrCreate(sessionId, userId) {
        if (sessionId) {
            const session = await this.get(sessionId);
            if (session) {
                return session;
            }
        }
        return this.create(userId);
    }
    generateSessionId() {
        return `sess_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 16)}`;
    }
    async cleanup() {
        this.sessions.clear();
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map