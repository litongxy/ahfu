# Feature Specification: AI健康咨询对话

**Feature Branch**: `001-ai-chat`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: 产品设计文档 - P0优先级核心功能

## User Scenarios & Testing

### User Story 1 - 用户发起健康咨询 (Priority: P1) 🎯 MVP

用户通过首页聊天输入框输入健康相关问题，AI识别用户意图并给出专业回答。

**Why this priority**: 这是产品的核心功能，是用户获取健康服务的主要入口，必须优先实现。

**Independent Test**: 可通过模拟用户输入问题，验证AI回复的准确性和响应时间。

**Acceptance Scenarios**:

1. **Given** 用户已登录，**When** 输入"最近总是失眠怎么办"，**Then** AI识别为睡眠健康场景，返回睡眠相关建议
2. **Given** 用户已登录，**When** 输入"同仁堂的历史"，**Then** AI识别为同仁堂文化场景，返回品牌介绍
3. **Given** 用户已登录，**When** 输入"今天天气真好"，**Then** AI识别为闲聊场景，进行友好对话

---

### User Story 2 - 快捷问题点击 (Priority: P2)

用户在首页点击预设的快捷问题卡片，快速获取健康信息。

**Why this priority**: 降低用户学习成本，提升首次使用体验，是重要的用户体验优化点。

**Independent Test**: 点击快捷问题卡片，验证是否正确展示对应答案。

**Acceptance Scenarios**:

1. **Given** 用户在首页，**When** 点击"健康饮食的误区有哪些？"，**Then** 展示健康饮食相关答案
2. **Given** 用户在首页，**When** 点击"三七粉对心脑血管有保护作用吗？"，**Then** 展示三七粉相关知识

---

### User Story 3 - 推荐内容/商品/页面 (Priority: P3)

AI根据用户咨询内容，推荐相关的健康内容、商品或功能页面。

**Why this priority**: 实现商业价值转化，提升用户粘性。

**Independent Test**: 输入特定问题，验证是否正确展示相关推荐内容。

**Acceptance Scenarios**:

1. **Given** 用户咨询饮食问题，**When** AI返回回复后，**Then** 底部展示相关食谱推荐
2. **Given** 用户咨询运动问题，**When** AI返回回复后，**Then** 底部展示相关运动课程推荐

---

### User Story 4 - 精准健康问卷引导 (Priority: P3)

AI根据对话上下文，引导用户填写精准健康问卷以获得更精准的个性化服务。

**Why this priority**: 收集用户健康数据，为后续个性化推荐奠定基础。

**Independent Test**: 完成问卷填写，验证用户健康档案是否正确更新。

**Acceptance Scenarios**:

1. **Given** 用户未填写健康档案，**When** 首次咨询健康问题，**Then** AI提示"补充更多资料，为您做个性化分析"并提供问卷入口

---

### Edge Cases

- 用户输入过于简短或模糊时，AI应请求澄清而非随意回答
- 用户输入包含敏感医疗建议需求时，应提示"仅供参考，请咨询专业医生"
- 系统繁忙或AI服务不可用时，应给出友好提示并提供重试选项
- 用户连续多次询问同一问题，应避免重复回答

---

## Requirements

### Functional Requirements

- **FR-001**: 系统 MUST 支持用户在聊天输入框输入文字问题
- **FR-002**: 系统 MUST 在3秒内返回AI回复（响应时间要求）
- **FR-003**: 系统 MUST 识别用户意图并匹配对应场景（饮食/运动/心理/睡眠/抗衰/疾病/中医/文化/闲聊）
- **FR-004**: 系统 MUST 基于知识库给出准确、可验证的健康信息
- **FR-005**: 系统 MUST 保存用户对话记录到数据库
- **FR-006**: 系统 MUST 支持快捷问题点击功能
- **FR-007**: 系统 MUST 在AI回复后推荐相关内容/商品（根据配置）
- **FR-008**: 系统 MUST 支持精准健康问卷填写和健康档案管理
- **FR-009**: 系统 MUST 对医疗相关敏感问题给出免责声明
- **FR-010**: 系统 MUST 记录用户反馈（点赞/踩）用于优化

### Key Entities

- **User**: 用户基本信息（ID、昵称、手机号、头像）
- **HealthProfile**: 用户健康档案（饮食偏好、运动习惯、睡眠情况、压力等级、健康目标、体质类型）
- **Conversation**: 对话记录（用户ID、场景、用户消息、AI回复、推荐内容、时间）
- **KnowledgeBase**: 知识库（问题、答案、关联场景）
- **Scene**: 场景配置（场景名称、场景定义、启用状态）
- **RecommendedContent**: 推荐内容（内容ID、内容类型、目标场景）
- **RecommendedGoods**: 推荐商品（商品ID、商品名称、目标场景）

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 用户可在3秒内获得AI回复
- **SC-002**: 意图识别准确率达到85%以上
- **SC-003**: 90%的常见问题能在知识库中找到准确答案
- **SC-004**: 用户满意度评分达到4分以上（5分制）
- **SC-005**: 推荐内容点击率达到10%以上
- **SC-006**: 页面加载时间不超过2秒

---

## Assumptions

- 用户已通过微信或其他方式完成登录
- AI对话服务通过外部API提供（无需自研LLM）
- 知识库内容由运营团队预先配置
- 推荐内容/商品数据已同步到系统
- 用户健康数据存储符合《个人信息保护法》要求
- iOS 12+ 和 Android 8+ 兼容性