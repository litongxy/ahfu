export interface HealthProfile {
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

export const userProfiles: Map<string, HealthProfile> = new Map();
