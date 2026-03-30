# Tasks: 内容推荐与商品推荐

**Input**: Design documents from `/specs/004-recommendation/`
**Prerequisites**: plan.md ✅, spec.md ✅

**依赖**: 本功能依赖 001-ai-chat, 002-report-analysis

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (继承 001)

- [ ] T001 [P] 确认 001-ai-chat 的 ACP Gateway 已部署
- [ ] T002 [P] 确认内容库/商品库数据已同步

---

## Phase 2: 数据模型 (Foundational)

- [ ] T003 [P] Create Content model (食谱/运动/心理/睡眠)
- [ ] T004 [P] Create Product model
- [ ] T005 [P] Create RecommendationRule model
- [ ] T006 Create UserPreference model (用户偏好)

---

## Phase 3: User Story 1 - 健康内容推荐 (Priority: P1) 🎯 MVP

**Goal**: 根据场景推荐相关健康内容

### Implementation

- [ ] T007 [P] [US1] Implement Content recommender in backend
- [ ] T008 [US1] Build content index (按场景/标签)
- [ ] T009 [US1] Add recommend tool to opencode Agent
- [ ] T010 [US1] Integrate content recommendation in chat response

---

## Phase 4: User Story 2 - 商品推荐 (Priority: P1) 🎯 MVP

**Goal**: 根据健康需求推荐相关商品

### Implementation

- [ ] T011 [P] [US2] Implement Product recommender
- [ ] T012 [US2] Build product index (按类目/场景/标签)
- [ ] T013 [US2] Add product recommendation to chat response
- [ ] T014 [US2] Add purchase link to recommendations

---

## Phase 5: User Story 3 - 个性化推荐 (Priority: P2)

**Goal**: 基于用户画像的个性化推荐

### Implementation

- [ ] T015 [P] [US3] Implement user preference tracking
- [ ] T016 [US3] Integrate with health profile data
- [ ] T017 [US3] Add collaborative filtering (optional)
- [ ] T018 [US3] Implement recommendation ranking optimization

---

## Phase 6: User Story 4 - 推荐配置管理 (Priority: P2)

**Goal**: 后台配置推荐规则

### Implementation

- [ ] T019 [P] [US4] Implement RecommendationRule CRUD
- [ ] T020 [US4] Add scene-to-content mapping
- [ ] T021 [US4] Add scene-to-product mapping
- [ ] T022 [US4] Add recommendation priority config

---

## Phase 7: 后台管理集成

- [ ] T023 [P] Admin: content management
- [ ] T024 Admin: product-recommendation mapping
- [ ] T025 Admin: recommendation analytics

---

## Phase 8: 性能与优化

- [ ] T026 [P] Add recommendation caching
- [ ] T027 Add A/B testing for recommendations
- [ ] T028 Performance optimization

---

## Phase 9: Polish

- [ ] T029 [P] Write unit tests for recommenders
- [ ] T030 Error handling for empty recommendations

---

## Dependencies

- 依赖 001-ai-chat (ACP Gateway)
- 依赖 002-report-analysis (健康档案数据)
- 依赖内容库/商品库数据就绪

## Implementation Strategy

### MVP First

1. Phase 1-2: Setup + 数据模型
2. Phase 3: US1 (内容推荐)
3. Phase 4: US2 (商品推荐)
4. **Deploy MVP!**

### Incremental

1. US1 → Test → Deploy
2. US2 → Test → Deploy
3. US3+US4 → Test → Deploy