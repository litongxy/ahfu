# Tasks: 同仁堂文化问答

**Input**: Design documents from `/specs/005-tongrentang-culture/`
**Prerequisites**: plan.md ✅, spec.md ✅

**依赖**: 本功能依赖 001-ai-chat

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (继承 001)

- [ ] T001 [P] 确认 001-ai-chat 的 ACP Gateway 已部署

---

## Phase 2: 数据模型 (Foundational)

- [ ] T002 [P] Create BrandKnowledge model
- [ ] T003 [P] Create ProductKnowledge model
- [ ] T004 [P] Create StoreInfo model

---

## Phase 3: User Story 1 - 品牌知识问答 (Priority: P1) 🎯 MVP

**Goal**: 回答同仁堂品牌相关问题

### Implementation

- [ ] T005 [P] [US1] Build brand knowledge base (历史、理念、荣誉)
- [ ] T006 [US1] Add tongrentang tool to opencode Agent
- [ ] T007 [US1] Implement brand Q&A in knowledge service
- [ ] T008 [US1] Add medical disclaimer for brand questions

---

## Phase 4: User Story 2 - 产品知识问答 (Priority: P1) 🎯 MVP

**Goal**: 回答同仁堂产品相关问题

### Implementation

- [ ] T009 [P] [US2] Build product knowledge base (经典产品、功效)
- [ ] T010 [US2] Add product Q&A to knowledge service
- [ ] T011 [US2] Add product recommendations (optional)
- [ ] T012 [US2] Add usage/contraindication warnings

---

## Phase 5: User Story 3 - 门店与就医问答 (Priority: P2)

**Goal**: 回答门店位置、就医流程问题

### Implementation

- [ ] T013 [P] [US3] Integrate store info data
- [ ] T014 [US3] Add store Q&A to knowledge service
- [ ] T015 [US3] Add appointment booking guidance

---

## Phase 6: 后台管理

**Goal**: 支持知识库维护

### Implementation

- [ ] T016 [P] Admin: brand knowledge CRUD
- [ ] T017 Admin: product knowledge CRUD
- [ ] T018 Admin: store info management

---

## Phase 7: Polish

- [ ] T019 [P] Write unit tests for knowledge service
- [ ] T020 Review and optimize Q&A accuracy

---

## Dependencies

- 依赖 001-ai-chat (ACP Gateway + 知识库框架)

## Implementation Strategy

### MVP First

1. Phase 1-2: Setup + 数据模型
2. Phase 3: US1 (品牌问答)
3. Phase 4: US2 (产品问答)
4. **Deploy MVP!**

### Incremental

1. US1 → Test → Deploy
2. US2 → Test → Deploy
3. US3 → Test → Deploy