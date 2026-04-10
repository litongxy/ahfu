"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acpProtocol = exports.ACPProtocol = void 0;
const uuid_1 = require("uuid");
class ACPProtocol {
    constructor(version = '1.0') {
        this.version = version;
    }
    parseRequest(data) {
        try {
            const msg = data;
            if (msg.protocol !== 'acp') {
                return null;
            }
            return msg;
        }
        catch {
            return null;
        }
    }
    createResponse(sessionId, content, options) {
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
    createStreamChunk(sessionId, content) {
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
    createStreamDone(sessionId) {
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
    createErrorResponse(sessionId, code, message) {
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
    generateSessionId() {
        return `session_${(0, uuid_1.v4)()}`;
    }
    validateMessage(msg) {
        if (!msg.message?.content) {
            return { valid: false, error: 'Message content is required' };
        }
        if (msg.message.type !== 'text') {
            return { valid: false, error: 'Only text messages are supported' };
        }
        return { valid: true };
    }
}
exports.ACPProtocol = ACPProtocol;
exports.acpProtocol = new ACPProtocol();
//# sourceMappingURL=acp-parser.js.map