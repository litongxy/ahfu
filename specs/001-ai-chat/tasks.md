# Tasks: AI健康咨询对话 (opencode + ACP)

**Input**: Design documents from `/specs/001-ai-chat/`
**Prerequisites**: plan.md ✅, spec.md ✅, contracts/ ✅

**架构说明**: 
- **AI Agent**: opencode (使用 opencode 作为对话引擎)
- **通信协议**: ACP (Agent Communication Protocol)
- **前端**: 微信小程序/APP，通过 ACP 与后端通信

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create ACP Gateway project structure (acp-gateway/src, acp-gateway/tests)
- [ ] T002 Create Backend project structure (backend/src, backend/tests)
- [ ] T003 Create Frontend project structure (frontend/pages, frontend/components)
- [ ] T004 Create Agents directory structure (agents/health-assistant/)
- [ ] T005 [P] Initialize Node.js project with Express for ACP Gateway
- [ ] T006 [P] Configure TypeScript, ESLint for all projects

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Setup PostgreSQL database schema
- [ ] T008 [P] Setup Redis for session/caching
- [ ] T009 [P] Implement ACP Protocol core (acp-parser, session-manager)
- [ ] T010 [P] Create base database models in backend
- [ ] T011 Configure environment variables (.env)
- [ ] T012 Setup CORS and security middleware

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - ACP协议 + opencode对话 (Priority: P1) 🎯 MVP

**Goal**: 用户可通过 ACP 协议发送消息，opencode Agent 返回回复

**Independent Test**: 通过 ACP Gateway 发送消息，验证 opencode Agent 返回正确响应

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement ACP message format in acp-gateway/src/protocol/acp-parser.ts
- [ ] T014 [P] [US1] Implement ACP Session manager in acp-gateway/src/protocol/session-manager.ts
- [ ] T015 [US1] Create opencode Agent definition in agents/health-assistant/agent.md
- [ ] T016 [US1] Define Agent tools in agents/health-assistant/tools/search-knowledge.md
- [ ] T017 [US1] Implement knowledge search tool in acp-gateway/src/protocol/tools/search-knowledge.ts
- [ ] T018 [US1] Implement POST /acp/chat endpoint in acp-gateway/src/routes/chat.route.ts
- [ ] T019 [US1] Integrate opencode with ACP Gateway (tool calling)
- [ ] T020 [US1] Add SSE streaming support for real-time responses

---

## Phase 4: User Story 2 - 快捷问题功能 (Priority: P2)

**Goal**: 用户可点击快捷问题快速获取答案

**Independent Test**: 获取快捷问题列表，点击后验证返回答案

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create quick-questions data model in backend
- [ ] T022 [US2] Implement GET /acp/config/quick-questions endpoint
- [ ] T023 [US2] Add quick question tools to opencode Agent

---

## Phase 5: User Story 3 - 推荐功能 (Priority: P3)

**Goal**: Agent 根据上下文推荐相关内容/商品

**Independent Test**: 特定问题触发推荐，验证返回推荐内容

### Implementation for User Story 3

- [ ] T024 [P] [US3] Implement recommendation tool in acp-gateway/src/protocol/tools/recommend.ts
- [ ] T025 [US3] Add recommend tool to opencode Agent definition
- [ ] T026 [US3] Add recommendation to response format

---

## Phase 6: User Story 4 - 健康档案 (Priority: P3)

**Goal**: 用户可填写和管理健康档案，Agent 可读取档案个性化回复

**Independent Test**: 填写健康档案后，验证 Agent 个性化回复

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create HealthProfile model in backend
- [ ] T028 [P] [US4] Implement get-profile tool in acp-gateway/src/protocol/tools/get-profile.ts
- [ ] T029 [US4] Add profile tool to opencode Agent definition
- [ ] T030 [US4] Implement GET/POST /acp/health-profile endpoint
- [ ] T031 [US4] Add profile context to Agent system prompt

---

## Phase 7: 前端集成 (Priority: P2)

**Goal**: 微信小程序/APP 集成 ACP 客户端

### Implementation

- [ ] T032 [P] [Frontend] Implement ACP client in frontend/services/acp-client.ts
- [ ] T033 [Frontend] Build chat input component
- [ ] T034 [Frontend] Build quick-questions component
- [ ] [ ] T035 [Frontend] Connect frontend to ACP Gateway

---

## Phase 8: 后台管理对接 (Priority: P2)

**Goal**: 后台可配置场景、知识库、热门问题

### Implementation

- [ ] T036 [P] Implement scene management endpoints
- [ ] T037 [P] Implement knowledge-base CRUD endpoints
- [ ] T038 Implement GET /acp/scenes endpoint
- [ ] T039 Implement GET /acp/knowledge/search endpoint

---

## Phase 9: 性能与安全 (Priority: P2)

**Goal**: 满足宪法要求的性能和安全标准

### Implementation

- [ ] T040 [P] Add response caching with Redis
- [ ] T041 [P] Implement rate limiting
- [ ] T042 Add data encryption for sensitive fields
- [ ] T043 [P] Add request/response logging
- [ ] T044 Performance testing

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T045 [P] Write unit tests for ACP protocol
- [ ] T046 [P] Write integration tests for endpoints
- [ ] T047 ACP Protocol documentation
- [ ] T048 Error handling standardization

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase
- **Polish (Phase 10)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: Core MVP - ACP + opencode 基础对话
- **User Story 2 (P2)**: 快捷问题 - 独立于 US1
- **User Story 3 (P3)**: 推荐功能 - 依赖 US1
- **User Story 4 (P3)**: 健康档案 - 独立于 US1
- **Frontend (Phase 7)**: 依赖 US1-US4 完成

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel
- Models within US1 marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (ACP + opencode)
4. **STOP and VALIDATE**: Test ACP protocol + opencode integration
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (ACP+opencode) → Test → Deploy (MVP!)
3. US2 (快捷问题) → Test → Deploy
4. Frontend integration → Test → Deploy
5. US3+US4 → Test → Deploy

---

## Notes

- **[P]** = parallelizable (different files, no dependencies)
- **[Story]** = maps to specific user story
- opencode 作为 AI Agent 核心，负责理解用户意图、生成回复、调用工具
- ACP 协议负责前后端通信，支持流式响应、会话管理
- Agent 可调用: 搜索知识库、获取用户档案、获取推荐内容 等工具