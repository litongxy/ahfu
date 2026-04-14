const fs = require('fs');
const os = require('os');
const path = require('path');

const servicePath = path.resolve(__dirname, '../dist/services/questions-knowledge.service.js');

describe('QuestionsKnowledgeService', () => {
  test('matches colloquial sleep questions to sleep knowledge', () => {
    const { QuestionsKnowledgeService } = require(servicePath);
    const service = new QuestionsKnowledgeService();
    const result = service.search('最近总是睡不好怎么办', 1)[0];

    expect(result).toBeTruthy();
    expect(`${result.file}|${result.title}`).toMatch(/高频口语补充问答|失眠|睡眠障碍|睡不好/);
  });

  test('reloads markdown knowledge after files change', () => {
    const { QuestionsKnowledgeService } = require(servicePath);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'questions-knowledge-'));
    const filePath = path.join(tempDir, '临时问答.md');

    try {
      fs.writeFileSync(
        filePath,
        '# 临时问答\n\n## 1. 老问题\n**常见问法**：老问题怎么办\n**一句话**：这是旧答案。\n',
        'utf8'
      );

      const service = new QuestionsKnowledgeService();
      service.questionsDir = tempDir;

      const firstResult = service.search('老问题怎么办', 1)[0];
      expect(firstResult.title).toBe('老问题');

      fs.writeFileSync(
        filePath,
        '# 临时问答\n\n## 1. 新问题\n**常见问法**：新问题怎么办\n**一句话**：这是新答案。\n',
        'utf8'
      );
      const nextTime = new Date(Date.now() + 2000);
      fs.utimesSync(filePath, nextTime, nextTime);

      const secondResult = service.search('新问题怎么办', 1)[0];
      expect(secondResult.title).toBe('新问题');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
