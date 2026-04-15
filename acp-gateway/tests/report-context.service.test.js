const path = require('path');

const servicePath = path.resolve(__dirname, '../dist/services/report-context.service.js');

describe('report-context.service', () => {
  test('formats recent report summary for prompt when report is usable', () => {
    const { formatReportSummaryForPrompt, isUsableParsedReport } = require(servicePath);
    const report = {
      id: 'report_context_ok',
      userId: 'u1',
      uploadTime: new Date('2026-04-10T08:00:00.000Z'),
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
        {
          name: '空腹血糖(GLU)',
          value: '5.3',
          unit: 'mmol/L',
          referenceRange: '3.9-6.1',
          isAnomaly: false,
          severity: 'normal',
        },
      ],
      anomalyCount: 1,
      aiAnalysis: '血脂偏高，建议先从饮食控制和中低强度运动开始。',
      status: 'parsed',
    };

    expect(isUsableParsedReport(report)).toBe(true);

    const summary = formatReportSummaryForPrompt(report);
    expect(summary).toContain('【最近体检报告】');
    expect(summary).toContain('上传时间：2026-04-10');
    expect(summary).toContain('甘油三酯(TG) 2.58 mmol/L');
    expect(summary).toContain('AI提示：血脂偏高');
  });

  test('keeps more report anomalies in the chat prompt summary', () => {
    const { formatReportSummaryForPrompt } = require(servicePath);

    const report = {
      id: 'report_context_more_anomalies',
      userId: 'u2',
      uploadTime: new Date('2026-04-14T08:00:00.000Z'),
      indicators: [
        { name: '红细胞压积(HCT)', value: '35.1', unit: 'L/L', referenceRange: '37-47', isAnomaly: true, severity: 'slight', suggestion: '建议结合血红蛋白复查' },
        { name: '淋巴细胞百分率(LYM%)', value: '43.3', unit: '%', referenceRange: '20-40', isAnomaly: true, severity: 'slight', suggestion: '建议结合感染史综合判断' },
        { name: '甘油三酯(TG)', value: '2.58', unit: 'mmol/L', referenceRange: '0.4-1.8', isAnomaly: true, severity: 'slight', suggestion: '建议控脂' },
        { name: '甲状腺结节', value: '甲状腺右叶结节', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'abnormal', suggestion: '建议复查超声' },
        { name: '甲状腺回声欠均匀', value: '甲状腺双叶回声不均匀', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'slight', suggestion: '建议结合甲功评估' },
        { name: '脂肪肝', value: '脂肪肝(中度)', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'abnormal', suggestion: '建议护肝控脂' },
        { name: '外阴白斑', value: '外阴白斑', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'abnormal', suggestion: '建议妇科就诊' },
        { name: '主动脉瓣反流', value: '主动脉瓣反流(轻度)', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'slight', suggestion: '建议心脏彩超复查' },
        { name: '左心室舒张功能减低', value: '左心室舒张功能减低', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'abnormal', suggestion: '建议心内科评估' },
        { name: '血管弹性减弱', value: '血管弹性重度减弱', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'serious', suggestion: '建议血管专科评估' },
        { name: '幽门螺杆菌阳性', value: 'HP 阳性', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'abnormal', suggestion: '建议消化科评估根除治疗' },
        { name: '痔', value: '外痔', unit: '', referenceRange: '未见异常', isAnomaly: true, severity: 'slight', suggestion: '建议肛肠科复查' },
      ],
      anomalyCount: 12,
      aiAnalysis: '报告存在多项异常，建议结合专科复查。',
      status: 'parsed',
    };

    const summary = formatReportSummaryForPrompt(report);
    expect(summary).toContain('本次体检发现 12 项需要关注的指标');
    expect(summary).toContain('红细胞压积(HCT) 35.1 L/L');
    expect(summary).toContain('血管弹性减弱');
    expect(summary).toContain('幽门螺杆菌阳性');
  });

  test('returns empty summary for parse-failure reports', () => {
    const { formatReportSummaryForPrompt, isUsableParsedReport } = require(servicePath);
    const report = {
      id: 'report_context_fail',
      userId: 'u1',
      uploadTime: new Date('2026-04-10T08:00:00.000Z'),
      indicators: [
        {
          name: '⚠️ 解析失败',
          value: '',
          unit: '',
          referenceRange: '',
          isAnomaly: false,
          severity: 'normal',
          suggestion: '请上传清晰的体检报告 PDF',
        },
      ],
      anomalyCount: 0,
      status: 'parsed',
    };

    expect(isUsableParsedReport(report)).toBe(false);
    expect(formatReportSummaryForPrompt(report)).toBe('');
  });
});
