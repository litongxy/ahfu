# Feature Specification: 内容推荐与商品推荐

**Feature Branch**: `004-recommendation`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: 产品设计文档 - P4优先级功能

## User Scenarios & Testing

### User Story 1 - 健康内容推荐 (Priority: P1) 🎯 MVP

根据用户咨询场景和健康档案，推荐相关的健康内容（食谱、运动课程、心理课程、睡眠课程）。

**Why this priority**: 内容推荐是健康服务的延伸，为用户提供增值价值。

**Independent Test**: 触发特定健康场景，验证返回相关内容推荐。

**Acceptance Scenarios**:

1. **Given** 用户咨询饮食问题，**When** AI 返回，**Then** 底部展示相关食谱推荐
2. **Given** 用户咨询运动问题，**When** AI 返回，**Then** 展示运动课程推荐
3. **Given** 用户有睡眠问题咨询，**When** AI 返回，**Then** 展示睡眠改善课程

---

### User Story 2 - 健康商品推荐 (Priority: P1) 🎯 MVP

根据用户健康需求和购买历史，推荐相关健康商品。

**Why this priority**: 实现商业转化，是产品的重要盈利模式。

**Independent Test**: 触发特定健康场景，验证返回相关商品推荐。

**Acceptance Scenarios**:

1. **Given** 用户咨询补钙问题，**When** AI 返回，**Then** 展示钙片相关商品
2. **Given** 用户咨询养生问题，**When** AI 返回，**Then** 展示同仁堂养生产品
3. **Given** 用户有运动需求，**When** AI 返回，**Then** 展示运动器材/护具

---

### User Story 3 - 个性化推荐优化 (Priority: P2)

基于用户健康档案和历史行为，实现更精准的个性化推荐。

**Why this priority**: 提升推荐转化率和用户体验。

**Independent Test**: 完善健康档案后，验证推荐相关性提升。

**Acceptance Scenarios**:

1. **Given** 用户填写"减重"目标，**When** 咨询饮食问题，**Then** 优先推荐低卡食谱
2. **Given** 用户有购买历史，**When** 再次咨询，**Then** 推荐相关新品

---

### User Story 4 - 推荐商品管理 (Priority: P2)

后台可配置商品推荐的场景映射和优先级。

**Why this priority**: 支持运营灵活配置推荐策略。

**Independent Test**: 后台配置后，前端验证显示效果。

**Acceptance Scenarios**:

1. **Given** 后台配置"运动场景"关联"瑜伽垫"，**When** 用户咨询运动问题，**Then** 推荐瑜伽垫
2. **Given** 后台调整商品排序，**When** 用户触发场景，**Then** 按新排序展示

---

### Edge Cases

- 无推荐内容时，应展示默认推荐或热门内容
- 推荐内容已下架，应自动跳过并展示下一个
- 用户多次拒绝同一类推荐，应降低该类推荐权重

---

## Requirements

### Functional Requirements

- **FR-001**: 系统 MUST 根据用户咨询场景推荐相关内容
- **FR-002**: 系统 MUST 推荐匹配的食谱（符合用户饮食偏好）
- **FR-003**: 系统 MUST 推荐匹配的运动课程
- **FR-004**: 系统 MUST 推荐匹配的心理/睡眠课程
- **FR-005**: 系统 MUST 根据健康需求推荐相关商品
- **FR-006**: 系统 MUST 避免过度商业化，推荐需与用户需求相关
- **FR-007**: 系统 MUST 支持基于健康档案的个性化推荐
- **FR-008**: 系统 MUST 支持基于历史行为的推荐优化
- **FR-009**: 系统 MUST 支持后台配置推荐规则
- **FR-010**: 系统 MUST 处理推荐内容/商品下架情况

### Key Entities

- **Content**: 内容（食谱、运动课程、心理课程、睡眠课程）
- **Product**: 商品（名称、类目、标签、关联场景）
- **RecommendationRule**: 推荐规则（场景、推荐类型、排序权重）
- **UserPreference**: 用户偏好（历史点击、购买记录、收藏）

---

## Success Criteria

- **SC-001**: 内容推荐点击率达到 10% 以上
- **SC-002**: 商品推荐点击率达到 5% 以上
- **SC-003**: 推荐转化率（购买）达到 2% 以上
- **SC-004**: 用户对推荐满意度达到 4 分以上

---

## Assumptions

- 内容库（食谱、课程）已由运营团队预先录入
- 商品库已同步到系统
- 推荐算法可复用开源推荐算法或第三方服务
- 同仁堂商品有明确的类目和标签体系