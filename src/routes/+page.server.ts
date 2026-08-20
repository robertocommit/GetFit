import { query } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const settings = await query<{ start_date: string }>("SELECT to_char(start_date, 'YYYY-MM-DD') AS start_date FROM app_settings WHERE id = 1");
  const sessions = await query<{
    workout_date: string; workout_type: 'A' | 'B' | 'C'; completed_at: string | null;
    duration_minutes: number | null; cardio_minutes: number | null; notes: string;
  }>(`SELECT to_char(workout_date, 'YYYY-MM-DD') AS workout_date, workout_type, completed_at::text,
      duration_minutes, cardio_minutes, notes FROM workout_sessions ORDER BY workout_date`);
  const logs = await query<{
    workout_date: string; exercise_id: string; set_number: number; reps: number | null;
    weight: string | null; rir: number | null; completed: boolean;
  }>(`SELECT to_char(s.workout_date, 'YYYY-MM-DD') AS workout_date, l.exercise_id, l.set_number,
      l.reps, l.weight::text, l.rir, l.completed FROM set_logs l
      JOIN workout_sessions s ON s.id = l.session_id ORDER BY s.workout_date, l.exercise_id, l.set_number`);

  return {
    startDate: settings.rows[0]?.start_date,
    sessions: sessions.rows,
    logs: logs.rows
  };
};
