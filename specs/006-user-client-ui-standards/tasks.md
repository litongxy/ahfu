# Tasks: 用户端 UI 规范整理

**Input**: Design documents from `/specs/006-user-client-ui-standards/`
**Prerequisites**: plan.md ✅, spec.md ✅

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Foundation)

**Purpose**: 准备规范整理所需的输入和目录结构

- [ ] T001 Create `specs/006-user-client-ui-standards/` directory and add spec/plan/tasks files
- [ ] T002 [P] Collect screenshot references from `~/Downloads/x健康app 用户端/` and sort by module
- [ ] T003 [P] Review `acp-gateway/src/services/recommendation.service.ts` and `specs/004-recommendation/spec.md` for scene mapping

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 先建立统一规则，再展开页面和组件

- [ ] T004 Define the global visual language section in `specs/006-user-client-ui-standards/spec.md`
- [ ] T005 [P] Define global typography, spacing, radius, color and button rules
- [ ] T006 [P] Define global states: loading, empty, error, disabled, success, permission, offline

**Checkpoint**: 基础规范完成，可以开始拆分页面模块

## Phase 3: User Story 1 - 统一全量用户端视觉语言 (Priority: P1)

**Goal**: 所有高频页面共享同一套视觉语言

**Independent Test**: 任取 5 张高频截图，对照规范能快速判断是否一致

- [ ] T007 [US1] Add the visual language section for brand color, layout rhythm and card hierarchy
- [ ] T008 [US1] Add examples for primary CTA, secondary CTA and destructive CTA styles
- [ ] T009 [US1] Add page-level rules for navigation bars, safe areas and bottom action bars

## Phase 4: User Story 2 - 统一核心业务模块页面结构 (Priority: P1)

**Goal**: 首页、商城、精准健康、心理、睡眠、个人中心等页面具备统一结构

**Independent Test**: 逐模块检查页面目标、核心区块、CTA 和跳转关系是否完整

- [ ] T010 [US2] Document homepage pattern, including hero, quick access, recommendations and bottom nav
- [ ] T011 [US2] Document commerce pattern, including search, category, product cards, checkout and payment
- [ ] T012 [US2] Document health/personal center pattern, including data cards, management entry and account area
- [ ] T013 [US2] Document psychology/sleep pattern, including cover, catalog, lesson list and purchase entry

## Phase 5: User Story 3 - 统一推荐链路呈现 (Priority: P2)

**Goal**: 推荐内容、商品和页面入口在不同场景下有统一展示方式

**Independent Test**: 对照 5 个推荐场景，检查推荐区布局不随场景变化而变化

- [ ] T014 [US3] Document recommendation surface rules for content cards, product cards and page-entry cards
- [ ] T015 [US3] Map `diet / exercise / psychology / sleep / antiaging` to recommended UI surfaces
- [ ] T016 [US3] Add fallback rules for empty recommendation states and under-filled recommendation blocks

## Phase 6: User Story 4 - 统一通用组件与状态规范 (Priority: P2)

**Goal**: 表单、弹窗、选择器、列表、空状态和权限提示保持一致

**Independent Test**: 抽查 10 个交互组件，能直接归入统一组件规范

- [ ] T017 [US4] Document shared component rules for buttons, cards, tabs, forms, search bars and lists
- [ ] T018 [US4] Document selector rules for date, city, store, spec, device and picker sheets
- [ ] T019 [US4] Document modal and permission prompt rules for photo, camera, Bluetooth and location flows
- [ ] T020 [US4] Document status rules for empty, loading, error, success, offline and invalid data states

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 完善规范可读性和可执行性

- [ ] T021 [P] Add module-by-module checklist for screenshot coverage
- [ ] T022 [P] Add assumptions and out-of-scope notes for pages not covered by screenshots
- [ ] T023 Review final spec for terminology consistency and duplicate rules
- [ ] T024 Ensure `spec.md`, `plan.md`, and `tasks.md` all reference the same branch name and scope

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3-6)**: Depend on Foundation completion
- **Polish (Phase 7)**: Depends on all story sections being drafted

### User Story Dependencies

- **US1**: Creates the global visual language baseline
- **US2**: Builds on the visual baseline to define page structure
- **US3**: Depends on page structure and recommendation scene mapping
- **US4**: Depends on the shared visual baseline and common page patterns

### Parallel Opportunities

- T002 and T003 can run in parallel
- T005 and T006 can run in parallel
- T010-T013 can be drafted in parallel once the baseline is set
- T017-T020 can be drafted in parallel once module patterns are complete

## Implementation Strategy

### MVP First

1. Complete the global visual language section
2. Complete the core module page patterns
3. Validate recommendation surface mapping
4. Validate shared component/state rules

### Incremental Delivery

1. First deliver a consistent visual baseline
2. Then add the main module patterns
3. Then formalize recommendation surfaces
4. Finally polish shared component and status rules

## Notes

- All tasks are documentation tasks; no runtime code changes are required
- The final spec should be directly usable by design, frontend and backend teams
- Keep wording aligned with the screenshot evidence and current repository naming
