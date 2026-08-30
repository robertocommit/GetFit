import { pool } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function PUT({ request }) {
  const body = await request.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '') || !['A', 'B', 'C'].includes(body.type)) {
    return json({ error: 'Seduta non valida' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query<{ completed_at: string | null }>(
      `SELECT completed_at::text FROM workout_sessions WHERE workout_date = $1 FOR UPDATE`,
      [body.date]
    );
    if (existing.rows[0]?.completed_at) {
      await client.query('COMMIT');
      return json({ ok: true, completedAt: existing.rows[0].completed_at, locked: true });
    }

    const session = await client.query<{ id: string; completed_at: string | null }>(
      `INSERT INTO workout_sessions (workout_date, workout_type, duration_minutes, cardio_minutes, notes, completed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $6 THEN now() ELSE NULL END, now())
       ON CONFLICT (workout_date) DO UPDATE SET workout_type = EXCLUDED.workout_type,
       duration_minutes = EXCLUDED.duration_minutes, cardio_minutes = EXCLUDED.cardio_minutes,
       notes = EXCLUDED.notes, completed_at = CASE WHEN $6 THEN COALESCE(workout_sessions.completed_at, now()) ELSE NULL END,
       updated_at = now()
       WHERE workout_sessions.completed_at IS NULL
       RETURNING id, completed_at::text`,
      [body.date, body.type, body.durationMinutes, body.cardioMinutes, body.notes ?? '', Boolean(body.completed)]
    );
    if (!session.rows[0]) {
      const locked = await client.query<{ completed_at: string | null }>(
        `SELECT completed_at::text FROM workout_sessions WHERE workout_date = $1`,
        [body.date]
      );
      await client.query('COMMIT');
      return json({ ok: true, completedAt: locked.rows[0]?.completed_at ?? null, locked: true });
    }
    const sessionId = session.rows[0].id;
    for (const [exerciseId, sets] of Object.entries(body.logs ?? {}) as [string, Record<string, unknown>[]][]) {
      for (const set of sets) {
        const effort = Number(set.effort);
        const normalizedEffort = Number.isInteger(effort) && effort >= 1 && effort <= 4 ? effort : null;
        await client.query(
          `INSERT INTO set_logs (session_id, exercise_id, set_number, reps, weight, effort, completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (session_id, exercise_id, set_number) DO UPDATE SET
           reps = EXCLUDED.reps, weight = EXCLUDED.weight, effort = EXCLUDED.effort, completed = EXCLUDED.completed`,
          [sessionId, exerciseId, set.setNumber, set.reps, set.weight, normalizedEffort, Boolean(set.completed)]
        );
      }
    }
    await client.query('COMMIT');
    return json({ ok: true, completedAt: session.rows[0].completed_at });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return json({ error: 'Impossibile salvare la seduta' }, { status: 500 });
  } finally {
    client.release();
  }
}
