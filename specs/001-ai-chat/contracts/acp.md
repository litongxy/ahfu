# ACP (Agent Communication Protocol) Specification

## Overview

ACP (Agent Communication Protocol) is a protocol for communication between clients (frontend apps) and AI Agents. It supports:
- Message passing with context
- Tool calling (Agent can invoke backend services)
- Streaming responses (SSE)
- Session management

---

## Message Format

### Request

```json
{
  "protocol": "acp",
  "version": "1.0",
  "sessionId": "session_xxx",
  "message": {
    "type": "text",
    "content": "用户问题"
  },
  "context": {
    "userId": "user_123",
    "scene": "health",
    "history": []
  },
  "tools": ["search-knowledge", "get-profile", "recommend"]
}
```

### Response

```json
{
  "protocol": "acp",
  "version": "1.0",
  "sessionId": "session_xxx",
  "message": {
    "type": "text",
    "content": "AI回复内容"
  },
  "tools": [
    {
      "name": "search-knowledge",
      "result": []
    }
  ],
  "recommendations": {
    "contents": [],
    "goods": [],
    "pages": []
  }
}
```

### Streaming Response (SSE)

```
event: message
data: {"type": "text", "content": "部"}

event: message
data: {"type": "text", "content": "分内"}

event: done
data: {"type": "done"}
```

---

## Endpoints

### POST /acp/chat

Send a chat message to the Agent.

**Request:**

```json
{
  "message": "最近总是失眠怎么办",
  "context": {
    "userId": "user_123"
  }
}
```

**Response:**

```json
{
  "response": "根据您的情况，失眠可能与...",
  "scene": "sleep",
  "recommendations": {}
}
```

### GET /acp/sessions/:sessionId

Get session info.

### DELETE /acp/sessions/:sessionId

Close session.

### GET /acp/config/quick-questions

Get quick question list.

### GET /acp/scenes

Get available scenes.

### POST /acp/health-profile

Update user health profile.

### GET /acp/health-profile

Get user health profile.

### GET /acp/knowledge/search

Search knowledge base.

---

## Session Management

- Session created on first message
- Session expires after 30 minutes of inactivity
- Session stores: user context, conversation history, scene

---

## Tool Calling

Agent can call tools defined in the system:

| Tool | Description | Parameters |
|------|-------------|------------|
| search-knowledge | Search knowledge base | keyword, scene |
| get-profile | Get user health profile | userId |
| recommend | Get recommended content | scene, userId |
| search-scenes | Search scenes | keyword |

---

## Error Handling

```json
{
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Tool not found: xxx"
  }
}
```

---

## Security

- All requests must include user authentication
- Sensitive data encrypted in transit (HTTPS)
- Rate limiting: 60 requests per minute per user