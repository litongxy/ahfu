const path = require('path');

const servicePath = path.resolve(__dirname, '../dist/services/opencode-agent.service.js');

describe('buildPantryRecipeSuggestion', () => {
  test('suggests dishes for tomato + egg pantry query', () => {
    const { buildPantryRecipeSuggestion } = require(servicePath);
    const result = buildPantryRecipeSuggestion('我现在有西红柿鸡蛋，都可以做什么菜？');

    expect(typeof result).toBe('string');
    expect(result).toContain('现有食材可直接做');
    expect(result).toContain('番茄炒蛋');
    expect(result).toContain('西红柿鸡蛋面');
  });

  test('supports ingredient alias like 番茄', () => {
    const { buildPantryRecipeSuggestion } = require(servicePath);
    const result = buildPantryRecipeSuggestion('冰箱有番茄和鸡蛋，能做什么？');

    expect(typeof result).toBe('string');
    expect(result).toContain('番茄炒蛋');
  });

  test('supports non tomato-egg pantry query', () => {
    const { buildPantryRecipeSuggestion } = require(servicePath);
    const result = buildPantryRecipeSuggestion('我有土豆和青椒，能做什么菜？');

    expect(typeof result).toBe('string');
    expect(result).toContain('青椒土豆丝');
  });

  test('supports short colloquial query with single-char ingredient', () => {
    const { buildPantryRecipeSuggestion } = require(servicePath);
    const result = buildPantryRecipeSuggestion('冰箱里有西兰花和蒜，可以做啥？');

    expect(typeof result).toBe('string');
    expect(result).toContain('蒜蓉西兰花');
  });

  test('supports single-ingredient pantry query like cucumber', () => {
    const { buildPantryRecipeSuggestion } = require(servicePath);
    const result = buildPantryRecipeSuggestion('我现在有黄瓜可以做什么菜？');

    expect(typeof result).toBe('string');
    expect(result).toContain('现有食材可直接做');
    expect(result).toContain('拍黄瓜');
    expect(result).toContain('凉拌黄瓜');
  });

  test('returns null for non-pantry queries', () => {
    const { buildPantryRecipeSuggestion } = require(servicePath);
    const result = buildPantryRecipeSuggestion('最近睡眠不好怎么调理？');

    expect(result).toBeNull();
  });
});

describe('medical web fallback heuristics', () => {
  test('prefers web search when medical knowledge base misses the question', () => {
    const { OpencodeAgentService } = require(servicePath);
    const service = new OpencodeAgentService();

    expect(service.hasMedicalKnowledgeHit('三七粉对心脑血管有保护作用吗？')).toBe(false);
    expect(service.shouldPreferWebSearch('三七粉对心脑血管有保护作用吗？', 'tcm')).toBe(true);
  });
});
