# Feature Specification: 体检报告分析

**Feature Branch**: `002-report-analysis`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: 产品设计文档 - P1优先级功能

## User Scenarios & Testing

### User Story 1 - 体检报告上传与解析 (Priority: P1) 🎯 MVP

用户上传体检报告（PDF/图片），系统解析报告内容，识别关键指标。

**Why this priority**: 体检报告分析是产品的核心功能之一，用户主要诉求之一就是解读体检报告。

**Independent Test**: 上传体检报告PDF/图片，验证系统返回解析后的指标数据。

**Acceptance Scenarios**:

1. **Given** 用户在报告分析入口，**When** 上传一份体检报告PDF，**Then** 系统解析出各项指标（血常规、尿常规、肝功能等）
2. **Given** 用户在报告分析入口，**When** 上传一张体检报告图片，**Then** 系统通过OCR识别出文字并解析指标
3. **Given** 用户上传报告，**When** 报告格式不支持，**Then** 系统提示"仅支持PDF或常见图片格式"

---

### User Story 2 - 异常项识别与分析 (Priority: P1) 🎯 MVP

系统识别体检报告中的异常指标，并给出专业分析。

**Why this priority**: 用户上传报告的核心目的就是了解自身健康状况，异常项识别是核心价值。

**Independent Test**: 上传包含异常项的报告，验证系统正确识别并给出分析。

**Acceptance Scenarios**:

1. **Given** 报告包含"轻度脂肪肝"，**When** 系统分析，**Then** 识别为异常项，给出"建议复查"建议
2. **Given** 报告包含"ALT 轻度升高"，**When** 系统分析，**Then** 识别为异常项，给出复查建议
3. **Given** 报告所有指标正常，**Then** 系统显示"您的体检报告有0项异常"

---

### User Story 3 - 干预方案推荐 (Priority: P1) 🎯 MVP

根据异常项给出个性化的干预方案（饮食、运动、睡眠建议）。

**Why this priority**: 给出可执行的健康建议是产品的核心价值转化点。

**Independent Test**: 有异常项的报告，验证返回对应的干预方案。

**Acceptance Scenarios**:

1. **Given** 异常项为脂肪肝，**When** 系统生成方案，**Then** 推荐饮食方案（低脂食谱）+ 运动方案（燃脂课程）
2. **Given** 异常项为睡眠问题，**When** 系统生成方案，**Then** 推荐睡眠课程 + 心理课程
3. **Given** 异常项为体重超标，**When** 系统生成方案，**Then** 推荐运动课程 + 食谱

---

### User Story 4 - 报告历史管理 (Priority: P2)

用户可以查看历史报告，记录健康变化。

**Why this priority**: 持续追踪健康数据是健康管理的重要部分。

**Independent Test**: 上传多份报告，验证可查看历史记录。

**Acceptance Scenarios**:

1. **Given** 用户已上传第一份报告，**When** 上传第二份报告，**Then** 两份报告都保存在历史记录中
2. **Given** 用户查看报告历史，**When** 选择历史报告，**Then** 展示历史报告的详情和分析结果

---

### User Story 5 - 报告分享 (Priority: P3)

用户可将报告分析结果分享给他人。

**Why this priority**: 提升产品传播性，便于用户咨询家人朋友。

**Independent Test**: 完成报告分析后，验证分享功能可用。

**Acceptance Scenarios**:

1. **Given** 报告分析完成，**When** 点击分享，**Then** 生成分享链接或图片
2. **Given** 他人打开分享链接，**Then** 可查看报告摘要（不含敏感信息）

---

### Edge Cases

- 报告图片模糊导致OCR识别失败时，应提示用户重新上传清晰图片
- 报告中包含罕见指标无法识别时，应提示"部分指标无法识别，建议咨询医生"
- 用户拒绝授权健康档案时，干预方案应基于报告数据而非档案
- 同一用户短时间多次上传相同报告，应提示"您已上传过相同报告"

---

## Requirements

### Functional Requirements

- **FR-001**: 系统 MUST 支持上传 PDF 格式体检报告
- **FR-002**: 系统 MUST 支持上传常见图片格式（JPG/PNG）的体检报告
- **FR-003**: 系统 MUST 通过 OCR 识别图片报告中的文字
- **FR-004**: 系统 MUST 解析报告中的关键健康指标（血常规、尿常规、肝功能、肾功能、血脂、血糖等）
- **FR-005**: 系统 MUST 识别异常指标并标记严重程度（正常/轻微/异常/严重）
- **FR-006**: 系统 MUST 针对异常项给出复查建议
- **FR-007**: 系统 MUST 根据异常项推荐对应的干预方案（食谱、运动课程、睡眠课程）
- **FR-008**: 系统 MUST 保存用户报告历史记录
- **FR-009**: 系统 MUST 支持查看历史报告详情
- **FR-010**: 系统 MUST 支持报告分享功能
- **FR-011**: 系统 MUST 对接用户健康档案，提供更精准的干预方案
- **FR-012**: 报告分析响应时间不超过 10 秒

### Key Entities

- **HealthReport**: 体检报告（ID、用户ID、报告URL、原始数据、解析结果、异常项、分析时间）
- **ReportIndicator**: 报告指标（指标名称、指标值、参考范围、异常标志、严重程度）
- **InterventionPlan**: 干预方案（方案类型、方案内容、推荐内容、适用场景）
- **ReportHistory**: 报告历史（用户ID、报告列表、上传时间）

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: PDF 报告解析成功率达到 95% 以上
- **SC-002**: 图片报告 OCR 识别准确率达到 90% 以上
- **SC-003**: 常见指标识别率达到 98% 以上
- **SC-004**: 异常项识别准确率达到 90% 以上
- **SC-005**: 用户对报告分析结果的满意度达到 4 分以上
- **SC-006**: 干预方案推荐相关性达到 85% 以上
- **SC-007**: 报告分析响应时间不超过 10 秒

---

## Assumptions

- 体检报告格式为国内常见体检机构标准格式
- OCR 技术由第三方服务提供（如阿里云 OCR、腾讯云 OCR）
- 指标正常值范围参考标准体检指标库
- 干预方案由专业医学团队审核
- 用户授权后可读取健康档案数据
- 报告存储采用云存储服务