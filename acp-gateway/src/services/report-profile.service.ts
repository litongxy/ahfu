import { isUsableParsedReport } from './report-context.service';
import type { HealthReport, ReportIndicator } from './report.model';
import type { HealthProfile } from './user-profile.store';
import { setReportDerivedProfile } from './user-profile.store';

function normalizeDate(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString().slice(0, 10);
}

function normalizeText(value: string | undefined): string {
  return String(value || '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim();
}

function addItems(target: Set<string>, items: string[]): void {
  for (const item of items) {
    const normalized = String(item || '').trim();
    if (normalized) {
      target.add(normalized);
    }
  }
}

function isHighNumericIndicator(indicator: ReportIndicator): boolean {
  const cleanValue = String(indicator.value || '').replace(/[^\d.]/g, '');
  const cleanRange = String(indicator.referenceRange || '').replace(/\s+/g, '');
  const numericValue = Number.parseFloat(cleanValue);

  if (!Number.isFinite(numericValue)) {
    return /↑|高|阳性|异常/.test(String(indicator.value || ''));
  }

  const upperBound = cleanRange.match(/(?:-|~|至)([\d.]+)$/) || cleanRange.match(/(?:<|<=|≤)([\d.]+)$/);
  if (upperBound) {
    const boundary = Number.parseFloat(upperBound[1]);
    return Number.isFinite(boundary) ? numericValue > boundary : indicator.isAnomaly;
  }

  return indicator.isAnomaly;
}

function extractSignalsFromIndicator(
  indicator: ReportIndicator,
  diseases: Set<string>,
  symptoms: Set<string>,
  goals: Set<string>
): void {
  const indicatorText = `${indicator.name} ${indicator.value} ${indicator.suggestion || ''}`;
  const text = normalizeText(indicatorText);
  const isHigh = isHighNumericIndicator(indicator);

  if (/甘油三酯|总胆固醇|低密度脂蛋白|高密度脂蛋白|血脂/.test(text)) {
    addItems(diseases, ['高血脂']);
    addItems(goals, ['控脂']);
  }

  if (/血管弹性|动脉硬化|主动脉瓣|左心室|心电图|心脏/.test(text)) {
    addItems(diseases, ['心血管异常']);
    addItems(goals, ['降压', '控脂']);
  }

  if (/高血压/.test(text)) {
    addItems(diseases, ['高血压']);
    addItems(goals, ['降压']);
  }

  if (/空腹血糖|糖化血红蛋白|尿糖|葡萄糖/.test(text) && isHigh) {
    addItems(diseases, ['糖代谢异常']);
    addItems(goals, ['控糖']);
  }

  if (/尿酸/.test(text) && isHigh) {
    addItems(diseases, ['高尿酸']);
    addItems(goals, ['低嘌呤']);
  }

  if (/脂肪肝|谷丙转氨酶|谷草转氨酶|胆红素|肝功能/.test(text)) {
    addItems(diseases, ['脂肪肝']);
    addItems(goals, ['护肝', '控脂']);
  }

  if (/肌酐|尿蛋白|尿潜血|尿白细胞|尿素氮|肾/.test(text) && indicator.isAnomaly) {
    addItems(diseases, ['肾功能异常']);
    addItems(goals, ['护肾']);
  }

  if (/甲状腺.*结节|甲状腺回声|促甲状腺激素|tsh|ft3|ft4/.test(text)) {
    addItems(diseases, ['甲状腺异常']);
  }

  if (/幽门螺杆菌|hp阳性|胃炎|胃溃疡|胃部/.test(text)) {
    addItems(diseases, ['胃炎', '幽门螺杆菌感染']);
    addItems(goals, ['养胃']);
  }

  if (/腔隙性脑梗塞|脑内缺血灶|脑萎缩/.test(text)) {
    addItems(diseases, ['脑血管风险']);
    addItems(goals, ['控脂', '降压']);
  }

  if (/红细胞压积|血红蛋白|贫血/.test(text) && indicator.isAnomaly) {
    addItems(diseases, ['贫血倾向']);
    addItems(goals, ['恢复']);
  }

  if (/慢性咽炎/.test(text)) {
    addItems(symptoms, ['慢性咽炎']);
  }

  if (/外痔|痔/.test(text)) {
    addItems(symptoms, ['痔']);
  }

  if (/视力欠佳|视力下降/.test(text)) {
    addItems(symptoms, ['视力下降']);
  }
}

export function buildProfileFromReport(report: HealthReport | null | undefined): HealthProfile | null {
  if (!isUsableParsedReport(report)) return null;

  const diseases = new Set<string>();
  const symptoms = new Set<string>();
  const goals = new Set<string>();
  const reportText = normalizeText(report.extractedText || '');

  if (/高血压史|高血压病|血压:1[4-9]\d\/|收缩压1[4-9]\d|血压控制/.test(reportText)) {
    addItems(diseases, ['高血压']);
    addItems(goals, ['降压']);
  }

  if (/脂肪肝/.test(reportText)) {
    addItems(diseases, ['脂肪肝']);
    addItems(goals, ['护肝', '控脂']);
  }

  if (/幽门螺杆菌|hp阳性/.test(reportText)) {
    addItems(diseases, ['胃炎', '幽门螺杆菌感染']);
    addItems(goals, ['养胃']);
  }

  if (/甲状腺.*结节|甲状腺双叶回声不均匀/.test(reportText)) {
    addItems(diseases, ['甲状腺异常']);
  }

  if (/腔隙性脑梗塞|脑内缺血灶|脑萎缩/.test(reportText)) {
    addItems(diseases, ['脑血管风险']);
    addItems(goals, ['控脂', '降压']);
  }

  for (const indicator of report.indicators) {
    if (!indicator || !indicator.isAnomaly) continue;
    extractSignalsFromIndicator(indicator, diseases, symptoms, goals);
  }

  return {
    id: `profile_${report.userId}`,
    userId: report.userId,
    chronicDisease: diseases.size > 0 ? Array.from(diseases) : undefined,
    symptoms: symptoms.size > 0 ? Array.from(symptoms) : undefined,
    healthGoals: goals.size > 0 ? Array.from(goals) : undefined,
    lastCheckup: normalizeDate(report.uploadTime),
    reportReferenceId: report.id,
    reportDerivedAt: new Date().toISOString(),
    profileSource: 'report',
  };
}

export function rebuildProfileFromReport(report: HealthReport | null | undefined): HealthProfile | null {
  if (!report?.userId) return null;

  const derivedProfile = buildProfileFromReport(report);
  setReportDerivedProfile(report.userId, derivedProfile);
  return derivedProfile;
}
