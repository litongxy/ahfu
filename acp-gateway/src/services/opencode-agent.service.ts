import { execSync } from 'child_process';
import { KnowledgeService } from './knowledge.service';
import {
  buildPantryRecipeSuggestion as buildPantryRecipeSuggestionFromLibrary,
  extractIngredientsFromMessage,
} from './pantry-recipe.service';
import { RecommendationService } from './recommendation.service';
import { pageRouteService } from './page-route.service';
import { questionsKnowledge } from './questions-knowledge.service';
import { formatReportSummaryForPrompt } from './report-context.service';
import type { HealthReport } from './report.model';
import { reportService } from './report.service';
import { userProfiles } from './user-profile.store';
import { webSearchService, WebSearchResult } from './web-search.service';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentContext {
  userId?: string;
  scene?: string;
  history?: AgentMessage[];
}

export interface AgentResult {
  response: string;
  scene: string;
  recommendations?: {
    contents: unknown[];
    goods: unknown[];
    pages: Array<{ name: string; url: string; icon?: string }>;
  };
}

export interface HealthProfile {
  userId: string;
  name?: string;
  age?: number;
  gender?: string;
  chronicDisease?: string[];
  allergy?: string[];
  symptoms?: string[];
  surgeryHistory?: string[];
  familyHistory?: string[];
  medicationHistory?: string[];
  dietHabit?: string;
  exerciseHabit?: string;
  sleepInfo?: string;
  lastCheckup?: string;
}

const profiles: Map<string, HealthProfile> = new Map();

export function buildPantryRecipeSuggestion(message: string): string | null {
  return buildPantryRecipeSuggestionFromLibrary(message);
}

function fetchHealthProfile(userId: string): HealthProfile | null {
  return userProfiles.get(userId) || null;
}

function saveHealthProfile(profile: HealthProfile): void {
  profiles.set(profile.userId, profile);
}

function formatHealthProfileForPrompt(profile: HealthProfile | null): string {
  if (!profile) return '';
  
  const parts: string[] = [];
  
  if (profile.chronicDisease && profile.chronicDisease.length > 0) {
    parts.push(`• 既往病史：${profile.chronicDisease.join('、')}`);
  }
  if (profile.allergy && profile.allergy.length > 0) {
    parts.push(`• 过敏史：${profile.allergy.join('、')}`);
  }
  if (profile.medicationHistory && profile.medicationHistory.length > 0) {
    parts.push(`• 用药史：${profile.medicationHistory.join('、')}`);
  }
  if (profile.surgeryHistory && profile.surgeryHistory.length > 0) {
    parts.push(`• 手术史：${profile.surgeryHistory.join('、')}`);
  }
  if (profile.familyHistory && profile.familyHistory.length > 0) {
    parts.push(`• 家族史：${profile.familyHistory.join('、')}`);
  }
  if (profile.symptoms && profile.symptoms.length > 0) {
    parts.push(`• 近期症状：${profile.symptoms.join('、')}`);
  }
  if (profile.dietHabit) {
    parts.push(`• 饮食习惯：${profile.dietHabit}`);
  }
  if (profile.exerciseHabit) {
    parts.push(`• 运动习惯：${profile.exerciseHabit}`);
  }
  if (profile.sleepInfo) {
    parts.push(`• 睡眠情况：${profile.sleepInfo}`);
  }
  
  return parts.length > 0 ? `\n【用户健康档案】\n${parts.join('\n')}` : '';
}

function checkMedicationContraindications(
  userMessage: string,
  profile: HealthProfile | null
): string {
  if (!profile) return '';
  
  const msg = userMessage.toLowerCase();
  const contraindications: string[] = [];
  
  const diseases = profile.chronicDisease || [];
  const allergies = profile.allergy || [];
  
  if (msg.includes('感冒') || msg.includes('退烧') || msg.includes('止痛')) {
    if (diseases.includes('高血压')) {
      contraindications.push('⚠️ 您有高血压，建议避免使用含麻黄碱、伪麻黄碱的感冒药');
    }
    if (diseases.includes('糖尿病')) {
      contraindications.push('⚠️ 您有糖尿病，注意避免使用含糖制剂的感冒药');
    }
    if (diseases.includes('胃溃疡') || diseases.includes('胃炎')) {
      contraindications.push('⚠️ 您有胃部疾病，建议避免使用布洛芬、阿司匹林等胃刺激性药物');
    }
    if (allergies.includes('青霉素')) {
      contraindications.push('⚠️ 您对青霉素过敏，使用阿莫西林等抗生素需谨慎');
    }
  }
  
  if (msg.includes('止痛') || msg.includes('消炎')) {
    if (diseases.includes('高血压')) {
      contraindications.push('⚠️ 您有高血压，慎用非甾体抗炎药');
    }
    if (diseases.includes('肾功能不全') || diseases.includes('肾病')) {
      contraindications.push('⚠️ 您有肾功能问题，避免使用氨基糖苷类等肾毒性药物');
    }
  }
  
  if (msg.includes('胃') || msg.includes('消化')) {
    if (diseases.includes('胃溃疡')) {
      contraindications.push('⚠️ 您有胃溃疡，避免使用阿司匹林、布洛芬等');
    }
  }
  
  if (allergies.includes('磺胺')) {
    if (msg.includes('抗菌') || msg.includes('消炎')) {
      contraindications.push('⚠️ 您对磺胺类药物过敏，需避免使用磺胺类抗菌药');
    }
  }
  
  return contraindications.length > 0 ? 
    `\n${contraindications.join('\n')}` : '';
}

function generatePersonalizedSuggestions(
  userMessage: string,
  profile: HealthProfile | null
): string {
  if (!profile) return '';
  
  const msg = userMessage.toLowerCase();
  const suggestions: string[] = [];
  const diseases = profile.chronicDisease || [];
  const symptoms = profile.symptoms || [];
  
  if ((msg.includes('头痛') || msg.includes('头疼')) && diseases.includes('高血压')) {
    suggestions.push('💡 您有高血压史，头痛时建议先测量血压，排除血压升高的可能');
  }
  
  if ((msg.includes('疲劳') || msg.includes('累') || msg.includes('没力气')) && diseases.includes('糖尿病')) {
    suggestions.push('💡 您有糖尿病史，疲劳可能是血糖异常，建议测量血糖');
  }
  
  if ((msg.includes('胸痛') || msg.includes('胸闷')) && diseases.includes('冠心病')) {
    suggestions.push('💡 您有冠心病史，胸痛可能是心绞痛信号，建议立即就医');
  }
  
  if (msg.includes('感冒') && diseases.includes('高血压')) {
    suggestions.push('💡 您有高血压，感冒药建议选择不含麻黄碱的品种');
  }
  
  if (msg.includes('感冒') && diseases.includes('糖尿病')) {
    suggestions.push('💡 您有糖尿病，感冒期间需加强血糖监测');
  }
  
  if (profile.dietHabit === '辣' && (msg.includes('胃') || msg.includes('消化'))) {
    suggestions.push('💡 您平时喜辣，有胃部不适建议暂时清淡饮食');
  }
  
  if (profile.sleepInfo === '<6' && (msg.includes('疲劳') || msg.includes('累'))) {
    suggestions.push('💡 您睡眠不足6小时，疲劳可能是睡眠质量导致');
  }
  
  if (symptoms.length > 0 && msg.includes('调理')) {
    suggestions.push(`💡 您近期有${symptoms.join('、')}症状，建议注意休息，如有加重及时就医`);
  }
  
  return suggestions.length > 0 ? 
    `\n${suggestions.join('\n')}` : '';
}

function generateHealthReminders(profile: HealthProfile): string {
  if (!profile) return '';
  
  const reminders: string[] = [];
  const diseases = profile.chronicDisease || [];
  const medications = profile.medicationHistory || [];
  
  if (diseases.includes('高血压')) {
    reminders.push('• 您有高血压，建议低盐饮食，定期监测血压');
  }
  if (diseases.includes('糖尿病')) {
    reminders.push('• 您有糖尿病，建议控制糖分摄入，定期监测血糖');
  }
  if (diseases.includes('冠心病')) {
    reminders.push('• 您有冠心病，建议避免剧烈运动，保持情绪稳定');
  }
  if (medications.includes('阿司匹林') || medications.includes('华法林')) {
    reminders.push('• 您在使用抗凝药物，注意避免外伤，定期复查凝血功能');
  }
  if (medications.includes('激素')) {
    reminders.push('• 您在使用激素类药物，请勿自行停药');
  }
  
  return reminders.length > 0 ? 
    `\n【健康提醒】\n${reminders.join('\n')}` : '';
}

const SYSTEM_PROMPT = `你是同仁堂健康中心的AI健康顾问助手。

【同仁堂品牌介绍】
北京同仁堂创建于1669年（清康熙八年），至今已有350多年历史，是全国中药行业著名的老字号。
历代同仁堂人恪守"同修仁德，济世养生"的堂训，秉承"炮制虽繁必不敢省人工，品味虽贵必不敢减物力"的古训。
著名产品包括：安宫牛黄丸、牛黄清心丸、大活络丹、乌鸡白凤丸、六味地黄丸等。
同仁堂于2000年在香港上市，是国内首家在香港上市的中药企业。

【回答要求】
1. 用中文，专业且亲切
2. 健康问题：分析原因 + 调理建议 + 日常注意事项（尽量详细、可执行）
3. 品牌问题：介绍同仁堂历史、文化、产品
4. 结尾规则：健康问题结尾必须单独一行输出“仅供参考，如有不适请就医。”；品牌问题结尾输出“欢迎了解更多同仁堂产品。”
5. 如果用户有健康档案，请根据用户的健康档案提供个性化建议
6. 如果涉及用药：不要给出处方/剂量；先提示禁忌/相互作用风险；建议咨询医生或药师
7. 输出格式（健康问题）优先使用以下结构（每部分尽量 3-6 条要点）：
   - 【一句话结论】（1-2句）
   - 【可能原因】（按常见→少见）
   - 【调理建议】按“饮食/运动/作息/情绪/其他”分点给出（尽量具体到频次、时长、食物替换）
   - 【何时需要就医】列出红旗症状/需要急诊的情况（至少3条）
   - 【你可以补充的信息】为更精准判断，给出2-4个追问
8. 长度：健康问题通常不少于350字；简单问候/闲聊保持简短`;

export class OpencodeAgentService {
  private knowledgeService = new KnowledgeService();
  private recommendationService = new RecommendationService();
  private useAI = true;

  async initialize() {
    try {
      // 测试 opencode 是否可用
      const result = execSync('~/.local/bin/opencode run "测试" 2>/dev/null', { 
        encoding: 'utf-8', 
        timeout: 5000 
      });
      if (result && result.length > 0) {
        this.useAI = true;
        console.log('✅ Opencode AI 已连接');
      }
    } catch (e) {
      this.useAI = false;
      console.log('⚠️ Opencode 不可用，使用知识库模式');
    }
  }

  async chat(message: string, context: AgentContext): Promise<AgentResult> {
    let scene = this.detectScene(message);
    
    let profile: HealthProfile | null = null;
    let latestReport: HealthReport | null = null;
    if (context.userId) {
      profile = fetchHealthProfile(context.userId);
      latestReport = await reportService.getLatestParsedReport(context.userId);
    }
    
    const userContext = [formatHealthProfileForPrompt(profile), formatReportSummaryForPrompt(latestReport)]
      .filter(Boolean)
      .join('\n');
    const personalizedSuggestions = generatePersonalizedSuggestions(message, profile);
    const contraindications = checkMedicationContraindications(message, profile);
    const healthReminders = generateHealthReminders(profile ?? {} as HealthProfile);
    
    let response = '';
    const pantrySuggestion = buildPantryRecipeSuggestion(message);
    const handledByPantry = Boolean(pantrySuggestion);
    const handledByCookingIntentFallback = !handledByPantry && this.isCookingRecipeIntent(message);

    if (handledByPantry) {
      scene = 'diet';
      response = pantrySuggestion || '';
    } else if (handledByCookingIntentFallback) {
      scene = 'diet';
      response = this.getCookingIntentFallback(message);
    } else {
      const hasMedicalKnowledgeHit = this.hasMedicalKnowledgeHit(message);

      // 超纲问题：优先联网查询；太超纲/无法联网时直接提示无法回答
      if (this.isOutOfScope(message, scene)) {
        response = (await this.tryAnswerWithWebSearch(message, userContext)) || this.getOutOfScopeResponse();
      } else {
        if (!hasMedicalKnowledgeHit && this.shouldPreferWebSearch(message, scene)) {
          response =
            (await this.tryAnswerWithWebSearch(message, userContext)) ||
            this.getMissingKnowledgeResponse(true);
        } else {
          if (this.useAI) {
            try {
              response = await this.callAI(message, userContext);
            } catch (e) {
              console.error('AI error:', e);
              response = questionsKnowledge.getDirectAnswer(message) || this.getFallbackResponse(message, scene);
            }
          } else {
            const knowledgeResults = this.knowledgeService.searchSync(message, scene);
            response = knowledgeResults.length > 0
              ? knowledgeResults[0].answer
              : (questionsKnowledge.getDirectAnswer(message) || this.getFallbackResponse(message, scene));
          }

          if (this.shouldTriggerWebSearch(message, response, scene)) {
            const webResponse = await this.tryAnswerWithWebSearch(message, userContext);
            if (webResponse) {
              response = webResponse;
            } else if (!hasMedicalKnowledgeHit && this.looksLikeHealthQuestion(message.toLowerCase())) {
              response = this.getMissingKnowledgeResponse(true);
            }
          }
        }
      }
    }

    if (!handledByPantry && !handledByCookingIntentFallback && (personalizedSuggestions || contraindications || healthReminders)) {
      const additionalInfo = [personalizedSuggestions, contraindications, healthReminders]
        .filter(Boolean)
        .join('\n');
      response = response + '\n' + additionalInfo;
    }

    // 获取推荐（结合用户提问 + 最近一次体检报告）
    const recs = await this.recommendationService.getRecommendations(scene, {
      userId: context.userId,
      message,
      profile,
      report: latestReport,
    });
    const pageRoutes = pageRouteService.getRecommendedRoutes(message);
    const pages = pageRoutes.map(r => ({ name: r.name, url: r.url, icon: r.icon }));
    const uniquePages = [...pages, ...recs.pages].filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i);
    const filteredPages = uniquePages.filter((p) => !['健康食谱', '运动课程', '我的'].includes(p.name));
    const finalPages = this.shouldRecommendProfileAndReport(message, response, scene)
      ? this.getProfileAndReportPages()
      : filteredPages;

    if (this.shouldUseRecommendationFallbackResponse(message, scene, response, recs.contents)) {
      response = this.getRecommendationFallbackResponse(scene);
    }

    return {
      response,
      scene,
      recommendations: { ...recs, pages: finalPages },
    };
  }

  private shouldRecommendProfileAndReport(message: string, response: string, scene: string): boolean {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return false;

    const lower = trimmedMessage.toLowerCase();
    if (this.isSmallTalk(lower) || lower.includes('谢谢')) return false;

    const trimmedResponse = response.trim();
    if (!trimmedResponse) return true;
    if (trimmedResponse === this.getOutOfScopeResponse().trim()) return true;

    if (scene !== 'chat') return false;

    const fallback = this.getFallbackResponse(trimmedMessage, scene).trim();
    return trimmedResponse === fallback;
  }

  private getProfileAndReportPages(): Array<{ name: string; url: string; icon?: string }> {
    const ids = ['health-profile', 'report-analysis'] as const;
    return ids
      .map((id) => pageRouteService.getRouteById(id))
      .filter((route): route is NonNullable<typeof route> => Boolean(route))
      .map((route) => ({ name: route.name, url: route.url, icon: route.icon }));
  }

  private async callAI(message: string, profileContext: string = '', extraContext: string = ''): Promise<string> {
    const knowledgeContext = questionsKnowledge.getRelevantContext(message);

    const parts = [SYSTEM_PROMPT, knowledgeContext, profileContext, extraContext]
      .map((part) => part.trim())
      .filter(Boolean);

    const prompt = `${parts.join('\n\n')}\n\n用户问题：${message}`;
    
    const result = execSync(
      `~/.local/bin/opencode run ${JSON.stringify(prompt)} 2>/dev/null`,
      { encoding: 'utf-8', timeout: 30000, maxBuffer: 1024 * 1024 }
    );
    
    return result.trim() || '抱歉，我暂时无法回答您的问题。';
  }

  private detectScene(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('体检') || m.includes('报告') || m.includes('指标')) return 'report';
    if (
      m.includes('吃') ||
      m.includes('饮食') ||
      m.includes('食谱') ||
      m.includes('菜谱') ||
      m.includes('早餐') ||
      m.includes('早饭') ||
      m.includes('晚餐') ||
      m.includes('晚饭') ||
      m.includes('食材') ||
      m.includes('做菜') ||
      m.includes('什么菜') ||
      m.includes('做啥') ||
      m.includes('营养') ||
      m.includes('西红柿') ||
      m.includes('番茄') ||
      m.includes('鸡蛋')
    ) {
      return 'diet';
    }
    if (
      m.includes('运动') ||
      m.includes('健身') ||
      m.includes('跑步') ||
      m.includes('锻炼') ||
      m.includes('减肥') ||
      m.includes('视频') ||
      m.includes('跟练') ||
      m.includes('课程') ||
      m.includes('拉伸') ||
      m.includes('动作片段')
    ) return 'exercise';
    if (m.includes('心理') || m.includes('压力') || m.includes('情绪') || m.includes('焦虑')) return 'psychology';
    if (
      m.includes('睡眠') ||
      m.includes('失眠') ||
      m.includes('睡觉') ||
      m.includes('入睡') ||
      m.includes('睡不好') ||
      m.includes('睡不踏实') ||
      m.includes('早醒') ||
      m.includes('老醒') ||
      m.includes('犯困') ||
      m.includes('多梦')
    ) return 'sleep';
    if (m.includes('抗衰') || m.includes('美容') || m.includes('保养')) return 'antiaging';
    if (m.includes('同仁堂') || m.includes('品牌') || m.includes('历史')) return 'brand';
    if (
      m.includes('中医') ||
      m.includes('养生') ||
      m.includes('调理') ||
      m.includes('体质') ||
      m.includes('中药') ||
      m.includes('中成药') ||
      m.includes('三七') ||
      m.includes('丹参') ||
      m.includes('黄芪') ||
      m.includes('人参') ||
      m.includes('当归')
    )
      return 'tcm';
    if (
      m.includes('头疼') ||
      m.includes('头痛') ||
      m.includes('感冒') ||
      m.includes('咳嗽') ||
      m.includes('咳') ||
      m.includes('发烧') ||
      m.includes('发热') ||
      m.includes('腹痛') ||
      m.includes('肚子') ||
      m.includes('胃痛') ||
      m.includes('恶心') ||
      m.includes('呕吐') ||
      m.includes('腹泻') ||
      m.includes('拉肚子') ||
      m.includes('便秘') ||
      m.includes('疼') ||
      m.includes('痛') ||
      m.includes('不舒服') ||
      m.includes('高血压') ||
      m.includes('低血压') ||
      m.includes('糖尿病') ||
      m.includes('心脑血管') ||
      m.includes('冠心病') ||
      m.includes('脑卒中') ||
      m.includes('中风') ||
      m.includes('心悸') ||
      m.includes('心慌') ||
      m.includes('发慌') ||
      m.includes('胸闷') ||
      m.includes('胸口发闷') ||
      m.includes('血脂') ||
      m.includes('甘油三酯') ||
      m.includes('口腔溃疡') ||
      m.includes('嘴里破') ||
      m.includes('嘴里烂')
    )
      return 'disease';
    return 'chat';
  }

  private isOutOfScope(message: string, scene: string): boolean {
    if (scene !== 'chat') return false;

    const trimmed = message.trim();
    if (!trimmed) return false;

    const m = trimmed.toLowerCase();

    if (this.isSmallTalk(m)) return false;
    if (this.looksLikeHealthQuestion(m)) return false;
    if (this.hasMedicalKnowledgeHit(trimmed)) return false;

    return true;
  }

  private hasMedicalKnowledgeHit(message: string): boolean {
    const trimmed = message.trim();
    if (!trimmed) return false;
    return questionsKnowledge.search(trimmed, 1).length > 0;
  }

  private shouldPreferWebSearch(message: string, scene: string): boolean {
    if (!webSearchService.isEnabled()) return false;

    const trimmed = message.trim();
    if (!trimmed) return false;

    const lower = trimmed.toLowerCase();
    if (this.isSmallTalk(lower)) return false;
    if (this.isCookingRecipeIntent(lower)) return false;
    if (this.isLifestyleRecommendationIntent(lower, scene)) return false;
    if (!this.looksLikeHealthQuestion(lower)) return false;
    if (scene === 'brand') return false;

    return !this.hasMedicalKnowledgeHit(trimmed);
  }

  private async tryAnswerWithWebSearch(message: string, profileContext: string): Promise<string | null> {
    if (!webSearchService.isEnabled()) return null;

    const results = await webSearchService.search(message, { maxResults: 5 });
    if (results.length === 0) return null;

    try {
      return this.useAI
        ? await this.callAI(message, profileContext, this.formatWebResultsForPrompt(results))
        : this.formatWebSearchAnswer(message, results);
    } catch (e) {
      console.warn('Web-answer AI failed, fallback to raw search results:', e);
      return this.formatWebSearchAnswer(message, results);
    }
  }

  private isSmallTalk(m: string): boolean {
    const phrases = [
      '你好',
      '您好',
      '早上好',
      '下午好',
      '晚上好',
      '在吗',
      'hi',
      'hello',
      '哈喽',
      '谢谢',
      '多谢',
      '谢了',
      'thanks',
      'thx',
      '你是谁',
      '你是什么',
      '你能做什么',
      '你可以做什么',
      '怎么用',
      '功能',
      '帮助',
      'help',
    ];
    return phrases.some((p) => m.includes(p));
  }

  private looksLikeHealthQuestion(m: string): boolean {
    const keywords = [
      '症状',
      '疼',
      '痛',
      '不舒服',
      '发烧',
      '发热',
      '咳',
      '咳嗽',
      '痰',
      '流鼻涕',
      '鼻塞',
      '嗓子',
      '咽',
      '喉',
      '头晕',
      '乏力',
      '疲劳',
      '恶心',
      '呕吐',
      '腹痛',
      '肚子',
      '胃',
      '腹泻',
      '拉肚子',
      '便秘',
      '过敏',
      '皮疹',
      '瘙痒',
      '失眠',
      '睡不着',
      '睡不好',
      '睡不踏实',
      '睡眠',
      '早醒',
      '老醒',
      '犯困',
      '多梦',
      '焦虑',
      '抑郁',
      '压力',
      '情绪',
      '饮食',
      '食谱',
      '营养',
      '运动',
      '健身',
      '减肥',
      '体检',
      '报告',
      '指标',
      '心脑血管',
      '冠心病',
      '脑卒中',
      '中风',
      '胸闷',
      '胸口发闷',
      '心悸',
      '心慌',
      '动脉硬化',
      '高血脂',
      '甘油三酯',
      '高尿酸',
      '血压',
      '血糖',
      '尿酸',
      '胆固醇',
      '心率',
      '用药',
      '药',
      '副作用',
      '禁忌',
      '剂量',
      '处方',
      '中医',
      '中药',
      '中成药',
      '草药',
      '药材',
      '三七',
      '丹参',
      '黄芪',
      '人参',
      '当归',
      '养生',
      '体质',
      '调理',
      '同仁堂',
    ];
    return keywords.some((k) => m.includes(k));
  }

  private getOutOfScopeResponse(): string {
    return '很抱歉，这类问题我无法回答。';
  }

  private getMissingKnowledgeResponse(searchAttempted: boolean): string {
    if (searchAttempted) {
      return `这个问题在当前医疗知识库里没有直接命中，我已尝试联网检索，但暂时没有拿到足够可靠的结果。

为了避免误导，我先不给出武断结论。你可以换一种更具体的问法，或补充症状、用药、检查指标等信息；如果涉及疾病判断或用药决策，建议咨询医生或药师。

仅供参考，如有不适请就医。`;
    }

    return `这个问题在当前医疗知识库里没有直接命中，而当前联网检索暂时不可用。

为了避免误导，我先不给出泛化建议。你可以稍后再试，或补充更具体的信息；如果涉及疾病判断或用药决策，建议咨询医生或药师。

仅供参考，如有不适请就医。`;
  }

  private getFallbackResponse(message: string, scene: string): string {
    const m = message.toLowerCase();
    if (m.includes('你好') || m.includes('hi') || m.includes('hello')) {
      return '您好！我是同仁堂AI健康助手，有什么健康问题可以问我～';
    }
    if (m.includes('谢谢')) return '不客气！有问题随时问我～';

    if (scene === 'diet' && this.isCookingRecipeIntent(m)) {
      return this.getCookingIntentFallback(message);
    }

    if (scene === 'diet' && /(误区|误解|陷阱|雷区|错误做法)/.test(m)) {
      return `关于“健康饮食误区”，临床上最常见的是这几类：

【常见误区】
- **误区1：只看“吃得少”不看“吃得对”**  
  长期极低热量、只吃水果/代餐，容易掉肌肉、反弹快。
- **误区2：把“无糖”当“低热量”**  
  无糖饮料/零食可能仍含较高脂肪或总能量，仍需看营养成分表。
- **误区3：主食吃得越少越好**  
  过度限碳会影响饱腹和稳定性，建议优先“粗细搭配”而不是“完全不吃”。
- **误区4：重口味靠“感觉清淡”判断**  
  外卖、酱料、腌制食品往往隐形高盐高油，高血压/水肿人群尤其要控制。
- **误区5：只在工作日控制，周末补偿性进食**  
  周期性暴食会拉高总热量和代谢波动。
- **误区6：不结合体检指标做个体化调整**  
  有血糖、血脂、尿酸、肝肾异常时，饮食策略应和普通减脂方案区分。

【更稳妥的执行方式】
- **餐盘法**：每餐优先做到“半盘蔬菜 + 四分之一优质蛋白 + 四分之一全谷/薯类”。
- **蛋白优先**：每餐保证鸡蛋、鱼虾、豆制品、瘦肉之一，减少饥饿反扑。
- **控糖控盐落地**：先替换含糖饮料和高盐零食，再优化正餐，比一次性大改更能坚持。
- **用数据复盘**：每 2–4 周看一次体重、腰围、睡眠、体检指标趋势，再微调方案。

【建议线下就医/营养门诊评估的情况】
- 3 个月内体重异常波动明显，或伴乏力、心慌、月经紊乱；
- 有糖尿病、高血压、痛风、肾病、脂肪肝等慢病但饮食方案不明确；
- 已严格控制饮食仍长期胃肠不适、头晕或低血糖样症状。

仅供参考，如有不适请就医。`;
    }
    
    const responses: Record<string, string> = {
      diet: `如果你现在想把饮食调得更科学，建议按“先基础、再个性化”来做：

【先建立基础盘】
- **餐盘结构**：半盘蔬菜 + 四分之一优质蛋白 + 四分之一全谷/薯类。
- **进食节律**：三餐尽量定时，晚餐与睡眠间隔 2–3 小时。
- **饮品管理**：优先白水/淡茶，含糖饮料尽量控制在“偶尔喝”。

【再做重点优化】
- **控糖目标**：先减少精制甜食和夜宵，再优化主食粗细搭配比例。
- **控脂目标**：减少油炸和反复煎炒，优先蒸煮炖；关注烹调油总量。
- **控压目标**：减少高盐调味和腌制食品，外卖尽量备注“少盐少油”。

【让方案更精准，你可以补充】
- 身高体重/腰围、最近体检异常项（如血糖血脂尿酸）；
- 作息和活动量、是否有慢病及长期用药。

仅供参考，如有不适请就医。`,
      exercise: `运动建议更有效的做法是“强度合适 + 能坚持”：\n\n- **频率**：每周 3–5 次为宜，每次 20–40 分钟。\n- **强度**：以“微喘但还能说完整句子”为参考（中等强度）。\n- **组合**：有氧（快走/慢跑/骑行）+ 力量（深蹲、俯卧撑、弹力带）+ 拉伸（肩颈/髋部）。\n- **酸痛处理**：运动后轻度酸痛正常，优先热身拉伸、补水与睡眠；持续疼痛或关节痛要及时休息并就医。`,
      psychology: `压力大时，可以先用“可执行”的方式把节奏拉回：\n\n- **先降生理唤醒**：4 秒吸气 + 6 秒呼气，做 2–3 分钟。\n- **拆任务**：把要做的事写下来，只选“下一步最小动作”。\n- **动一动**：快走 10 分钟、晒太阳、拉伸肩颈，往往比硬扛更有效。\n- **需要帮助就求助**：如果持续影响睡眠/食欲/情绪，建议尽早找专业人士支持。`,
      sleep: `想睡得更稳，优先把“入睡条件”做对：\n\n- **固定起床时间**：比固定入睡时间更重要。\n- **睡前 1 小时减刺激**：少刷屏、少剧烈运动、少争吵/工作。\n- **咖啡因与酒精**：下午后尽量不喝咖啡/浓茶；酒精会让睡眠更浅。\n- **睡不着的处理**：躺 20 分钟仍清醒就起床做放松的事，困了再回床。`,
      antiaging: `抗衰的核心是长期习惯（先做最有效的 3 件事）：\n\n- **睡眠**：尽量保证规律作息与足够时长。\n- **运动**：力量训练 + 有氧，优先“每周能坚持”。\n- **饮食**：蛋白质足量、蔬果多样、少精制糖。\n\n如果你说下年龄段与目标（皮肤/体能/体重/指标），我可以把建议做得更具体。`,
      brand: `北京同仁堂创建于 1669 年，是著名中医药老字号，秉承“同修仁德，济世养生”的理念。\n\n如果你想了解某个产品/经典方、或同仁堂历史故事，我可以按你关心的方向展开。`,
      report: `我可以帮你看体检报告：\n\n- 先把**异常指标**置顶解释（可能原因 + 需要排除什么）。\n- 再给**可执行**的生活方式建议（饮食/运动/睡眠）。\n- 如果你告诉我年龄、性别、既往史与用药，我能更准确地解读。\n\n你可以先上传 PDF/图片，我会逐项说明。`,
      tcm: `中医养生强调“治未病”，常见思路包括：\n\n- **辨体质**（气虚/湿热/阴虚等）\n- **调作息**（起居有常、饮食有节）\n- **动静结合**（八段锦、太极、快走）\n\n如果你说下主要困扰（例如乏力、上火、胃胀、睡不好），我可以按体质思路给建议。`,
      disease: `有不适症状建议及时就医（尤其是胸痛、呼吸困难、高热不退等）。\n\n日常自我管理上，你可以告诉我：症状持续多久、严重程度、诱因、既往史与用药，我会给更具体的生活方式与就医建议。`,
      chat: '您好！我是同仁堂AI健康助手，有什么健康问题可以问我～',
    };
    return responses[scene] || responses.chat;
  }

  private shouldTriggerWebSearch(message: string, response: string, scene: string): boolean {
    if (!webSearchService.isEnabled()) return false;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return false;

    const m = trimmedMessage.toLowerCase();
    if (m.includes('你好') || m.includes('hi') || m.includes('hello')) return false;
    if (m.includes('谢谢')) return false;
    if (this.isCookingRecipeIntent(m)) return false;

    const trimmedResponse = response.trim();
    if (!trimmedResponse) return true;

    const uncertainPhrases = [
      '抱歉，我暂时无法回答',
      '暂时无法回答',
      '无法回答',
      '我不知道',
      '不太确定',
      '不确定',
      '不清楚',
    ];
    if (uncertainPhrases.some((p) => trimmedResponse.includes(p))) return true;

    if (this.looksLikeHealthQuestion(m) && !this.hasMedicalKnowledgeHit(trimmedMessage)) return true;

    const fallback = this.getFallbackResponse(trimmedMessage, scene).trim();
    if (trimmedResponse === fallback) return true;

    if (trimmedMessage.length >= 10 && trimmedResponse.length < 30) return true;

    return false;
  }

  private isCookingRecipeIntent(message: string): boolean {
    const m = String(message || '').toLowerCase();
    if (!m.trim()) return false;

    const cookingKeywords = [
      '做什么菜',
      '做啥菜',
      '做哪些菜',
      '可以做什么',
      '可以做啥',
      '能做什么',
      '能做啥',
      '怎么做',
      '怎么吃',
      '菜谱',
      '食谱',
    ];
    const pantryContextKeywords = [
      '冰箱',
      '我有',
      '家里有',
      '手头有',
      '现有食材',
      '目前有',
      '剩了',
      '剩下',
      '还有这些食材',
    ];

    const hasCookingKeyword = cookingKeywords.some((keyword) => m.includes(keyword));
    if (!hasCookingKeyword) return false;

    return pantryContextKeywords.some((keyword) => m.includes(keyword));
  }

  private isLifestyleRecommendationIntent(message: string, scene: string): boolean {
    const m = String(message || '').toLowerCase();
    if (!m.trim()) return false;

    const recommendationKeywords = [
      '推荐',
      '食谱',
      '菜谱',
      '早餐',
      '早饭',
      '晚餐',
      '晚饭',
      '视频',
      '跟练',
      '课程',
      '运动',
      '锻炼',
    ];
    if (!recommendationKeywords.some((keyword) => m.includes(keyword))) {
      return false;
    }

    return ['diet', 'exercise', 'report', 'sleep', 'psychology', 'antiaging'].includes(scene);
  }

  private shouldUseRecommendationFallbackResponse(
    message: string,
    scene: string,
    response: string,
    contents: unknown[]
  ): boolean {
    if (!Array.isArray(contents) || contents.length === 0) return false;
    if (!this.isLifestyleRecommendationIntent(message, scene)) return false;

    const text = String(response || '').trim();
    if (!text) return true;
    return text.includes('这个问题在当前医疗知识库里没有直接命中');
  }

  private getRecommendationFallbackResponse(scene: string): string {
    const responses: Record<string, string> = {
      diet: '我先按你的目标筛了几条更贴近的饮食推荐，优先看卡片里的时长、热量和标签；如果你补充口味、食材或体检指标，我可以继续细化到更具体的搭配。',
      exercise: '我先按你的需求筛了几条更贴近的跟练内容，优先看强度、时长和标签；如果你告诉我疼痛部位、可用时间或运动基础，我可以继续缩小范围。',
      report: '我先结合你最近一次体检报告和当前问题，筛了几条更相关的食谱与运动建议；如果你告诉我最关心的异常项，我可以继续按指标逐条解释。',
      sleep: '我先按你的睡眠目标筛了几条更贴近的建议，你可以先看卡片里的标签和标题；如果你补充入睡困难、早醒还是多梦，我可以继续细化。',
      psychology: '我先按你的当前困扰筛了几条更贴近的建议，你可以先看卡片里的标签和标题；如果你补充持续时长和影响程度，我可以继续细化。',
      antiaging: '我先按你的当前目标筛了几条更贴近的建议，你可以先看卡片里的标签和标题；如果你补充年龄段和重点诉求，我可以继续细化。',
    };
    return responses[scene] || '我先按你的当前需求筛了几条更贴近的建议，你可以先看卡片里的标签和标题；如果你补充更多背景，我可以继续细化。';
  }

  private getCookingIntentFallback(message: string): string {
    const ingredients = extractIngredientsFromMessage(message);
    if (ingredients.length === 0) {
      return `可以按你手头食材来配菜。你再告诉我现在有哪些食材（例如：鸡蛋、豆腐、青椒、番茄、肉片），我马上给你“现在就能做”的菜名和做法步骤。`;
    }

    const owned = ingredients.join('、');
    return `你现在有「${owned}」。我可以按现有食材给你配菜。\n\n先给你 3 个常用方向：\n1. 家常快炒：${owned} + 蒜姜\n2. 蛋类搭配：${owned} + 鸡蛋\n3. 肉类搭配：${owned} + 肉片\n\n你再补充一下还有哪些食材和口味偏好（清淡/下饭/减脂），我马上给你具体菜名和步骤。`;
  }

  private formatWebResultsForPrompt(results: WebSearchResult[]): string {
    const top = results.slice(0, 5);
    const formatted = top
      .map((r, i) => {
        const snippet = r.snippet ? `摘要：${r.snippet}` : '';
        return `(${i + 1}) ${r.title}\n${snippet}\n来源：${r.url}`.trim();
      })
      .join('\n\n');

    return `【联网搜索结果】\n${formatted}\n\n【回答要求】\n1. 优先基于以上资料回答，不要编造。\n2. 用中文，结构清晰，尽量贴近当前对话风格。\n3. 如为健康相关内容：保持谨慎，给出就医/急症提示，并在结尾加“仅供参考，如有不适请就医”。\n4. 结尾给出【参考来源】列出你使用到的链接（3-5条即可）。`;
  }

  private formatWebSearchAnswer(message: string, results: WebSearchResult[]): string {
    const top = results.slice(0, 5);
    const sources = top.map((r) => `- ${r.title}：${r.url}`).join('\n');
    const snippets = top
      .map((r, i) => {
        const snippet = r.snippet ? r.snippet.trim() : '';
        return snippet ? `${i + 1}. ${snippet}` : '';
      })
      .filter(Boolean)
      .join('\n');

    return `我刚刚为你做了联网搜索，并整理了要点（供参考）：\n\n【要点】\n${snippets || '（搜索结果未返回摘要）'}\n\n【参考来源】\n${sources}\n\n如果你希望我进一步整理成更完整的答案，请告诉我：你的具体场景/关注点；如果是健康问题，也请补充年龄/性别、症状持续多久、是否伴随发热/疼痛等。\n\n（以上为公开网页检索整理，可能存在滞后/不准确；健康问题仅供参考，如有不适请就医。）`;
  }
}

export const opencodeAgent = new OpencodeAgentService();
