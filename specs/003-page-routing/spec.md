# Feature Specification: 功能页路由

**Feature Branch**: `003-page-routing`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: 产品设计文档 - P2优先级功能

## User Scenarios & Testing

### User Story 1 - 语义意图识别 (Priority: P1) 🎯 MVP

AI 识别用户语义中的功能页面跳转意图。

**Why this priority**: 功能页路由是提升用户体验的关键功能，让用户快速到达目标页面。

**Independent Test**: 输入特定语句，验证识别为页面跳转意图。

**Acceptance Scenarios**:

1. **Given** 用户输入"我想查看体检报告"，**When** AI 识别，**Then** 识别为功能页路由意图，跳转到体检报告页面
2. **Given** 用户输入"去商城看看"，**When** AI 识别，**Then** 识别为页面跳转，跳转到商城
3. **Given** 用户输入"我的健康档案在哪里"，**When** AI 识别，**Then** 识别为页面跳转，跳转到我的页面

---

### User Story 2 - 快捷入口展示 (Priority: P1) 🎯 MVP

在 AI 回复中展示相关功能页面的快捷入口。

**Why this priority**: 让用户可以一键直达目标页面，提升转化率。

**Independent Test**: 触发功能页路由，验证显示快捷入口。

**Acceptance Scenarios**:

1. **Given** 识别为体检报告意图，**When** AI 返回，**Then** 底部显示"查看体检报告"快捷入口卡片
2. **Given** 识别为精准健康意图，**When** AI 返回，**Then** 显示"完善健康资料"入口

---

### User Story 3 - 页面配置管理 (Priority: P2)

后台可配置功能页面快捷入口的展示规则。

**Why this priority**: 让运营人员灵活配置快捷入口，提升运营效率。

**Independent Test**: 后台配置后，前端验证显示效果。

**Acceptance Scenarios**:

1. **Given** 后台新增页面配置，**When** 用户触发对应场景，**Then** 展示配置的快捷入口
2. **Given** 后台禁用某页面入口，**When** 用户触发，**Then** 不再展示该入口

---

### Edge Cases

- 用户意图不明确时，应展示多个可能的页面选项供用户选择
- 目标页面不存在或已下线，应提示用户并引导到首页
- 用户未登录时触发需要登录的页面，应先引导登录

---

## Requirements

### Functional Requirements

- **FR-001**: 系统 MUST 识别用户语义中的页面跳转意图
- **FR-002**: 系统 MUST 支持常见功能页面的跳转（体检报告、精准健康、商城、我的、健康档案等）
- **FR-003**: 系统 MUST 在对话中展示快捷入口卡片
- **FR-004**: 系统 MUST 支持快捷入口的点击跳转
- **FR-005**: 系统 MUST 支持后台配置页面快捷入口
- **FR-006**: 系统 MUST 支持页面入口的启用/禁用配置
- **FR-007**: 系统 MUST 处理未登录时的页面跳转（引导登录）
- **FR-008**: 系统 MUST 处理页面不存在的情况

### Key Entities

- **PageRoute**: 页面路由配置（页面名称、页面路径、启用状态、关联场景、图标、排序）
- **RouteIntent**: 路由意图（关键词、页面ID、匹配规则）

---

## Success Criteria

- **SC-001**: 页面意图识别准确率达到 90% 以上
- **SC-002**: 快捷入口点击率达到 30% 以上
- **SC-003**: 页面跳转成功率达到 99% 以上
- **SC-004**: 用户满意度评分达到 4 分以上

---

## Assumptions

- 页面路由表由后台预先配置
- 意图识别复用 001-ai-chat 的 NLP 能力
- 前端支持深链接跳转
- 页面权限控制由各页面自行处理