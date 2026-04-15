const path = require('path');
const { execFileSync } = require('child_process');

const reportsDir = path.resolve(__dirname, '../uploads/reports');
const servicePath = path.resolve(__dirname, '../dist/services/report.service.js');
const findingLibraryPath = path.resolve(__dirname, '../dist/services/report-special-findings-library.js');
const RESULT_MARKER = '__REPORT_RESULT__';

const getPdfPath = (fileName) => path.join(reportsDir, fileName);

const parsePdf = (fileName) => {
  const script = `
    const { reportService } = require(${JSON.stringify(servicePath)});
    const filePath = ${JSON.stringify(getPdfPath(fileName))};
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    (async () => {
      const indicators = await reportService.parsePDF(filePath);
      process.stdout.write(${JSON.stringify(RESULT_MARKER)} + JSON.stringify(indicators));
    })().catch((error) => {
      process.stderr.write(String(error && error.stack ? error.stack : error));
      process.exit(1);
    });
  `;

  const output = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  const markerIndex = output.lastIndexOf(RESULT_MARKER);
  if (markerIndex === -1) {
    throw new Error(`Missing parse output marker for ${fileName}`);
  }

  return JSON.parse(output.slice(markerIndex + RESULT_MARKER.length));
};

const parseText = (text) => {
  const script = `
    const { reportService } = require(${JSON.stringify(servicePath)});
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    const indicators = reportService.extractIndicatorsFromText(${JSON.stringify(text)});
    process.stdout.write(${JSON.stringify(RESULT_MARKER)} + JSON.stringify(indicators));
  `;

  const output = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  const markerIndex = output.lastIndexOf(RESULT_MARKER);
  if (markerIndex === -1) {
    throw new Error('Missing parse output marker for text input');
  }

  return JSON.parse(output.slice(markerIndex + RESULT_MARKER.length));
};

const findIndicator = (indicators, keyword) =>
  indicators.find((indicator) => indicator.name.includes(keyword));

const getFindingRuleCount = () => {
  const script = `
    const { SPECIAL_FINDING_LIBRARY } = require(${JSON.stringify(findingLibraryPath)});
    process.stdout.write(${JSON.stringify(RESULT_MARKER)} + JSON.stringify({ count: SPECIAL_FINDING_LIBRARY.length }));
  `;

  const output = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  const markerIndex = output.lastIndexOf(RESULT_MARKER);
  if (markerIndex === -1) {
    throw new Error('Missing rule count output marker');
  }

  return JSON.parse(output.slice(markerIndex + RESULT_MARKER.length)).count;
};

describe('ReportService PDF parsing', () => {
  test('parses ciming reports with exact lab values and ECG normal', () => {
    const indicators = parsePdf('report-1775029731210-261936425.pdf');

    expect(findIndicator(indicators, '白细胞').value).toBe('6.23');
    expect(findIndicator(indicators, '血小板').value).toBe('259.0');
    expect(findIndicator(indicators, '总胆固醇').value).toBe('4.41');
    expect(findIndicator(indicators, '甘油三酯').value).toBe('0.98');
    expect(findIndicator(indicators, '尿酸').value).toBe('304.00');
    expect(findIndicator(indicators, '心电图').value).toBe('正常');
  });

  test('captures additional real indicators in aikang reports without inventing ALT', () => {
    const indicators = parsePdf('0010900225880955.pdf');

    expect(findIndicator(indicators, '谷草转氨酶').value).toBe('15');
    expect(findIndicator(indicators, '碱性磷酸酶').value).toBe('62');
    expect(findIndicator(indicators, '总胆红素').value).toBe('8.1');
    expect(findIndicator(indicators, '空腹血糖').value).toBe('4.72');
    expect(findIndicator(indicators, '糖化血红蛋白').value).toBe('5.6');
    expect(findIndicator(indicators, '总胆固醇').value).toBe('4.85');
    expect(findIndicator(indicators, '甘油三酯').value).toBe('1.39');
    expect(findIndicator(indicators, '尿酸').value).toBe('282');
    expect(findIndicator(indicators, '促甲状腺激素').value).toBe('1.858');
    expect(findIndicator(indicators, '谷丙转氨酶')).toBeUndefined();
  });

  test('parses meinian reports and keeps abnormal triglyceride detection', () => {
    const indicators = parsePdf('美年体检报告1.pdf');
    const tg = findIndicator(indicators, '甘油三酯');

    expect(findIndicator(indicators, '谷丙转氨酶').value).toBe('18.1');
    expect(findIndicator(indicators, '总胆固醇').value).toBe('5');
    expect(tg.value).toBe('2.58');
    expect(tg.isAnomaly).toBe(true);
    expect(findIndicator(indicators, '尿酸').value).toBe('181');
    expect(findIndicator(indicators, '血管弹性减弱')).toMatchObject({ value: '血管弹性重度减弱', isAnomaly: true });
    expect(findIndicator(indicators, '幽门螺杆菌阳性')).toMatchObject({ value: 'HP 阳性', isAnomaly: true });
    expect(findIndicator(indicators, '红细胞压积')).toMatchObject({ value: '35.1', isAnomaly: true });
  });

  test('repairs mojibake PDFs before extracting indicators', () => {
    const indicators = parsePdf('report-1774837233984-361205328.pdf');

    expect(findIndicator(indicators, '白细胞').value).toBe('6.5');
    expect(findIndicator(indicators, '红细胞').value).toBe('4.5');
    expect(findIndicator(indicators, '血红蛋白').value).toBe('135');
    expect(findIndicator(indicators, '空腹血糖').value).toBe('5.5');
    expect(findIndicator(indicators, '谷丙转氨酶').value).toBe('35');
    expect(findIndicator(indicators, '甘油三酯').value).toBe('1.2');
  });

  test('ignores educational guidance pages when extracting aikang narrative findings', () => {
    const indicators = parsePdf('report-1775830435729-390647771.pdf');
    const names = indicators.filter((indicator) => indicator.isAnomaly).map((indicator) => indicator.name);

    expect(names).toEqual(expect.arrayContaining(['甲状腺结节', '乳腺结节', '乳腺增生', '支气管扩张', '窦性心律不齐', '屈光不正']));
    expect(names).not.toContain('肺结节');
    expect(names).not.toContain('近视');
    expect(names).not.toContain('鼻窦炎');
  });

  test('ignores personal history and historical comparison sections in ciming reports', () => {
    const indicators = parsePdf('report-1776148669373-595659707.pdf');
    const anomalies = indicators.filter((indicator) => indicator.isAnomaly);
    const names = anomalies.map((indicator) => indicator.name);

    expect(names).toContain('屈光不正');
    expect(names).not.toContain('脂肪肝');
    expect(names).not.toContain('子宫肌瘤');
    expect(names).not.toContain('卵巢囊肿');
    expect(names).not.toContain('胆囊息肉');
    expect(names).not.toContain('胆囊结石');
    expect(names).not.toContain('肾结石');
    expect(names).not.toContain('肺结节');
    expect(names).not.toContain('高密度脂蛋白(HDL)');
  });

  test('rejects non-report PDFs instead of inventing lab data', () => {
    const indicators = parsePdf('report-1774834170986-772567725.pdf');

    expect(indicators).toHaveLength(1);
    expect(indicators[0].name).toBe('⚠️ 请上传体检报告');
  });

  test('detects qualitative urine anomalies with graded severity', () => {
    const indicators = parseText(`
      尿蛋白 PRO ++ 阴性
      尿糖 GLU 阴性 阴性
      尿酮体 KET ± 阴性
      尿潜血 BLD + 阴性
      白细胞(LEU) 阳性 阴性
    `);

    expect(findIndicator(indicators, '尿蛋白')).toMatchObject({ value: '++', isAnomaly: true, severity: 'abnormal' });
    expect(findIndicator(indicators, '尿糖')).toMatchObject({ value: '阴性', isAnomaly: false, severity: 'normal' });
    expect(findIndicator(indicators, '尿酮体')).toMatchObject({ value: '±', isAnomaly: true, severity: 'slight' });
    expect(findIndicator(indicators, '尿潜血')).toMatchObject({ value: '+', isAnomaly: true, severity: 'slight' });
    expect(findIndicator(indicators, '尿白细胞')).toMatchObject({ value: '阳性', isAnomaly: true, severity: 'abnormal' });
  });

  test('adds contextual thyroid and inflammation suggestions', () => {
    const indicators = parseText(`
      促甲状腺激素 TSH 8.20 0.35-5.5
      游离甲状腺素 FT4 8.10 10.3-24.2
      游离三碘甲状腺原氨酸 FT3 2.00 2.3-6.3
      C反应蛋白 CRP 18.0 <10
      血沉 ESR 35 0-20
      降钙素原 PCT 0.86 <0.5
      白细胞 WBC 12.5 4-10
    `);

    expect(findIndicator(indicators, '促甲状腺激素').suggestion).toContain('甲状腺功能减退');
    expect(findIndicator(indicators, '游离甲状腺素').suggestion).toContain('甲状腺功能减退');
    expect(findIndicator(indicators, 'C反应蛋白').suggestion).toContain('白细胞同时升高');
    expect(findIndicator(indicators, '血沉').suggestion).toContain('C 反应蛋白同时升高');
    expect(findIndicator(indicators, '降钙素原').suggestion).toContain('细菌感染');
  });

  test('extracts narrative conclusion abnormalities from numbered report summaries', () => {
    const indicators = parseText(`
      【1】 乳腺结节待查
      【2】 体重指数增高
      【3】 屈光不正
      【4】 宫颈TCT提示轻度炎症反应性细胞改变
      【5】 多发性子宫肌瘤可能
      【6】 双侧乳腺小叶增生
      【7】 甲状腺腺体回声欠均匀
      【8】 ⅡⅢaVF导联轻度T波改变
    `);

    expect(findIndicator(indicators, '乳腺结节')).toMatchObject({ value: '乳腺结节待查', isAnomaly: true });
    expect(findIndicator(indicators, '体重指数')).toMatchObject({ value: '体重指数增高', isAnomaly: true });
    expect(findIndicator(indicators, '屈光不正')).toMatchObject({ value: '屈光不正', isAnomaly: true });
    expect(findIndicator(indicators, '宫颈TCT')).toMatchObject({ value: '宫颈TCT提示轻度炎症反应性细胞改变', isAnomaly: true });
    expect(findIndicator(indicators, '子宫肌瘤')).toMatchObject({ value: '多发性子宫肌瘤可能', isAnomaly: true });
    expect(findIndicator(indicators, '乳腺小叶增生')).toMatchObject({ value: '双侧乳腺小叶增生', isAnomaly: true });
    expect(findIndicator(indicators, '甲状腺回声欠均匀')).toMatchObject({ value: '甲状腺腺体回声欠均匀', isAnomaly: true });
    expect(findIndicator(indicators, 'T波改变')).toMatchObject({ value: 'ⅡⅢaVF导联轻度T波改变', isAnomaly: true });
  });

  test('ships at least 100 common conclusion rules for health reports', () => {
    expect(getFindingRuleCount()).toBeGreaterThanOrEqual(100);
  });
});
