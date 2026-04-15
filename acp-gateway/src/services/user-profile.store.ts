export interface HealthProfile {
  id?: string;
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
  reportReferenceId?: string;
  reportDerivedAt?: string;
  profileSource?: 'manual' | 'report' | 'merged';
}

export const userProfiles: Map<string, HealthProfile> = new Map();
export const reportDerivedProfiles: Map<string, HealthProfile> = new Map();

const PROFILE_LIST_FIELDS = [
  'chronicDisease',
  'allergy',
  'symptoms',
  'surgeryHistory',
  'familyHistory',
  'medicationHistory',
  'healthGoals',
] as const;

type ProfileListField = typeof PROFILE_LIST_FIELDS[number];

function normalizeStringList(values?: string[]): string[] | undefined {
  if (!Array.isArray(values)) return undefined;

  const normalized = Array.from(
    new Set(
      values
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );

  return normalized.length > 0 ? normalized : undefined;
}

function pickPreferredValue<T>(primary?: T, fallback?: T): T | undefined {
  if (typeof primary === 'string') {
    return primary.trim() ? primary : fallback;
  }
  if (typeof primary === 'number') {
    return Number.isFinite(primary) ? primary : fallback;
  }
  if (primary !== undefined && primary !== null) {
    return primary;
  }
  return fallback;
}

function pickMergedList(
  manual: HealthProfile | null | undefined,
  derived: HealthProfile | null | undefined,
  field: ProfileListField
): string[] | undefined {
  const manualItems = normalizeStringList(manual?.[field]);
  const derivedItems = normalizeStringList(derived?.[field]);

  return normalizeStringList([
    ...(manualItems ?? []),
    ...(derivedItems ?? []),
  ]);
}

export function mergeHealthProfiles(
  manual: HealthProfile | null | undefined,
  derived: HealthProfile | null | undefined
): HealthProfile | null {
  const userId = manual?.userId || derived?.userId;
  if (!userId) return null;

  const merged: HealthProfile = {
    id: pickPreferredValue(manual?.id, derived?.id) ?? `profile_${userId}`,
    userId,
    name: pickPreferredValue(manual?.name, derived?.name),
    age: pickPreferredValue(manual?.age, derived?.age),
    gender: pickPreferredValue(manual?.gender, derived?.gender),
    dietHabit: pickPreferredValue(manual?.dietHabit, derived?.dietHabit),
    exerciseHabit: pickPreferredValue(manual?.exerciseHabit, derived?.exerciseHabit),
    sleepInfo: pickPreferredValue(manual?.sleepInfo, derived?.sleepInfo),
    lastCheckup: pickPreferredValue(manual?.lastCheckup, derived?.lastCheckup),
    stressLevel: pickPreferredValue(manual?.stressLevel, derived?.stressLevel),
    constitutionType: pickPreferredValue(manual?.constitutionType, derived?.constitutionType),
    reportReferenceId: derived?.reportReferenceId,
    reportDerivedAt: derived?.reportDerivedAt,
    profileSource: manual && derived ? 'merged' : manual ? 'manual' : 'report',
  };

  for (const field of PROFILE_LIST_FIELDS) {
    const mergedItems = pickMergedList(manual, derived, field);
    if (mergedItems) {
      merged[field] = mergedItems;
    }
  }

  return merged;
}

export function getEffectiveHealthProfile(userId: string): HealthProfile | null {
  return mergeHealthProfiles(
    userProfiles.get(userId) ?? null,
    reportDerivedProfiles.get(userId) ?? null
  );
}

export function setReportDerivedProfile(userId: string, profile: HealthProfile | null): void {
  if (!profile) {
    reportDerivedProfiles.delete(userId);
    return;
  }

  reportDerivedProfiles.set(userId, {
    ...profile,
    id: profile.id || `profile_${userId}`,
    userId,
    profileSource: 'report',
  });
}
