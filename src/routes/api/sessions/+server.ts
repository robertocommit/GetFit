import { pool } from '$lib/server/db';
import { json } from '@sveltejs/kit';

const SKIP_REASONS = ['forza_maggiore', 'pigrizia'];

export async function PUT({ request }) {
  const body = await request.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '') || !['A', 'B', 'C'].includes(body.type)) {
    return json({ error: 'Seduta non valida' }, { status: 400 });
  }
  const hasSkipField = Object.prototype.hasOwnProperty.call(body, 'skippedReason');
  const requestedSkip = body.skippedReason ?? null;
  if (hasSkipField && requestedSkip !== null && !SKIP_REASONS.includes(requestedSkip)) {
    return json({ error: 'Motivo non valido' }, { status: 400 });
  }
  const completing = Boolean(body.completed);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query<{ completed_at: string | null; skipped_reason: string | null }>(
      `SELECT completed_at::text, skipped_reason FROM workout_sessions WHERE workout_date = $1 FOR UPDATE`,
      [body.date]
    );
    if (existing.rows[0]?.completed_at) {
      await client.query('COMMIT');
      return json({ ok: true, completedAt: existing.rows[0].completed_at, locked: true });
    }
    const skippedReason = hasSkipField ? requestedSkip : (existing.rows[0]?.skipped_reason ?? null);
    if (completing && hasSkipField && skippedReason !== null) {
      await client.query('ROLLBACK');
      return json({ error: 'Seduta non valida' }, { status: 400 });
    }

    const session = await client.query<{ id: string; completed_at: string | null; skipped_reason: string | null; skipped_at: string | null }>(
      `INSERT INTO workout_sessions (workout_date, workout_type, duration_minutes, cardio_minutes, notes, completed_at, skipped_reason, skipped_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $6 THEN now() ELSE NULL END,
         CASE WHEN $6 THEN NULL ELSE $7 END, CASE WHEN $6 THEN NULL WHEN $7 IS NOT NULL THEN now() ELSE NULL END, now())
       ON CONFLICT (workout_date) DO UPDATE SET workout_type = EXCLUDED.workout_type,
       duration_minutes = EXCLUDED.duration_minutes, cardio_minutes = EXCLUDED.cardio_minutes,
       notes = EXCLUDED.notes, completed_at = CASE WHEN $6 THEN COALESCE(workout_sessions.completed_at, now()) ELSE NULL END,
       skipped_reason = CASE WHEN $6 THEN NULL ELSE $7 END,
       skipped_at = CASE WHEN $6 THEN NULL WHEN $7 IS NOT NULL THEN now() ELSE NULL END,
       updated_at = now()
       WHERE workout_sessions.completed_at IS NULL
       RETURNING id, completed_at::text, skipped_reason, skipped_at::text`,
      [body.date, body.type, body.durationMinutes, body.cardioMinutes, body.notes ?? '', completing, skippedReason]
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
        const skipped = Boolean(set.skipped);
        const effort = Number(set.effort);
        const normalizedEffort = !skipped && Number.isInteger(effort) && effort >= 1 && effort <= 4 ? effort : null;
        await client.query(
          `INSERT INTO set_logs (session_id, exercise_id, set_number, reps, weight, effort, completed, skipped)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (session_id, exercise_id, set_number) DO UPDATE SET
           reps = EXCLUDED.reps, weight = EXCLUDED.weight, effort = EXCLUDED.effort,
           completed = EXCLUDED.completed, skipped = EXCLUDED.skipped`,
          [sessionId, exerciseId, set.setNumber, set.reps, set.weight, normalizedEffort, Boolean(set.completed) && !skipped, skipped]
        );
      }
    }
    await client.query('COMMIT');
    return json({
      ok: true,
      completedAt: session.rows[0].completed_at,
      skippedReason: session.rows[0].skipped_reason,
      skippedAt: session.rows[0].skipped_at
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return json({ error: 'Impossibile salvare la seduta' }, { status: 500 });
  } finally {
    client.release();
  }
}
