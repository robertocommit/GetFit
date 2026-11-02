import { cervicalBlocked, cervicalIds, novemberExercises } from './november.ts';
import type { Session, TrainingContext, WorkoutType, SetLog } from './types';
const numberOrNull = (v: unknown, min: number, max = Infinity, integer = false) => v === null || v === undefined || (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isInteger(v)));
export function validateSession(body: Session & {completed?: boolean}, previousLogs: Record<string,SetLog[]> = {}): string | null {
  if (!body.logs || typeof body.logs !== 'object' || Array.isArray(body.logs)) return 'Serie non valide';
  if (!numberOrNull(body.durationMinutes,0,10000,true) || !numberOrNull(body.cardioMinutes,0,10000,true)) return 'Durata non valida';
  const c = body.trainingContext;
  if (c) {
    if (c.version !== 'november-2026' || !novemberExercises(body.date,body.type as WorkoutType) || !Array.isArray(c.exercises) || !c.decisions || typeof c.decisions !== 'object') return 'Versione del programma non valida';
    if (['physioApproved','symptoms','delayedSymptoms'].some(k => typeof c[k as keyof TrainingContext] !== 'boolean')) return 'Conferme cervicali non valide';
    if (!numberOrNull(c.painBefore,0,10) || !numberOrNull(c.painAfter,0,10)) return 'Il dolore deve essere tra 0 e 10';
    if (Object.keys(body.logs).some(id => !c.exercises.some(e=>e.id===id))) return 'Esercizio non previsto nella scheda';
    for (const d of Object.values(c.decisions)) {
      if (!d || typeof d !== 'object' || ['technique','tolerated','demonstrated'].some(k => k in d && typeof d[k as keyof typeof d] !== 'boolean')) return 'Conferme esercizio non valide';
      if (d.band && (typeof d.band !== 'object' || Object.values(d.band).some(v => typeof v !== 'string' || v.length > 2000))) return 'Configurazione elastico non valida';
    }
  }
  for (const [id,logs] of Object.entries(body.logs)) {
    if (!Array.isArray(logs) || logs.length > 100 || new Set(logs.map(l => l.setNumber)).size !== logs.length) return 'Serie duplicate o non valide';
    for (const l of logs) {
      if (typeof l.completed !== 'boolean' || typeof l.skipped !== 'boolean') return 'Stato della serie non valido';
      if (!numberOrNull(l.reps,0,10000,true) || !numberOrNull(l.weight,0,99999) || !numberOrNull(l.effort,1,4,true) || !numberOrNull(l.holdSeconds,1,3600,true) || !Number.isInteger(l.setNumber) || l.setNumber < 1 || ![null,undefined,'left','right'].includes(l.side)) return 'Valori della serie non validi';
      if (cervicalIds.includes(id)) {
        if (!c || l.weight !== null) return 'Il carico cervicale numerico deve restare nullo';
        if (l.completed && !l.skipped) {
          const alreadyPerformed = previousLogs[id]?.some(old => old.setNumber === l.setNumber && old.completed && !old.skipped);
          if (!alreadyPerformed && cervicalBlocked(c,id)) return cervicalBlocked(c,id);
          if (!l.reps || !l.holdSeconds || (id === 'band-neck-lateral' && !l.side) || (id !== 'band-neck-lateral' && l.side)) return 'Registra ripetizioni, durata e lato corretti';
        }
      }
    }
  }
  if (body.completed && c) {
    for (const e of c.exercises) {
      const logs = body.logs[e.id];
      if (!logs?.length || logs.length < e.sets * (e.target?.perSide ? 2 : 1) || !logs.every(l => l.completed || l.skipped)) return 'Completa o escludi ogni serie prima di chiudere';
      if (e.id === 'band-neck-lateral' && !['left','right'].every(side => logs.filter(l => l.side === side).length >= e.sets)) return 'Registra entrambi i lati';
    }
    if (c.exercises.some(e => cervicalIds.includes(e.id) && body.logs[e.id]?.some(l => l.completed && !l.skipped)) && c.painAfter === null) return 'Registra il dolore dopo la seduta';
  }
  return null;
}
