# Implementation Plan: 功能页路由

**Branch**: `003-page-routing` | **Date**: 2026-03-28 | **Spec**: `specs/003-page-routing/spec.md`

**Input**: Feature specification from `/specs/003-page-routing/spec.md`

## Summary

实现功能页路由功能，用户通过自然语言表达页面跳转需求，AI 识别意图后展示快捷入口，一键直达目标页面。

**技术方案**: 
- 复用 001-ai-chat 的意图识别能力
- ACP 协议返回页面快捷入口
- 前端处理跳转逻辑

## Technical Context

**依赖**:
- 001-ai-chat: ACP Gateway, opencode Agent
- 前端项目: 微信小程序

**新增组件**:
- 页面路由配置表
- 意图匹配规则

## Constitution Check

| 原则 | 检查项 | 状态 |
|------|--------|------|
| I. AI健康咨询为核心 | 功能页路由是健康服务入口 | ✅ PASS |
| II. 报告智能分析 | 本功能不涉及 | N/A |
| III. 个性化推荐 | 展示快捷入口 | ✅ PASS |
| IV. 数据安全与隐私 | 本功能不涉及敏感数据 | ✅ PASS |
| V. 用户体验优先 | 一键跳转，提升体验 | ✅ PASS |
| VI. 后台管理规范化 | 需支持页面配置管理 | ✅ PASS |

**结论**: 符合宪法要求

## Project Structure

### 复用项目

```text
# 复用 001-ai-chat
acp-gateway/
├── src/
│   ├── protocol/tools/
│   │   └── page-router.ts    # 页面路由工具 ⭐ 新增
│   └── routes/
│       └── route.route.ts    # 路由配置接口 ⭐ 新增

# 复用 Backend
backend/
├── src/
│   ├── models/
│   │   ├── page-route.model.ts   # 页面路由 ⭐ 新增
│   │   └── route-intent.model.ts # 路由意图 ⭐ 新增
│   └── services/
│       └── route.service.ts      # 路由服务 ⭐ 新增
```

**Structure Decision**: 
- 复用 001-ai-chat 基础设施
- 新增页面路由相关模型和服务

---

## 依赖

本功能依赖 001-ai-chat 功能