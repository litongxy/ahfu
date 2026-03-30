# Tasks: 功能页路由

**Input**: Design documents from `/specs/003-page-routing/`
**Prerequisites**: plan.md ✅, spec.md ✅

**依赖**: 本功能依赖 001-ai-chat (ACP Gateway + opencode Agent)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (继承 001)

- [ ] T001 [P] 确认 001-ai-chat 的 ACP Gateway 已部署

---

## Phase 2: 数据模型 (Foundational)

- [ ] T002 [P] Create PageRoute model in backend/src/models/page-route.model.ts
- [ ] T003 [P] Create RouteIntent model in backend/src/models/route-intent.model.ts
- [ ] T004 Setup database migrations for route tables

---

## Phase 3: User Story 1 - 语义意图识别 (Priority: P1) 🎯 MVP

**Goal**: 识别用户语义中的页面跳转意图

### Implementation

- [ ] T005 [P] [US1] Define default page routes (体检报告、精准健康、商城、我的、健康档案)
- [ ] T006 [US1] Implement intent matching logic in acp-gateway/src/services/intent-matcher.ts
- [ ] T007 [US1] Add page-routing tool to opencode Agent
- [ ] T008 [US1] Integrate intent matching with chat response

---

## Phase 4: User Story 2 - 快捷入口展示 (Priority: P1) 🎯 MVP

**Goal**: 在对话中展示页面快捷入口

### Implementation

- [ ] T009 [P] [US2] Design quick entry card format in response
- [ ] T010 [US2] Implement page route recommendations
- [ ] T011 [US2] Add multiple page options for ambiguous intent

---

## Phase 5: User Story 3 - 页面配置管理 (Priority: P2)

**Goal**: 后台可配置页面快捷入口

### Implementation

- [ ] T012 [P] [US3] Implement CRUD for PageRoute in backend
- [ ] T013 [US3] Implement GET /acp/routes endpoint
- [ ] T014 [US3] Add enable/disable functionality
- [ ] T015 [US3] Add route priority configuration

---

## Phase 6: 前端集成

**Goal**: 前端实现快捷入口点击跳转

### Implementation

- [ ] T016 [P] [Frontend] Update chat response parser to handle page routes
- [ ] T017 [Frontend] Implement quick entry card component
- [ ] T018 [Frontend] Add deep link handling
- [ ] T019 [Frontend] Handle login-required pages

---

## Phase 7: 后台管理集成

**Goal**: 后台管理页面路由配置

### Implementation

- [ ] T020 [P] Admin: page route management UI
- [ ] T021 Admin: route intent configuration

---

## Phase 8: Polish

- [ ] T022 [P] Write unit tests for intent matcher
- [ ] T023 Error handling for invalid routes

---

## Dependencies

- 依赖 001-ai-chat 的 ACP Gateway

## Implementation Strategy

### MVP First

1. Phase 1-2: Setup + 数据模型
2. Phase 3: US1 (意图识别)
3. Phase 4: US2 (快捷入口)
4. **Deploy MVP!**

### Incremental

1. US1 → Test → Deploy
2. US2 → Test → Deploy
3. US3 (后台配置) → Test → Deploy