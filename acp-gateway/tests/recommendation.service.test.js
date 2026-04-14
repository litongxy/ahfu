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
    expect(
      result.contents.some((c) =>
        Array.isArray(c.evidenceBadges) && c.evidenceBadges.some((badge) => String(badge).includes('甘油三酯'))
      )
    ).toBe(true);
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

  test('tailors glucose report to glycemic recipes and matching aerobic exercise', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const fakeReport = {
      id: 'report_test_glucose',
      userId: 'u1',
      uploadTime: new Date('2026-01-01T00:00:00.000Z'),
      indicators: [
        {
          name: '空腹血糖(GLU)',
          value: '7.1',
          unit: 'mmol/L',
          referenceRange: '3.9-6.1',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议控制精制碳水摄入，规律运动并复查血糖',
        },
      ],
      anomalyCount: 1,
      status: 'parsed',
    };

    const result = await svc.getRecommendations('report', {
      message: '根据这份体检报告，给我推荐更对应的食谱和运动视频',
      report: fakeReport,
    });

    const recipes = result.contents.filter((c) => c.type === 'recipe');
    const recipeIds = recipes.map((c) => c.id);
    const exerciseItems = result.contents.filter((c) => c.type === 'exercise');

    expect(recipeIds).toContain('recipe_oats_chicken_bowl');
    expect(recipeIds).not.toContain('recipe_steamed_fish_low_salt');
    expect(recipes.every((item) => item.tags.includes('控糖') || item.tags.includes('减脂'))).toBe(true);
    expect(exerciseItems.length).toBeGreaterThan(0);
    expect(exerciseItems.some((item) => item.tags.includes('减脂') || item.tags.includes('新手友好'))).toBe(true);
    expect(exerciseItems.every((item) => item.intensity !== 'high')).toBe(true);
  });

  test('tailors uric acid report to low-purine recipe and low-intensity exercise only', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const fakeReport = {
      id: 'report_test_uric',
      userId: 'u1',
      uploadTime: new Date('2026-01-01T00:00:00.000Z'),
      indicators: [
        {
          name: '尿酸(UA)',
          value: '520',
          unit: 'umol/L',
          referenceRange: '150-420',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议控制高嘌呤饮食，多饮水并配合低冲击运动',
        },
      ],
      anomalyCount: 1,
      status: 'parsed',
    };

    const result = await svc.getRecommendations('report', {
      message: '上传报告后，只想看对应的食谱和运动建议',
      report: fakeReport,
    });

    const recipeIds = result.contents.filter((c) => c.type === 'recipe').map((c) => c.id);
    const exerciseItems = result.contents.filter((c) => c.type === 'exercise');
    const recipeEvidence = result.contents
      .filter((c) => c.type === 'recipe')
      .flatMap((c) => Array.isArray(c.evidenceBadges) ? c.evidenceBadges : []);

    expect(recipeIds).toEqual(['recipe_winter_melon_egg_soup']);
    expect(recipeEvidence.some((badge) => String(badge).includes('尿酸'))).toBe(true);
    expect(exerciseItems.length).toBeGreaterThan(0);
    expect(exerciseItems.every((item) => item.intensity === 'low')).toBe(true);
    expect(exerciseItems.some((item) => item.id === 'video_baduanjin')).toBe(true);
  });

  test('maps nodule and respiratory findings to gentler report-aware recipes and videos', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const fakeReport = {
      id: 'report_test_nodule_respiratory',
      userId: 'u1',
      uploadTime: new Date('2026-01-01T00:00:00.000Z'),
      indicators: [
        {
          name: '甲状腺结节',
          value: '左侧甲状腺结节',
          unit: '',
          referenceRange: '未见异常',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议结合甲状腺超声分级与专科意见定期复查',
        },
        {
          name: '乳腺增生',
          value: '双侧乳腺小叶增生',
          unit: '',
          referenceRange: '未见异常',
          isAnomaly: true,
          severity: 'slight',
          suggestion: '建议结合月经周期和乳腺症状定期复查',
        },
        {
          name: '支气管扩张',
          value: '右下肺一支气管局限性扩张',
          unit: '',
          referenceRange: '未见异常',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议戒烟并多做深呼吸，结合呼吸科意见评估',
        },
      ],
      anomalyCount: 3,
      status: 'parsed',
    };

    const result = await svc.getRecommendations('report', {
      message: '根据体检报告，给我推荐更对应的食谱和运动视频',
      report: fakeReport,
    });

    const recipes = result.contents.filter((c) => c.type === 'recipe');
    const exercises = result.contents.filter((c) => c.type === 'exercise');
    const evidence = result.contents.flatMap((c) => Array.isArray(c.evidenceBadges) ? c.evidenceBadges : []);

    expect(recipes.length).toBeGreaterThan(0);
    expect(exercises.length).toBeGreaterThan(0);
    expect(recipes.some((item) => item.tags.includes('清淡') || item.tags.includes('恢复'))).toBe(true);
    expect(exercises.every((item) => item.intensity === 'low')).toBe(true);
    expect(
      evidence.some((badge) =>
        /(甲状腺结节|乳腺增生|支气管扩张)/.test(String(badge))
      )
    ).toBe(true);
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

  test('prefers breakfast recipes for breakfast intent and returns professional reason copy', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const result = await svc.getRecommendations('diet', {
      message: '明早来不及做饭，帮我推荐两个快手早餐食谱',
    });

    const recipes = result.contents.filter((c) => c.type === 'recipe');
    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes.some((item) => (item.tags || []).includes('早餐'))).toBe(true);
    expect(recipes.some((item) => (item.tags || []).includes('快手'))).toBe(true);
    expect(recipes.every((item) => String(item.reason || '').includes('匹配依据：'))).toBe(true);
  });

  test('prefers shoulder-neck exercise videos when chat intent asks for guided follow-along video', async () => {
    const { RecommendationService } = require(servicePath);
    const svc = new RecommendationService();

    const result = await svc.getRecommendations('chat', {
      message: '办公室坐了一天肩颈很紧，推荐一个能直接跟练的视频',
    });

    const exercises = result.contents.filter((c) => c.type === 'exercise');
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises[0].bvid).toBeTruthy();
    expect(exercises.some((item) => (item.tags || []).includes('肩颈') || (item.tags || []).includes('办公室'))).toBe(true);
    expect(exercises.every((item) => String(item.reason || '').includes('匹配依据：'))).toBe(true);
  });
});
