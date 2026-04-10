import * as fs from 'fs';
import * as path from 'path';

interface KnowledgeEntry {
  file: string;
  title: string;
  content: string;
  keywords: string[];
}

const QUERY_STOP_PHRASES = [
  '怎么办',
  '咋办',
  '怎么缓解',
  '如何缓解',
  '怎么调理',
  '如何调理',
  '怎么处理',
  '怎么改善',
  '要注意什么',
  '需要注意什么',
  '应该注意什么',
  '怎么回事',
  '什么原因',
  '是什么原因',
  '是什么情况',
  '严重吗',
  '会传染吗',
  '多久能好',
  '挂什么科',
  '看什么科',
  '吃什么药',
  '用什么药',
  '能自愈吗',
  '能好吗',
  '会好吗',
  '怎么预防',
  '犯了',
];

const SYNONYM_MAP: Record<string, string[]> = {
  '发热': ['发烧', '发烧了', '高烧', '低烧'],
  '小儿': ['孩子', '儿童', '幼儿', '婴儿', '宝宝'],
  '感冒': ['感冒了', '风寒', '风热'],
  '咳嗽': ['咳嗽了', '咳痰'],
  '腹泻': ['拉肚子', '拉稀'],
  '便秘': ['便秘了', '排便困难'],
  '失眠': ['睡不着', '入睡困难', '失眠了', '晚上老是睡不着', '翻来覆去睡不着', '半夜老醒'],
  '头痛': ['头疼', '头疼了'],
  '胃痛': ['胃疼', '胃不舒服', '胃里难受', '胃一阵一阵疼'],
  '腹痛': ['肚子疼', '肚子痛'],
  '腰痛': ['腰疼', '腰椎', '腰酸', '腰酸背痛', '坐久了腰酸背痛'],
  '颈椎病': ['肩颈酸痛', '肩颈疼', '肩颈痛', '肩颈僵硬', '肩颈不舒服', '脖子酸痛', '脖子僵硬', '脖子特别僵', '肩膀酸', '肩膀酸痛', '肩颈劳损'],
  '肩周炎': ['肩膀疼', '肩膀痛', '肩膀抬不起来', '肩膀活动受限'],
  '鼻塞': ['鼻子堵', '鼻子不通气', '鼻子塞', '鼻子堵得难受', '鼻子堵得睡不着'],
  '流涕': ['流鼻涕', '流清涕', '流脓涕', '流鼻水'],
  '打喷嚏': ['老打喷嚏'],
  '鼻痒': ['鼻子痒'],
  '喉咙痛': ['嗓子疼', '嗓子痛', '喉咙像刀割', '咽口水疼', '吞口水疼'],
  '反酸': ['烧心', '胃里反酸', '心口烧', '胃里烧得慌'],
  '胸闷': ['胸口闷', '胸口发闷'],
  '心悸': ['心里发慌', '心跳快', '心跳乱'],
  '久坐': ['坐久了', '坐太久', '久坐了'],
  '口腔溃疡': ['嘴里破了', '嘴巴里面烂了'],
  '痛经': ['来姨妈肚子疼', '来月经肚子疼'],
  '痤疮': ['痘痘', '青春痘', '脸上长痘'],
  '结膜炎': ['红眼病', '眼睛又红又痒', '眼睛红得难受'],
  '关节痛': ['关节疼', '关节炎'],
  '高血压': ['血压高', '血压偏高'],
  '糖尿病': ['血糖高', '血糖偏高'],
  '心脏病': ['心脏不好', '冠心病'],
  '皮肤病': ['皮肤问题', '皮炎'],
  '过敏': ['过敏了', '过敏性'],
  '月经': ['月经不调', '经期'],
  '更年期': ['绝经期', '围绝经期'],
  '抑郁': ['抑郁症', '抑郁了', '情绪低落'],
  '焦虑': ['焦虑症', '焦虑了', '紧张'],
};

const COMMON_TERMS = [
  '胃炎', '溃疡', '腹泻', '便秘', '感冒', '咳嗽', '发热', '发烧', '头痛', '失眠',
  '高血压', '糖尿病', '心脏病', '中风', '癌症', '肿瘤', '炎症', '感染',
  '疼痛', '酸痛', '过敏', '皮炎', '湿疹', '哮喘', '肺炎', '肝炎', '肾炎',
  '肩颈', '肩膀', '脖子', '颈部', '颈椎', '颈椎病', '肩周炎', '腰椎', '关节炎', '风湿', '痛风', '贫血', '甲亢', '甲减',
  '抑郁', '焦虑', '神经衰弱', '更年期', '月经', '不孕',
  '前列腺', '阳痿', '早泄', '肾病', '尿路感染', '结石', '胆囊',
  '胃痛', '反酸', '烧心', '腹痛', '胸痛', '胸闷', '心悸', '腰痛', '腰疼', '腰酸', '腿痛', '关节痛', '牙痛',
  '痔疮', '肛裂', '口腔溃疡', '咽炎', '喉咙痛', '鼻炎', '鼻塞', '流涕', '流鼻涕', '打喷嚏', '鼻痒', '中耳炎',
  '近视', '白内障', '青光眼', '结膜炎', '角膜炎',
  '痤疮', '银屑病', '白癜风', '脱发', '白发', '痛经',
  '肥胖', '减肥', '增重', '营养', '维生素', '钙', '铁', '锌',
  '小儿', '孕妇', '老人', '婴儿', '幼儿', '青少年',
  '养生', '保健', '预防', '调理', '久坐',
];

const CONCEPT_HINTS: Record<string, string[]> = {
  'neck_shoulder': ['肩颈', '肩膀', '脖子', '颈椎', '颈部', '肩周'],
  'waist': ['腰痛', '腰酸', '腰椎', '腰部'],
  'urinary': ['小便', '尿频', '尿急', '尿痛', '前列腺', '会阴'],
  'anus': ['肛门', '痔疮', '肛裂', '便血'],
  'nose': ['鼻炎', '鼻塞', '流涕', '打喷嚏', '鼻痒'],
  'throat': ['喉咙', '嗓子', '咽炎', '咽痛', '扁桃体'],
  'eye': ['眼睛', '结膜炎', '视力', '红眼病'],
  'stomach': ['胃痛', '胃炎', '反酸', '烧心'],
  'sleep': ['失眠', '睡不着', '早醒', '入睡困难'],
  'mental': ['焦虑', '抑郁', '心慌', '紧张', '情绪低落'],
};

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[，,。！？?；;：:\s、（）()【】\[\]“”"'`~!@#$%^&*+=|\\/<>-]/g, '')
    .trim();
}

function canUseReverseContainment(term: string, keyword: string): boolean {
  return keyword.length >= 3 && term.length - keyword.length <= 3;
}

function extractConcepts(text: string): string[] {
  const normalized = normalizeForMatch(text);
  return Object.entries(CONCEPT_HINTS)
    .filter(([, hints]) => hints.some((hint) => normalized.includes(normalizeForMatch(hint))))
    .map(([concept]) => concept);
}

function matchesConcept(text: string, concept: string): boolean {
  const normalized = normalizeForMatch(text);
  const hints = CONCEPT_HINTS[concept] || [];
  return hints.some((hint) => normalized.includes(normalizeForMatch(hint)));
}

export class QuestionsKnowledgeService {
  private entries: KnowledgeEntry[] = [];
  private loaded = false;
  private questionsDir: string;

  constructor() {
    this.questionsDir = path.resolve(__dirname, '../../../questions');
  }

  private load(): void {
    if (this.loaded) return;
    
    try {
      const files = fs.readdirSync(this.questionsDir).filter(f => f.endsWith('.md'));
      
      for (const file of files) {
        const filePath = path.join(this.questionsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileTitle = file.replace('.md', '');
        const sections = this.splitSections(content);

        if (sections.length === 0) {
          this.entries.push({
            file,
            title: fileTitle,
            content,
            keywords: this.extractKeywords(fileTitle, content),
          });
          continue;
        }

        sections.forEach((section) => {
          this.entries.push({
            file,
            title: section.title,
            content: section.content,
            keywords: this.extractKeywords(section.title, section.content),
          });
        });
      }
      
      this.loaded = true;
      console.log(`✅ 已加载 ${this.entries.length} 条知识库条目`);
    } catch (e) {
      console.error('加载知识库失败:', e);
    }
  }

  private splitSections(content: string): Array<{ title: string; content: string }> {
    const lines = content.split('\n');
    const sections: Array<{ title: string; content: string }> = [];
    let currentTitle = '';
    let currentContent: string[] = [];

    lines.forEach((line) => {
      const match = line.match(/^##(?!#)\s*(\d+\.\s*)?(.+)$/);
      if (match) {
        if (currentTitle) {
          sections.push({
            title: currentTitle,
            content: currentContent.join('\n').trim(),
          });
        }
        currentTitle = match[2].trim();
        currentContent = [line];
        return;
      }

      if (currentTitle) {
        currentContent.push(line);
      }
    });

    if (currentTitle) {
      sections.push({
        title: currentTitle,
        content: currentContent.join('\n').trim(),
      });
    }

    return sections;
  }

  private extractKeywords(title: string, content: string): string[] {
    const keywords: Set<string> = new Set();
    
    keywords.add(title);
    
    const diseaseNames = content.match(/^##(?!#)\s*\d+\.\s*(.+)$/gm) || [];
    diseaseNames.forEach(d => {
      const name = d.replace(/^##\s*\d+\.\s*/, '').trim();
      keywords.add(name);
    });

    COMMON_TERMS.forEach(term => {
      if (content.includes(term)) {
        keywords.add(term);
        if (SYNONYM_MAP[term]) {
          SYNONYM_MAP[term].forEach(syn => keywords.add(syn));
        }
      }
    });

    Object.keys(SYNONYM_MAP).forEach(term => {
      if (content.includes(term)) {
        SYNONYM_MAP[term].forEach(syn => keywords.add(syn));
      }
    });
    
    return Array.from(keywords);
  }

  private extractQueryTerms(query: string): string[] {
    const raw = query.toLowerCase().trim();
    const compact = normalizeForMatch(raw);
    const variants = new Set<string>();

    if (raw) variants.add(raw);
    if (compact) variants.add(compact);

    let stripped = compact;
    QUERY_STOP_PHRASES.forEach((phrase) => {
      stripped = stripped.replace(new RegExp(normalizeForMatch(phrase), 'g'), '');
    });
    if (stripped) variants.add(stripped);

    COMMON_TERMS.forEach((term) => {
      const normalizedTerm = normalizeForMatch(term);
      if (normalizedTerm && compact.includes(normalizedTerm)) {
        variants.add(term.toLowerCase());
        variants.add(normalizedTerm);
      }
    });

    Object.entries(SYNONYM_MAP).forEach(([canonical, synonyms]) => {
      const normalizedCanonical = normalizeForMatch(canonical);
      if (normalizedCanonical && compact.includes(normalizedCanonical)) {
        variants.add(canonical.toLowerCase());
        variants.add(normalizedCanonical);
      }

      synonyms.forEach((synonym) => {
        const normalizedSynonym = normalizeForMatch(synonym);
        if (normalizedSynonym && compact.includes(normalizedSynonym)) {
          variants.add(canonical.toLowerCase());
          variants.add(normalizedCanonical);
          variants.add(synonym.toLowerCase());
          variants.add(normalizedSynonym);
        }
      });
    });

    return Array.from(variants).filter(Boolean);
  }

  search(query: string, maxResults: number = 3): KnowledgeEntry[] {
    this.load();
    
    const queryTerms = this.extractQueryTerms(query);
    const normalizedQuery = normalizeForMatch(query);
    const queryConcepts = extractConcepts(query);
    
    const scored = this.entries.map(entry => {
      let score = 0;
      const matchedTerms = new Set<string>();
      const normalizedTitle = normalizeForMatch(entry.title);
      const normalizedContent = normalizeForMatch(entry.content);

      if (normalizedQuery) {
        if (normalizedTitle.includes(normalizedQuery)) {
          score += 30;
        }
        if (normalizedContent.includes(normalizedQuery)) {
          score += 12;
        }
      }
      
      queryTerms.forEach(term => {
        if (entry.title.toLowerCase().includes(term)) {
          score += 20;
          matchedTerms.add(term);
        }
        
        entry.keywords.forEach(kw => {
          const kwLower = kw.toLowerCase();
          if (kw === term || kwLower === term) {
            score += 15;
            matchedTerms.add(term);
          } else if (kwLower.includes(term)) {
            score += 5;
            matchedTerms.add(term);
          } else if (term.includes(kwLower) && canUseReverseContainment(term, kwLower)) {
            score += 5;
            matchedTerms.add(term);
          }
        });
        
        const contentLower = entry.content.toLowerCase();
        if (contentLower.includes(term)) {
          const matches = contentLower.split(term).length - 1;
          score += Math.min(matches, 10);
          matchedTerms.add(term);
        }
      });

      if (matchedTerms.size > 0) {
        score += matchedTerms.size * 3;
      }
      if (queryTerms.length > 1 && matchedTerms.size >= 2) {
        score += matchedTerms.size * 10;
      }

      queryConcepts.forEach((concept) => {
        const titleMatchesConcept = matchesConcept(entry.title, concept);
        const contentMatchesConcept = matchesConcept(entry.content, concept);

        if (titleMatchesConcept) {
          score += 28;
        } else if (contentMatchesConcept) {
          score += 10;
        } else {
          score -= 12;
        }
      });
      
      return { entry, score };
    });
    
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(s => s.entry);
  }

  getRelevantContext(query: string): string {
    const results = this.search(query, 2);
    
    if (results.length === 0) {
      return '';
    }
    
    const contextParts = results.map(entry => {
      const relevantSections = this.extractRelevantSections(entry.content, query);
      return `【${entry.title}】\n${relevantSections}`;
    });
    
    return `\n\n---\n**参考知识库内容**：\n${contextParts.join('\n\n')}\n---\n\n请基于以上知识库内容回答用户问题。`;
  }

  getDirectAnswer(query: string): string {
    const result = this.search(query, 1)[0];
    if (!result) {
      return '';
    }

    const sectionText = this.extractRelevantSections(result.content, query);
    const lines = sectionText
      .split('\n')
      .map((line) => line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
      .filter(Boolean)
      .filter((line) => !/^来源文件[:：]/.test(line))
      .slice(0, 8);

    const bulletLines = lines.map((line) => (line.startsWith('-') ? line : `- ${line}`)).join('\n');

    return `关于“${query}”，可以先参考这些要点：\n${bulletLines}\n\n如果症状持续不缓解、明显加重，或伴高热、呼吸困难、胸痛、意识改变等情况，请及时就医。\n\n仅供参考，如有不适请就医。`;
  }

  private extractRelevantSections(content: string, query: string): string {
    const sections: Array<{ title: string; content: string; score: number }> = [];
    
    const lines = content.split('\n');
    let currentTitle = '';
    let currentContent: string[] = [];
    let isFirst = true;
    
    for (const line of lines) {
      const match = line.match(/^##(?!#)\s*(\d+\.\s*)?(.+)$/);
      if (match) {
        if (!isFirst && currentTitle) {
          sections.push({ 
            title: currentTitle, 
            content: currentContent.join('\n'),
            score: 0 
          });
        }
        currentTitle = match[2].trim();
        currentContent = [line];
        isFirst = false;
      } else if (currentTitle) {
        currentContent.push(line);
      } else if (isFirst) {
        currentContent.push(line);
      }
    }
    
    if (currentTitle) {
      sections.push({ 
        title: currentTitle, 
        content: currentContent.join('\n'),
        score: 0 
      });
    }
    
    const queryTerms = this.extractQueryTerms(query);
    
    sections.forEach(section => {
      const sectionLower = section.content.toLowerCase();
      const titleLower = section.title.toLowerCase();
      let score = 0;
      
      queryTerms.forEach(term => {
        if (titleLower.includes(term)) {
          score += 10;
        }
        if (sectionLower.includes(term)) {
          score += sectionLower.split(term).length - 1;
        }
      });
      
      section.score = score;
    });
    
    const relevant = sections
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.content.trim());
    
    if (relevant.length === 0) {
      return content.slice(0, 800);
    }
    
    return relevant.join('\n\n');
  }

  getAllFiles(): string[] {
    this.load();
    return Array.from(new Set(this.entries.map(e => e.file)));
  }

  getEntryByTitle(title: string): KnowledgeEntry | undefined {
    this.load();
    return this.entries.find(e => e.title === title);
  }
}

export const questionsKnowledge = new QuestionsKnowledgeService();
