---
name: document-retrieval
description: 用于本地文档检索与定位。当用户要求“在文档里找”“检索知识库/PDF/Markdown/说明文档”“帮我定位某段内容、字段、配置、问答条目”时使用。适合搜索 questions、docs、Markdown、TXT、JSON、HTML、YAML、代码注释和可提取文本的 PDF，并返回带路径与行号的结果。
---

# 文档检索

这个技能用于在当前工作区里快速检索文档、知识库和说明文件，并把结果整理成可直接引用的答案。

## 何时使用

当用户提出这些需求时触发：

- “在文档里找一下……”
- “帮我检索知识库有没有……”
- “PDF 里有没有提到……”
- “定位这个字段/配置/段落在哪个文件”
- “查一下 questions/ 里面有没有类似问法”
- “根据文档回答，不要凭空猜”

## 检索流程

### 1. 先缩小范围

优先根据用户问题判断目录和文件类型，不要一上来全仓库扫。

常见目标目录：

- `questions/`：知识库、问答、体检/医疗文档
- `docs/`：说明文档
- `pages/`：前端页面文案、静态说明
- `acp-gateway/src/`：服务端逻辑、提示词、知识检索代码
- `acp-gateway/tests/`：现有行为和测试样例

### 2. 先找文件，再搜内容

优先使用 `rg`：

```bash
rg --files questions docs pages acp-gateway | rg '关键词|文件名'
```

再做内容检索：

```bash
rg -n -C 2 --hidden -S '关键词' questions docs pages acp-gateway
```

如果是多个表达方式，拆开搜，不要只搜一句完整自然语言。

例如用户问“喉咙像刀割一样疼怎么办”，可拆成：

- `喉咙`
- `咽炎`
- `咽痛`
- `嗓子疼`

如果需要稳定复用，优先直接运行技能自带脚本：

```bash
bash .agents/skills/document-retrieval/scripts/search-docs.sh '喉咙像刀割一样疼怎么办'
```

限定目录时：

```bash
bash .agents/skills/document-retrieval/scripts/search-docs.sh 'questionsKnowledge' acp-gateway/src
```

### 3. 检索结构化文档时保留上下文

对于 Markdown、YAML、JSON、代码注释：

- 用 `rg -n -C 2` 或 `sed -n` 保留前后文
- 需要确认整段语义时，再打开对应文件片段
- 不要整篇读入，先定位再展开

### 4. PDF 处理

如果用户点名 PDF：

- 先检查是不是可提取文本 PDF
- 优先使用系统文本提取工具，如 `pdftotext`
- 如果仓库里已有 PDF 处理流程，优先复用
- 如果提取效果差，明确说明“这是扫描件/图片型 PDF，文本检索可能不完整”

如果任务明显偏 PDF 结构化处理，继续结合现有 `pdf` 技能。

脚本支持 `--pdf` 开关，会在 `pdftotext` 可用时额外检索 PDF 文本：

```bash
bash .agents/skills/document-retrieval/scripts/search-docs.sh --pdf '血糖' docs questions
```

### 5. 输出要求

回答时优先给：

1. 结论
2. 命中的文件和行号
3. 必要的短摘录或总结
4. 如果没找到，说明搜了哪些目录和关键词

尽量使用这种输出方式：

- 命中：[文件.md](/abs/path/file.md:23)
- 关键内容：……

## 检索策略

### 自然语言问句

不要只搜完整句子，先做术语归一化：

- 发烧 -> 发热
- 红眼病 -> 结膜炎
- 痘痘 -> 痤疮
- 拉肚子 -> 腹泻
- 睡不着 -> 失眠

### 配置/字段定位

如果用户找字段、常量、配置项：

- 先搜精确字段名
- 再搜近义命名
- 最后搜调用位置和测试

示例：

```bash
rg -n --hidden -S 'questionsKnowledge|getDirectAnswer|SYNONYM_MAP' acp-gateway
```

### 知识库问答检索

检索 `questions/` 时，优先看：

- 标题行：`^##`
- `**症状**`
- `**解决办法**`
- `**建议**`
- `**关联问法**`

示例：

```bash
rg -n '^##|关联问法|症状|解决办法|建议' questions/医疗口语问法扩展库01.md
```

## 找不到时怎么做

如果第一次没命中：

1. 换同义词
2. 放宽到上级目录
3. 从文件名检索改为内容检索
4. 从自然语言改成术语检索
5. 明确告诉用户“当前仓库中未找到直接证据”

不要把“没找到”说成“没有这个功能/没有这条知识”，除非你已经说明搜索范围。

## 注意事项

- 优先引用仓库中的一手文档，不要凭印象补全
- 大文件先检索后展开，避免无关内容占满上下文
- 结果里尽量带文件路径和行号，方便用户直接点开
- 如果文档和代码冲突，优先指出冲突，不要强行合并结论
