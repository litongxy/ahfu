"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URINE_INDICATORS = exports.BLOOD_INDICATORS = void 0;
exports.parseValue = parseValue;
exports.generateAnomalySuggestions = generateAnomalySuggestions;
const report_range_library_1 = require("./report-range-library");
exports.BLOOD_INDICATORS = report_range_library_1.BLOOD_RANGE_BASELINES;
exports.URINE_INDICATORS = report_range_library_1.URINE_RANGE_BASELINES;
function parseValue(valueStr, normalRange) {
    const cleanValue = valueStr.replace(/[↑↓⇅]/g, '').trim();
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) {
        if (normalRange === '阴性' || normalRange === '正常') {
            const normalizedText = cleanValue.toLowerCase();
            const isNormalText = /^(阴性|正常|未见|neg|negative|-)$/.test(normalizedText);
            const isSlightPositive = /^(±|trace|tr|微量|\+|1\+|弱阳性)$/.test(normalizedText);
            const isPositive = /^(阳性|pos|positive|\+\+|2\+|\+\+\+|3\+|\+\+\+\+|4\+|强阳性)$/.test(normalizedText);
            return {
                value: numValue,
                isAnomaly: !isNormalText,
                severity: isNormalText ? 'normal' : isSlightPositive ? 'slight' : isPositive ? 'abnormal' : 'abnormal',
            };
        }
        return { value: 0, isAnomaly: false, severity: 'normal' };
    }
    const normalizedRange = normalRange.replace(/\s+/g, '');
    const rangeMatch = normalizedRange.match(/([\d.]+)-([\d.]+)/);
    const upperMatch = normalizedRange.match(/^(?:<|<=|≤)([\d.]+)$/);
    const lowerMatch = normalizedRange.match(/^(?:>|>=|≥)([\d.]+)$/);
    if (!rangeMatch && !upperMatch && !lowerMatch) {
        return { value: numValue, isAnomaly: false, severity: 'normal' };
    }
    if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (valueStr.includes('↑') || numValue > max * 1.2) {
            return { value: numValue, isAnomaly: true, severity: numValue > max * 2 ? 'serious' : 'abnormal' };
        }
        if (valueStr.includes('↓') || numValue < min * 0.8) {
            return { value: numValue, isAnomaly: true, severity: numValue < min * 0.5 ? 'serious' : 'abnormal' };
        }
        if (numValue > max || numValue < min) {
            return { value: numValue, isAnomaly: true, severity: 'slight' };
        }
        return { value: numValue, isAnomaly: false, severity: 'normal' };
    }
    if (upperMatch) {
        const max = parseFloat(upperMatch[1]);
        if (numValue > max * 2) {
            return { value: numValue, isAnomaly: true, severity: 'serious' };
        }
        if (numValue > max * 1.5) {
            return { value: numValue, isAnomaly: true, severity: 'abnormal' };
        }
        if (numValue > max) {
            return { value: numValue, isAnomaly: true, severity: 'slight' };
        }
        return { value: numValue, isAnomaly: false, severity: 'normal' };
    }
    if (lowerMatch) {
        const min = parseFloat(lowerMatch[1]);
        if (numValue < min * 0.5) {
            return { value: numValue, isAnomaly: true, severity: 'serious' };
        }
        if (numValue < min * 0.8) {
            return { value: numValue, isAnomaly: true, severity: 'abnormal' };
        }
        if (numValue < min) {
            return { value: numValue, isAnomaly: true, severity: 'slight' };
        }
        return { value: numValue, isAnomaly: false, severity: 'normal' };
    }
    return { value: numValue, isAnomaly: false, severity: 'normal' };
}
function generateAnomalySuggestions(indicator) {
    const name = indicator.name.toLowerCase();
    if (name.includes('脂肪肝'))
        return '建议复查腹部B超，注意饮食调理';
    if (name.includes('谷丙转氨酶') || name.includes('(alt)'))
        return '建议复查肝功能，避免饮酒并规律作息';
    if (name.includes('谷草转氨酶') || name.includes('(ast)'))
        return '建议复查肝功能，并结合心肌酶等检查综合判断';
    if (name.includes('碱性磷酸酶') || name.includes('(alp)'))
        return '建议结合肝胆和彩超结果，排查胆道或骨代谢问题';
    if (name.includes('总胆红素') || name.includes('(tbil)'))
        return '建议结合肝功能及胆道检查，必要时复查胆红素分型';
    if (name.includes('尿蛋白'))
        return '建议复查尿常规与肾功能，必要时就诊肾内科';
    if (name.includes('尿糖'))
        return '建议结合空腹血糖或糖化血红蛋白，评估糖代谢情况';
    if (name.includes('尿酮体'))
        return '建议关注进食情况、血糖变化，必要时复查尿酮体';
    if (name.includes('尿潜血'))
        return '建议复查尿常规，必要时排查泌尿系统出血或结石';
    if (name.includes('尿白细胞'))
        return '建议结合尿培养或泌尿系统症状，排查感染';
    if (name.includes('空腹血糖') || name.includes('(glu)'))
        return '建议复查空腹血糖，必要时做糖耐量试验';
    if (name.includes('糖化血红蛋白'))
        return '建议结合空腹血糖与饮食习惯，评估近三个月血糖控制情况';
    if (name.includes('总胆固醇') || name.includes('(tc)'))
        return '注意控制饱和脂肪摄入，规律运动并复查血脂';
    if (name.includes('甘油三酯') || name.includes('(tg)'))
        return '建议控制精制碳水和饮酒，增加运动并复查血脂';
    if (name.includes('高密度脂蛋白') || name.includes('(hdl)'))
        return '建议结合整体血脂结果评估心血管风险';
    if (name.includes('低密度脂蛋白') || name.includes('(ldl)'))
        return '建议控制饮食并结合心血管风险进行管理';
    if (name.includes('尿酸') || name.includes('(ua)'))
        return '建议低嘌呤饮食、多饮水，必要时复查尿酸';
    if (name.includes('肌酐') || name.includes('(cr)'))
        return '建议结合尿素氮和尿检结果评估肾功能';
    if (name.includes('尿素氮') || name.includes('(bun)'))
        return '建议结合肌酐和水化状态，综合评估肾功能';
    if (name.includes('胱抑素c') || name.includes('(cysc)'))
        return '建议结合肌酐和eGFR评估早期肾功能变化';
    if (name.includes('促甲状腺激素') || name.includes('(tsh)'))
        return '建议结合 FT3、FT4 及内分泌评估甲状腺功能';
    if (name.includes('ft3'))
        return '建议结合 TSH、FT4 综合判断是否存在甲亢或甲减倾向';
    if (name.includes('ft4'))
        return '建议结合 TSH、FT3 综合判断甲状腺功能状态';
    if (name.includes('c反应蛋白') || name.includes('(crp)'))
        return '提示炎症或感染活动，建议结合症状和血常规综合判断';
    if (name.includes('血沉') || name.includes('(esr)'))
        return '提示炎症或免疫活动可能，建议结合 CRP 和临床症状评估';
    if (name.includes('降钙素原') || name.includes('(pct)'))
        return '提示细菌感染可能，建议结合体温、血常规和医生评估';
    return '建议复查';
}
//# sourceMappingURL=report.model.js.map