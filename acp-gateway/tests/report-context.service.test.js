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
