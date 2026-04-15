import { Router, Request, Response } from 'express';
import { rebuildProfileFromReport } from '../services/report-profile.service';
import { reportService } from '../services/report.service';
import { getEffectiveHealthProfile, userProfiles } from '../services/user-profile.store';
import { isUserScopeAllowed, requireAuth, resolveRequestUserId } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

interface HealthProfile {
  id: string;
  userId: string;
  name?: string;
  age?: number;
  gender?: string;
  chronicDisease?: string[];
  allergy?: string[];
  symptoms?: string[];
  surgeryHistory?: string[];
  familyHistory?: string[];
  medicationHistory?: string[];
  dietHabit?: string;
  exerciseHabit?: string;
  sleepInfo?: string;
  lastCheckup?: string;
  stressLevel?: number;
  healthGoals?: string[];
  constitutionType?: string;
}

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const requestedUserId = req.query.userId as string | undefined;
    if (!isUserScopeAllowed(req, requestedUserId)) {
      res.status(403).json({
        code: 403,
        message: '无权访问其他用户档案',
      });
      return;
    }

    const userId = resolveRequestUserId(req, requestedUserId || undefined);

    if (!userId) {
      res.status(400).json({
        code: 400,
        message: 'userId is required',
      });
      return;
    }

    let profile = getEffectiveHealthProfile(userId);
    if (!profile) {
      const latestReport = await reportService.getLatestParsedReport(userId);
      rebuildProfileFromReport(latestReport);
      profile = getEffectiveHealthProfile(userId);
    }

    if (!profile) {
      res.json({
        code: 0,
        data: null,
      });
      return;
    }

    res.json({
      code: 0,
      data: profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      code: 500,
      message: '获取健康档案失败',
    });
  }
});

router.post('/profile', (req: Request, res: Response) => {
  const { 
    userId: bodyUserId, 
    name,
    age,
    gender,
    chronicDisease,
    allergy,
    symptoms,
    surgeryHistory,
    familyHistory,
    medicationHistory,
    dietHabit, 
    exerciseHabit, 
    sleepInfo,
    lastCheckup,
    stressLevel, 
    healthGoals, 
    constitutionType 
  } = req.body;

  if (!isUserScopeAllowed(req, bodyUserId)) {
    res.status(403).json({
      code: 403,
      message: '无权修改其他用户档案',
    });
    return;
  }

  const userId = resolveRequestUserId(req, bodyUserId || undefined);
  if (!userId) {
    res.status(400).json({
      code: 400,
      message: 'userId is required',
    });
    return;
  }

  const profile: HealthProfile = {
    id: `profile_${userId}`,
    userId,
    name,
    age,
    gender,
    chronicDisease: chronicDisease || [],
    allergy: allergy || [],
    symptoms: symptoms || [],
    surgeryHistory: surgeryHistory || [],
    familyHistory: familyHistory || [],
    medicationHistory: medicationHistory || [],
    dietHabit: dietHabit || '',
    exerciseHabit: exerciseHabit || '',
    sleepInfo: sleepInfo || '',
    lastCheckup: lastCheckup || '',
    stressLevel: stressLevel || 3,
    healthGoals: healthGoals || [],
    constitutionType,
  };

  userProfiles.set(userId, profile);
  const mergedProfile = getEffectiveHealthProfile(userId);

  res.json({
    code: 0,
    data: mergedProfile,
  });
});

export { router as healthRouter };
