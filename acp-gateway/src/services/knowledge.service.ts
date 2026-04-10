interface KnowledgeItem {
  question: string;
  answer: string;
  scene: string;
  tags: string[];
}

const knowledgeBase: KnowledgeItem[] = [
  {
    question: '健康饮食的误区有哪些？',
    answer: '常见的健康饮食误区包括：1. 只吃蔬菜水果不吃肉；2. 认为无糖食品更健康；3. 过度节食；4. 迷信某种食物的功效；5. 不吃早餐。建议保持均衡饮食，荤素搭配。',
    scene: 'diet',
    tags: ['饮食', '误区', '健康'],
  },
  {
    question: '吃糖真的能助眠吗？',
    answer: '这是一个误区。虽然糖分可以暂时让人感到疲劳，但会影响睡眠质量。睡前摄入过多糖分会导致血糖波动，影响深度睡眠。建议睡前2-3小时避免摄入糖分。',
    scene: 'sleep',
    tags: ['睡眠', '糖', '饮食'],
  },
  {
    question: '三七粉对心脑血管有保护作用吗？',
    answer: '三七粉确实有一定的活血化瘀作用，对心脑血管有一定益处。但需注意：1. 要在医生指导下使用；2. 不能替代药物治疗；3. 孕妇禁用；4. 服用期间注意观察身体反应。',
    scene: 'tcm',
    tags: ['三七', '心脑血管', '中药'],
  },
  {
    question: '如何改善睡眠质量？',
    answer: '改善睡眠质量的建议：1. 保持规律作息；2. 睡前1小时避免使用电子设备；3. 适度运动但避免睡前剧烈运动；4. 营造舒适的睡眠环境；5. 睡前可泡脚或喝温牛奶。',
    scene: 'sleep',
    tags: ['睡眠', '改善', '方法'],
  },
  {
    question: '运动后肌肉酸痛怎么办？',
    answer: '运动后肌肉酸痛的缓解方法：1. 适度休息；2. 按摩放松；3. 热敷；4. 补充水分和电解质；5. 拉伸放松。如果疼痛严重或持续时间较长，建议就医检查。',
    scene: 'exercise',
    tags: ['运动', '肌肉酸痛', '缓解'],
  },
  {
    question: '同仁堂的历史',
    answer: '北京同仁堂创建于1669年（清康熙八年），至今已有350多年的历史，是全国中药行业著名的老字号。历代同仁堂人始终恪守"同修仁德，济世养生"的堂训。',
    scene: 'brand',
    tags: ['同仁堂', '历史', '老字号'],
  },
  {
    question: '如何缓解压力？',
    answer: '缓解压力的方法：1. 深呼吸练习；2. 适度运动；3. 与朋友倾诉；4. 培养兴趣爱好；5. 必要时寻求专业心理咨询。长期压力会影响身心健康，要重视起来。',
    scene: 'psychology',
    tags: ['压力', '缓解', '心理健康'],
  },
];

export class KnowledgeService {
  async search(keyword: string, scene?: string): Promise<KnowledgeItem[]> {
    return this.searchSync(keyword, scene);
  }

  searchSync(keyword: string, scene?: string): KnowledgeItem[] {
    const lowerKeyword = keyword.toLowerCase();

    let results = [...knowledgeBase];

    if (scene) {
      results = results.filter((item) => item.scene === scene);
    }

    results = results.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerKeyword) ||
        item.answer.toLowerCase().includes(lowerKeyword) ||
        item.tags.some((tag) => lowerKeyword.includes(tag.toLowerCase()))
    );

    return results.slice(0, 5);
  }

  async getByScene(scene: string): Promise<KnowledgeItem[]> {
    return knowledgeBase.filter((item) => item.scene === scene);
  }

  async getAll(): Promise<KnowledgeItem[]> {
    return knowledgeBase;
  }

  async add(item: KnowledgeItem): Promise<void> {
    knowledgeBase.push(item);
  }
}