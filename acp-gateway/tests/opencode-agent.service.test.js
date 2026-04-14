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

  test('recognizes colloquial sleep questions as health queries', () => {
    const { OpencodeAgentService } = require(servicePath);
    const service = new OpencodeAgentService();

    expect(service.detectScene('最近总是睡不好怎么办')).toBe('sleep');
    expect(service.hasMedicalKnowledgeHit('最近总是睡不好怎么办')).toBe(true);
  });

  test('detects guided video queries as exercise scene', () => {
    const { OpencodeAgentService } = require(servicePath);
    const service = new OpencodeAgentService();

    expect(service.detectScene('肩颈很紧，给我一个能直接跟练的视频')).toBe('exercise');
  });

  test('prioritizes report scene when report intent and recipe keywords appear together', () => {
    const { OpencodeAgentService } = require(servicePath);
    const service = new OpencodeAgentService();

    expect(service.detectScene('根据我最近体检报告，给我推荐更对应的食谱和运动视频')).toBe('report');
  });

  test('does not treat generic breakfast recommendation as pantry cooking intent', () => {
    const { OpencodeAgentService } = require(servicePath);
    const service = new OpencodeAgentService();

    expect(service.isCookingRecipeIntent('明早来不及做饭，帮我推荐两个快手早餐食谱')).toBe(false);
    expect(service.isCookingRecipeIntent('根据我最近体检报告，给我推荐更对应的食谱和运动视频')).toBe(false);
  });

  test('keeps pantry-style recipe requests as cooking intent', () => {
    const { OpencodeAgentService } = require(servicePath);
    const service = new OpencodeAgentService();

    expect(service.isCookingRecipeIntent('冰箱里有鸡蛋和番茄，可以做什么菜？')).toBe(true);
  });

  test('does not prefer web search for lifestyle recommendation intent', () => {
    const { OpencodeAgentService } = require(servicePath);
    const service = new OpencodeAgentService();

    expect(service.isLifestyleRecommendationIntent('明早来不及做饭，帮我推荐两个快手早餐食谱', 'diet')).toBe(true);
  });
});
