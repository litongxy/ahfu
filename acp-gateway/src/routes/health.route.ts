import { Router, Request, Response } from 'express';
import { userProfiles } from '../services/user-profile.store';
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

router.get('/profile', (req: Request, res: Response) => {
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

  const profile = userProfiles.get(userId);

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

  res.json({
    code: 0,
    data: profile,
  });
});

export { router as healthRouter };
