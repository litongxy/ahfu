import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  ReportIndicator,
  HealthReport,
  ReportAnalysisResult,
  BLOOD_INDICATORS,
  URINE_INDICATORS,
  generateAnomalySuggestions,
} from './report.model';
import { REPORT_RANGE_LIBRARY, URINE_QUALITATIVE_LIBRARY } from './report-range-library';
import {
  DEFAULT_NEGATIVE_FINDING_PATTERNS,
  SPECIAL_FINDING_HEALTH_KEYWORDS,
  SPECIAL_FINDING_LIBRARY,
  SpecialFindingRule,
} from './report-special-findings-library';
import { isUsableParsedReport } from './report-context.service';

const reports: Map<string, HealthReport> = new Map();
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/reports');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

type IndicatorSpec = {
  name: string;
  aliases: RegExp[];
  unit: string;
  defaultRange: string;
  validRange: { min: number; max: number };
};

type IndicatorCandidate = {
  line: string;
  value: string;
  unit: string;
  referenceRange: string;
  score: number;
};

type ParsedReportContent = {
  indicators: ReportIndicator[];
  extractedText: string;
};

const CP1252_UNICODE_TO_BYTE = new Map<number, number>([
  [0x20AC, 0x80],
  [0x201A, 0x82],
  [0x0192, 0x83],
  [0x201E, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02C6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const MOJIBAKE_CHAR_PATTERN = /[ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŒœŠšŽžƒˆ˜†‡•–—‘’‚“”„…‰‹›€™]/;

const INDICATOR_SPECS: IndicatorSpec[] = REPORT_RANGE_LIBRARY.map((item) => ({
  name: item.displayName,
  aliases: item.aliases,
  unit: item.unit,
  defaultRange: item.normalRange,
  validRange: item.validRange,
}));

export class ReportService {

  async uploadAndAnalyze(userId: string, filePath: string, originalName: string): Promise<any> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: HealthReport = {
      id: reportId,
      userId,
      reportUrl: filePath,
      originalName: originalName,
      extractedText: '',
      uploadTime: new Date(),
      indicators: [],
      anomalyCount: 0,
      status: 'parsing',
    };
    reports.set(reportId, report);

    try {
      let parsedContent: ParsedReportContent;
      
      if (originalName.toLowerCase().endsWith('.pdf')) {
        parsedContent = await this.parsePdfContent(filePath);
      } else if (originalName.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        parsedContent = {
          indicators: await this.parseImage(filePath),
          extractedText: '',
        };
      } else {
        parsedContent = {
          indicators: this.createParseFailureIndicators('暂不支持该文件类型，请上传 PDF 或清晰的图片报告。'),
          extractedText: '',
        };
      }

      report.indicators = parsedContent.indicators;
      report.extractedText = parsedContent.extractedText;
      report.anomalyCount = report.indicators.filter(i => i.isAnomaly).length;

      const isParseFailed = report.indicators.some(i => 
        i.name.includes('解析失败') || 
        i.name.includes('未找到') || 
        i.name.includes('请上传') ||
        i.name.includes('维护中') ||
        i.name.includes('暂时无法')
      );
      
      if (isParseFailed) {
        const parseFailure = report.indicators.find(i => i.name.startsWith('⚠️'));
        report.aiAnalysis = `⚠️ 无法分析：${parseFailure?.suggestion || '请上传包含体检指标的 PDF 文件（如血常规、肝功能、血糖等检测报告）'}`;
        report.analysisResult = report.aiAnalysis;
      } else {
        const aiAnalysis = await this.analyzeWithAI(report.indicators, userId);
        report.analysisResult = aiAnalysis;
        report.aiAnalysis = aiAnalysis;
      }
      report.status = 'parsed';

      this.saveReportToFile(report);

      return {
        id: reportId,
        status: 'parsed',
        anomalyCount: report.anomalyCount,
        indicators: report.indicators,
        aiAnalysis: report.aiAnalysis,
        extractedText: report.extractedText,
      };

    } catch (error) {
      console.error('解析失败:', error);
      report.status = 'failed';
      throw error;
    }
  }

  async parsePDF(filePath: string): Promise<ReportIndicator[]> {
    const parsedContent = await this.parsePdfContent(filePath);
    return parsedContent.indicators;
  }

  private async parsePdfContent(filePath: string): Promise<ParsedReportContent> {
    try {
      const rawText = await this.extractPdfText(filePath);
      const text = this.prepareExtractedPdfText(rawText);
      
      console.log('\n[体检报告 PDF 提取文字开始]\n%s\n[体检报告 PDF 提取文字结束]\n', text || '(空)');
      
      if (text && text.trim().length > 20) {
        return {
          indicators: this.extractIndicatorsFromText(text),
          extractedText: text,
        };
      }
      
      return {
        indicators: this.createParseFailureIndicators('PDF 内容为空，未能识别体检指标。'),
        extractedText: text,
      };
    } catch (error) {
      console.error('PDF解析错误:', error);
      return {
        indicators: this.createParseFailureIndicators('PDF 解析失败，请稍后重试或重新上传更清晰的报告。'),
        extractedText: '',
      };
    }
  }

  private async parseImage(filePath: string): Promise<ReportIndicator[]> {
    console.log('开始解析图片:', filePath);
    
    const { execSync } = require('child_process');
    let useAI = true;
    
    try {
      execSync('~/.local/bin/opencode run "test" 2>/dev/null', { encoding: 'utf-8', timeout: 3000 });
    } catch (e) {
      console.log('opencode不可用，尝试本地解析');
      useAI = false;
    }
    
    if (!useAI) {
      try {
        const Tesseract = require('tesseract.js');
        console.log('使用Tesseract OCR识别...');
        const worker = await Tesseract.createWorker('chi_sim+eng');
        const result = await worker.recognize(filePath);
        await worker.terminate();
        
        const text = result.data.text;
        console.log('OCR识别文本:', text.substring(0, 200));
        
        if (text && text.trim().length > 10) {
          return this.extractIndicatorsFromText(text);
        }
      } catch (e: unknown) {
        const err = e as Error;
        console.log('OCR解析失败:', err.message);
      }
      console.log('无法解析图片，请上传PDF格式');
      return this.createParseFailureIndicators('图片识别失败，请优先上传 PDF 报告或更清晰的图片。');
    }
    
    try {
      const fs = require('fs');
      const imageBuffer = fs.readFileSync(filePath);
      const base64 = imageBuffer.toString('base64');
      const ext = filePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      const dataUrl = `data:image/${ext};base64,${base64}`;
      
      const prompt = `请仔细识别这张体检报告图片中的血液检测指标数值。

重点识别以下指标（注意：总胆固醇正常值约3.1-5.7，甘油三酯正常值约0.4-1.7）：
1. 总胆固醇(TC) - 正常范围3.1-5.7 mmol/L
2. 甘油三酯(TG) - 正常范围0.4-1.7 mmol/L  
3. 谷丙转氨酶(ALT) - 正常范围0-40 U/L
4. 谷草转氨酶(AST) - 正常范围0-40 U/L
5. 空腹血糖(GLU) - 正常范围3.9-6.1 mmol/L
6. 尿酸(UA) - 正常范围150-420 umol/L
7. 肌酐(Cr) - 正常范围44-133 umol/L
8. 血红蛋白(HGB) - 正常范围120-160 g/L
9. 白细胞(WBC) - 正常范围4-10 10^9/L
10. 血小板(PLT) - 正常范围100-300 10^9/L

请按以下JSON格式返回（只返回JSON，不要其他内容）：
[{"name":"总胆固醇","value":"实际数值","unit":"mmol/L"},{"name":"谷丙转氨酶","value":"实际数值","unit":"U/L"},...]`;

      const result = execSync(
        `~/.local/bin/opencode run ${JSON.stringify(prompt)} --image ${dataUrl} 2>/dev/null`,
        { encoding: 'utf-8', timeout: 60000, maxBuffer: 1024 * 1024 }
      );
      
      console.log('AI识别结果:', result.substring(0, 500));
      
      const indicators = this.parseAIResult(result);
      
      if (indicators.length > 0) {
        const healthKeywords = ['血糖', '血脂', '肝功能', '血压', '尿酸', '肌酐', '白细胞', '红细胞', '血红蛋白', '血小板', '胆固醇', '甘油三酯', '转氨酶', '尿', '心电图', 'B超', 'CT', 'MRI', '体检', '报告'];
        const isHealthReport = healthKeywords.some(kw => result.toLowerCase().includes(kw.toLowerCase()));
        
        if (!isHealthReport) {
          console.log('上传的文件不是体检报告');
          return this.createUploadReportIndicators();
        }
        return indicators;
      }
      
      return this.createParseFailureIndicators('图片中未识别到有效体检指标，请上传更清晰的报告。');
    } catch (error) {
      console.error('图片解析错误:', error);
      return this.createParseFailureIndicators('图片解析失败，请上传 PDF 报告或稍后重试。');
    }
  }
  
  private parseAIResult(aiResult: string): ReportIndicator[] {
    try {
      const indicators: ReportIndicator[] = [];
      
      const cleanResult = aiResult.replace(/```json|```/g, '').trim();
      
      const jsonMatch = cleanResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const items = JSON.parse(jsonMatch[0]);
          if (Array.isArray(items)) {
            const nameMap: Record<string, {name: string, unit: string, range: string}> = {
              '谷丙转氨酶': {name: '谷丙转氨酶(ALT)', unit: 'U/L', range: '0-40'},
              'ALT': {name: '谷丙转氨酶(ALT)', unit: 'U/L', range: '0-40'},
              '丙氨酸氨基转移酶': {name: '谷丙转氨酶(ALT)', unit: 'U/L', range: '0-40'},
              '谷草转氨酶': {name: '谷草转氨酶(AST)', unit: 'U/L', range: '0-40'},
              'AST': {name: '谷草转氨酶(AST)', unit: 'U/L', range: '0-40'},
              '天门冬氨酸氨基转移酶': {name: '谷草转氨酶(AST)', unit: 'U/L', range: '0-40'},
              '空腹血糖': {name: '空腹血糖(GLU)', unit: 'mmol/L', range: '3.9-6.1'},
              '血糖': {name: '空腹血糖(GLU)', unit: 'mmol/L', range: '3.9-6.1'},
              'GLU': {name: '空腹血糖(GLU)', unit: 'mmol/L', range: '3.9-6.1'},
              '甘油三酯': {name: '甘油三酯(TG)', unit: 'mmol/L', range: '0.4-1.7'},
              'TG': {name: '甘油三酯(TG)', unit: 'mmol/L', range: '0.4-1.7'},
              '总胆固醇': {name: '总胆固醇(TC)', unit: 'mmol/L', range: '3.1-5.7'},
              'TC': {name: '总胆固醇(TC)', unit: 'mmol/L', range: '3.1-5.7'},
              '高密度脂蛋白': {name: '高密度脂蛋白(HDL)', unit: 'mmol/L', range: '1.0-1.9'},
              'HDL': {name: '高密度脂蛋白(HDL)', unit: 'mmol/L', range: '1.0-1.9'},
              '低密度脂蛋白': {name: '低密度脂蛋白(LDL)', unit: 'mmol/L', range: '0-3.1'},
              'LDL': {name: '低密度脂蛋白(LDL)', unit: 'mmol/L', range: '0-3.1'},
              '尿酸': {name: '尿酸(UA)', unit: 'umol/L', range: '150-420'},
              'UA': {name: '尿酸(UA)', unit: 'umol/L', range: '150-420'},
              '肌酐': {name: '肌酐(Cr)', unit: 'umol/L', range: '44-133'},
              'Cr': {name: '肌酐(Cr)', unit: 'umol/L', range: '44-133'},
              '白细胞': {name: '白细胞(WBC)', unit: '10^9/L', range: '4-10'},
              'WBC': {name: '白细胞(WBC)', unit: '10^9/L', range: '4-10'},
              '红细胞': {name: '红细胞(RBC)', unit: '10^12/L', range: '4.0-5.5'},
              'RBC': {name: '红细胞(RBC)', unit: '10^12/L', range: '4.0-5.5'},
              '血红蛋白': {name: '血红蛋白(HGB)', unit: 'g/L', range: '120-160'},
              'HGB': {name: '血红蛋白(HGB)', unit: 'g/L', range: '120-160'},
              '血小板': {name: '血小板(PLT)', unit: '10^9/L', range: '100-300'},
              'PLT': {name: '血小板(PLT)', unit: '10^9/L', range: '100-300'},
            };
            
            for (const item of items) {
              const nameKey = Object.keys(nameMap).find(k => item.name && item.name.includes(k));
              if (nameKey) {
                const info = nameMap[nameKey];
                const value = parseFloat(String(item.value).replace(/[↑↓]/g, ''));
                if (!isNaN(value) && value > 0 && value < 2000) {
                  const isAnomaly = this.checkAnomaly(value, info.range);
                  const severity = this.getSeverity(value, info.range);
                  indicators.push({
                    name: info.name,
                    value: value >= 100 ? Math.round(value).toString() : (Math.round(value * 10) / 10).toFixed(1),
                    unit: item.unit || info.unit,
                    referenceRange: info.range,
                    isAnomaly,
                    severity,
                    suggestion: isAnomaly ? generateAnomalySuggestions({name: info.name, value: String(value), unit: info.unit, referenceRange: info.range, isAnomaly, severity} as ReportIndicator) : '',
                  });
                }
              }
            }
            
            if (indicators.length > 0) {
              return indicators;
            }
          }
        } catch (e) {
          console.error('JSON解析失败，尝试正则解析');
        }
      }
      
      const patterns: Array<{name: string, pattern: RegExp, unit: string, range: string}> = [
        { name: '谷丙转氨酶(ALT)', pattern: /ALT[：:\s]*(\d+\.?\d*)|谷丙转氨酶[：:\s]*(\d+\.?\d*)/i, unit: 'U/L', range: '0-40' },
        { name: '谷草转氨酶(AST)', pattern: /AST[：:\s]*(\d+\.?\d*)|谷草转氨酶[：:\s]*(\d+\.?\d*)/i, unit: 'U/L', range: '0-40' },
        { name: '空腹血糖(GLU)', pattern: /空腹血糖[：:\s]*(\d+\.?\d*)|GLU[：:\s]*(\d+\.?\d*)/i, unit: 'mmol/L', range: '3.9-6.1' },
        { name: '甘油三酯(TG)', pattern: /甘油三酯[：:\s]*(\d+\.?\d*)|TG[：:\s]*(\d+\.?\d*)/i, unit: 'mmol/L', range: '0.4-1.7' },
        { name: '总胆固醇(TC)', pattern: /总胆固醇[：:\s]*(\d+\.?\d*)|TC[：:\s]*(\d+\.?\d*)/i, unit: 'mmol/L', range: '3.1-5.7' },
        { name: '高密度脂蛋白(HDL)', pattern: /高密度脂蛋白[：:\s]*(\d+\.?\d*)|HDL[：:\s]*(\d+\.?\d*)/i, unit: 'mmol/L', range: '1.0-1.9' },
        { name: '低密度脂蛋白(LDL)', pattern: /低密度脂蛋白[：:\s]*(\d+\.?\d*)|LDL[：:\s]*(\d+\.?\d*)/i, unit: 'mmol/L', range: '0-3.1' },
        { name: '尿酸(UA)', pattern: /尿酸[：:\s]*(\d+\.?\d*)|UA[：:\s]*(\d+\.?\d*)/i, unit: 'umol/L', range: '150-420' },
        { name: '肌酐(Cr)', pattern: /肌酐[：:\s]*(\d+\.?\d*)|Cr[：:\s]*(\d+\.?\d*)/i, unit: 'umol/L', range: '44-133' },
        { name: '白细胞(WBC)', pattern: /白细胞[：:\s]*(\d+\.?\d*)|WBC[：:\s]*(\d+\.?\d*)/i, unit: '10^9/L', range: '4-10' },
        { name: '红细胞(RBC)', pattern: /红细胞[：:\s]*(\d+\.?\d*)|RBC[：:\s]*(\d+\.?\d*)/i, unit: '10^12/L', range: '4.0-5.5' },
        { name: '血红蛋白(HGB)', pattern: /血红蛋白[：:\s]*(\d+\.?\d*)|HGB[：:\s]*(\d+\.?\d*)/i, unit: 'g/L', range: '120-160' },
        { name: '血小板(PLT)', pattern: /血小板[：:\s]*(\d+\.?\d*)|PLT[：:\s]*(\d+\.?\d*)/i, unit: '10^9/L', range: '100-300' },
      ];

      const roundValue = (value: number): string => {
        if (value >= 100) {
          return Math.round(value).toString();
        } else if (value >= 10) {
          return (Math.round(value * 10) / 10).toString();
        } else {
          return (Math.round(value * 10) / 10).toFixed(1);
        }
      };

      const validRanges: Record<string, {min: number, max: number}> = {
        '谷丙转氨酶(ALT)': {min: 5, max: 500},
        '谷草转氨酶(AST)': {min: 5, max: 500},
        '空腹血糖(GLU)': {min: 1, max: 30},
        '甘油三酯(TG)': {min: 0.1, max: 15},
        '总胆固醇(TC)': {min: 1.5, max: 8},  // 总胆固醇一般不会超过8
        '高密度脂蛋白(HDL)': {min: 0.3, max: 5},
        '低密度脂蛋白(LDL)': {min: 0.5, max: 8},
        '尿酸(UA)': {min: 50, max: 800},
        '肌酐(Cr)': {min: 20, max: 1000},
        '白细胞(WBC)': {min: 1, max: 50},
        '红细胞(RBC)': {min: 2, max: 8},
        '血红蛋白(HGB)': {min: 50, max: 220},
        '血小板(PLT)': {min: 30, max: 700},
      };

      for (const p of patterns) {
        const match = aiResult.match(p.pattern);
        if (match) {
          const valueStr = match[1] || match[2];
          if (valueStr) {
            const value = parseFloat(valueStr.replace(/[↑↓]/g, ''));
            const range = validRanges[p.name];
            if (!isNaN(value) && value > 0 && range && value >= range.min && value <= range.max) {
              const roundedValue = roundValue(value);
              const numValue = parseFloat(roundedValue);
              const isAnomaly = this.checkAnomaly(numValue, p.range);
              const severity = this.getSeverity(numValue, p.range);
              
              indicators.push({
                name: p.name,
                value: roundedValue,
                unit: p.unit,
                referenceRange: p.range,
                isAnomaly,
                severity,
                suggestion: isAnomaly ? generateAnomalySuggestions({ name: p.name, value: roundedValue, unit: p.unit, referenceRange: p.range, isAnomaly, severity } as ReportIndicator) : '',
              });
            }
          }
        }
      }
      
      return indicators;
    } catch (e) {
      console.error('解析AI结果失败:', e);
      return [];
    }
  }

  private extractIndicatorsFromText(text: string): ReportIndicator[] {
    const normalizedText = text.replace(/\r/g, '');
    const lines = normalizedText
      .split('\n')
      .map(line => this.normalizeReportLine(line))
      .filter(Boolean);

    const indicators = INDICATOR_SPECS
      .map(spec => this.extractIndicatorFromLines(lines, spec))
      .filter((item): item is ReportIndicator => Boolean(item));
    indicators.push(...this.extractQualitativeIndicators(lines));
    indicators.push(...this.extractSpecialFindings(lines));

    const refinedIndicators = this.refineContextualIndicators(this.deduplicateIndicators(indicators));

    if (refinedIndicators.length === 0) {
      if (!this.looksLikeHealthReport(normalizedText)) {
        return this.createUploadReportIndicators();
      }
      return this.createParseFailureIndicators('报告已识别，但未能准确提取指标，请稍后重试或联系管理员优化模板。');
    }

    return refinedIndicators;
  }

  private deduplicateIndicators(indicators: ReportIndicator[]): ReportIndicator[] {
    const indicatorMap = new Map<string, ReportIndicator>();

    for (const indicator of indicators) {
      const existing = indicatorMap.get(indicator.name);
      if (!existing) {
        indicatorMap.set(indicator.name, indicator);
        continue;
      }

      const shouldReplace =
        (indicator.isAnomaly && !existing.isAnomaly) ||
        (indicator.suggestion || '').length > (existing.suggestion || '').length ||
        (indicator.value || '').length > (existing.value || '').length;

      if (shouldReplace) {
        indicatorMap.set(indicator.name, indicator);
      }
    }

    return Array.from(indicatorMap.values());
  }

  private extractQualitativeIndicators(lines: string[]): ReportIndicator[] {
    return URINE_QUALITATIVE_LIBRARY
      .map(spec => this.extractQualitativeIndicator(lines, spec))
      .filter((item): item is ReportIndicator => Boolean(item));
  }

  private extractQualitativeIndicator(
    lines: string[],
    spec: { displayName: string; aliases: RegExp[]; normalRange: string }
  ): ReportIndicator | null {
    const candidates: Array<{ value: string; score: number }> = [];

    for (let index = 0; index < lines.length; index += 1) {
      const contexts = this.buildIndicatorContexts(lines, index);

      for (const line of contexts) {
        const aliasMatch = this.findAliasMatch(line, spec.aliases);
        if (!aliasMatch || aliasMatch.index === undefined) {
          continue;
        }

        const tail = line.slice(aliasMatch.index + aliasMatch[0].length);
        const value = this.extractQualitativeValue(tail) || this.extractQualitativeValue(line);
        if (!value) {
          continue;
        }

        let score = 0;
        if (/尿|镜检|LEU|PRO|KET|BLD|GLU/i.test(line)) {
          score += 4;
        }
        if (/(阴性|阳性|弱阳性|强阳性|neg|positive|trace|微量|±|\+)/i.test(line)) {
          score += 3;
        }
        if (/\bmmol\/L\b|\b10\^/i.test(line)) {
          score -= 2;
        }

        candidates.push({
          value: this.normalizeQualitativeValue(value),
          score,
        });
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const evaluation = this.evaluateQualitativeValue(best.value);

    return {
      name: spec.displayName,
      value: best.value,
      unit: '',
      referenceRange: spec.normalRange,
      isAnomaly: evaluation.isAnomaly,
      severity: evaluation.severity,
      suggestion: evaluation.isAnomaly
        ? generateAnomalySuggestions({
            name: spec.displayName,
            value: best.value,
            unit: '',
            referenceRange: spec.normalRange,
            isAnomaly: evaluation.isAnomaly,
            severity: evaluation.severity,
          } as ReportIndicator)
        : '',
    };
  }

  private extractQualitativeValue(text: string): string | null {
    const match = text.match(/(强阳性|弱阳性|阳性|阴性|未见|正常|negative|neg|positive|pos|trace|tr|微量|±|[1-4]?\+{1,4})/i);
    return match ? match[1] : null;
  }

  private normalizeQualitativeValue(value: string): string {
    const normalized = value.trim().toLowerCase();

    if (/^(negative|neg|阴性|未见|正常)$/.test(normalized)) {
      return '阴性';
    }
    if (/^(trace|tr|微量|±)$/.test(normalized)) {
      return '±';
    }
    if (/^(positive|pos|阳性)$/.test(normalized)) {
      return '阳性';
    }
    if (/^弱阳性$/.test(normalized)) {
      return '弱阳性';
    }
    if (/^强阳性$/.test(normalized)) {
      return '强阳性';
    }
    if (/^(1\+|\+)$/.test(normalized)) {
      return '+';
    }
    if (/^(2\+|\+\+)$/.test(normalized)) {
      return '++';
    }
    if (/^(3\+|\+\+\+)$/.test(normalized)) {
      return '+++';
    }
    if (/^(4\+|\+\+\+\+)$/.test(normalized)) {
      return '++++';
    }

    return value.trim();
  }

  private evaluateQualitativeValue(value: string): { isAnomaly: boolean; severity: 'normal' | 'slight' | 'abnormal' | 'serious' } {
    if (value === '阴性') {
      return { isAnomaly: false, severity: 'normal' };
    }
    if (value === '±' || value === '+' || value === '弱阳性') {
      return { isAnomaly: true, severity: 'slight' };
    }
    if (value === '++' || value === '阳性') {
      return { isAnomaly: true, severity: 'abnormal' };
    }
    if (value === '+++' || value === '++++' || value === '强阳性') {
      return { isAnomaly: true, severity: 'serious' };
    }

    return { isAnomaly: true, severity: 'abnormal' };
  }

  private refineContextualIndicators(indicators: ReportIndicator[]): ReportIndicator[] {
    const refined = indicators.map(indicator => ({ ...indicator }));

    this.applyThyroidPatternSuggestions(refined);
    this.applyInflammationSuggestions(refined);

    return refined;
  }

  private prepareExtractedPdfText(text: string): string {
    const normalizedText = this.normalizeCompatibilityText(text);
    const repairedText = this.repairMojibakeText(normalizedText);

    return repairedText
      .split('\n')
      .map(line => this.normalizeReportLine(line))
      .join('\n');
  }

  private normalizeCompatibilityText(text: string): string {
    return text
      // Kangxi radicals often appear in some PDFs (e.g. ⾼/⼦/⽋). Normalize only those.
      .replace(/[\u2F00-\u2FD5]/g, (char) => char.normalize('NFKC'))
      // Fraction slash breaks mojibake decoding and should be treated as '/'.
      .replace(/\u2044/g, '/');
  }

  private repairMojibakeText(text: string): string {
    const repaired = text
      .split('\n')
      .map(line => this.repairMojibakeLine(line))
      .join('\n');

    return this.getHealthKeywordHitCount(repaired) > this.getHealthKeywordHitCount(text) ? repaired : text;
  }

  private repairMojibakeLine(line: string): string {
    if (!MOJIBAKE_CHAR_PATTERN.test(line)) {
      return line;
    }

    const repaired = this.decodeCp1252Mojibake(line);
    if (!repaired || repaired === line) {
      return line;
    }

    const originalChineseCount = (line.match(/[\u4e00-\u9fff]/g) || []).length;
    const repairedChineseCount = (repaired.match(/[\u4e00-\u9fff]/g) || []).length;
    const originalKeywordHits = this.getHealthKeywordHitCount(line);
    const repairedKeywordHits = this.getHealthKeywordHitCount(repaired);

    return repairedChineseCount > originalChineseCount || repairedKeywordHits > originalKeywordHits
      ? repaired
      : line;
  }

  private decodeCp1252Mojibake(line: string): string | null {
    const bytes: number[] = [];

    for (const char of line) {
      const code = char.codePointAt(0);
      if (code === undefined) {
        continue;
      }

      if (code <= 0xff) {
        bytes.push(code);
        continue;
      }

      const mappedByte = CP1252_UNICODE_TO_BYTE.get(code);
      if (mappedByte === undefined) {
        return null;
      }

      bytes.push(mappedByte);
    }

    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
    } catch {
      return null;
    }
  }

  private checkAnomaly(value: number, range: string): boolean {
    const parsedRange = this.parseReferenceRange(range);
    if (!parsedRange) return false;

    if (parsedRange.min !== undefined && value < parsedRange.min) {
      return true;
    }
    if (parsedRange.max !== undefined && value > parsedRange.max) {
      return true;
    }
    return false;
  }

  private getSeverity(value: number, range: string): 'normal' | 'slight' | 'abnormal' | 'serious' {
    const parsedRange = this.parseReferenceRange(range);
    if (!parsedRange) return 'normal';

    const { min, max } = parsedRange;
    if (min !== undefined && max !== undefined) {
      if (value < min * 0.5 || value > max * 2) return 'serious';
      if (value < min * 0.8 || value > max * 1.5) return 'abnormal';
      if (value < min || value > max) return 'slight';
      return 'normal';
    }

    if (max !== undefined) {
      if (value > max * 2) return 'serious';
      if (value > max * 1.5) return 'abnormal';
      if (value > max) return 'slight';
      return 'normal';
    }

    if (min !== undefined) {
      if (value < min * 0.5) return 'serious';
      if (value < min * 0.8) return 'abnormal';
      if (value < min) return 'slight';
    }

    return 'normal';
  }

  private async extractPdfText(filePath: string): Promise<string> {
    const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(fs.readFileSync(filePath));
    const document = await pdfjsLib.getDocument({ data }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = this.groupPdfItemsIntoLines(content.items || []);
      pages.push(`--- PAGE ${pageNumber} ---\n${lines.join('\n')}`);
    }

    return pages.join('\n');
  }

  private groupPdfItemsIntoLines(items: any[]): string[] {
    const lines = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of items) {
      const text = typeof item?.str === 'string' ? this.normalizeReportLine(item.str) : '';
      if (!text) {
        continue;
      }

      const transform = Array.isArray(item?.transform) ? item.transform : [];
      const x = Number(transform[4] || 0);
      const rawY = Number(transform[5] || 0);
      const y = Math.round(rawY * 2) / 2;

      const parts = lines.get(y) || [];
      parts.push({ x, text });
      lines.set(y, parts);
    }

    return Array.from(lines.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts
        .sort((a, b) => a.x - b.x)
        .map(part => part.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim())
      .filter(Boolean);
  }

  private normalizeReportLine(line: string): string {
    return this.normalizeCompatibilityText(line)
      .replace(/\u00a0/g, ' ')
      .replace(/[（）]/g, m => (m === '（' ? '(' : ')'))
      .replace(/[：]/g, ':')
      .replace(/[＜﹤]/g, '<')
      .replace(/[＞﹥]/g, '>')
      .replace(/\s*\/\s*/g, '/')
      .replace(/\s*\^\s*/g, '^')
      .replace(/(\d)\s*(?:--|—|–|－|﹣|−|~|～|至)\s*(\d)/g, '$1-$2')
      .replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '$1')
      .replace(/([A-Za-z])\s+(?=[A-Za-z])/g, '$1')
      .replace(/(\d)\s+(?=%)/g, '$1')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractIndicatorFromLines(lines: string[], spec: IndicatorSpec): ReportIndicator | null {
    const candidates: IndicatorCandidate[] = [];

    for (let index = 0; index < lines.length; index += 1) {
      const contexts = this.buildIndicatorContexts(lines, index);

      for (const line of contexts) {
        const aliasMatch = this.findAliasMatch(line, spec.aliases);
        if (!aliasMatch || aliasMatch.index === undefined) {
          continue;
        }

        const tail = line.slice(aliasMatch.index + aliasMatch[0].length);
        const numericMatches = Array.from(tail.matchAll(/\d+(?:\.\d+)?/g));
        if (numericMatches.length === 0) {
          continue;
        }

        const hasStructuredEvidence =
          this.lineContainsUnit(line, spec.unit) ||
          Boolean(this.extractReferenceRange(line)) ||
          /[↑↓⇅]/.test(line) ||
          (numericMatches.length <= 3 && line.length <= 48);

        if (!hasStructuredEvidence) {
          continue;
        }

        const valueMatch = numericMatches.find(match => this.isWithinValidRange(parseFloat(match[0]), spec.validRange)) || numericMatches[0];
        const valueIndex = valueMatch.index || 0;
        const afterValue = tail.slice(valueIndex + valueMatch[0].length);
        const referenceRange = this.extractReferenceRange(afterValue) || this.extractReferenceRange(line) || spec.defaultRange;
        const score = this.scoreIndicatorCandidate(line, spec);

        candidates.push({
          line,
          value: this.normalizeNumericValue(valueMatch[0]),
          unit: this.normalizeUnit(line, spec.unit),
          referenceRange,
          score,
        });
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score || a.line.length - b.line.length);
    const best = candidates[0];
    if (best.score < 2) {
      return null;
    }
    const numericValue = parseFloat(best.value);
    const isAnomaly = this.checkAnomaly(numericValue, best.referenceRange);
    const severity = this.getSeverity(numericValue, best.referenceRange);

    return {
      name: spec.name,
      value: best.value,
      unit: best.unit,
      referenceRange: best.referenceRange,
      isAnomaly,
      severity,
      suggestion: isAnomaly
        ? generateAnomalySuggestions({
            name: spec.name,
            value: best.value,
            unit: best.unit,
            referenceRange: best.referenceRange,
            isAnomaly,
            severity,
          } as ReportIndicator)
        : '',
    };
  }

  private buildIndicatorContexts(lines: string[], index: number): string[] {
    const contexts = new Set<string>();
    const current = lines[index];
    const previous = index > 0 ? lines[index - 1] : '';
    const next = index < lines.length - 1 ? lines[index + 1] : '';

    if (current) {
      contexts.add(current);
    }
    if (current && next) {
      contexts.add(`${current} ${next}`);
    }
    if (previous && current) {
      contexts.add(`${previous} ${current}`);
    }

    return Array.from(contexts)
      .map(line => this.normalizeReportLine(line))
      .filter(Boolean);
  }

  private findAliasMatch(line: string, aliases: RegExp[]): RegExpExecArray | null {
    for (const alias of aliases) {
      alias.lastIndex = 0;
      const match = alias.exec(line);
      if (match) {
        return match;
      }
    }
    return null;
  }

  private isWithinValidRange(value: number, range: { min: number; max: number }): boolean {
    return !Number.isNaN(value) && value >= range.min && value <= range.max;
  }

  private scoreIndicatorCandidate(line: string, spec: IndicatorSpec): number {
    let score = 0;
    const normalizedLine = line.toLowerCase();
    const numericCount = line.match(/\d+(?:\.\d+)?/g)?.length || 0;

    if (this.lineContainsUnit(line, spec.unit)) {
      score += 5;
    }
    if (this.extractReferenceRange(line)) {
      score += 4;
    }
    if (/(项目|结果|单位|参考范围|标本类型|样品采集时间|结果发布时间|检验|审核|检查所见)/.test(line)) {
      score += 3;
    }
    if (/[()]/.test(line)) {
      score += 1;
    }
    if (/[↑↓⇅]/.test(line)) {
      score += 1;
    }
    if (/(历史对比|三年关键指标对比|样本均值|趋势|汇总分析|平均|2022-10|2021-10)/.test(line)) {
      score -= 8;
    }
    if (/(样本均值|关键指标|导读|温馨提示)/.test(line)) {
      score -= 6;
    }
    if (/(建议|见于|危险因素|意义|说明|相关|饮食|复查|控制体重|必要时|发生急性胰腺炎)/.test(line)) {
      score -= 8;
    }
    if (/[。；;]/.test(line)) {
      score -= 4;
    }
    if (line.length > 80) {
      score -= 4;
    }
    if (!this.lineContainsUnit(line, spec.unit) && !this.extractReferenceRange(line) && line.length > 36) {
      score -= 3;
    }
    if (numericCount > 4) {
      score -= 2;
    }
    if (normalizedLine.includes('page')) {
      score -= 1;
    }

    return score;
  }

  private extractReferenceRange(text: string): string | null {
    const normalized = text
      .replace(/[＜﹤]/g, '<')
      .replace(/[＞﹥]/g, '>')
      .replace(/(\d)\s*(?:--|—|–|－|﹣|−|~|～|至)\s*(\d)/g, '$1-$2');
    const match = normalized.match(/(?:[<>≤≥]=?\s*\d+(?:\.\d+)?)|(?:\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?)/);
    return match ? match[0].replace(/\s+/g, '') : null;
  }

  private normalizeUnit(line: string, fallbackUnit: string): string {
    return this.lineContainsUnit(line, fallbackUnit) ? fallbackUnit : fallbackUnit;
  }

  private lineContainsUnit(line: string, unit: string): boolean {
    const normalizedLine = line.toLowerCase().replace(/μ/g, 'u');
    const normalizedUnit = unit.toLowerCase().replace(/μ/g, 'u');
    return normalizedLine.includes(normalizedUnit);
  }

  private normalizeNumericValue(value: string): string {
    return value.replace(/[↑↓⇅]/g, '').trim();
  }

  private parseReferenceRange(range: string): { min?: number; max?: number } | null {
    const normalized = range
      .replace(/\s+/g, '')
      .replace(/[＜﹤]/g, '<')
      .replace(/[＞﹥]/g, '>')
      .replace(/(\d)\s*(?:--|—|–|－|﹣|−|~|～|至)\s*(\d)/g, '$1-$2');

    const between = normalized.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if (between) {
      return {
        min: parseFloat(between[1]),
        max: parseFloat(between[2]),
      };
    }

    const upper = normalized.match(/^(?:<|<=|≤)(\d+(?:\.\d+)?)$/);
    if (upper) {
      return { max: parseFloat(upper[1]) };
    }

    const lower = normalized.match(/^(?:>|>=|≥)(\d+(?:\.\d+)?)$/);
    if (lower) {
      return { min: parseFloat(lower[1]) };
    }

    return null;
  }

  private extractSpecialFindings(lines: string[]): ReportIndicator[] {
    const indicators: ReportIndicator[] = [];

    const ecgLines = Array.from(new Set(
      lines.flatMap((line, index) => {
        if (!/心电图/.test(line)) {
          return [];
        }
        const nextLine = index < lines.length - 1 ? lines[index + 1] : '';
        return [line, this.normalizeReportLine(`${line} ${nextLine}`)];
      }).filter(Boolean)
    ));
    const ecgNormalLine = ecgLines.find(line => /窦性心律|正常心电图|未见异常/.test(line));
    const ecgAbnormalLine = ecgLines.find(line => !/未见异常|正常心电图/.test(line) && /心电图.*异常|异常心电图|ST-T|早搏|房颤|房扑|传导阻滞|缺血|改变|异常/.test(line));

    if (ecgNormalLine) {
      indicators.push({
        name: '心电图',
        value: '正常',
        unit: '',
        referenceRange: '正常',
        isAnomaly: false,
        severity: 'normal',
        suggestion: '',
      });
    } else if (ecgAbnormalLine) {
      indicators.push({
        name: '心电图',
        value: this.extractEcgFindingValue(ecgAbnormalLine),
        unit: '',
        referenceRange: '正常',
        isAnomaly: true,
        severity: 'abnormal',
        suggestion: '建议进一步检查心电图异常相关情况',
      });
    }

    if (lines.some(line => /(?:检查所见|超声).*脂肪肝/.test(line) && !/未见异常/.test(line))) {
      indicators.push({
        name: '脂肪肝',
        value: '检出',
        unit: '',
        referenceRange: '正常',
        isAnomaly: true,
        severity: 'abnormal',
        suggestion: '建议进一步检查脂肪肝相关情况',
      });
    }

    if (lines.some(line => /血压.*(?:偏高|异常|升高)/.test(line))) {
      indicators.push({
        name: '高血压',
        value: '检出',
        unit: '',
        referenceRange: '正常',
        isAnomaly: true,
        severity: 'abnormal',
        suggestion: '建议进一步检查高血压相关情况',
      });
    }

    indicators.push(...this.extractRuleBasedFindings(lines));

    return indicators;
  }

  private extractRuleBasedFindings(lines: string[]): ReportIndicator[] {
    return SPECIAL_FINDING_LIBRARY
      .map(rule => this.extractRuleBasedFinding(lines, rule))
      .filter((item): item is ReportIndicator => Boolean(item));
  }

  private extractRuleBasedFinding(lines: string[], rule: SpecialFindingRule): ReportIndicator | null {
    const candidates: Array<{
      context: string;
      value: string;
      severity: 'slight' | 'abnormal' | 'serious';
      score: number;
    }> = [];

    for (let index = 0; index < lines.length; index += 1) {
      const contexts = this.buildFindingContexts(lines, index);

      contexts.forEach((context, contextIndex) => {
        if (!this.isLikelyFindingContext(context)) {
          return;
        }

        const match = this.findAliasMatch(context, rule.aliases);
        if (!match) {
          return;
        }

        if (this.containsNegativeFindingContext(context, rule)) {
          return;
        }

        const value = this.extractRuleBasedFindingValue(context, match[0]);
        const severity = this.resolveRuleBasedSeverity(context, rule.defaultSeverity);
        let score = 0;

        if (contextIndex === 0) {
          score += 10;
        } else if (contextIndex === 1) {
          score += 6;
        } else if (contextIndex === 2) {
          score += 5;
        } else {
          score += 3;
        }

        if (value.length <= 28) {
          score += 4;
        } else if (value.length <= 48) {
          score += 2;
        }

        if (context.length <= 24) {
          score += 3;
        }

        if (value === match[0] || value.startsWith(match[0]) || this.normalizeReportLine(context).startsWith(match[0])) {
          score += 4;
        }

        if (/^(?:小结|结论|提示|印象|诊断|异常(?:结果|项目)?|检查所见|超声(?:提示|所见)|.*检查结果)/.test(context)) {
          score += 5;
        }

        if (/[:：]/.test(context)) {
          score += 2;
        }

        if (/(阳性|增高|降低|减低|减弱|欠佳|反流|结节|囊肿|息肉|外痔|白斑|脑梗塞|脑梗死|缺血灶|脑萎缩)/.test(context)) {
          score += 2;
        }

        if (/(外痔|内痔|混合痔|视力欠佳|脂肪肝\(?(?:轻度|中度|重度)?\)?|HP\s*阳性|甲状腺右叶结节|左心室舒张功能减低|主动脉瓣反流|血管弹性(?:轻度|中度|重度)?减弱)/.test(context)) {
          score += 4;
        }

        if (/^[【\[]?\d+[】\]]?[、.)）:]?/.test(context)) {
          score += 1;
        }

        if (/^\d+\s*[、.．]/.test(context) || /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(context)) {
          score -= 6;
        }

        if (/(【医学解释】|【常见原因及后果】|【建议】)/.test(context)) {
          score -= 12;
        }

        if (/(病因|危险因素|独立预测因子|可导致|可见于|可因|常见的有|世界卫生组织|活动性感染|观察变化|定期复查|正规医院|治愈率|发病率|主要靠|准确性高)/.test(context)) {
          score -= 8;
        }

        if (context.length > 64) {
          score -= 4;
        }

        candidates.push({
          context,
          value,
          severity,
          score,
        });
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score || a.value.length - b.value.length);
    const best = candidates[0];
    if (best.score < 5) {
      return null;
    }

    return {
      name: rule.displayName,
      value: best.value,
      unit: '',
      referenceRange: '未见异常',
      isAnomaly: true,
      severity: best.severity,
      suggestion: rule.suggestion,
    };
  }

  private buildFindingContexts(lines: string[], index: number): string[] {
    const contexts = new Set<string>();
    const current = lines[index];
    const previous = index > 0 ? lines[index - 1] : '';
    const next = index < lines.length - 1 ? lines[index + 1] : '';

    if (current) {
      contexts.add(current);
    }
    if (current && next) {
      contexts.add(`${current} ${next}`);
    }
    if (previous && current) {
      contexts.add(`${previous} ${current}`);
    }
    if (previous && current && next) {
      contexts.add(`${previous} ${current} ${next}`);
    }

    return Array.from(contexts)
      .map(line => this.normalizeReportLine(line))
      .filter(Boolean);
  }

  private isLikelyFindingContext(line: string): boolean {
    const normalized = this.normalizeReportLine(line);
    if (!normalized) {
      return false;
    }

    const hasFindingCue = /(小结|结论|提示|印象|诊断|异常|阳性|增高|降低|减低|减弱|反流|脂肪肝|白斑|外痔|痔疮|视力欠佳|缺血灶|脑梗塞|脑梗死|脑萎缩|结节|囊肿|息肉|增生|肌瘤|回声|钙化|咽炎|HPV|TCT|HP)/.test(normalized);

    if (/(医学名词科普|名词科普|名词解释|科普知识内容)/.test(normalized)) {
      return false;
    }

    if (normalized.length > 120 && !hasFindingCue && !/(结论|提示|印象|诊断|所见|异常)/.test(normalized)) {
      return false;
    }

    if (/[。！？]/.test(normalized) && normalized.length > 48 && !hasFindingCue) {
      return false;
    }

    if (/[，,;；]/.test(normalized) && normalized.length > 32 && !hasFindingCue) {
      return false;
    }

    if (/(什么是|怎么办|如何|治疗|预防|很多人|一般|通常|可能导致|需要注意|原因|科普|医生提醒|是指|简称|又称|又译为|主要症状|主要表现|多见于|常见于|属于|包括|可分为|引自|参考区间|正常值范围|指导原则|WS\/T|T-Score|等疾病)/.test(normalized)) {
      return false;
    }

    return /(结节|囊肿|息肉|增生|肌瘤|异常|改变|炎|肥胖|超重|屈光不正|近视|远视|散光|结石|斑块|积液|回声|钙化|胃炎|食管炎|幽门螺杆菌|心动过缓|心动过速|早搏|阻滞|高电压|退行性变|咽炎|牙周炎|龋齿|白内障|骨量减少|骨质疏松|体重指数|BMI|腰围|TCT|HPV|脂肪肝|白斑|痔|反流|舒张功能减低|弹性减弱|视力欠佳|脑梗塞|脑梗死|缺血灶|脑萎缩)/.test(normalized)
      || /^[【\[]\d+[】\]]/.test(normalized)
      || /^[（(]\d+[)）]/.test(normalized);
  }

  private containsNegativeFindingContext(line: string, rule: SpecialFindingRule): boolean {
    return [...DEFAULT_NEGATIVE_FINDING_PATTERNS, ...(rule.negativeAliases || [])].some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });
  }

  private extractRuleBasedFindingValue(line: string, fallbackValue: string): string {
    const cleaned = this.normalizeReportLine(line)
      .replace(/^[•·●▪■◆◇\-]+\s*/, '')
      .replace(/^[【\[]?\d+[】\]]?[、.)）:]?\s*/, '')
      .replace(/^[（(]?\d+[)）]\s*/, '')
      .replace(/^[一二三四五六七八九十]+[、.．]\s*/, '')
      .replace(/^(检查结论|结论摘要|检查所见|超声提示|超声所见|印象|提示|诊断|诊断意见|异常结果|异常项目)[:：]?\s*/, '')
      .trim();

    const fallback = fallbackValue.trim();
    const conditionHits = (cleaned.match(/结节|囊肿|息肉|结石|增生|肌瘤|斑块|积液|钙化|炎|改变|外痔|白斑|脂肪肝|反流|减低|减弱|欠佳|脑梗塞|脑梗死|缺血灶|脑萎缩|回声/g) || []).length;
    const isDefinitionLike = /(是指|简称|又称|又译为|主要症状|主要表现|常见于|多见于|引自|参考区间|正常值范围|指导原则|WS\/T|T-Score|等疾病)/.test(cleaned);

    if (!cleaned) {
      return fallback;
    }

    if (isDefinitionLike) {
      return fallback;
    }

    if (cleaned.startsWith(fallback) && /[:：]/.test(cleaned)) {
      return fallback;
    }

    if (/[：:]/.test(cleaned) && cleaned.length > 24) {
      return fallback;
    }

    if (conditionHits >= 2 && cleaned.length > fallback.length + 6) {
      return fallback;
    }

    if (cleaned.length <= 48) {
      return cleaned;
    }

    return fallback;
  }

  private resolveRuleBasedSeverity(
    line: string,
    defaultSeverity: 'slight' | 'abnormal' | 'serious',
  ): 'slight' | 'abnormal' | 'serious' {
    if (/(高度|重度|高级别|可疑恶性|恶性|癌|肿瘤|占位|4c|5类|HSIL|ASC-H)/i.test(line)) {
      return 'serious';
    }

    if (/(轻度|轻微|低度|待查|可能|可疑|欠均匀|偏高|偏低|增高|小结节|微小|早期)/i.test(line)) {
      return defaultSeverity === 'serious' ? 'abnormal' : 'slight';
    }

    return defaultSeverity;
  }

  private applyThyroidPatternSuggestions(indicators: ReportIndicator[]): void {
    const tsh = this.findIndicatorByKeyword(indicators, '促甲状腺激素');
    const ft3 = this.findIndicatorByKeyword(indicators, 'FT3');
    const ft4 = this.findIndicatorByKeyword(indicators, 'FT4');

    const tshDirection = tsh ? this.getIndicatorDirection(tsh) : 'unknown';
    const ft3Direction = ft3 ? this.getIndicatorDirection(ft3) : 'unknown';
    const ft4Direction = ft4 ? this.getIndicatorDirection(ft4) : 'unknown';

    if (tshDirection === 'high' && (ft4Direction === 'low' || ft3Direction === 'low')) {
      this.updateIndicatorSuggestion(tsh, '提示甲状腺功能减退倾向，建议结合 FT3、FT4 及内分泌专科进一步评估');
      this.updateIndicatorSuggestion(ft4, 'FT4 偏低并伴 TSH 升高，提示甲状腺功能减退倾向');
      this.updateIndicatorSuggestion(ft3, 'FT3 偏低并伴 TSH 升高，提示甲状腺功能减退倾向');
      return;
    }

    if (tshDirection === 'low' && (ft4Direction === 'high' || ft3Direction === 'high')) {
      this.updateIndicatorSuggestion(tsh, '提示甲状腺功能亢进倾向，建议结合 FT3、FT4 及内分泌专科进一步评估');
      this.updateIndicatorSuggestion(ft4, 'FT4 偏高并伴 TSH 降低，提示甲状腺功能亢进倾向');
      this.updateIndicatorSuggestion(ft3, 'FT3 偏高并伴 TSH 降低，提示甲状腺功能亢进倾向');
      return;
    }

    if (tshDirection === 'high') {
      this.updateIndicatorSuggestion(tsh, 'TSH 升高，若 FT3、FT4 正常需警惕亚临床甲减，建议复查甲功');
    } else if (tshDirection === 'low') {
      this.updateIndicatorSuggestion(tsh, 'TSH 降低，若 FT3、FT4 正常需警惕亚临床甲亢，建议复查甲功');
    }

    if (ft3Direction === 'high' || ft3Direction === 'low') {
      this.updateIndicatorSuggestion(ft3, 'FT3 异常，建议结合 TSH、FT4 综合评估甲状腺功能状态');
    }
    if (ft4Direction === 'high' || ft4Direction === 'low') {
      this.updateIndicatorSuggestion(ft4, 'FT4 异常，建议结合 TSH、FT3 综合评估甲状腺功能状态');
    }
  }

  private applyInflammationSuggestions(indicators: ReportIndicator[]): void {
    const wbc = this.findIndicatorByKeyword(indicators, '白细胞');
    const crp = this.findIndicatorByKeyword(indicators, 'C反应蛋白');
    const esr = this.findIndicatorByKeyword(indicators, '血沉');
    const pct = this.findIndicatorByKeyword(indicators, '降钙素原');

    const wbcDirection = wbc ? this.getIndicatorDirection(wbc) : 'unknown';
    const crpDirection = crp ? this.getIndicatorDirection(crp) : 'unknown';
    const esrDirection = esr ? this.getIndicatorDirection(esr) : 'unknown';
    const pctDirection = pct ? this.getIndicatorDirection(pct) : 'unknown';

    if (crpDirection === 'high') {
      const crpMessage = wbcDirection === 'high'
        ? 'C反应蛋白与白细胞同时升高，提示感染或炎症活动可能更高，建议结合症状及时评估'
        : 'C反应蛋白升高，提示炎症或感染活动，建议结合症状、血常规和医生评估';
      this.updateIndicatorSuggestion(crp, crpMessage);
    }

    if (esrDirection === 'high') {
      const esrMessage = crpDirection === 'high'
        ? '血沉与 C 反应蛋白同时升高，提示炎症活动存在，建议结合风湿免疫或感染情况评估'
        : '血沉升高，提示慢性炎症、自身免疫或感染活动可能';
      this.updateIndicatorSuggestion(esr, esrMessage);
    }

    if (pctDirection === 'high') {
      const pctMessage = crpDirection === 'high' || wbcDirection === 'high'
        ? '降钙素原升高并伴炎症指标异常，需警惕细菌感染，建议结合临床症状尽快评估'
        : '降钙素原升高，提示细菌感染或严重炎症反应可能';
      this.updateIndicatorSuggestion(pct, pctMessage);
    }
  }

  private findIndicatorByKeyword(indicators: ReportIndicator[], keyword: string): ReportIndicator | undefined {
    return indicators.find(indicator => indicator.name.includes(keyword));
  }

  private updateIndicatorSuggestion(indicator: ReportIndicator | undefined, suggestion: string): void {
    if (!indicator || !indicator.isAnomaly) {
      return;
    }
    indicator.suggestion = suggestion;
  }

  private getIndicatorDirection(indicator: ReportIndicator): 'normal' | 'high' | 'low' | 'positive' | 'unknown' {
    const numericValue = parseFloat(String(indicator.value).replace(/[↑↓⇅]/g, '').trim());
    if (!Number.isNaN(numericValue)) {
      const parsedRange = this.parseReferenceRange(indicator.referenceRange);
      if (!parsedRange) {
        return 'unknown';
      }
      if (parsedRange.max !== undefined && numericValue > parsedRange.max) {
        return 'high';
      }
      if (parsedRange.min !== undefined && numericValue < parsedRange.min) {
        return 'low';
      }
      return 'normal';
    }

    if (indicator.isAnomaly) {
      return 'positive';
    }
    if (/阴性|正常|未见/.test(indicator.value)) {
      return 'normal';
    }

    return 'unknown';
  }

  private looksLikeHealthReport(text: string): boolean {
    const normalized = text.toLowerCase();
    const reportMarkers = ['体检报告', 'medical examination report', '健康体检报告'];
    if (reportMarkers.some(marker => normalized.includes(marker))) {
      return true;
    }

    const strongLabKeywords = ['血糖', '糖化血红蛋白', '尿酸', '肌酐', '白细胞', '红细胞', '血红蛋白', '血小板', '胆固醇', '甘油三酯', '转氨酶', '心电图', '尿蛋白', '尿糖', '尿潜血', '尿白细胞', '促甲状腺激素', 'ft3', 'ft4', 'c反应蛋白', '血沉', '降钙素原', ...SPECIAL_FINDING_HEALTH_KEYWORDS];
    return strongLabKeywords.filter(keyword => normalized.includes(keyword.toLowerCase())).length >= 2;
  }

  private getHealthKeywordHitCount(text: string): number {
    const healthKeywords = ['体检', '报告', '血糖', '糖化血红蛋白', '尿酸', '肌酐', '白细胞', '红细胞', '血红蛋白', '血小板', '胆固醇', '甘油三酯', '转氨酶', '心电图', '尿蛋白', '尿糖', '尿潜血', '尿白细胞', '促甲状腺激素', 'ft3', 'ft4', 'c反应蛋白', '血沉', '降钙素原', ...SPECIAL_FINDING_HEALTH_KEYWORDS];
    const normalized = text.toLowerCase();
    return healthKeywords.filter(keyword => normalized.includes(keyword.toLowerCase())).length;
  }

  private extractEcgFindingValue(line: string): string {
    const normalized = this.normalizeReportLine(line)
      .replace(/^.*?心电图[:：]?\s*/, '')
      .replace(/^检查所见[:：]?\s*/, '')
      .trim();

    if (!normalized) {
      return '异常';
    }
    if (/窦性心律|正常心电图|未见异常/.test(normalized)) {
      return '正常';
    }

    const cleaned = normalized
      .replace(/^.*?(异常心电图)/, '$1')
      .replace(/^[·•]/, '')
      .trim();

    return cleaned || '异常';
  }

  private createUploadReportIndicators(): ReportIndicator[] {
    return [{
      name: '⚠️ 请上传体检报告',
      value: '未检测到体检指标',
      unit: '',
      referenceRange: '',
      isAnomaly: false,
      severity: 'normal',
      suggestion: '请上传包含血常规、肝功能、血糖等指标的体检报告',
    }];
  }

  private createParseFailureIndicators(message: string): ReportIndicator[] {
    return [{
      name: '⚠️ 解析失败',
      value: '未检测到有效指标',
      unit: '',
      referenceRange: '',
      isAnomaly: false,
      severity: 'normal',
      suggestion: message,
    }];
  }

  private async analyzeWithAI(indicators: ReportIndicator[], userId: string): Promise<string> {
    const anomalyItems = indicators.filter(i => i.isAnomaly);
    
    if (anomalyItems.length === 0) {
      return [
        '【总体结论】',
        '本次体检未识别到明确异常指标，整体健康状况看起来较稳定。',
        '',
        '【建议怎么做更稳】',
        '• 运动：每周累计 150 分钟中等强度有氧（快走/骑行/游泳等），外加 2 次力量训练（20 分钟/次）。',
        '• 饮食：多蔬果、优质蛋白、全谷物；少油少盐少糖，尽量少饮酒；保持三餐规律。',
        '• 睡眠：固定起床时间，保证 7-8 小时；睡前 1 小时减少屏幕刺激和咖啡因。',
        '• 体重与腰围：如有超重/腹型肥胖，优先把体重缓慢降到更健康区间（避免快速减重）。',
        '',
        '【复查建议】',
        '• 一般建议每年 1 次体检；如有慢病或家族史，可按医生建议缩短复查间隔。',
        '',
        '【重要提示】',
        '以上建议仅供参考，不能替代医生面诊。如有胸痛、呼吸困难、持续高热、明显头晕乏力等不适，请及时就医。',
      ].join('\n');
    }

    const indicatorList = anomalyItems.map((i, index) => {
      const value = i.value === undefined || i.value === null || i.value === '' ? '--' : String(i.value);
      const unit = i.unit ? i.unit : '';
      const range = i.referenceRange ? i.referenceRange : '信息不足';
      const severityLabel = i.severity === 'serious'
        ? '重点关注'
        : i.severity === 'abnormal'
          ? '异常'
          : i.severity === 'slight'
            ? '轻度异常'
            : '异常';
      const suggestion = i.suggestion ? `；提示：${i.suggestion}` : '';
      return `${index + 1}. ${i.name}：${value}${unit}（参考范围：${range}；程度：${severityLabel}${suggestion}）`;
    }).join('\n');

    const prompt = `你是一名严谨的体检报告解读与健康管理顾问（偏谨慎、科普向）。请基于“异常指标清单”输出一份【可执行的健康建议】。

【硬性要求】
1. 用中文输出，结构化清晰。
2. 不要编造体检报告里不存在的指标、数值、检查结论；信息不足就写“信息不足/建议补充”，不要瞎猜。
3. 不下确定诊断，用“可能/倾向/需要结合医生评估”等表述。
4. 建议更详细：总字数建议约 900-1800 字。
5. 必须包含“7天行动计划（每天 1-2 个具体任务）”。
6. 不要写异常总数、剩余项数量等数字汇总，直接表述为“异常指标/相关指标/其余内容”即可。
7. 结尾必须单独一行输出：仅供参考，如有不适请就医。

【异常指标清单】
${indicatorList}

【输出要求】
优先使用以下小标题（每节都要有内容）：
- 【总体评估（先给结论与优先级）】
- 【逐项解读（每项：意义/常见原因/你可以怎么做/建议复查或就医）】
- 【生活方式处方（饮食/运动/睡眠/体重管理/戒烟限酒/压力管理）】
- 【7天行动计划（每天 1-2 个任务）】
- 【建议的复查/进一步检查（含建议就医科室）】
- 【何时需要就医/急诊（红旗信号）】
- 【中医调理思路（仅作科普）】
- 【你还可以补充的信息】`;

    try {
      const result = execSync(
        `~/.local/bin/opencode run ${JSON.stringify(prompt)} 2>/dev/null`,
        { encoding: 'utf-8', timeout: 60000, maxBuffer: 1024 * 1024 }
      );
      return result.trim() || this.generateDefaultAnalysis(anomalyItems);
    } catch (error) {
      console.error('AI分析失败:', error);
      return this.generateDefaultAnalysis(anomalyItems);
    }
  }

  private generateDefaultAnalysis(anomalyItems: ReportIndicator[]): string {
    const summary = '您的体检报告提示存在需要关注的异常指标，建议结合既往病史、近期症状与复查结果综合判断。';

    const abnormalList = anomalyItems
      .slice(0, 12)
      .map((i) => {
        const range = i.referenceRange ? `（参考范围：${i.referenceRange}）` : '';
        return `- ${i.name}: ${i.value}${i.unit}${range}`;
      })
      .join('\n');
    const omitted = anomalyItems.length > 12 ? '\n- （其余内容略）' : '';

    const perItemNotes = anomalyItems
      .slice(0, 8)
      .map((i, idx) => {
        const value = i.value === undefined || i.value === null || i.value === '' ? '--' : String(i.value);
        const unit = i.unit ? i.unit : '';
        const range = i.referenceRange ? `（参考范围：${i.referenceRange}）` : '';
        const severityLabel = i.severity === 'serious'
          ? '重点关注'
          : i.severity === 'abnormal'
            ? '异常'
            : i.severity === 'slight'
              ? '轻度异常'
              : '异常';
        const suggestion = i.suggestion || generateAnomalySuggestions(i);
        return `${idx + 1}. ${i.name}：${value}${unit}${range}（${severityLabel}）\n   - 建议：${suggestion}`;
      })
      .join('\n');
    const perItemOmitted = anomalyItems.length > 8 ? '\n（其余内容建议在页面列表中逐项查看。）' : '';

    const categories: Record<string, string[]> = {
      肝功能: anomalyItems.filter(i => i.name.includes('转氨酶') || i.name.includes('ALT') || i.name.includes('AST') || i.name.includes('胆红素')).map(i => i.name),
      血糖: anomalyItems.filter(i => i.name.includes('血糖') || i.name.includes('GLU') || i.name.includes('糖化血红蛋白') || i.name.includes('HbA1c')).map(i => i.name),
      血脂: anomalyItems.filter(i => i.name.includes('甘油三酯') || i.name.includes('胆固醇') || i.name.includes('TG') || i.name.includes('TC') || i.name.includes('LDL') || i.name.includes('HDL')).map(i => i.name),
      血常规: anomalyItems.filter(i => i.name.includes('白细胞') || i.name.includes('血红蛋白') || i.name.includes('血小板') || i.name.includes('WBC') || i.name.includes('HGB') || i.name.includes('PLT')).map(i => i.name),
      肾功能: anomalyItems.filter(i => i.name.includes('肌酐') || i.name.includes('尿素') || i.name.includes('尿酸') || i.name.includes('eGFR')).map(i => i.name),
    };

    const lifestyle: string[] = [];
    if (categories.肝功能.length > 0) {
      lifestyle.push('• 肝功能相关：近1-2周避免饮酒与熬夜，减少油炸/高脂饮食；若有乏力、食欲差、黄疸、右上腹不适，建议尽快就医复查肝功并结合肝胆彩超。');
    }
    if (categories.血糖.length > 0) {
      lifestyle.push('• 血糖相关：主食定量、减少含糖饮料/甜点，优先全谷物与高纤维蔬菜；每周≥150分钟中等强度有氧运动（如快走/骑行），并关注体重与腰围变化。');
    }
    if (categories.血脂.length > 0) {
      lifestyle.push('• 血脂相关：减少肥肉/动物油/反式脂肪，增加鱼类、豆制品、坚果（适量）；配合规律运动与体重管理，通常需要在 1-3 个月后复查评估趋势。');
    }
    if (categories.肾功能.length > 0) {
      lifestyle.push('• 肾功能/尿酸相关：保证饮水（如无心肾限制），减少高嘌呤饮食与酒精；避免滥用止痛药，复查时可同时关注尿常规与血压。');
    }
    if (categories.血常规.length > 0) {
      lifestyle.push('• 血常规相关：若提示贫血或营养不足，注意铁/蛋白质摄入（瘦肉、豆类、蛋奶），必要时结合医生建议进一步查铁蛋白、叶酸、维B12等。');
    }
    if (lifestyle.length === 0) {
      lifestyle.push('• 先关注作息、饮食与运动的整体规律性，并在 1-3 个月内复查相关指标，观察是否为一过性波动。');
    }

    const followUp: string[] = [
      '• 建议携带本次报告到体检/门诊复核，结合既往结果判断趋势。',
      '• 一般可在 1-3 个月内复查相关异常指标（具体以医生建议为准）。',
      '• 若合并基础疾病（如高血压、糖尿病、脂肪肝等），建议进行长期管理与随访。',
    ];

    const redFlags: string[] = [
      '• 胸痛、明显胸闷气短、突然一侧肢体无力/言语不清等情况，请立即就医或呼叫急救。',
      '• 持续高热、明显黄疸（皮肤/眼白发黄）、黑便/呕血、持续呕吐等情况，建议尽快就医。',
      '• 剧烈腹痛、呼吸困难、意识改变等急症表现，应立即就医。',
    ];

    const actionPlan: string[] = [
      '第1天：把异常项截图保存，记录当天饮食与睡眠；晚饭后快走 20 分钟。',
      '第2天：含糖饮料全部换成白水/无糖茶；睡前提前 30 分钟上床。',
      '第3天：三餐加一份蔬菜；做 15 分钟拉伸或轻力量训练。',
      '第4天：外食少油少盐，主食减量并加一份优质蛋白；快走 30 分钟。',
      '第5天：晚饭不晚于睡前 3 小时；睡前做 10 分钟呼吸放松。',
      '第6天：做一次 20 分钟力量训练；整理复查项目与时间。',
      '第7天：回顾一周记录，挑 2 个最容易坚持的习惯继续做 4 周，再复查评估。',
    ];

    return `【总体评估】\n${summary}\n\n【异常指标（节选）】\n${abnormalList}${omitted}\n\n【逐项要点（节选）】\n${perItemNotes}${perItemOmitted}\n\n【生活方式建议】\n${lifestyle.join('\n')}\n\n【7天行动计划】\n${actionPlan.join('\n')}\n\n【复查/就医建议】\n${followUp.join('\n')}\n\n【需要立即就医/急诊的情况】\n${redFlags.join('\n')}\n\n仅供参考，如有不适请就医。`;
  }

  private saveReportToFile(report: HealthReport): void {
    const filePath = path.join(UPLOAD_DIR, `${report.id}.json`);
    const data = {
      ...report,
      uploadTime: report.uploadTime.toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  async getReport(reportId: string): Promise<HealthReport | null> {
    const filePath = path.join(UPLOAD_DIR, `${reportId}.json`);

    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const report: HealthReport = {
          ...data,
          uploadTime: new Date(data.uploadTime),
        };
        reports.set(reportId, report);
        return report;
      } catch (error) {
        console.error('读取报告文件失败:', error);
      }
    }

    return reports.get(reportId) || null;
  }

  async getReportHistory(userId: string, page: number = 1, pageSize: number = 10): Promise<HealthReport[]> {
    const userReports: HealthReport[] = [];
    
    reports.forEach((report) => {
      if (report.userId === userId) {
        userReports.push(report);
      }
    });

    if (userReports.length === 0) {
      const files = fs.readdirSync(UPLOAD_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(UPLOAD_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.userId === userId) {
          const report: HealthReport = {
            ...data,
            uploadTime: new Date(data.uploadTime),
          };
          reports.set(data.id, report);
          userReports.push(report);
        }
      }
    }

    userReports.sort((a, b) => b.uploadTime.getTime() - a.uploadTime.getTime());
    const start = (page - 1) * pageSize;
    return userReports.slice(start, start + pageSize);
  }

  async getLatestParsedReport(userId: string): Promise<HealthReport | null> {
    const history = await this.getReportHistory(userId, 1, 20);
    return history.find((report) => isUsableParsedReport(report)) || null;
  }

  async generatePDFReport(reportId: string): Promise<string | null> {
    const report = await this.getReport(reportId);
    if (!report) return null;

    try {
      const jsPDF = require('jspdf');
      require('jspdf-autotable');
      
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('体检报告分析报告', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`报告编号: ${report.id}`, 20, 35);
      doc.text(`生成时间: ${new Date().toLocaleDateString()}`, 20, 45);
      doc.text(`异常项数: ${report.anomalyCount}`, 20, 55);

      if (report.indicators && report.indicators.length > 0) {
        const tableData = report.indicators.map(i => [
          i.name,
          i.value + ' ' + i.unit,
          i.referenceRange,
          i.isAnomaly ? (i.severity === 'serious' ? '严重异常' : i.severity === 'abnormal' ? '异常' : '轻度异常') : '正常',
        ]);

        (doc as any).autoTable({
          startY: 65,
          head: [['指标名称', '检测值', '参考范围', '状态']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [196, 30, 58] },
        });
      }

      if (report.aiAnalysis) {
        const analysisY = (doc as any).lastAutoTable?.finalY || 120;
        doc.setFontSize(14);
        doc.text('AI分析建议', 20, analysisY + 15);
        
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(report.aiAnalysis, 170);
        doc.text(lines, 20, analysisY + 25);
      }

      const pdfPath = path.join(UPLOAD_DIR, `${reportId}_analysis.pdf`);
      doc.save(pdfPath);
      
      return pdfPath;
    } catch (error) {
      console.error('生成PDF失败:', error);
      return null;
    }
  }

  async reAnalyze(reportId: string): Promise<any> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error('报告不存在');
    }

    if (report.reportUrl && fs.existsSync(report.reportUrl)) {
      const originalName = report.originalName || path.basename(report.reportUrl);

      if (originalName.toLowerCase().endsWith('.pdf')) {
        const parsedContent = await this.parsePdfContent(report.reportUrl);
        report.indicators = parsedContent.indicators;
        report.extractedText = parsedContent.extractedText;
      } else if (originalName.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        report.indicators = await this.parseImage(report.reportUrl);
        report.extractedText = '';
      }

      report.anomalyCount = report.indicators.filter(i => i.isAnomaly).length;
    }

    const parseFailure = report.indicators.find(i => i.name.startsWith('⚠️'));
    if (parseFailure) {
      report.aiAnalysis = `⚠️ 无法分析：${parseFailure.suggestion || '报告解析失败，请重新上传后再试。'}`;
      report.analysisResult = report.aiAnalysis;
      this.saveReportToFile(report);

      return {
        reportId,
        aiAnalysis: report.aiAnalysis,
        extractedText: report.extractedText,
      };
    }

    const aiAnalysis = await this.analyzeWithAI(report.indicators, report.userId);
    report.aiAnalysis = aiAnalysis;
    report.analysisResult = aiAnalysis;
    this.saveReportToFile(report);

    return {
      reportId,
      aiAnalysis,
      extractedText: report.extractedText,
    };
  }
}

export const reportService = new ReportService();
