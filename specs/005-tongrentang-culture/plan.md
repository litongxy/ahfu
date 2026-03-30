# Implementation Plan: 同仁堂文化问答

**Branch**: `005-tongrentang-culture` | **Date**: 2026-03-28 | **Spec**: `specs/005-tongrentang-culture/spec.md`

**Input**: Feature specification from `/specs/005-tongrentang-culture/spec.md`

## Summary

实现同仁堂品牌文化问答功能，用户咨询品牌历史、产品信息、门店信息等问题，AI 给出专业回答。

**技术方案**: 
- 复用 001-ai-chat 的 ACP Gateway
- 知识库: 品牌知识 + 产品知识 + 门店信息

## Technical Context

**依赖**:
- 001-ai-chat: ACP Gateway, opencode Agent

**新增组件**:
- 品牌知识库
- 产品知识库
- 门店信息库

## Constitution Check

| 原则 | 检查项 | 状态 |
|------|--------|------|
| I. AI健康咨询为核心 | 品牌问答是健康服务延伸 | ✅ PASS |
| II. 报告智能分析 | 本功能不涉及 | N/A |
| III. 个性化推荐 | 可结合商品推荐 | ✅ PASS |
| IV. 数据安全与隐私 | 本功能不涉及敏感数据 | ✅ PASS |
| V. 用户体验优先 | 增强品牌认知 | ✅ PASS |
| VI. 后台管理规范化 | 需支持知识库管理 | ✅ PASS |

**结论**: 符合宪法要求

## Project Structure

### 复用项目

```text
# 复用 001-ai-chat 的知识库
backend/
├── src/
│   ├── models/
│   │   ├── brand-knowledge.model.ts  # 品牌知识 ⭐ 新增
│   │   ├── product-knowledge.model.ts # 产品知识 ⭐ 新增
│   │   └── store-info.model.ts       # 门店信息 ⭐ 新增
│   └── services/
│       └── tongrentang.service.ts    # 同仁堂服务 ⭐ 新增

# 复用 opencode Agent
agents/
└── health-assistant/
    └── tools/
        └── tongrentang-knowledge.md   # 同仁堂知识工具 ⭐ 新增
```

**Structure Decision**: 
- 复用 001-ai-chat 基础设施和知识库体系
- 新增品牌/产品/门店知识库