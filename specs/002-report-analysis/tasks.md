# Tasks: 体检报告分析

**Input**: Design documents from `/specs/002-report-analysis/`
**Prerequisites**: plan.md ✅, spec.md ✅

**依赖**: 本功能依赖 001-ai-chat (ACP Gateway + opencode Agent)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (继承 001)

**Purpose**: 复用 001-ai-chat 的基础设施

**注意**: Phase 1-2 主要依赖 001-ai-chat 的工作，如已完成可跳过

- [ ] T001 [P] 确认 001-ai-chat 的 ACP Gateway 已部署
- [ ] T002 [P] 确认 opencode Agent 已配置

---

## Phase 2: 数据模型 (Foundational)

**Purpose**: 创建报告相关数据模型

- [ ] T003 [P] Create HealthReport model in backend/src/models/health-report.model.ts
- [ ] T004 [P] Create ReportIndicator model in backend/src/models/report-indicator.model.ts
- [ ] T005 [P] Create InterventionPlan model in backend/src/models/intervention-plan.model.ts
- [ ] T006 Setup database migrations for report tables

**Checkpoint**: 数据模型 ready

---

## Phase 3: User Story 1 - 报告上传与解析 (Priority: P1) 🎯 MVP

**Goal**: 用户可上传 PDF/图片报告，系统解析出指标数据

**Independent Test**: 上传报告，验证返回解析后的指标列表

### Implementation

- [ ] T007 [P] [US1] Implement OCR service (aliyun/tencent OCR) in acp-gateway/src/services/ocr.service.ts
- [ ] T008 [P] [US1] Implement PDF parser in acp-gateway/src/services/parser.service.ts
- [ ] T009 [US1] Implement indicator extractor in acp-gateway/src/services/indicator-extractor.ts
- [ ] T010 [US1] Implement POST /acp/report/upload endpoint
- [ ] T011 [US1] Add file upload validation (PDF, JPG, PNG, max 20MB)
- [ ] T012 [US1] Integrate OCR with report parsing

---

## Phase 4: User Story 2 - 异常项识别 (Priority: P1) 🎯 MVP

**Goal**: 识别报告中的异常指标，给出分析

**Independent Test**: 上传有异常项的报告，验证识别正确

### Implementation

- [ ] T013 [P] [US2] Create indicator reference data (正常值范围库)
- [ ] T014 [US2] Implement anomaly detection logic in acp-gateway/src/services/analyzer.service.ts
- [ ] T015 [US2] Add severity classification (正常/轻微/异常/严重)
- [ ] T016 [US2] Generate复查建议 based on anomaly type
- [ ] T017 [US2] Integrate anomaly detection with report parsing

---

## Phase 5: User Story 3 - 干预方案 (Priority: P1) 🎯 MVP

**Goal**: 根据异常项生成个性化干预方案

**Independent Test**: 有异常项的报告，验证返回干预方案

### Implementation

- [ ] T018 [P] [US3] Define intervention plan templates (饮食/运动/睡眠)
- [ ] T019 [US3] Implement plan generation logic in acp-gateway/src/services/plan-generator.service.ts
- [ ] T020 [US3] Integrate with opencode Agent for AI 建议生成
- [ ] T021 [US3] Add recipe/exercise/sleep course recommendations
- [ ] T022 [US3] Get user health profile for personalized plans

---

## Phase 6: User Story 4 - 报告历史 (Priority: P2)

**Goal**: 用户可查看历史报告记录

**Independent Test**: 上传多份报告，验证可查看历史

### Implementation

- [ ] T023 [P] [US4] Implement GET /acp/report/history endpoint
- [ ] T024 [US4] Implement GET /acp/report/:reportId endpoint
- [ ] T025 [US4] Add report deduplication (相同报告提示)

---

## Phase 7: User Story 5 - 分享功能 (Priority: P3)

**Goal**: 用户可分享报告分析结果

**Independent Test**: 完成分析后，验证可生成分享

### Implementation

- [ ] T026 [P] [US5] Implement report summary generation
- [ ] [ ] T027 [US5] Implement share link generation
- [ ] T028 [US5] Add privacy filter (分享内容脱敏)

---

## Phase 8: 前端集成 (Priority: P2)

**Goal**: 小程序/APP 集成报告上传功能

### Implementation

- [ ] T029 [P] [Frontend] Add report upload component
- [ ] T030 [Frontend] Build report result display page
- [ ] T031 [Frontend] Build report history page
- [ ] T032 [Frontend] Add share functionality

---

## Phase 9: 后台管理 (Priority: P2)

**Goal**: 后台可查看和管理用户报告

### Implementation

- [ ] T033 [P] Admin endpoint: list user reports
- [ ] T034 Admin endpoint: view report details
- [ ] T035 Add report analytics to admin dashboard

---

## Phase 10: 性能与安全

**Goal**: 满足性能和合规要求

### Implementation

- [ ] T036 [P] Add async processing for large reports
- [ ] T037 [P] Implement report data encryption
- [ ] T038 Add processing timeout handling
- [ ] T039 Performance testing (目标: <10秒)

---

## Phase 11: Polish

- [ ] T040 [P] Write unit tests for parser service
- [ ] T041 [P] Write unit tests for analyzer service
- [ ] T042 Error handling improvements

---

## Dependencies & Execution Order

### 依赖

- 本功能依赖 001-ai-chat 的 ACP Gateway 和 opencode Agent
- 001 完成后再开始本功能

### Phase Dependencies

- **Setup (Phase 1)**: 确认依赖功能就绪
- **Foundational (Phase 2)**: 数据模型
- **User Stories (Phase 3-8)**: 核心功能开发
- **Polish (Phase 11)**: 测试收尾

### User Story Dependencies

- **US1 (P1)**: 报告上传与解析 - 基础
- **US2 (P1)**: 异常项识别 - 依赖 US1
- **US3 (P1)**: 干预方案 - 依赖 US2
- **US4 (P2)**: 历史记录 - 独立
- **US5 (P3)**: 分享功能 - 独立
- **Frontend (Phase 8)**: 依赖 US1-US5

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Phase 1-2: Setup + 数据模型
2. Phase 3: US1 (上传+解析)
3. Phase 4: US2 (异常识别)
4. Phase 5: US3 (干预方案)
5. **STOP and VALIDATE**: 完整报告分析流程
6. Deploy/demo (MVP!)

### Incremental Delivery

1. Setup + Foundational
2. US1 (上传解析) → Test → Deploy
3. US2+US3 (分析+方案) → Test → Deploy
4. US4 (历史) → Test → Deploy
5. Frontend → Test → Deploy