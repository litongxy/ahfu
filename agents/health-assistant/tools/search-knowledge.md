# 知识库搜索工具

## 工具名称

`search-knowledge`

## 描述

搜索健康知识库，获取与用户问题相关的知识条目。

## 输入参数

```json
{
  "keyword": "用户问题中的关键词",
  "scene": "场景类型（可选）：diet|exercise|psychology|sleep|anti-aging|disease|tcm|brand"
}
```

## 输出格式

```json
{
  "results": [
    {
      "question": "标准问题",
      "answer": "标准答案",
      "scene": "所属场景",
      "tags": ["标签1", "标签2"]
    }
  ],
  "total": 10
}
```

## 使用示例

用户问："失眠怎么办？"

```
search-knowledge({
  "keyword": "失眠",
  "scene": "sleep"
})
```

## 注意事项

- 关键词要简洁，去除语气词
- 如果没有明确场景，可以不传scene参数
- 返回结果按相关性排序