import { workouts } from './program.ts';
import type { Exercise, Session, SetLog, TrainingContext, WorkoutType } from './types';

export const cervicalIds = ['band-neck-flexion', 'band-neck-extension', 'band-neck-lateral', 'band-neck-retraction', 'chin-nod'];
export const cervicalTitle = 'Forza cervicale — Elastici · Fase 1';
export function novemberWeek(date: string): number | null {
  if (date < '2026-11-02' || date > '2026-11-29') return null;
  return Math.floor((Date.parse(`${date}T12:00:00Z`) - Date.parse('2026-11-02T12:00:00Z')) / 604800000);
}
// A target is a proposal. It never becomes a completed log or an applied load by date.
const targets: Record<WorkoutType, Record<string, [number, number | null][]>> = {
  A: {
    squat: [[8,52.5],[9,52.5],[8,55],[10,55]], bench: [[8,52.5],[9,52.5],[8,55],[10,55]],
    row: [[8,55],[9,55],[10,55],[10,55]], lateral: [[10,7],[11,7],[12,7],[12,7]],
    curl: [[10,10],[11,10],[12,10],[12,10]], carry: [[1,16],[1,16],[1,16],[1,16]],
    'dead-bug': [[30,null],[30,null],[30,null],[30,null]]
  },
  B: {
    rdl: [[10,50],[8,52.5],[9,52.5],[10,52.5]], 'incline-db': [[10,12],[11,12],[12,12],[12,12]],
    pulldown: [[10,50],[11,50],[12,50],[12,50]], 'split-squat': [[10,4],[11,4],[12,4],[12,4]],
    'face-pull': [[10,17.5],[11,17.5],[12,17.5],[12,17.5]], shrug: [[10,20],[11,20],[12,20],[12,20]],
    'dead-hang': [[40,null],[40,null],[40,null],[40,null]], 'pallof-hold': [[20,null],[20,null],[20,null],[20,null]]
  },
  C: {
    'leg-press': [[10,130],[11,130],[10,140],[10,140]], bench: [[10,50],[11,50],[12,50],[8,52.5]],
    row: [[10,50],[11,50],[12,50],[8,55]], pulldown: [[10,50],[11,50],[12,50],[12,50]],
    lateral: [[12,8],[13,8],[14,8],[14,8]], pushdown: [[10,12.5],[11,12.5],[12,12.5],[10,15]],
    curl: [[10,10],[11,10],[12,10],[12,10]], carry: [[1,20],[1,20],[1,20],[1,20]],
    'side-plank': [[20,null],[20,null],[20,null],[20,null]]
  }
};
const cervicalNames = [
  ['band-neck-flexion','Flessione cervicale isometrica con elastico','Band-resisted cervical isometric flexion','Flessori cervicali'],
  ['band-neck-extension','Estensione cervicale isometrica con elastico','Band-resisted cervical isometric extension','Estensori cervicali'],
  ['band-neck-lateral','Flessione laterale cervicale isometrica con elastico','Band-resisted cervical isometric lateral flexion','Flessori laterali cervicali'],
  ['band-neck-retraction','Retrazione cervicale con elastico','Band-resisted cervical retraction','Stabilizzatori e retrattori cervicali'],
  ['chin-nod','Attivazione dei flessori cervicali profondi','Supine chin nod','Flessori cervicali profondi']
];
export function cervicalExercises(week: number): Exercise[] {
  return cervicalNames.map(([id,name,technicalName,muscles]) => {
    const isometric = ['band-neck-flexion','band-neck-extension','band-neck-lateral'].includes(id);
    const reps = (isometric ? [5,6,6,6] : [8,9,10,10])[week];
    const holdSeconds = (isometric ? [5,5,7,8] : [5,5,5,6])[week];
    return { id,name,technicalName,muscles,sets:2,reps:`${reps} × ${holdSeconds} sec${id === 'band-neck-lateral' ? '/lato' : ''}`,
      minReps:reps,startWeight:null,unit:'sec',increment:null,tracking:'cervical',
      resistanceType:id === 'chin-nod' ? 'bodyweight' : 'resistance_band',
      target:{reps,weight:null,holdSeconds,perSide:id === 'band-neck-lateral'},
      note:'Proposta da validare con il fisioterapista. Resistenza minima, invariata a novembre; nessun cedimento.' };
  });
}
export function novemberExercises(date: string, type: WorkoutType): Exercise[] | null {
  const week = novemberWeek(date);
  if (week === null) return null;
  const base = workouts[type].exercises.filter(e => !['neck-iso','neck-lateral'].includes(e.id)).map(e => {
    const target = targets[type][e.id]?.[week];
    if (!target) return { ...e }; // Existing mobility keeps its unquantified prescription.
    const [reps,weight] = target;
    const sets = ['carry','dead-bug','dead-hang','pallof-hold','side-plank','split-squat','face-pull','shrug'].includes(e.id) ? e.sets : 4;
    return { ...e, sets, prescription:undefined, target:{reps,weight},
      reps:e.tracking === 'carry' ? '1 andata e ritorno' : e.tracking === 'timed' ? `${reps} sec${['pallof-hold','side-plank'].includes(e.id) ? '/lato' : ''}` : `${reps}${e.id === 'split-squat' ? '/gamba' : ''}` };
  });
  const ids = type === 'A' ? [0,1,4] : type === 'B' ? [2,4] : [3,4];
  const neck = cervicalExercises(week);
  return [...base,...ids.map(i => neck[i])];
}
export function newTrainingContext(date: string, type: WorkoutType): TrainingContext | null {
  const exercises = novemberExercises(date,type);
  return exercises ? {version:'november-2026',exercises,physioApproved:false,symptoms:false,delayedSymptoms:false,painBefore:null,painAfter:null,decisions:{}} : null;
}
// A previously registered session always retains its original exercise list and counts.
export function sessionExercises(session: Session): Exercise[] {
  if (session.trainingContext) return session.trainingContext.exercises;
  const known = [...workouts.A.exercises,...workouts.B.exercises,...workouts.C.exercises,...cervicalExercises(0)];
  const savedIds = Object.keys(session.logs);
  const ids = [...workouts[session.type].exercises.map(e=>e.id).filter(id=>savedIds.includes(id)),...savedIds.filter(id=>!workouts[session.type].exercises.some(e=>e.id===id))];
  return ids.length ? ids.map(id => {
    const e = known.find(e => e.id === id);
    return {...(e ?? {id,name:id,sets:0,reps:'',startWeight:null,unit:'kg',increment:null}),sets:session.logs[id].length};
  }) : workouts[session.type].exercises;
}
export function previousExercise(sessions: Session[], date: string, type: WorkoutType, id: string) {
  // Do not skip over the latest missed/partial/skipped workout to find an older success.
  return sessions.filter(s => s.date < date && s.type === type && s.logs[id]?.length)
    .sort((a,b) => b.date.localeCompare(a.date))[0];
}
export function seedLogs(exercise: Exercise, previous: SetLog[] = []): SetLog[] {
  const cervical = exercise.tracking === 'cervical';
  const reps = cervical ? 5 : exercise.tracking === 'carry' ? 1 : exercise.tracking === 'mobility' ? null : exercise.minReps ?? (Number(exercise.reps.match(/\d+/)?.[0] ?? 0) || null);
  const sides = exercise.target?.perSide ? ['left','right'] as const : [null];
  return sides.flatMap(side => Array.from({length:exercise.sets},(_,i) => {
    const prior = previous.filter(l => (l.side ?? null) === side)[i] ?? previous[0];
    return {setNumber:0,reps:prior?.reps ?? (cervical ? (exercise.id === 'chin-nod' || exercise.id === 'band-neck-retraction' ? 8 : 5) : reps),
      weight:cervical || exercise.tracking === 'timed' || exercise.tracking === 'mobility' ? null : prior?.weight ?? exercise.startWeight,
      effort:null,completed:false,skipped:false,...(cervical ? {holdSeconds:prior?.holdSeconds ?? 5,side} : {})};
  })).map((l,i) => ({...l,setNumber:i+1}));
}
export function runTarget(date: string) {
  const week = novemberWeek(date);
  return week !== null && new Date(`${date}T12:00:00`).getDay() === 3 ? [1.5,1.8,2.1,2.5][week] : 1.3;
}
