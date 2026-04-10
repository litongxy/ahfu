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
export declare class ACPProtocol {
    private version;
    constructor(version?: string);
    parseRequest(data: unknown): ACPMessage | null;
    createResponse(sessionId: string, content: string, options?: Partial<ACPResponse>): ACPResponse;
    createStreamChunk(sessionId: string, content: string): ACPResponse;
    createStreamDone(sessionId: string): ACPResponse;
    createErrorResponse(sessionId: string, code: string, message: string): ACPResponse;
    generateSessionId(): string;
    validateMessage(msg: ACPMessage): {
        valid: boolean;
        error?: string;
    };
}
export declare const acpProtocol: ACPProtocol;
//# sourceMappingURL=acp-parser.d.ts.map