export type WorkoutType = 'A' | 'B' | 'C';

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
  rir: number | null;
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
