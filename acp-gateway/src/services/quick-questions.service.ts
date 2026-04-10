import * as fs from 'fs';
import * as path from 'path';

export interface QuickQuestionItem {
  id: string;
  question: string;
  scene: string;
}

interface TopicGroup {
  fileTitle: string;
  fileScene: string;
  topics: string[];
}

const MAX_QUESTION_COUNT = 500;

const SEED_QUESTIONS: Array<{ question: string; scene: string }> = [
  { question: '健康饮食的误区有哪些？', scene: 'diet' },
  { question: '吃糖真的能助眠吗？', scene: 'sleep' },
  { question: '三七粉对心脑血管有保护作用吗？', scene: 'tcm' },
  { question: '如何缓解压力？', scene: 'psychology' },
  { question: '运动后肌肉酸痛怎么办？', scene: 'exercise' },
  { question: '晚上总是睡不着怎么办？', scene: 'sleep' },
  { question: '减脂期怎么安排三餐更稳？', scene: 'diet' },
  { question: '久坐肩颈酸痛怎么缓解？', scene: 'exercise' },
  { question: '血压偏高日常怎么调理？', scene: 'disease' },
  { question: '体检报告里转氨酶偏高怎么办？', scene: 'report' },
];

export class QuickQuestionsService {
  private readonly questionsDir: string;
  private cachedQuestions: QuickQuestionItem[] | null = null;

  constructor() {
    this.questionsDir = path.resolve(__dirname, '../../../questions');
  }

  getQuestions(limit: number = MAX_QUESTION_COUNT): QuickQuestionItem[] {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), MAX_QUESTION_COUNT)
      : MAX_QUESTION_COUNT;
    return this.loadQuestions().slice(0, safeLimit);
  }

  private loadQuestions(): QuickQuestionItem[] {
    if (this.cachedQuestions) {
      return this.cachedQuestions;
    }

    this.cachedQuestions = this.buildQuestions();
    return this.cachedQuestions;
  }

  private buildQuestions(): QuickQuestionItem[] {
    const results: QuickQuestionItem[] = [];
    const seen = new Set<string>();
    let nextId = 1;

    const pushQuestion = (question: string, scene: string) => {
      const normalizedQuestion = this.normalizeQuestion(question);
      if (!normalizedQuestion) {
        return;
      }

      const key = normalizedQuestion.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      results.push({
        id: `q${nextId}`,
        question: normalizedQuestion,
        scene,
      });
      nextId += 1;
    };

    for (const seed of SEED_QUESTIONS) {
      pushQuestion(seed.question, seed.scene);
    }

    const topicGroups = this.collectTopicGroups();

    for (const group of topicGroups) {
      if (results.length >= MAX_QUESTION_COUNT) {
        break;
      }

      pushQuestion(this.toFileLevelQuestion(group.fileTitle), group.fileScene);

      for (const topic of group.topics) {
        if (results.length >= MAX_QUESTION_COUNT) {
          break;
        }

        const scene = this.inferScene(`${group.fileTitle} ${topic}`, group.fileScene);
        pushQuestion(this.toPrimaryQuestion(topic), scene);
      }
    }

    if (results.length < MAX_QUESTION_COUNT) {
      for (const group of topicGroups) {
        for (const topic of group.topics) {
          if (results.length >= MAX_QUESTION_COUNT) {
            break;
          }

          const scene = this.inferScene(`${group.fileTitle} ${topic}`, group.fileScene);
          pushQuestion(this.toSecondaryQuestion(topic), scene);
        }

        if (results.length >= MAX_QUESTION_COUNT) {
          break;
        }
      }
    }

    return results.slice(0, MAX_QUESTION_COUNT);
  }

  private collectTopicGroups(): TopicGroup[] {
    const groups: TopicGroup[] = [];

    try {
      const files = fs
        .readdirSync(this.questionsDir)
        .filter((file) => file.endsWith('.md'))
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

      for (const file of files) {
        const filePath = path.join(this.questionsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileTitle = this.cleanTopic(file.replace(/\.md$/i, ''));
        const fileScene = this.inferScene(fileTitle, 'disease');
        const topics = this.extractTopics(content);

        groups.push({
          fileTitle,
          fileScene,
          topics,
        });
      }
    } catch (error) {
      console.error('加载常见问题库失败:', error);
    }

    return groups;
  }

  private extractTopics(content: string): string[] {
    const topicSet = new Set<string>();
    const headingRegex = /^##\s*(?:\d+\.\s*)?(.+)$/gm;
    const matches = content.matchAll(headingRegex);

    for (const match of matches) {
      const rawTopic = match[1] ?? '';
      const topic = this.cleanTopic(rawTopic);
      if (!topic) {
        continue;
      }
      topicSet.add(topic);
    }

    return Array.from(topicSet);
  }

  private cleanTopic(value: string): string {
    const normalized = value
      .trim()
      .replace(/^[\d一二三四五六七八九十]+[、.．)\s-]*/, '')
      .replace(/[【】]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[：:。；;，,]+$/g, '');

    return normalized;
  }

  private normalizeQuestion(question: string): string {
    const normalized = question.trim().replace(/\s+/g, '');
    if (!normalized) {
      return '';
    }

    const withoutTail = normalized.replace(/[?？]+$/g, '');
    if (!withoutTail) {
      return '';
    }

    return `${withoutTail}？`;
  }

  private toFileLevelQuestion(fileTitle: string): string {
    if (/报告|体检|检查|检验|指标/.test(fileTitle)) {
      return `${fileTitle}最关键的解读点是什么`;
    }

    if (/饮食|营养|食谱/.test(fileTitle)) {
      return `${fileTitle}怎么做更科学`;
    }

    if (/运动|康复|骨科/.test(fileTitle)) {
      return `${fileTitle}有哪些实用建议`;
    }

    if (/心理|精神/.test(fileTitle)) {
      return `${fileTitle}常见问题怎么应对`;
    }

    if (/中医/.test(fileTitle)) {
      return `${fileTitle}常见调理思路有哪些`;
    }

    return `${fileTitle}有哪些常见问题`;
  }

  private toPrimaryQuestion(topic: string): string {
    if (/^(为什么|如何|怎样|怎么|是否|能否|可否|要不要|需不需要)/.test(topic)) {
      return topic;
    }

    if (/(中医|体质|方药|中药|药材|三七|丹参|黄芪|人参|当归|艾灸|针灸|八段锦)/.test(topic)) {
      return `${topic}怎么调理更稳妥`;
    }

    if (/(检查|检验|体检|指标|报告|影像|超声|CT|MRI|核磁)/i.test(topic)) {
      return `${topic}怎么解读`;
    }

    if (/(症状|体征|表现)/.test(topic)) {
      return `${topic}常见表现有哪些`;
    }

    if (/(预防|管理|康复|护理|保健|养生)/.test(topic)) {
      return `${topic}该怎么做`;
    }

    if (/(病|炎|症|癌|瘤|综合征|高血压|糖尿病|冠心病|脑卒中|哮喘|鼻炎|胃炎|结石|骨折|痛风)/.test(topic)) {
      return `${topic}有哪些常见症状和处理建议`;
    }

    return `${topic}该怎么预防和调理`;
  }

  private toSecondaryQuestion(topic: string): string {
    if (/(检查|检验|体检|指标|报告)/.test(topic)) {
      return `${topic}异常时通常要注意什么`;
    }

    if (/(病|炎|症|痛|综合征|癌|瘤)/.test(topic)) {
      return `${topic}什么时候需要尽快就医`;
    }

    if (/(中医|体质|方药|中药|药材|三七|丹参|黄芪|人参|当归)/.test(topic)) {
      return `${topic}适合哪些人群`;
    }

    return `${topic}有哪些常见误区`;
  }

  private inferScene(text: string, fallback: string): string {
    if (/同仁堂|品牌|老字号/.test(text)) {
      return 'brand';
    }

    if (/报告|体检|指标|检查|检验|化验/.test(text)) {
      return 'report';
    }

    if (/睡眠|失眠|打鼾|入睡|早醒|多梦/.test(text)) {
      return 'sleep';
    }

    if (/心理|精神|焦虑|抑郁|压力|情绪/.test(text)) {
      return 'psychology';
    }

    if (/运动|锻炼|健身|康复|骨科|肌肉|关节/.test(text)) {
      return 'exercise';
    }

    if (/饮食|营养|食谱|减脂|控糖|控脂|肥胖|维生素|钙|铁|锌/.test(text)) {
      return 'diet';
    }

    if (/中医|中药|方药|体质|养生|三七|丹参|黄芪|人参|当归|艾灸|针灸/.test(text)) {
      return 'tcm';
    }

    if (/抗衰|更年期|围绝经|衰老|美容/.test(text)) {
      return 'antiaging';
    }

    if (/病|炎|症|疼|痛|发热|发烧|咳嗽|腹泻|便秘|心脑血管|高血压|糖尿病/.test(text)) {
      return 'disease';
    }

    return fallback;
  }
}

export const quickQuestionsService = new QuickQuestionsService();
