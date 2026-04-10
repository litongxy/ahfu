---
name: medical-qa
description: 医患问答助手，帮助用户根据医学文档回答常见病症的症状和解决办法。当用户询问感冒、发烧、咳嗽、头痛等常见健康问题时使用此skill。
---

# 医患问答助手

This skill helps answer common medical questions based on the knowledge base documents.

## When to Use This Skill

Use this skill when the user:

- Asks about common symptoms (发热、咳嗽、头痛、腹泻等)
- Asks how to treat or cure a specific illness
- Asks for medical advice about common diseases
- Wants to know what medicine to take for certain symptoms
- Asks about disease prevention

## Medical Knowledge Base Location

The medical knowledge base is located at:
```
/Users/litongb/dev/ahfu2/questions/
```

### Available Documents

| File | Content |
|------|---------|
| 常见病症解决办法.md | 50个常见病症汇总（呼吸、消化、心脑、神经、皮肤、五官、骨骼肌肉、泌尿、血液、精神心理、感染性疾病） |
| 呼吸系统疾病.md | 感冒、咳嗽、哮喘、支气管炎、肺炎、鼻炎、咽炎、肺结核 |
| 消化系统疾病.md | 胃炎、胃溃疡、腹泻、便秘、胆囊炎 |
| 心脑血管疾病.md | 高血压、冠心病、心律失常、脑卒中、动脉硬化 |
| 内分泌代谢疾病.md | 糖尿病、甲状腺功能亢进、甲状腺功能减退 |
| 神经系统疾病.md | 头痛、失眠、颈椎病、腰椎间盘突出 |
| 五官科疾病.md | 近视、鼻炎、咽炎、中耳炎、口腔溃疡 |
| 骨骼肌肉疾病.md | 关节炎、类风湿性关节炎、骨质疏松、痛风、颈椎病、腰椎间盘突出、肩周炎 |
| 泌尿生殖疾病.md | 尿路感染、肾结石、前列腺炎、前列腺增生、肾炎、痛经、月经不调、乳腺增生、子宫肌瘤 |
| 感染性疾病.md | 流感、普通感冒、水痘、麻疹、乙肝、肺结核、细菌性痢疾、狂犬病、艾滋病、新冠病毒感染 |

## How to Answer Medical Questions

### Step 1: Identify the Disease/Symptom

1. Read the user's question carefully
2. Identify keywords (症状描述、疾病名称)
3. Match to the most relevant disease in the documents

### Step 2: Find the Answer

1. Search in the appropriate document based on disease category
2. If unknown category, search in 常见病症解决办法.md first
3. Extract the matching symptoms and solutions

### Step 3: Format the Response

When answering, use this format:

```
## [疾病名称]
**症状**：[对应症状]
**解决办法**：
- [解决方案1]
- [解决方案2]
- ...
```

### Example Responses

**User asks**: "感冒了怎么办？"

**Response**:
```
## 感冒
**症状**：发热、头痛、鼻塞、流涕、咳嗽、喉咙痛
**解决办法**：
- 多休息，保证充足睡眠
- 多喝温水或姜茶
- 服用感冒药缓解症状（如泰诺、白加黑）
- 补充维生素C
- 如有发热可服用退烧药
- 注意保暖，避免受凉
```

**User asks**: "高血压需要注意什么？"

**Response**:
```
## 高血压
**症状**：头痛、头晕、胸闷、心悸（常无症状）
**解决办法**：
- 限制盐分摄入（每天<6克）
- 控制体重
- 规律运动
- 戒烟限酒
- 按时服用降压药
- 定期监测血压
- 减少压力
```

## Important Disclaimers

**MUST ALWAYS** include the following disclaimer after any response:

```
> **注意**：以上信息仅供参考，不能替代专业医疗建议。如有健康问题，请及时就医。
```

This is mandatory for all medical-related answers.

## Response Language

- If user asks in Chinese, respond in Chinese
- If user asks in English, respond in English
- Match the language of the question

## Handling Unavailable Information

If the disease or symptom is not found in the documents:

1. Apologize that the specific information is not available in the knowledge base
2. Suggest the user consult a healthcare professional
3. Still include the mandatory disclaimer