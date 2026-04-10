import { v4 as uuidv4 } from 'uuid';

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

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private sessionExpireSeconds: number;

  constructor(
    private redis: any = null,
    sessionExpireMinutes: number = 30
  ) {
    this.sessionExpireSeconds = sessionExpireMinutes * 60;
  }

  private getKey(sessionId: string): string {
    return `acp:session:${sessionId}`;
  }

  async create(userId?: string, scene?: string): Promise<SessionData> {
    const session: SessionData = {
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

  async get(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    return session || null;
  }

  async update(sessionId: string, data: Partial<SessionData>): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const updated: SessionData = {
      ...session,
      ...data,
      updatedAt: Date.now(),
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<SessionData | null> {
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

  async extend(sessionId: string): Promise<void> {
    // In-memory mode: no-op
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async getOrCreate(sessionId: string | undefined, userId?: string): Promise<SessionData> {
    if (sessionId) {
      const session = await this.get(sessionId);
      if (session) {
        return session;
      }
    }
    return this.create(userId);
  }

  private generateSessionId(): string {
    return `sess_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  }

  async cleanup(): Promise<void> {
    this.sessions.clear();
  }
}