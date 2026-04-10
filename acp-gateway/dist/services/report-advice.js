"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNoAnomalyAdvice = buildNoAnomalyAdvice;
exports.buildAnomalyAdvice = buildAnomalyAdvice;
const DISCLAIMER = [
    '---',
    '> **重要提示**：以下信息仅供参考，不能替代专业医疗建议。如有健康问题或不适症状，请及时就医。',
].join('\n');
const severityLabel = (severity) => {
    if (severity === 'serious')
        return '重点关注';
    if (severity === 'abnormal')
        return '异常';
    if (severity === 'slight')
        return '轻度异常';
    return '正常';
};
const DEPT_RULES = [
    { match: /(体重指数|BMI|超重|肥胖|中心性肥胖|腰围)/i, dept: '体重管理门诊/营养科', followUp: '建议 1-3 个月复查体重、BMI、腰围，并结合血脂/血糖评估代谢风险。' },
    { match: /(甘油三酯|胆固醇|血脂|HDL|LDL)/i, dept: '心内科/内分泌科', followUp: '建议 1-3 个月复查血脂（TC、TG、HDL、LDL），同时评估饮食和运动执行情况。' },
    { match: /(血糖|糖化血红蛋白|HbA1c|GLU)/i, dept: '内分泌科', followUp: '建议 1-3 个月复查空腹血糖/糖化血红蛋白，并结合体重和饮食结构调整。' },
    { match: /(尿酸|痛风)/i, dept: '风湿免疫科/肾内科', followUp: '建议 1-3 个月复查尿酸及肾功能，日常注意饮水与低嘌呤饮食。' },
    { match: /(甲状腺)/i, dept: '内分泌科', followUp: '建议结合甲功、甲状腺抗体与超声分级，按医生建议随访复查。' },
    { match: /(乳腺)/i, dept: '乳腺外科/影像科', followUp: '建议结合超声分级（如 BI-RADS）与年龄风险因素，按医生建议复查或进一步检查。' },
    { match: /(宫颈|TCT|HPV)/i, dept: '妇科', followUp: '建议结合 HPV/TCT 结果与既往史，按妇科医生建议复查或进一步评估。' },
    { match: /(子宫|卵巢|盆腔|附件)/i, dept: '妇科', followUp: '建议结合症状和超声结论，按医生建议 3-6 个月复查妇科超声。' },
    { match: /(肺结节|磨玻璃)/i, dept: '呼吸科/胸外科', followUp: '建议结合 CT 报告大小、密度与随访建议，按医生指导定期复查。' },
    { match: /(胆囊|肝|胰)/i, dept: '肝胆外科/消化科', followUp: '建议结合腹痛、消化症状与超声结论，按医生建议复查超声或进一步评估。' },
    { match: /(肾结石|膀胱|前列腺|泌尿)/i, dept: '泌尿外科', followUp: '建议多饮水并结合症状复查泌尿系超声，必要时做结石成分与代谢评估。' },
    { match: /(心电图|T波|ST|早搏|阻滞|房颤|房扑)/i, dept: '心内科', followUp: '建议结合症状复查心电图，必要时完善动态心电图/超声心动图等检查。' },
    { match: /(骨量减少|骨质疏松)/i, dept: '骨科/内分泌科', followUp: '建议结合骨密度、维生素 D、钙等评估，按医生建议补充与随访。' },
    { match: /(屈光不正|近视|远视|散光)/i, dept: '眼科/视光中心', followUp: '建议完善验光与眼科检查，按医生建议配镜或随访。' },
];
const inferDeptAdvice = (indicator) => {
    const name = `${indicator.name || ''} ${indicator.value || ''}`;
    const hit = DEPT_RULES.find(rule => rule.match.test(name));
    return hit ? { dept: hit.dept, followUp: hit.followUp } : null;
};
const formatIndicatorLine = (indicator) => {
    const unit = indicator.unit ? ` ${indicator.unit}` : '';
    const range = indicator.referenceRange ? `（参考：${indicator.referenceRange}）` : '';
    return `${indicator.name}: ${indicator.value}${unit}${range}`;
};
function buildNoAnomalyAdvice() {
    return [
        '【总体评估】',
        '- 本次未检出明确异常/阳性结果，整体状况良好。建议继续保持并把健康管理做成“可持续的习惯”。',
        '',
        '【日常健康处方（4周执行版）】',
        '- 饮食：三餐规律，优先蔬菜、优质蛋白（鱼/蛋/奶/豆/瘦肉）、全谷物；少油少糖少酒，减少夜宵和含糖饮料。',
        '- 运动：每周累计 150 分钟中等强度有氧（快走/骑行/游泳等）+ 2 次力量训练（深蹲/推举/核心）。',
        '- 睡眠：尽量固定作息，目标 7-9 小时；睡前 1 小时减少屏幕刺激与咖啡因。',
        '- 压力与习惯：每天 10 分钟放松训练或散步；如吸烟/频繁饮酒，建议逐步减少并寻求专业支持。',
        '',
        '【复查建议】',
        '- 若无不适症状：建议每年体检一次；有家族史或慢病风险者可适当提前复查血脂、血糖、血压等。',
        '',
        DISCLAIMER,
    ].join('\n');
}
function buildAnomalyAdvice(anomalyItems) {
    const sorted = [...anomalyItems].sort((a, b) => {
        const rank = (s) => (s === 'serious' ? 3 : s === 'abnormal' ? 2 : s === 'slight' ? 1 : 0);
        return rank(b.severity) - rank(a.severity);
    });
    const headline = sorted.slice(0, 8).map(item => item.name).join('、');
    const severeCount = sorted.filter(i => i.severity === 'serious').length;
    const abnormalCount = sorted.filter(i => i.severity === 'abnormal').length;
    const slightCount = sorted.filter(i => i.severity === 'slight').length;
    const lines = [];
    lines.push('【总体评估】');
    lines.push(`- 本次检出 ${sorted.length} 项异常/阳性结果：${headline}${sorted.length > 8 ? ' 等' : ''}。`);
    lines.push(`- 严重度分布：重点关注 ${severeCount} 项，异常 ${abnormalCount} 项，轻度异常 ${slightCount} 项。`);
    lines.push('- 建议先处理“重点关注/异常”，再逐步改善轻度异常与生活方式风险因素。');
    lines.push('');
    lines.push('【逐项解读与建议】');
    sorted.forEach((item, index) => {
        const deptAdvice = inferDeptAdvice(item);
        const label = severityLabel(item.severity);
        const suggestion = item.suggestion ? item.suggestion.trim() : '';
        lines.push(`${index + 1}. ${item.name}（${label}）`);
        lines.push(`- 当前结果：${formatIndicatorLine(item)}`);
        if (suggestion) {
            lines.push(`- 解读与建议：${suggestion}`);
        }
        else {
            lines.push('- 解读与建议：建议结合既往体检、症状及医生意见综合评估，必要时复查确认。');
        }
        if (deptAdvice) {
            lines.push(`- 建议科室：${deptAdvice.dept}`);
            lines.push(`- 复查/进一步检查：${deptAdvice.followUp}`);
        }
        else {
            lines.push('- 复查/进一步检查：建议结合医生意见选择复查项目和时间。');
        }
    });
    lines.push('');
    lines.push('【生活方式处方（优先级从高到低）】');
    lines.push('- 饮食：减少油炸、肥肉、反式脂肪与含糖饮料；主食可用全谷物替换部分精米面；每餐保证蔬菜，蛋白质优先鱼/豆/蛋/奶。');
    lines.push('- 运动：从“每周 3 次、每次 30 分钟快走”开始，逐步提升到每周 150 分钟有氧 + 2 次力量训练；久坐每 1 小时起身活动 3-5 分钟。');
    lines.push('- 体重管理：若存在 BMI/腰围偏高，建议先以“每月减重 1-2kg 或腰围下降 1-2cm”为可执行目标。');
    lines.push('- 睡眠：保证 7-9 小时；打鼾严重、白天嗜睡者建议评估睡眠呼吸问题。');
    lines.push('- 烟酒：尽量不吸烟；饮酒越少越好，如需饮酒建议控制量并避免空腹饮酒。');
    lines.push('');
    lines.push('【需要尽快就医的情况（出现任一条请及时就诊/急诊）】');
    lines.push('- 胸痛胸闷、明显心悸、晕厥、活动后气促进行性加重。');
    lines.push('- 咳血、呼吸困难、持续高热不退。');
    lines.push('- 明显腹痛（尤其右上腹/腰腹痛）、血尿、排尿困难或剧烈绞痛。');
    lines.push('- 异常阴道出血、下腹持续疼痛明显加重。');
    lines.push('');
    lines.push(DISCLAIMER);
    return lines.join('\n');
}
//# sourceMappingURL=report-advice.js.map