# Implementation Plan: 内容推荐与商品推荐

**Branch**: `004-recommendation` | **Date**: 2026-03-28 | **Spec**: `specs/004-recommendation/spec.md`

**Input**: Feature specification from `/specs/004-recommendation/spec.md`

## Summary

实现内容推荐和商品推荐功能，根据用户咨询场景和健康档案，智能推荐相关健康内容和商品。

**技术方案**: 
- 复用 001-ai-chat 的 ACP Gateway
- 推荐引擎: 基于规则 + 协同过滤
- 内容库: 食谱、运动课程、心理课程、睡眠课程

## Technical Context

**依赖**:
- 001-ai-chat: ACP Gateway, opencode Agent
- 002-report-analysis: 用户健康档案数据

**新增组件**:
- 推荐引擎服务
- 内容/商品索引

## Constitution Check

| 原则 | 检查项 | 状态 |
|------|--------|------|
| I. AI健康咨询为核心 | 推荐是健康服务延伸 | ✅ PASS |
| II. 报告智能分析 | 本功能不涉及 | N/A |
| III. 个性化推荐 | 核心功能 | ✅ PASS |
| IV. 数据安全与隐私 | 需保护用户行为数据 | ✅ PASS |
| V. 用户体验优先 | 推荐需与需求相关 | ✅ PASS |
| VI. 后台管理规范化 | 需支持推荐配置 | ✅ PASS |

**结论**: 符合宪法要求

## Project Structure

### 复用项目

```text
acp-gateway/
├── src/
│   ├── protocol/tools/
│   │   └── recommend.ts         # 推荐工具 ⭐ 新增
│   └── services/
│       └── recommendation/     # 推荐引擎 ⭐ 新增
│           ├── content-recommender.ts
│           └── product-recommender.ts

backend/
├── src/
│   ├── models/
│   │   ├── content.model.ts    # 内容 ⭐ 新增
│   │   ├── product.model.ts    # 商品 ⭐ 新增
│   │   └── recommendation-rule.model.ts # 推荐规则 ⭐ 新增
│   └── services/
│       └── recommendation.service.ts
```

**Structure Decision**: 
- 复用 001-ai-chat 基础设施
- 新增推荐引擎服务