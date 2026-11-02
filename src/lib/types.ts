export type WorkoutType = 'A' | 'B' | 'C';
export type ActivityType = 'run' | 'wing_chun';
export type SkipReason = 'forza_maggiore' | 'pigrizia' | 'vacanza';

export type ActivityLog = {
  date: string;
  type: ActivityType;
  completedAt: string | null;
  skippedReason: SkipReason | null;
  skippedAt: string | null;
  durationMinutes: number | null;
  distanceKm: number | null;
  rpe: number | null;
  sprintCompleted: boolean;
  notes: string;
};

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  minReps?: number;
  maxReps?: number;
  startWeight: number | null;
  prescription?: { fromDate: string; weight: number };
  unit: string;
  increment: number | null;
  note?: string;
  tracking?: 'strength' | 'carry' | 'timed' | 'mobility' | 'cervical';
  resistanceType?: 'weight' | 'resistance_band' | 'bodyweight';
  technicalName?: string;
  muscles?: string;
  target?: { reps: number | null; weight: number | null; holdSeconds?: number; perSide?: boolean };
};

export type ExerciseGuide = {
  benefit: string;
  longTermBenefit: string;
  image?: string;
  equipment: string;
  setup: string;
  steps: string[];
  breathing: string;
  feel: string;
  mistakes: string[];
  alternative: string;
  safety?: string;
  requiresDemonstration?: boolean;
};

export type SetLog = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  effort: number | null;
  completed: boolean;
  skipped: boolean;
  holdSeconds?: number | null;
  side?: 'left' | 'right' | null;
};

export type BandSetup = {
  brand?: string; model?: string; color?: string; nominalResistance?: string;
  configuration?: string; anchor?: string; referenceLength?: string;
};

export type TrainingContext = {
  version: 'november-2026';
  exercises: Exercise[];
  physioApproved: boolean;
  symptoms: boolean;
  delayedSymptoms: boolean;
  painBefore: number | null;
  painAfter: number | null;
  decisions: Record<string, {
    technique?: boolean; tolerated?: boolean; demonstrated?: boolean;
    applied?: { reps: number | null; weight: number | null; holdSeconds?: number; at: string };
    band?: BandSetup;
  }>;
};

export type Session = {
  date: string;
  type: WorkoutType;
  completedAt: string | null;
  skippedReason: SkipReason | null;
  skippedAt: string | null;
  durationMinutes: number | null;
  cardioMinutes: number | null;
  notes: string;
  logs: Record<string, SetLog[]>;
  trainingContext?: TrainingContext | null;
};
