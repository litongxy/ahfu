import type { HealthReport, ReportIndicator } from './report.model';

const REPORT_PARSE_FAILURE_PATTERNS = ['⚠️', '请上传', '解析失败', '未找到', '维护中', '暂时无法'];

function isParseFailureIndicator(indicator: ReportIndicator | null | undefined): boolean {
  const name = String(indicator?.name || '');
  return REPORT_PARSE_FAILURE_PATTERNS.some((pattern) => name.includes(pattern));
}

function normalizeReportDate(input: Date | string | number | undefined): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function compactText(text: string, maxLength: number): string {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function getSeverityRank(indicator: ReportIndicator): number {
  switch (indicator.severity) {
    case 'serious':
      return 3;
    case 'abnormal':
      return 2;
    case 'slight':
      return 1;
    default:
      return 0;
  }
}

function formatIndicatorSummary(indicator: ReportIndicator): string {
  const name = compactText(String(indicator.name || '').trim(), 24);
  const value = compactText(String(indicator.value || '').trim(), 18);
  const unit = compactText(String(indicator.unit || '').trim(), 12);
  const suggestion = compactText(String(indicator.suggestion || '').trim(), 40);

  const valueText = [value, unit].filter(Boolean).join(' ').trim();
  if (suggestion) {
    return `${name}${valueText ? ` ${valueText}` : ''}（${suggestion}）`;
  }
  return `${name}${valueText ? ` ${valueText}` : ''}`;
}

export function isUsableParsedReport(report: HealthReport | null | undefined): report is HealthReport {
  if (!report || report.status !== 'parsed') return false;

  const indicators = Array.isArray(report.indicators) ? report.indicators : [];
  if (indicators.length === 0) return false;

  return !indicators.some((indicator) => isParseFailureIndicator(indicator));
}

export function formatReportSummaryForPrompt(report: HealthReport | null | undefined): string {
  if (!isUsableParsedReport(report)) return '';

  const indicators = Array.isArray(report.indicators) ? report.indicators : [];
  const anomalyItems = indicators
    .filter((indicator) => indicator && indicator.isAnomaly)
    .sort((a, b) => getSeverityRank(b) - getSeverityRank(a))
    .slice(0, 5);
  const lines: string[] = [];
  const uploadDate = normalizeReportDate(report.uploadTime);

  if (uploadDate) {
    lines.push(`• 上传时间：${uploadDate}`);
  }

  if (anomalyItems.length > 0) {
    lines.push(`• 异常概览：本次体检发现 ${anomalyItems.length} 项需要关注的指标`);
    lines.push(`• 重点指标：${anomalyItems.map((indicator) => formatIndicatorSummary(indicator)).join('；')}`);
  } else {
    lines.push('• 异常概览：本次体检未见明显异常指标');
  }

  const analysisSummary = compactText(
    String(report.aiAnalysis || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .find(Boolean) || '',
    90
  );
  if (analysisSummary) {
    lines.push(`• AI提示：${analysisSummary}`);
  }

  return lines.length > 0 ? `\n【最近体检报告】\n${lines.join('\n')}` : '';
}
