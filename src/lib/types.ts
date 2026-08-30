export type WorkoutType = 'A' | 'B' | 'C';
export type ActivityType = 'run' | 'wing_chun';

export type ActivityLog = {
  date: string;
  type: ActivityType;
  completedAt: string | null;
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
  unit: string;
  increment: number | null;
  note?: string;
  tracking?: 'strength' | 'carry' | 'timed' | 'mobility';
};

export type ExerciseGuide = {
  equipment: string;
  setup: string;
  steps: string[];
  breathing: string;
  feel: string;
  mistakes: string[];
  alternative: string;
  safety?: string;
};

export type SetLog = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  effort: number | null;
  completed: boolean;
};

export type Session = {
  date: string;
  type: WorkoutType;
  completedAt: string | null;
  durationMinutes: number | null;
  cardioMinutes: number | null;
  notes: string;
  logs: Record<string, SetLog[]>;
};
