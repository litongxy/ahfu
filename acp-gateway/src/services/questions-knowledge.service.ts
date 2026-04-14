import * as fs from 'fs';
import * as path from 'path';

interface KnowledgeEntry {
  file: string;
  title: string;
  content: string;
  keywords: string[];
}

const QUERY_STOP_PHRASES = [
  '有哪些常见症状和处理建议',
  '有哪些常见症状',
  '有哪些常见表现',
  '常见表现有哪些',
  '常见症状有哪些',
  '有哪些表现',
  '该怎么预防和调理',
  '日常怎么控制',
  '日常怎么调理',
  '饮食要注意什么',
  '管理要注意什么',
  '一般要注意什么',
  '专项体检要注意什么',
  '体检要注意什么',
  '怎么降',
  '怎么控制',
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

const CORE_TOPIC_PREFIXES = [
  '最近总是',
  '最近老是',
  '最近一直',
  '最近',
  '总是',
  '老是',
  '一直',
  '经常',
  '得了',
  '遇到',
  '想做',
  '关于',
  '反复',
  '如果出现',
  '如果',
];
const CORE_TOPIC_SUFFIXES = [
  '有哪些常见症状和处理建议',
  '有哪些常见症状',
  '有哪些常见表现',
  '常见表现有哪些',
  '常见症状有哪些',
  '有哪些表现',
  '该怎么预防和调理',
  '日常怎么控制',
  '日常怎么调理',
  '饮食要注意什么',
  '管理要注意什么',
  '一般要注意什么',
  '专项体检要注意什么',
  '体检要注意什么',
  '怎么解读',
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
  '怎么办',
  '咋办',
  '怎么降',
  '怎么控制',
  '管理',
  '预防',
  '康复',
];

const SYNONYM_MAP: Record<string, string[]> = {
  '发热': ['发烧', '发烧了', '高烧', '低烧'],
  '小儿': ['孩子', '儿童', '幼儿', '婴儿', '宝宝'],
  '感冒': ['感冒了', '风寒', '风热'],
  '咳嗽': ['咳嗽了', '咳痰'],
  '腹泻': ['拉肚子', '拉稀'],
  '便秘': ['便秘了', '排便困难'],
  '失眠': ['睡不着', '入睡困难', '失眠了', '晚上老是睡不着', '翻来覆去睡不着', '半夜老醒', '睡不好', '最近总是睡不好', '老是睡不好', '总是睡不好', '睡得不好', '睡不踏实', '容易醒', '老醒'],
  '睡眠障碍': ['睡眠不好', '睡不好觉', '早醒', '多梦', '睡得浅'],
  '嗜睡': ['犯困', '老犯困', '总犯困', '白天犯困', '白天老犯困', '白天总犯困'],
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
  '胸闷': ['胸口闷', '胸口发闷', '胸闷得慌', '胸口堵得慌'],
  '心悸': ['心里发慌', '心跳快', '心跳乱', '心慌', '发慌', '心里慌', '心跳很快', '心跳快得慌'],
  '久坐': ['坐久了', '坐太久', '久坐了'],
  '口腔溃疡': ['嘴里破了', '嘴巴里面烂了', '嘴里烂了', '口腔破了'],
  '痛经': ['来姨妈肚子疼', '来月经肚子疼', '姨妈疼', '经期肚子疼'],
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
  '高血脂', '高脂血症', '高尿酸', '高尿酸血症', '脂肪肝',
  '疼痛', '酸痛', '过敏', '皮炎', '湿疹', '哮喘', '肺炎', '肝炎', '肾炎',
  '肩颈', '肩膀', '脖子', '颈部', '颈椎', '颈椎病', '肩周炎', '腰椎', '关节炎', '风湿', '痛风', '贫血', '甲亢', '甲减',
  '抑郁', '焦虑', '神经衰弱', '更年期', '月经', '不孕',
  '前列腺', '前列腺炎', '前列腺增生', '阳痿', '早泄', '肾病', '尿路感染', '结石', '胆囊',
  '脓毒症', '脓毒症综合征', '冠心病', '慢阻肺', '慢性肾脏病', '胃食管反流病',
  '胃痛', '反酸', '烧心', '腹痛', '胸痛', '胸闷', '心悸', '腰痛', '腰疼', '腰酸', '腿痛', '关节痛', '牙痛',
  '痔疮', '肛裂', '口腔溃疡', '咽炎', '喉咙痛', '鼻炎', '鼻塞', '流涕', '流鼻涕', '打喷嚏', '鼻痒', '中耳炎',
  '近视', '白内障', '青光眼', '结膜炎', '角膜炎',
  '痤疮', '银屑病', '白癜风', '脱发', '白发', '痛经',
  '失眠', '睡眠障碍', '嗜睡', '犯困',
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
  'sleep': ['失眠', '睡不着', '睡不好', '睡眠障碍', '早醒', '老醒', '入睡困难', '犯困', '多梦'],
  'mental': ['焦虑', '抑郁', '心慌', '紧张', '情绪低落'],
};

const KEYWORD_FIELD_LABELS = [
  '常见问法',
  '关联问法',
  '适用问题',
  '对应主题',
  '常见表现',
  '症状',
  '表现',
  '别名',
  '关键词',
  '核心词',
  '相关问题',
];

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[，,。！？?；;：:\s、（）()【】\[\]“”"'`~!@#$%^&*+=|\\/<>-]/g, '')
    .trim();
}

function stripPrefixes(value: string, prefixes: string[]): string {
  let current = value.trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      if (current.startsWith(prefix)) {
        current = current.slice(prefix.length).trim();
        changed = true;
      }
    }
  }

  return current;
}

function stripSuffixes(value: string, suffixes: string[]): string {
  let current = value.trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      if (current.endsWith(suffix)) {
        current = current.slice(0, -suffix.length).trim();
        changed = true;
      }
    }
  }

  return current;
}

function extractCoreTopic(text: string): string {
  let current = String(text || '')
    .trim()
    .replace(/^[#\-\d.\s]+/, '')
    .replace(/（续）|\(续\)/g, '')
    .replace(/[?？]+$/g, '')
    .trim();

  current = stripPrefixes(current, CORE_TOPIC_PREFIXES);
  current = stripSuffixes(current, CORE_TOPIC_SUFFIXES);

  return current.trim();
}

function extractMedicalAnchors(text: string): string[] {
  const rawText = String(text || '').trim();
  const normalized = normalizeForMatch(rawText);
  const anchors = new Set<string>();

  if (!normalized) {
    return [];
  }

  COMMON_TERMS.forEach((term) => {
    const normalizedTerm = normalizeForMatch(term);
    if (normalized.includes(normalizedTerm)) {
      anchors.add(term);
    }
  });

  Object.entries(SYNONYM_MAP).forEach(([canonical, synonyms]) => {
    const normalizedCanonical = normalizeForMatch(canonical);
    if (normalized.includes(normalizedCanonical)) {
      anchors.add(canonical);
    }

    synonyms.forEach((synonym) => {
      const normalizedSynonym = normalizeForMatch(synonym);
      if (normalized.includes(normalizedSynonym)) {
        anchors.add(canonical);
        anchors.add(synonym);
      }
    });
  });

  const diseaseMatches = rawText.match(/[\u4e00-\u9fa5A-Za-z()（）]{2,24}(?:高血压|高血脂|高脂血症|高尿酸血症|高尿酸|糖尿病|脂肪肝|冠心病|前列腺炎|前列腺增生|哮喘|慢阻肺|胃炎|鼻炎|咽炎|脓毒症综合征|脓毒症|综合征|心脏病|肾病|肺炎|结石|胃食管反流病|反流|痛风|甲亢|甲减|肝炎|肾炎|炎|病|症)/g) || [];
  diseaseMatches.forEach((match) => {
    anchors.add(stripPrefixes(match.trim(), CORE_TOPIC_PREFIXES));
  });

  return Array.from(anchors)
    .map((anchor) => anchor.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function isExpandedLibraryFile(file: string): boolean {
  return /医疗(?:口语问法|问答)扩展库/.test(file);
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
  private loadedSignature = '';
  private questionsDir: string;

  constructor() {
    this.questionsDir = path.resolve(__dirname, '../../../questions');
  }

  private buildDirectorySignature(): string {
    const files = fs.readdirSync(this.questionsDir).filter(f => f.endsWith('.md')).sort();
    return files.map((file) => {
      const stat = fs.statSync(path.join(this.questionsDir, file));
      return `${file}:${stat.size}:${stat.mtimeMs}`;
    }).join('|');
  }

  private load(): void {
    try {
      const nextSignature = this.buildDirectorySignature();
      if (nextSignature === this.loadedSignature && this.entries.length > 0) {
        return;
      }

      const files = fs.readdirSync(this.questionsDir).filter(f => f.endsWith('.md'));
      const nextEntries: KnowledgeEntry[] = [];

      for (const file of files) {
        const filePath = path.join(this.questionsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileTitle = file.replace('.md', '');
        const sections = this.splitSections(content);

        if (sections.length === 0) {
          nextEntries.push({
            file,
            title: fileTitle,
            content,
            keywords: this.extractKeywords(fileTitle, content),
          });
          continue;
        }

        sections.forEach((section) => {
          nextEntries.push({
            file,
            title: section.title,
            content: section.content,
            keywords: this.extractKeywords(section.title, section.content),
          });
        });
      }

      this.entries = nextEntries;
      this.loadedSignature = nextSignature;
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
    const titleCoreTopic = extractCoreTopic(title);
    if (titleCoreTopic) {
      keywords.add(titleCoreTopic);
    }
    
    const diseaseNames = content.match(/^##(?!#)\s*\d+\.\s*(.+)$/gm) || [];
    diseaseNames.forEach(d => {
      const name = d.replace(/^##\s*\d+\.\s*/, '').trim();
      keywords.add(name);
      const coreTopic = extractCoreTopic(name);
      if (coreTopic) {
        keywords.add(coreTopic);
      }
    });

    content.split('\n').forEach((line) => {
      const match = line.match(/^\*\*([^*]+)\*\*[：:](.+)$/);
      if (!match) {
        return;
      }

      const label = match[1].trim();
      if (!KEYWORD_FIELD_LABELS.includes(label)) {
        return;
      }

      match[2]
        .split(/[；;]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => {
          keywords.add(item);
          const coreTopic = extractCoreTopic(item);
          if (coreTopic) {
            keywords.add(coreTopic);
          }
        });
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
    const coreTopic = extractCoreTopic(query);
    const normalizedCoreTopic = normalizeForMatch(coreTopic);

    if (raw) variants.add(raw);
    if (compact) variants.add(compact);
    if (coreTopic) variants.add(coreTopic.toLowerCase());
    if (normalizedCoreTopic) variants.add(normalizedCoreTopic);

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

    extractMedicalAnchors(query).forEach((anchor) => {
      const normalizedAnchor = normalizeForMatch(anchor);
      variants.add(anchor.toLowerCase());
      if (normalizedAnchor) {
        variants.add(normalizedAnchor);
      }
    });

    return Array.from(variants).filter(Boolean);
  }

  search(query: string, maxResults: number = 3): KnowledgeEntry[] {
    this.load();
    
    const queryTerms = this.extractQueryTerms(query);
    const normalizedQuery = normalizeForMatch(query);
    const normalizedQueryCore = normalizeForMatch(extractCoreTopic(query));
    const queryAnchors = extractMedicalAnchors(query);
    const queryConcepts = extractConcepts(query);
    
    const scored = this.entries.map(entry => {
      let score = 0;
      let hasMeaningfulMatch = false;
      const matchedTerms = new Set<string>();
      const normalizedTitle = normalizeForMatch(entry.title);
      const normalizedTitleCore = normalizeForMatch(extractCoreTopic(entry.title));
      const normalizedContent = normalizeForMatch(entry.content);
      const expandedLibraryFile = isExpandedLibraryFile(entry.file);

      if (normalizedQuery) {
        if (normalizedTitle.includes(normalizedQuery)) {
          score += 30;
          hasMeaningfulMatch = true;
        }
        if (normalizedContent.includes(normalizedQuery)) {
          score += 12;
          hasMeaningfulMatch = true;
        }
      }

      if (normalizedQueryCore) {
        if (normalizedTitleCore === normalizedQueryCore) {
          score += 90;
          hasMeaningfulMatch = true;
        } else if (normalizedTitle === normalizedQueryCore) {
          score += 80;
          hasMeaningfulMatch = true;
        } else if (normalizedTitleCore.includes(normalizedQueryCore)) {
          score += 32;
          hasMeaningfulMatch = true;
        } else if (
          normalizedQueryCore.includes(normalizedTitleCore) &&
          normalizedTitleCore.length >= 2
        ) {
          score += 20;
          hasMeaningfulMatch = true;
        }
      }
      
      queryTerms.forEach(term => {
        if (entry.title.toLowerCase().includes(term)) {
          score += 20;
          hasMeaningfulMatch = true;
          matchedTerms.add(term);
        }
        
        entry.keywords.forEach(kw => {
          const kwLower = kw.toLowerCase();
          if (kw === term || kwLower === term) {
            score += 15;
            hasMeaningfulMatch = true;
            matchedTerms.add(term);
          } else if (kwLower.includes(term)) {
            score += 5;
            hasMeaningfulMatch = true;
            matchedTerms.add(term);
          } else if (term.includes(kwLower) && canUseReverseContainment(term, kwLower)) {
            score += 5;
            hasMeaningfulMatch = true;
            matchedTerms.add(term);
          }
        });
        
        const contentLower = entry.content.toLowerCase();
        if (contentLower.includes(term)) {
          const matches = contentLower.split(term).length - 1;
          score += Math.min(matches, 10);
          hasMeaningfulMatch = true;
          matchedTerms.add(term);
        }
      });

      queryAnchors.forEach((anchor) => {
        const normalizedAnchor = normalizeForMatch(anchor);
        if (!normalizedAnchor) {
          return;
        }

        if (normalizedTitleCore === normalizedAnchor) {
          score += 80;
          hasMeaningfulMatch = true;
          matchedTerms.add(anchor);
          return;
        }

        if (normalizedTitle === normalizedAnchor) {
          score += 60;
          hasMeaningfulMatch = true;
          matchedTerms.add(anchor);
          return;
        }

        if (normalizedTitleCore.includes(normalizedAnchor)) {
          score += 24;
          hasMeaningfulMatch = true;
          matchedTerms.add(anchor);
          return;
        }

        if (normalizedContent.includes(normalizedAnchor)) {
          score += 4;
          hasMeaningfulMatch = true;
          matchedTerms.add(anchor);
        }
      });

      if (matchedTerms.size > 0) {
        score += matchedTerms.size * 3;
      }
      if (queryTerms.length > 1 && matchedTerms.size >= 2) {
        score += matchedTerms.size * 10;
      }

      score += expandedLibraryFile ? -8 : 4;

      queryConcepts.forEach((concept) => {
        const titleMatchesConcept = matchesConcept(entry.title, concept);
        const contentMatchesConcept = matchesConcept(entry.content, concept);

        if (titleMatchesConcept) {
          score += 28;
          hasMeaningfulMatch = true;
        } else if (contentMatchesConcept) {
          score += 10;
          hasMeaningfulMatch = true;
        } else {
          score -= 12;
        }
      });
      
      return { entry, score, hasMeaningfulMatch };
    });
    
    return scored
      .filter(s => s.hasMeaningfulMatch && s.score > 0)
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
    const results = this.search(query, 5);
    const normalizedQueryCore = normalizeForMatch(extractCoreTopic(query));
    const result = results.find((entry) =>
      !isExpandedLibraryFile(entry.file) &&
      normalizedQueryCore &&
      normalizeForMatch(extractCoreTopic(entry.title)) === normalizedQueryCore
    ) || results.find((entry) => !isExpandedLibraryFile(entry.file)) || results[0];

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
