import type { Exercise, SetLog } from './types';

export function exerciseSuggestion(exercise: Exercise, previous: SetLog[], returning = false) {
  const completed = previous.filter((set) => set.completed && !set.skipped);
  const lastWeight = completed.filter((set) => set.weight !== null).at(-1)?.weight ?? exercise.startWeight;
  const fallbackReps = exercise.minReps ?? null;
  const recordedReps = completed.map((set) => set.reps).filter((reps): reps is number => reps !== null);
  const previousReps = recordedReps.length ? Math.min(...recordedReps) : fallbackReps;
  const reps = previousReps === null ? null : Math.max(fallbackReps ?? 0, Math.min(previousReps, exercise.maxReps ?? previousReps));
  const base = { weight: lastWeight, reps, message: '' };
  if ((exercise.tracking ?? 'strength') !== 'strength') return base;
  if (!completed.length) return { ...base, message: 'Scegli un carico controllabile e registra la fatica dopo le serie.' };
  if (returning) return { ...base, message: 'Rientro dopo la pausa: riparti dall’ultimo carico, lascia 2–3 ripetizioni di margine e riduci il peso se la tecnica peggiora.' };

  const allComplete = previous.length >= exercise.sets && previous.every((set) => set.completed && !set.skipped);
  const manageable = allComplete && previous.every((set) => set.effort !== null && set.effort <= 2);
  const sameWeight = lastWeight !== null && previous.every((set) => set.weight === lastWeight);
  const atTop = exercise.maxReps !== undefined && previous.every((set) => set.reps !== null && set.reps >= exercise.maxReps!);
  if (manageable && sameWeight && atTop && exercise.increment && lastWeight !== null) {
    return {
      weight: lastWeight + exercise.increment,
      reps: fallbackReps,
      message: `Serie al massimo delle ripetizioni con fatica 1–2/4: prova +${exercise.increment} ${exercise.unit} e riparti da ${fallbackReps} ripetizioni. Conferma il carico nel riscaldamento.`
    };
  }
  if (manageable && reps !== null && exercise.maxReps !== undefined && !atTop) {
    return { ...base, reps: Math.min(reps + 1, exercise.maxReps), message: 'Fatica 1–2/4: prova una ripetizione in più mantenendo il carico e la tecnica.' };
  }
  return { ...base, message: 'Consolida questo carico. L’aumento viene proposto dopo tutte le serie al massimo delle ripetizioni e fatica 1–2/4 registrata.' };
}
