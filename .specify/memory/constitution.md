# TongRen Tang Yuanqi Assistant Constitution

<!--
Sync Impact Report
===================
Version change: N/A → 1.0.0 (Initial creation)

Modified principles: N/A (new constitution)
- New: I. AI健康咨询为核心 (derived from product design doc - core feature)
- New: II. 报告智能分析 (derived from 报告分析 section)
- New: III. 个性化推荐 (derived from 内容推荐/商品推荐 sections)
- New: IV. 数据安全与隐私 (derived from 非功能性需求 - Security)
- New: V. 用户体验优先 (derived from 页面设计 section)
- New: VI. 后台管理规范化 (derived from 后台管理系统设计 section)

Added sections:
- Security Requirements (derived from 非功能性需求)
- Development Workflow (derived from 产品设计文档)
- Governance (new)

Removed sections: N/A

Templates requiring updates: ✅ No updates needed
- .specify/templates/plan-template.md: Generic, no changes needed
- .specify/templates/spec-template.md: Generic, no changes needed
- .specify/templates/tasks-template.md: Generic, no changes needed
- .specify/templates/agent-file-template.md: Generic, no changes needed

Deferred items: None

Version bump rationale: Initial creation (1.0.0)
-->

## Core Principles

### I. AI健康咨询为核心 (AI Health Consultation as Core)

AI健康咨询是产品的核心功能，所有功能设计都必须服务于用户的健康咨询需求。系统必须基于知识库提供准确、专业、可验证的健康信息。AI对话能力是用户获取健康服务的主要入口，必须保证响应速度（<3秒）和回答质量。任何新功能的引入都不能削弱健康咨询的核心体验。

### II. 报告智能分析 (Intelligent Report Analysis)

体检报告分析是产品的重要功能（P1优先级），必须能够准确解析用户上传的体检报告，识别异常指标，并给出个性化的干预方案。报告分析结果必须清晰展示异常项、复查建议和生活调理方案。系统需要对接用户健康档案，提供持续的健康追踪服务。

### III. 个性化推荐 (Personalized Recommendation)

内容推荐和商品推荐必须基于用户画像、健康档案和实时意图进行个性化匹配。推荐算法需要平衡用户需求和业务目标，避免过度商业化。内容推荐需覆盖食谱、运动课程、心理课程、睡眠课程等健康领域。商品推荐需与用户健康需求相关联。

### IV. 数据安全与隐私 (Data Security & Privacy)

用户健康数据属于敏感信息，必须遵循最小必要原则采集和存储。所有用户数据必须加密传输和存储，敏感信息需脱敏展示。用户必须明确知悉并同意数据使用目的，享有数据查阅和删除权利。后台系统访问需有完整的权限控制机制。

### V. 用户体验优先 (User Experience First)

产品设计必须以用户便捷性为首要目标。AI对话入口必须显眼易达，操作流程必须简洁直观。页面加载时间不超过2秒，AI响应时间不超过3秒。需支持多种交互方式（文字、语音），并提供清晰的操作引导。快捷问题和默认内容可降低用户学习成本。

### VI. 后台管理规范化 (Standardized Backend Management)

后台管理系统必须支持完整的内容管理、商品管理、场景管理和知识库管理功能。所有运营配置必须可追溯、可审计。数据统计必须支持多维度分析（UV/PV、场景分布、高频问题）。系统需具备完整的权限管理体系，支持角色分配。

## Security Requirements

用户数据安全是产品的基础要求。传输安全：所有API接口必须使用HTTPS加密传输。存储安全：用户敏感信息（身份证号、体检报告数据）必须加密存储。访问控制：后台系统必须实现基于角色的权限控制（RBAC），操作日志需保留至少180天。隐私保护：用户手机号、姓名等个人信息在展示时必须脱敏处理。合规要求：产品需符合《个人信息保护法》相关要求，用户需签署隐私协议后才能使用核心功能。

## Development Workflow

开发流程必须遵循规范化的迭代节奏。需求阶段：所有功能必须先编写产品设计文档，明确功能描述、数据模型和接口设计。开发阶段：必须遵循代码规范，核心模块需编写单元测试，集成测试覆盖关键业务流程。测试阶段：功能测试通过后方可进入预发布环境，性能测试需满足响应时间要求。发布阶段：必须经过灰度发布验证，重大功能需A/B测试验证效果。运营阶段：需持续监控核心指标（用户活跃度、对话成功率、推荐转化率），发现问题及时迭代优化。

## Governance

本宪法是项目开发的核心准则，所有开发活动必须遵循本宪法的原则。修订流程：宪法修订需经过评审，重大变更需更新版本号并记录变更原因。版本管理：采用语义化版本号（MAJOR.MINOR.PATCH），重大架构调整或核心原则变更需升级主版本号。合规检查：所有PR必须验证是否符合本宪法的原则要求。冲突解决：当具体规范与宪法原则冲突时，以宪法原则为准，但需在文档中说明理由。

**Version**: 1.0.0 | **Ratified**: 2026-03-28 | **Last Amended**: 2026-03-28