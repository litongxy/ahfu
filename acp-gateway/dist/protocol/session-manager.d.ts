export interface SessionData {
    id: string;
    userId?: string;
    scene?: string;
    history: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: number;
    }>;
    context: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}
export declare class SessionManager {
    private redis;
    private sessions;
    private sessionExpireSeconds;
    constructor(redis?: any, sessionExpireMinutes?: number);
    private getKey;
    create(userId?: string, scene?: string): Promise<SessionData>;
    get(sessionId: string): Promise<SessionData | null>;
    update(sessionId: string, data: Partial<SessionData>): Promise<SessionData | null>;
    addMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<SessionData | null>;
    extend(sessionId: string): Promise<void>;
    delete(sessionId: string): Promise<void>;
    getOrCreate(sessionId: string | undefined, userId?: string): Promise<SessionData>;
    private generateSessionId;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=session-manager.d.ts.map