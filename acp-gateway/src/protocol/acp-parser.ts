import { v4 as uuidv4 } from 'uuid';

export interface ACPMessage {
  protocol: 'acp';
  version: string;
  sessionId?: string;
  message: {
    type: 'text' | 'image' | 'voice';
    content: string;
  };
  context?: {
    userId?: string;
    scene?: string;
    history?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
  tools?: string[];
}

export interface ACPResponse {
  protocol: 'acp';
  version: string;
  sessionId: string;
  message: {
    type: 'text' | 'stream' | 'done';
    content: string;
  };
  scene?: string;
  tools?: Array<{
    name: string;
    result: unknown;
  }>;
  recommendations?: {
    contents?: unknown[];
    goods?: unknown[];
    pages?: Array<{
      name: string;
      url: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class ACPProtocol {
  private version: string;

  constructor(version: string = '1.0') {
    this.version = version;
  }

  parseRequest(data: unknown): ACPMessage | null {
    try {
      const msg = data as ACPMessage;
      if (msg.protocol !== 'acp') {
        return null;
      }
      return msg;
    } catch {
      return null;
    }
  }

  createResponse(sessionId: string, content: string, options?: Partial<ACPResponse>): ACPResponse {
    return {
      protocol: 'acp',
      version: this.version,
      sessionId,
      message: {
        type: 'text',
        content,
      },
      ...options,
    };
  }

  createStreamChunk(sessionId: string, content: string): ACPResponse {
    return {
      protocol: 'acp',
      version: this.version,
      sessionId,
      message: {
        type: 'stream',
        content,
      },
    };
  }

  createStreamDone(sessionId: string): ACPResponse {
    return {
      protocol: 'acp',
      version: this.version,
      sessionId,
      message: {
        type: 'done',
        content: '',
      },
    };
  }

  createErrorResponse(sessionId: string, code: string, message: string): ACPResponse {
    return {
      protocol: 'acp',
      version: this.version,
      sessionId,
      message: {
        type: 'text',
        content: '',
      },
      error: {
        code,
        message,
      },
    };
  }

  generateSessionId(): string {
    return `session_${uuidv4()}`;
  }

  validateMessage(msg: ACPMessage): { valid: boolean; error?: string } {
    if (!msg.message?.content) {
      return { valid: false, error: 'Message content is required' };
    }
    if (msg.message.type !== 'text') {
      return { valid: false, error: 'Only text messages are supported' };
    }
    return { valid: true };
  }
}

export const acpProtocol = new ACPProtocol();