# Implementation Plan: 体检报告分析

**Branch**: `002-report-analysis` | **Date**: 2026-03-28 | **Spec**: `specs/002-report-analysis/spec.md`

**Input**: Feature specification from `/specs/002-report-analysis/spec.md`

## Summary

实现体检报告上传、解析、分析功能。用户上传体检报告（PDF/图片），系统通过 OCR 识别和解析，识别异常指标，生成个性化干预方案。

**技术方案**: 
- **OCR 服务**: 阿里云 OCR / 腾讯云 OCR
- **报告解析**: PDF 解析库 + 自研指标提取算法
- **AI 分析**: opencode Agent（复用 001-ai-chat 的 Agent）
- **通信**: ACP 协议

## Technical Context

**Language/Version**: Node.js 18+, Python 3.11+  
**Primary Dependencies**:  
- **OCR**: 阿里云通用OCR / 腾讯云OCR
- **PDF解析**: pdf-parse, pdf2json
- **存储**: PostgreSQL, 阿里云OSS/腾讯云COS
- **后端**: Express/FastAPI

**Testing**: Jest, pytest, 手动测试  
**Target Platform**: iOS 12+, Android 8+, 微信小程序  
**Project Type**: 体检报告分析模块 (复用 ACP Gateway)  
**Performance Goals**: 分析响应<10秒, 支持大文件(最大20MB)  
**Constraints**: 符合《个人信息保护法》，报告数据加密存储  
**Scale/Scope**: 约10万用户

## Constitution Check

| 原则 | 检查项 | 状态 |
|------|--------|------|
| I. AI健康咨询为核心 | 报告分析是健康服务延伸 | ✅ PASS |
| II. 报告智能分析 | 核心功能，必须实现 | ✅ PASS |
| III. 个性化推荐 | 干预方案推荐 | ✅ PASS |
| IV. 数据安全与隐私 | 报告数据加密、隐私合规 | ✅ PASS |
| V. 用户体验优先 | 响应时间<10秒 | ✅ PASS |
| VI. 后台管理规范化 | 需支持报告数据管理 | ✅ PASS |

**结论**: 符合宪法要求

## Project Structure

### Documentation (this feature)

```text
specs/002-report-analysis/
├── plan.md              # This file
├── spec.md              # Feature specification
├── contracts/
│   └── openapi.yaml     # API 定义
└── tasks.md             # Task list
```

### Source Code (复用现有项目)

```text
# 复用 001-ai-chat 的 ACP Gateway
acp-gateway/
├── src/
│   ├── protocol/tools/
│   │   ├── ocr.ts           # OCR 工具 ⭐ 新增
│   │   └── analyze-report.ts # 报告分析工具 ⭐ 新增
│   ├── services/
│   │   ├── ocr.service.ts   # OCR 服务 ⭐ 新增
│   │   ├── parser.service.ts # 报告解析服务 ⭐ 新增
│   │   └── analyzer.service.ts # 异常分析服务 ⭐ 新增
│   └── routes/
│       └── report.route.ts  # 报告接口 ⭐ 新增
└── package.json

# 复用 Backend
backend/
├── src/
│   ├── models/
│   │   ├── health-report.model.ts   # 体检报告 ⭐ 新增
│   │   ├── report-indicator.model.ts # 报告指标 ⭐ 新增
│   │   └── intervention-plan.model.ts # 干预方案 ⭐ 新增
│   └── services/
│       └── report.service.ts
```

**Structure Decision**: 
- 复用 001-ai-chat 的 ACP Gateway
- 新增报告相关工具和服务
- Backend 新增报告相关模型

---

## Complexity Tracking

无需复杂度追踪，架构符合宪法要求。

---

## 依赖

本功能依赖 001-ai-chat 功能：
- ACP Gateway 基础设施
- opencode Agent（用于生成分析建议）
- 健康档案数据（用于个性化干预方案）