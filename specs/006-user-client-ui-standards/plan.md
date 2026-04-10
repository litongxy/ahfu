# Implementation Plan: 用户端 UI 规范整理

**Branch**: `006-user-client-ui-standards` | **Date**: 2026-03-31 | **Spec**: `specs/006-user-client-ui-standards/spec.md`

**Input**: 现有用户端截图资料、`acp-gateway/src/services/recommendation.service.ts`、`specs/004-recommendation/spec.md`

## Summary

整理一份面向用户端的页面级 UI 规范，覆盖首页、商城、精准健康、心理、睡眠、个人中心、订单售后、登录注册和各类弹窗状态。

这份规范要同时兼容现有截图中的高频交互，以及代码里已经存在的推荐链路：`diet / exercise / psychology / sleep / antiaging`。

## Technical Context

**Language/Version**: Markdown / 中文文档  
**Primary Dependencies**: 现有用户端截图、`specs/004-recommendation/spec.md`、`acp-gateway/src/services/recommendation.service.ts`  
**Storage**: 文件系统中的 `specs/006-user-client-ui-standards/`  
**Testing**: 人工对照检查 + 文档清单校验  
**Target Platform**: 用户端移动端页面规范文档  
**Project Type**: documentation/specification  
**Performance Goals**: 50+ 高频页面可按同一规范复用  
**Constraints**: 保留现有绿色品牌基调；不引入新的实现代码；不改变后端推荐逻辑  
**Scale/Scope**: 覆盖用户端核心业务页面、通用组件与状态

## Constitution Check

| 原则 | 检查项 | 状态 |
|------|--------|------|
| I. AI健康咨询为核心 | UI 规范服务于健康、心理、睡眠和商城链路 | ✅ PASS |
| II. 报告智能分析 | 覆盖体检报告、处方、健康数据等展示规范 | ✅ PASS |
| III. 个性化推荐 | 覆盖推荐内容、商品和页面入口展示规则 | ✅ PASS |
| IV. 数据安全与隐私 | 覆盖登录、权限、手机号、账户等敏感状态规范 | ✅ PASS |
| V. 用户体验优先 | 统一页面语言，减少跨模块体验割裂 | ✅ PASS |
| VI. 后台管理规范化 | 为后续页面和组件复用提供统一规则 | ✅ PASS |

**结论**: 符合宪法要求

## Project Structure

### Documentation (this feature)

```text
specs/006-user-client-ui-standards/
├── spec.md              # UI 规范需求说明
├── plan.md              # 本文件
└── tasks.md             # 规范整理执行任务
```

### Source Context (repository root)

```text
acp-gateway/src/services/recommendation.service.ts
acp-gateway/src/services/opencode-agent.service.ts
specs/004-recommendation/spec.md
specs/005-tongrentang-culture/spec.md
```

**Structure Decision**:
- 以 `specs/006-user-client-ui-standards/` 作为本次规范沉淀目录
- 复用现有推荐场景定义和截图素材作为事实依据
- 用页面级规范 + 通用组件规范的方式约束后续用户端页面

## Execution Approach

1. 先整理用户端整体视觉语言，定义统一的品牌、排版和卡片规则
2. 再按核心模块整理页面模式，确保每个页面都能被归类
3. 然后补齐通用组件和状态规范，避免不同模块各做各的
4. 最后对推荐链路做专门说明，和现有场景推荐逻辑对齐

## Validation Approach

- 用截图逐页对照，检查规范是否覆盖高频页面
- 用推荐场景逐类对照，检查 `diet / exercise / psychology / sleep / antiaging` 是否都有展示规则
- 用组件清单逐项对照，检查按钮、卡片、选择器、弹窗、空状态是否统一
- 用状态清单逐项对照，检查未登录、无权限、成功、失败、下架、空数据是否有规范
