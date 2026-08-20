import type { Exercise, WorkoutType } from './types';

export const workouts: Record<WorkoutType, { title: string; focus: string; cardio: string; exercises: Exercise[] }> = {
  A: {
    title: 'Forza di base',
    focus: 'Squat · petto · schiena · presa',
    cardio: '15–20 min · camminata inclinata o cyclette',
    exercises: [
      { id: 'squat', name: 'Squat', sets: 3, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 40, unit: 'kg', increment: 5 },
      { id: 'bench', name: 'Bench press', sets: 4, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 40, unit: 'kg', increment: 2.5 },
      { id: 'row', name: 'Seated cable row', sets: 4, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5, note: 'Usa lo scatto minimo della macchina.' },
      { id: 'lateral', name: 'Lateral raises', sets: 3, reps: '12–15', minReps: 12, maxReps: 15, startWeight: 5, unit: 'kg/mano', increment: 1 },
      { id: 'curl', name: 'Dumbbell curl', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 8, unit: 'kg/mano', increment: 1 },
      { id: 'carry', name: 'Farmer carry', sets: 4, reps: '30–40 m', startWeight: 16, unit: 'kg/mano', increment: 2, note: 'Inserisci i metri nel campo reps.' },
      { id: 'neck-iso', name: 'Neck isometrics', sets: 2, reps: '20–30 sec/direzione', startWeight: null, unit: 'sec', increment: null, note: 'Solo pressione delicata contro la mano nel mese 1.' }
    ]
  },
  B: {
    title: 'Catena posteriore',
    focus: 'Dorsali · anche · unilateralità',
    cardio: 'Cardio facoltativo, ritmo facile',
    exercises: [
      { id: 'rdl', name: 'Romanian deadlift', sets: 3, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 40, unit: 'kg', increment: 5 },
      { id: 'incline-db', name: 'Incline dumbbell press', sets: 4, reps: '8–12', minReps: 8, maxReps: 12, startWeight: 12, unit: 'kg/mano', increment: 2 },
      { id: 'pulldown', name: 'Lat pulldown', sets: 4, reps: '8–12', minReps: 8, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'split-squat', name: 'Bulgarian split squat', sets: 3, reps: '8–10/gamba', minReps: 8, maxReps: 10, startWeight: 0, unit: 'kg/mano', increment: 2, note: 'Inizia a corpo libero; aggiungi peso solo con controllo.' },
      { id: 'face-pull', name: 'Face pull', sets: 3, reps: '12–15', minReps: 12, maxReps: 15, startWeight: 15, unit: 'kg', increment: 5 },
      { id: 'shrug', name: 'Shrug con manubri', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 16, unit: 'kg/mano', increment: 2 },
      { id: 'dead-hang', name: 'Dead hang', sets: 3, reps: '20–40 sec', startWeight: null, unit: 'sec', increment: null },
      { id: 'neck-lateral', name: 'Neck lateral isometric', sets: 2, reps: '20 sec/lato', startWeight: null, unit: 'sec', increment: null }
    ]
  },
  C: {
    title: 'Volume & capacità',
    focus: 'Ipertrofia · presa · condizionamento',
    cardio: '20–25 min · intensità facile',
    exercises: [
      { id: 'leg-press', name: 'Leg press', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 100, unit: 'kg', increment: 10 },
      { id: 'bench', name: 'Bench press', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 2.5 },
      { id: 'row', name: 'Seated cable row', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'pulldown', name: 'Lat pulldown', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'lateral', name: 'Lateral raises', sets: 4, reps: '12–20', minReps: 12, maxReps: 20, startWeight: 5, unit: 'kg/mano', increment: 1 },
      { id: 'pushdown', name: 'Triceps pushdown', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: null, unit: 'kg', increment: 5, note: 'Scegli un peso facile/moderato.' },
      { id: 'curl', name: 'Dumbbell curl', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 8, unit: 'kg/mano', increment: 1 },
      { id: 'carry', name: 'Farmer carry', sets: 3, reps: '40–60 m', startWeight: 16, unit: 'kg/mano', increment: 2, note: 'Inserisci i metri nel campo reps.' },
      { id: 'neck', name: 'Neck', sets: 2, reps: 'per direzione', startWeight: null, unit: 'sec', increment: null, note: 'Leggerissimo. Dal mese 2 puoi usare una banda.' }
    ]
  }
};

export const monthThemes = [
  { title: 'Riavvio', text: 'RIR 3–4. La seduta deve quasi sembrarti troppo facile.' },
  { title: 'Tecnica', text: 'Movimenti puliti e progressione graduale. RIR 3.' },
  { title: 'Massa', text: 'Priorità a spalle, dorsali, petto e braccia. Puoi arrivare a RIR 2.' },
  { title: 'Consolidamento', text: 'Stessa struttura, tecnica stabile e piccoli progressi.' },
  { title: 'Rifinitura', text: 'Più forte sugli stessi esercizi, senza cercare massimali.' }
];

export function workoutTypeForDate(date: Date): WorkoutType | null {
  const day = date.getDay();
  return day === 2 ? 'A' : day === 4 ? 'B' : day === 6 ? 'C' : null;
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function monthNumber(startDate: string, date: string) {
  const start = parseLocalDate(startDate);
  const target = parseLocalDate(date);
  const weeks = Math.max(0, Math.floor((target.getTime() - start.getTime()) / 604800000));
  return Math.min(5, Math.floor(weeks / 4) + 1);
}

export function programEnd(startDate: string) {
  const end = parseLocalDate(startDate);
  end.setMonth(end.getMonth() + 5);
  return end;
}

export function schedule(startDate: string) {
  const start = parseLocalDate(startDate);
  const end = programEnd(startDate);
  const days: { date: string; type: WorkoutType }[] = [];
  for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    const type = workoutTypeForDate(cursor);
    if (type) days.push({ date: dateKey(cursor), type });
  }
  return days;
}
