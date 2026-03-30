# Implementation Plan: AI健康咨询对话

**Branch**: `001-ai-chat` | **Date**: 2026-03-28 | **Spec**: `specs/001-ai-chat/spec.md`

**Input**: Feature specification from `/specs/001-ai-chat/spec.md`

## Summary

实现AI健康咨询对话功能，用户通过首页聊天输入框发起健康问题咨询，**使用 opencode 作为 AI Agent** 与用户对话，**前后端通过 ACP (Agent Communication Protocol) 协议通信**。

**技术方案**: 
- **AI Agent**: opencode (基于 Claude/其他LLM的AI代理)
- **通信协议**: ACP (Agent Communication Protocol) - 专用于Agent与系统通信的协议
- **架构**: 前端(小程序/APP) ↔ ACP Gateway ↔ opencode Agent ↔ 知识库/后端服务

## Technical Context

**Language/Version**: 
- Backend: Node.js 18+, Python 3.11+ (for ACP Gateway)
- Frontend: TypeScript, Swift 5.9+, Kotlin 1.9+
- AI Agent: opencode

**Primary Dependencies**:  
- **AI Agent**: opencode (作为对话引擎)
- **后端**: FastAPI/Express, PostgreSQL, Redis
- **通信**: ACP Protocol (自研/标准Agent通信协议)
- **存储**: PostgreSQL (主数据库), Redis (缓存/Session)

**Testing**: pytest, Jest, manual testing with opencode  
**Target Platform**: iOS 12+, Android 8+, 微信小程序  
**Project Type**: AI Agent + 移动应用 + ACP Gateway  
**Performance Goals**: AI响应<3秒, 页面加载<2秒, 支持10000+并发用户  
**Constraints**: 需符合《个人信息保护法》，用户数据加密存储  
**Scale/Scope**: 约10万用户，50+知识库场景

### ACP 协议说明

ACP (Agent Communication Protocol) 是用于 Agent 与系统通信的协议：

```
前端请求 → ACP Gateway → opencode Agent → 知识库/服务
                                    ↓
                              前端响应 ← ACP Gateway
```

- **消息格式**: JSON with agent context
- **流式响应**: 支持 Server-Sent Events (SSE)
- **会话管理**: ACP Session 管理用户上下文
- **工具调用**: Agent 可调用系统工具 (搜索知识库、查询数据库等)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

根据 `.specify/memory/constitution.md` 核心原则检查：

| 原则 | 检查项 | 状态 |
|------|--------|------|
| I. AI健康咨询为核心 | 确保对话是核心功能入口 | ✅ PASS |
| II. 报告智能分析 | 本功能不涉及 | N/A |
| III. 个性化推荐 | 需实现内容/商品推荐 | ✅ PASS |
| IV. 数据安全与隐私 | 敏感信息加密、隐私合规 | ✅ PASS |
| V. 用户体验优先 | 响应时间<3秒、简洁交互 | ✅ PASS |
| VI. 后台管理规范化 | 需支持知识库管理 | ✅ PASS |

**结论**: 符合宪法要求，无需复杂度追踪。

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chat/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (optional)
├── data-model.md        # Phase 1 output (optional)
├── contracts/           # ACP Protocol contracts
│   ├── openapi.yaml     # REST API (for reference)
│   └── acp.md          # ACP Protocol 定义
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
# ACP Gateway - 协议转换层 (Node.js/Express)
acp-gateway/
├── src/
│   ├── protocol/        # ACP 协议实现
│   │   ├── acp-parser.ts     # ACP 消息解析
│   │   ├── session-manager.ts # 会话管理
│   │   └── tools/           # Agent 工具注册
│   │       ├── search-knowledge.ts
│   │       ├── get-profile.ts
│   │       └── recommend.ts
│   ├── routes/          # 对外接口
│   │   ├── chat.route.ts
│   │   └── health.route.ts
│   ├── middleware/      # 中间件
│   │   └── auth.middleware.ts
│   └── index.ts         # 入口
├── tests/
│   ├── unit/
│   └── integration/
└── package.json

# 后端服务 - 数据和服务层
backend/
├── src/
│   ├── models/          # 数据模型
│   │   ├── user.model.ts
│   │   ├── health-profile.model.ts
│   │   ├── knowledge-base.model.ts
│   │   └── scene.model.ts
│   ├── services/        # 业务逻辑
│   │   ├── knowledge.service.ts
│   │   ├── recommendation.service.ts
│   │   └── profile.service.ts
│   └── db/              # 数据库
├── tests/
└── package.json

# 前端 - 微信小程序
frontend/
├── pages/
│   ├── index/           # 首页
│   └── chat/            # 对话页
├── components/
│   ├── chat-input/
│   └── quick-questions/
├── services/
│   └── acp-client.ts    # ACP 客户端
├── app.json
└── project.config.json

# opencode Agent 配置
agents/
└── health-assistant/
    ├── agent.md         # Agent 角色定义
    ├── tools/           # 可用工具
    │   ├── search-knowledge.md
    │   ├── get-profile.md
    │   └── recommend.md
    └── prompts/
        └── system.md
```

**Structure Decision**: 
采用 **ACP Gateway + opencode Agent** 架构：
- **ACP Gateway**: 协议解析、会话管理、工具路由
- **opencode**: 作为 AI 对话引擎
- **Backend**: 提供数据和服务能力

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无需复杂度追踪，架构符合宪法要求。

---

**下一步**: 运行 `/speckit.tasks` 命令生成任务列表