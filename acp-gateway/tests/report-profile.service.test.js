const path = require('path');

const servicePath = path.resolve(__dirname, '../dist/services/report-profile.service.js');
const storePath = path.resolve(__dirname, '../dist/services/user-profile.store.js');

describe('report-profile.service', () => {
  afterEach(() => {
    const { userProfiles, reportDerivedProfiles } = require(storePath);
    userProfiles.clear();
    reportDerivedProfiles.clear();
  });

  test('builds a report-derived profile from structured findings', () => {
    const { buildProfileFromReport } = require(servicePath);

    const profile = buildProfileFromReport({
      id: 'report_profile_test_1',
      userId: 'u1',
      uploadTime: new Date('2026-04-10T08:00:00.000Z'),
      extractedText: '既往史 : 高血压史(治疗中) HP 阳性 甲状腺右叶结节',
      indicators: [
        {
          name: '甘油三酯(TG)',
          value: '2.58',
          unit: 'mmol/L',
          referenceRange: '0.4-1.8',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议控制精制碳水和饮酒，增加运动并复查血脂',
        },
        {
          name: '脂肪肝',
          value: '脂肪肝(中度)',
          unit: '',
          referenceRange: '未见异常',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议低脂饮食并规律运动',
        },
      ],
      anomalyCount: 2,
      status: 'parsed',
    });

    expect(profile).not.toBeNull();
    expect(profile.chronicDisease).toEqual(expect.arrayContaining(['高血压', '高血脂', '脂肪肝', '胃炎', '幽门螺杆菌感染', '甲状腺异常']));
    expect(profile.healthGoals).toEqual(expect.arrayContaining(['降压', '控脂', '护肝', '养胃']));
    expect(profile.lastCheckup).toBe('2026-04-10');
    expect(profile.reportReferenceId).toBe('report_profile_test_1');
  });

  test('rebuilds and stores the latest report-derived profile', () => {
    const { rebuildProfileFromReport } = require(servicePath);
    const { getEffectiveHealthProfile, reportDerivedProfiles } = require(storePath);

    const profile = rebuildProfileFromReport({
      id: 'report_profile_test_2',
      userId: 'u2',
      uploadTime: new Date('2026-04-12T09:00:00.000Z'),
      extractedText: '双侧基底节区多发腔隙性脑梗塞',
      indicators: [
        {
          name: '左心室舒张功能减低',
          value: '左心室舒张功能减低',
          unit: '',
          referenceRange: '未见异常',
          isAnomaly: true,
          severity: 'abnormal',
          suggestion: '建议结合血压、心脏彩超和心内科意见综合评估',
        },
      ],
      anomalyCount: 1,
      status: 'parsed',
    });

    expect(profile).not.toBeNull();
    expect(reportDerivedProfiles.get('u2').reportReferenceId).toBe('report_profile_test_2');

    const effectiveProfile = getEffectiveHealthProfile('u2');
    expect(effectiveProfile.chronicDisease).toEqual(expect.arrayContaining(['心血管异常', '脑血管风险']));
    expect(effectiveProfile.healthGoals).toEqual(expect.arrayContaining(['降压', '控脂']));
  });

  test('does not derive diseases from generic AI analysis examples', () => {
    const { buildProfileFromReport } = require(servicePath);

    const profile = buildProfileFromReport({
      id: 'report_profile_test_3',
      userId: 'u3',
      uploadTime: new Date('2026-04-12T09:00:00.000Z'),
      extractedText: '体检未见明显异常',
      aiAnalysis: '若合并基础疾病（如高血压、糖尿病、脂肪肝等），建议长期管理与随访。',
      indicators: [
        {
          name: '心电图',
          value: '正常',
          unit: '',
          referenceRange: '正常',
          isAnomaly: false,
          severity: 'normal',
          suggestion: '',
        },
      ],
      anomalyCount: 0,
      status: 'parsed',
    });

    expect(profile).not.toBeNull();
    expect(profile.chronicDisease || []).toEqual([]);
    expect(profile.healthGoals || []).toEqual([]);
  });
});
