const path = require('path');

const servicePath = path.resolve(__dirname, '../dist/services/recommendation.service.js');

describe('RecommendationService', () => {
  test('recommends recipe + exercise based on report lipid anomalies', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const fakeReport = {
      id: 'report_test_lipids',
      userId: 'u1',
      uploadTime: new Date('2026-01-01T00:00:00.000Z'),
      indicators: [
        {
          name: '甘油三酯(TG)',
          value: '2.58',
          unit: 'mmol/L',
          referenceRange: '0.4-1.7',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议控制精制碳水和饮酒，增加运动并复查血脂',
        },
      ],
      anomalyCount: 1,
      status: 'parsed',
    };

    const result = await svc.getRecommendations('report', {
      message: '体检血脂偏高，想要对应的菜谱和运动视频',
      report: fakeReport,
    });

    expect(Array.isArray(result.contents)).toBe(true);
    expect(result.contents.some((c) => c.type === 'recipe')).toBe(true);
    expect(result.contents.some((c) => c.type === 'exercise')).toBe(true);
    expect(result.contents.map((c) => c.reason || '').join('\n')).toContain('控脂');
  });

  test('filters high-intensity videos when report suggests heart risk', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const fakeReport = {
      id: 'report_test_heart',
      userId: 'u1',
      uploadTime: new Date('2026-01-01T00:00:00.000Z'),
      indicators: [
        {
          name: '心电图',
          value: 'T波改变',
          unit: '',
          referenceRange: '正常',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议结合症状与医生评估',
        },
      ],
      anomalyCount: 1,
      status: 'parsed',
    };

    const result = await svc.getRecommendations('report', {
      message: '我想运动改善一下，但心电图有点异常',
      report: fakeReport,
    });

    const exercises = result.contents.filter((c) => c.type === 'exercise');
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.every((c) => c.intensity !== 'high')).toBe(true);
    expect(exercises.some((c) => c.id === 'video_baduanjin' || c.tags.includes('低强度'))).toBe(true);
  });

  test('returns pantry-matched tomato-egg recipes when user asks by ingredients', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const result = await svc.getRecommendations('diet', {
      message: '我有西红柿和鸡蛋，可以做什么菜？',
    });

    const recipeTitles = result.contents.filter((c) => c.type === 'recipe').map((c) => c.title);
    expect(recipeTitles).toContain('番茄炒蛋');
    expect(recipeTitles.some((title) => title.includes('鸡蛋'))).toBe(true);
  });

  test('returns cucumber recipes for single-ingredient pantry query', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const result = await svc.getRecommendations('diet', {
      message: '我现在有黄瓜可以做什么菜？',
    });

    const recipeTitles = result.contents.filter((c) => c.type === 'recipe').map((c) => c.title);
    expect(recipeTitles.length).toBeGreaterThan(0);
    expect(recipeTitles.some((title) => title.includes('黄瓜'))).toBe(true);
    expect(recipeTitles.some((title) => title === '拍黄瓜' || title === '凉拌黄瓜')).toBe(true);
  });

  test('keeps the signature recipe trio showing up across ten diet questions', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const messages = [
      '我最近想控制血糖，吃什么比较合适？',
      '减脂期晚饭推荐什么菜？',
      '血脂有点高，给我推荐几道菜',
      '最近想吃清淡一点，有没有适合的菜谱？',
      '胃不太舒服，晚餐吃什么比较好？',
      '想要高蛋白又清爽的菜，有推荐吗？',
      '体检说要少盐少油，吃什么菜好？',
      '我想控制体重，三餐里有什么推荐菜？',
      '有没有适合日常养胃的家常菜？',
      '想吃得健康一点，给我推荐三道菜',
    ];
    const focusIds = new Set([
      'recipe_oats_chicken_bowl',
      'recipe_steamed_fish_low_salt',
      'recipe_tomato_tofu_soup',
    ]);

    let roundsWithFocus = 0;

    for (const message of messages) {
      const result = await svc.getRecommendations('diet', { message });
      const hasFocusRecipe = result.contents.some((content) => focusIds.has(content.id));
      if (hasFocusRecipe) {
        roundsWithFocus += 1;
      }
    }

    expect(messages).toHaveLength(10);
    expect(roundsWithFocus).toBeGreaterThanOrEqual(7);
  });
});
