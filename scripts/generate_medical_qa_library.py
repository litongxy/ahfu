from __future__ import annotations

import pathlib
import re
from typing import Iterable, List, Tuple

ROOT = pathlib.Path(__file__).resolve().parents[1]
QUESTIONS_DIR = ROOT / 'questions'
TARGET_TOTAL = 1000
FILES_COUNT = 5
PER_FILE = TARGET_TOTAL // FILES_COUNT
GENERATED_FILE_PREFIXES = ('医疗问答扩展库', '医疗口语问法扩展库')

PRIORITY_FILES = [
    '常见病症解决办法.md',
    '五官科疾病.md',
    '五官科疾病续.md',
    '呼吸系统疾病.md',
    '呼吸系统疾病续.md',
    '消化系统疾病.md',
    '消化系统疾病续.md',
    '心脑血管疾病.md',
    '心脑血管疾病续.md',
    '神经系统疾病.md',
    '神经系统疾病续.md',
    '骨骼肌肉疾病.md',
    '骨科疾病.md',
    '感染性疾病.md',
    '感染性疾病续.md',
    '内分泌代谢疾病.md',
    '内分泌系统疾病续.md',
    '泌尿生殖疾病.md',
    '泌尿系统疾病.md',
    '耳鼻喉科疾病.md',
    '眼科疾病.md',
    '皮肤疾病.md',
    '皮肤疾病续.md',
    '口腔科疾病.md',
    '精神心理疾病.md',
    '儿科疾病.md',
    '妇产科疾病.md',
    '男科疾病.md',
    '常见健康问题.md',
    '常见症状与体征.md',
    '常见症状自我判断.md',
    '常见慢性病管理.md',
    '慢性病管理续.md',
]

QUESTIONISH_RE = re.compile(r'(如何|怎么|怎么办|为什么|是否|能否|需不需要|要不要|什么时候|哪些|哪种|哪类|怎么看|怎么选)')
GENERAL_TOPIC_HINTS = [
    '体检', '报告', '指标', '检查', '手术', '服药', '抗生素', '医院', '就诊', '急诊', '复查',
    '医保', '康复', '预防', '维护', '管理', '生活方式', '远程医疗', '第二诊疗意见', '关怀',
    '看病', '沟通', '报销', '套餐', '准备', '急救', '营养', '用药', '检查适应症', '检查项目',
]

DISEASE_SUFFIXES = [
    '炎', '病', '症', '痛', '热', '咳嗽', '感染', '过敏', '溃疡', '哮喘', '肿瘤', '结石', '综合征',
    '中毒', '骨折', '扭伤', '癌', '异常', '障碍', '缺乏', '损伤', '侧弯', '增生', '突出', '失调',
]

SECTION_RE = re.compile(r'^##(?!#)\s*(?:\d+\.\s*)?(.+)$', re.M)


def normalize_title(title: str) -> str:
    return re.sub(r'[\s\-—_·•：:，,。！？?（）()【】\[\]“”"\']+', '', title).strip().lower()


def ordered_files() -> List[pathlib.Path]:
    all_files = {
        p.name: p
        for p in QUESTIONS_DIR.glob('*.md')
        if not any(p.name.startswith(prefix) for prefix in GENERATED_FILE_PREFIXES)
    }
    ordered: List[pathlib.Path] = []
    for name in PRIORITY_FILES:
        path = all_files.pop(name, None)
        if path is not None:
            ordered.append(path)
    ordered.extend(sorted(all_files.values(), key=lambda p: p.name))
    return ordered


def split_sections(text: str) -> Iterable[Tuple[str, str]]:
    matches = list(SECTION_RE.finditer(text))
    for index, match in enumerate(matches):
        title = match.group(1).strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if title and body:
            yield title, body


def classify_content(title: str, body: str) -> str:
    if '**症状**' in body and ('**解决办法**' in body or '**建议**' in body):
        return 'disease'
    if '**问题**' in body and ('**建议**' in body or '**要点**' in body):
        return 'general'
    if any(hint in title for hint in GENERAL_TOPIC_HINTS):
        return 'general'
    return 'disease'


def build_question(title: str, body: str) -> str:
    if QUESTIONISH_RE.search(title):
        return title
    kind = classify_content(title, body)
    if kind == 'general' or any(hint in title for hint in GENERAL_TOPIC_HINTS):
        return f'{title}要注意什么'
    if len(title) <= 8 or any(title.endswith(suffix) for suffix in DISEASE_SUFFIXES):
        return f'{title}犯了怎么办'
    return f'{title}怎么办'


def build_aliases(title: str, body: str) -> List[str]:
    kind = classify_content(title, body)
    if QUESTIONISH_RE.search(title):
        aliases = [title]
    elif kind == 'general' or any(hint in title for hint in GENERAL_TOPIC_HINTS):
        aliases = [
            f'{title}要注意什么',
            f'{title}应该怎么办',
            f'{title}需要关注什么',
            f'{title}怎么处理更合适',
        ]
    else:
        aliases = [
            f'{title}怎么办',
            f'{title}犯了怎么办',
            f'{title}怎么缓解',
            f'{title}需要注意什么',
            f'{title}日常怎么调理',
        ]
    deduped: List[str] = []
    seen = set()
    for alias in aliases:
        normalized = normalize_title(alias)
        if normalized and normalized not in seen:
            seen.add(normalized)
            deduped.append(alias)
    return deduped[:4]


def clean_body(body: str) -> str:
    lines = [line.rstrip() for line in body.splitlines()]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return '\n'.join(lines)


def build_entry(index: int, title: str, body: str, source_file: str) -> str:
    question = build_question(title, body)
    aliases = build_aliases(title, body)
    answer_body = clean_body(body)
    return f'''## {index}. {question}
**对应主题**：{title}
**关联问法**：{'；'.join(aliases)}
**来源文件**：{source_file}
{answer_body}

**补充提醒**：
- 如果症状持续不缓解、明显加重，或伴高热、呼吸困难、胸痛、意识改变、反复呕吐等情况，请及时就医。
- 如果涉及儿童、孕期、老年人、慢性病、过敏史或长期用药，建议结合医生或药师意见处理。
'''.rstrip()


def contains_any(text: str, keywords: List[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def build_chat_candidates(title: str, body: str) -> List[str]:
    haystack = f'{title}\n{body}'
    candidates: List[str] = []
    seen = set()

    def add(*phrases: str) -> None:
        for phrase in phrases:
            normalized = normalize_title(phrase)
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            candidates.append(phrase)

    if '高血压' in title:
        add('血压老是高怎么办', '血压反反复复降不下来怎么办')

    if '糖尿病' in title:
        add('血糖总是高怎么办', '饭后血糖老控制不好怎么办')

    if contains_any(title, ['焦虑', '焦虑症']):
        add('心里发慌老静不下来怎么办', '总紧张焦虑怎么办')

    if contains_any(title, ['抑郁', '抑郁症']):
        add('心里一直压得难受怎么办', '总是开心不起来怎么办')

    if contains_any(title, ['痛经']):
        add('来姨妈肚子疼得厉害怎么办', '每次来月经都疼怎么办')

    if contains_any(title, ['月经不调']):
        add('姨妈老不准怎么办', '月经总是不规律怎么办')

    if contains_any(title, ['痤疮', '青春痘']):
        add('脸上长痘老不好怎么办', '痘痘反反复复冒怎么办')

    if contains_any(title, ['口腔溃疡']):
        add('嘴里破了疼得吃不下怎么办', '嘴巴里面烂了怎么办')

    if contains_any(title, ['牙周炎', '牙髓炎', '牙痛']):
        add('牙疼得睡不着怎么办', '一碰牙就疼怎么办')

    if contains_any(title, ['胃食管反流', '反流性食管炎', '食管炎', '食管裂孔疝']):
        add('胃里反酸烧心怎么办', '胸口烧得慌老反酸怎么办')

    if contains_any(title, ['鼻炎', '过敏性鼻炎']) or (
        contains_any(haystack, ['鼻塞']) and contains_any(haystack, ['流涕', '流清涕', '打喷嚏', '鼻痒'])
    ):
        add('鼻子不通气老打喷嚏怎么办', '鼻子堵得难受还流鼻涕怎么办')

    if contains_any(haystack, ['鼻窦炎']) or (
        contains_any(haystack, ['鼻塞']) and contains_any(haystack, ['头痛', '嗅觉减退'])
    ):
        add('鼻子不通气还头疼怎么办', '鼻子堵得睡不着怎么办')

    if contains_any(title, ['咽炎', '扁桃体炎', '会厌炎', '喉炎']) or contains_any(haystack, ['咽痛', '喉咙痛']):
        add('喉咙像刀割一样疼怎么办', '嗓子疼咽口水都难受怎么办')

    if contains_any(haystack, ['胃炎', '胃痛', '消化不良', '上腹痛']):
        add('胃不舒服隐隐作痛怎么办', '吃完东西胃里难受怎么办')

    if contains_any(haystack, ['胸骨后']) and contains_any(haystack, ['反酸', '烧心']):
        add('胃里反酸烧心怎么办', '胸口烧得慌老反酸怎么办')

    if contains_any(haystack, ['腹泻', '拉稀']):
        add('一直拉肚子怎么办', '老跑厕所拉稀怎么办')

    if contains_any(haystack, ['便秘']):
        add('好几天拉不出来怎么办', '上厕所蹲很久还是拉不出来怎么办')

    if contains_any(haystack, ['失眠', '入睡困难', '早醒', '睡眠浅']):
        add('晚上翻来覆去睡不着怎么办', '半夜老醒睡不好怎么办')

    if contains_any(haystack, ['头痛', '偏头痛']) and contains_any(haystack, ['恶心', '呕吐']):
        add('头疼得厉害还想吐怎么办')
    elif contains_any(haystack, ['头痛', '偏头痛']):
        add('头疼得厉害怎么办', '头一阵一阵疼怎么办')

    if contains_any(haystack, ['发热', '发烧']):
        add('发烧一直退不下来怎么办', '烧得难受浑身没劲怎么办')

    if contains_any(haystack, ['咳嗽']):
        add('咳个不停怎么办', '一直咳嗽停不下来怎么办')

    if contains_any(haystack, ['胸闷']) and contains_any(haystack, ['心悸', '心慌']):
        add('胸口闷还心慌怎么办', '心跳快得发慌怎么办')

    if contains_any(haystack, ['颈椎病', '脖子痛', '颈痛', '肩颈']):
        add('脖子僵硬肩膀酸怎么办', '低头久了脖子特别僵怎么办')

    if contains_any(haystack, ['腰痛', '腰椎', '腰酸']):
        add('坐久了腰酸背痛怎么办', '腰疼还不敢使劲怎么办')

    if contains_any(haystack, ['尿频']) and contains_any(haystack, ['尿急', '尿痛']):
        add('老想上厕所还尿痛怎么办', '小便总不舒服怎么办')
    elif contains_any(haystack, ['尿频', '尿急', '尿痛']):
        add('总想上厕所怎么办', '小便不舒服怎么办')

    if contains_any(haystack, ['结膜炎', '红眼病', '眼红', '眼痒']):
        add('眼睛又红又痒怎么办', '眼睛红得难受还有分泌物怎么办')

    if contains_any(haystack, ['口腔溃疡']):
        add('嘴里破了疼得吃不下怎么办', '嘴巴里面烂了怎么办')

    if contains_any(haystack, ['牙痛', '牙周炎', '牙髓炎']):
        add('牙疼得睡不着怎么办', '一碰牙就疼怎么办')

    if contains_any(haystack, ['湿疹', '荨麻疹', '皮炎']) or (
        contains_any(haystack, ['皮疹']) and contains_any(haystack, ['瘙痒', '痒'])
    ):
        add('身上起疹子还特别痒怎么办', '皮肤一片一片痒怎么办')

    if contains_any(haystack, ['哮喘', '呼吸困难']):
        add('喘不上气怎么办', '一活动就喘得厉害怎么办')

    if contains_any(haystack, ['痛风', '高尿酸']):
        add('脚趾突然疼得厉害怎么办', '关节又红又肿还很疼怎么办')

    if contains_any(haystack, ['前列腺炎']):
        add('下面坠胀还小便不舒服怎么办', '会阴不舒服老想上厕所怎么办')

    if contains_any(haystack, ['痔疮']):
        add('上厕所肛门疼还出血怎么办', '痔疮犯了坐着都难受怎么办')

    if not candidates:
        kind = classify_content(title, body)
        if '体检' in title:
            add(f'想做{title}要注意什么', f'做{title}前需要准备什么')
        elif '手术' in title:
            add(f'做{title}前后要注意什么', f'{title}术后怎么照顾')
        elif '检查' in title:
            add(f'做{title}前要准备什么', f'{title}之前需要注意什么')
        elif kind == 'general':
            add(f'遇到{title}一般要注意什么', f'{title}这种情况该怎么处理')
        else:
            add(f'得了{title}该怎么办', f'{title}发作了怎么处理')

    return candidates


def build_chat_title_options(title: str, body: str) -> List[str]:
    options = build_chat_candidates(title, body)
    kind = classify_content(title, body)

    if '体检' in title:
        options.extend([f'想做{title}要注意什么', f'做{title}前需要准备什么'])
    elif '手术' in title:
        options.extend([f'做{title}前后要注意什么', f'{title}术后怎么照顾'])
    elif '检查' in title:
        options.extend([f'做{title}前要准备什么', f'{title}之前需要注意什么'])
    elif kind == 'general':
        options.extend([f'遇到{title}一般要注意什么', f'{title}这种情况该怎么处理'])
    else:
        options.extend([f'得了{title}该怎么办', f'{title}发作了怎么处理'])

    options.extend(build_aliases(title, body))

    deduped: List[str] = []
    seen = set()
    for option in options:
        normalized = normalize_title(option)
        if normalized and normalized not in seen:
            seen.add(normalized)
            deduped.append(option)
    return deduped


def build_chat_question(title: str, body: str) -> str:
    return build_chat_title_options(title, body)[0]


def build_chat_aliases(title: str, body: str, selected_question: str | None = None) -> List[str]:
    aliases = build_chat_title_options(title, body)
    if selected_question:
        selected_normalized = normalize_title(selected_question)
        aliases = [selected_question] + [
            alias for alias in aliases if normalize_title(alias) != selected_normalized
        ]
    deduped: List[str] = []
    seen = set()
    for alias in aliases:
        normalized = normalize_title(alias)
        if normalized and normalized not in seen:
            seen.add(normalized)
            deduped.append(alias)
    return deduped[:6]


def build_chat_entry(index: int, title: str, body: str, source_file: str, question: str | None = None) -> str:
    question = question or build_chat_question(title, body)
    aliases = build_chat_aliases(title, body, question)
    answer_body = clean_body(body)
    return f'''## {index}. {question}
**对应主题**：{title}
**关联问法**：{'；'.join(aliases)}
**来源文件**：{source_file}
{answer_body}

**补充提醒**：
- 如果症状持续不缓解、明显加重，或伴高热、呼吸困难、胸痛、意识改变、反复呕吐等情况，请及时就医。
- 如果涉及儿童、孕期、老年人、慢性病、过敏史或长期用药，建议结合医生或药师意见处理。
'''.rstrip()


def collect_topics(limit: int | None = None) -> List[Tuple[str, str, str]]:
    topics: List[Tuple[str, str, str]] = []
    seen = set()
    for path in ordered_files():
        text = path.read_text(encoding='utf-8')
        for title, body in split_sections(text):
            normalized = normalize_title(title)
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            topics.append((title, body, path.name))
            if limit is not None and len(topics) >= limit:
                return topics
    return topics


def write_files(entries: List[str], prefix: str, title_prefix: str, intro: str) -> None:
    for i in range(FILES_COUNT):
        start = i * PER_FILE
        end = start + PER_FILE
        chunk = entries[start:end]
        file_index = i + 1
        header = [
            f'# {title_prefix} {file_index:02d}',
            '',
            f'> {intro}',
            '',
        ]
        content = '\n\n'.join(header + chunk).rstrip() + '\n'
        target = QUESTIONS_DIR / f'{prefix}{file_index:02d}.md'
        target.write_text(content, encoding='utf-8')


def main() -> None:
    all_topics = collect_topics()
    if len(all_topics) < TARGET_TOTAL:
        raise RuntimeError(f'可用去重条目不足 {TARGET_TOTAL} 条，当前只有 {len(all_topics)} 条')

    standard_topics = all_topics[:TARGET_TOTAL]
    chat_topics: List[Tuple[str, str, str, str]] = []
    seen_chat_questions = set()
    for title, body, source in all_topics:
        chosen_question = ''
        for option in build_chat_title_options(title, body):
            normalized_option = normalize_title(option)
            if normalized_option and normalized_option not in seen_chat_questions:
                chosen_question = option
                break
        if not chosen_question:
            continue
        seen_chat_questions.add(normalize_title(chosen_question))
        chat_topics.append((title, body, source, chosen_question))
        if len(chat_topics) >= TARGET_TOTAL:
            break

    if len(chat_topics) < TARGET_TOTAL:
        raise RuntimeError(f'可用口语问法不足 {TARGET_TOTAL} 条，当前只有 {len(chat_topics)} 条')

    standard_entries = [
        build_entry(index + 1, title, body, source)
        for index, (title, body, source) in enumerate(standard_topics)
    ]
    chat_entries = [
        build_chat_entry(index + 1, title, body, source, question)
        for index, (title, body, source, question) in enumerate(chat_topics)
    ]
    write_files(
        standard_entries,
        prefix='医疗问答扩展库',
        title_prefix='医疗问答扩展库',
        intro='由现有 questions 知识库条目整理生成，重点补充“鼻炎犯了怎么办”这类自然问句形式，便于聊天检索直接命中。',
    )
    write_files(
        chat_entries,
        prefix='医疗口语问法扩展库',
        title_prefix='医疗口语问法扩展库',
        intro='由现有 questions 知识库条目整理生成，重点补充“喉咙像刀割一样疼怎么办”“胃里反酸烧心怎么办”这类口语聊天问法。',
    )
    print(f'generated_standard={len(standard_entries)} generated_chat={len(chat_entries)} files={FILES_COUNT * 2}')


if __name__ == '__main__':
    main()
