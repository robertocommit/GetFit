import { query } from '$lib/server/db';
import { json } from '@sveltejs/kit';

const SKIP_REASONS = ['forza_maggiore', 'pigrizia'];

export async function PUT({ request }) {
  const body = await request.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '') || !['run', 'wing_chun'].includes(body.type)) {
    return json({ error: 'Attività non valida' }, { status: 400 });
  }
  const skippedReason = body.skippedReason ?? null;
  if (skippedReason !== null && !SKIP_REASONS.includes(skippedReason)) {
    return json({ error: 'Motivo non valido' }, { status: 400 });
  }

  if (skippedReason !== null) {
    const result = await query<{ skipped_at: string }>(
      `INSERT INTO activity_logs (activity_date, activity_type, duration_minutes, distance_km, rpe, sprint_completed, notes, completed_at, skipped_reason, skipped_at, updated_at)
       VALUES ($1, $2, NULL, NULL, NULL, false, $3, NULL, $4, now(), now())
       ON CONFLICT (activity_date, activity_type) DO UPDATE SET
         duration_minutes = NULL, distance_km = NULL, rpe = NULL, sprint_completed = false,
         notes = EXCLUDED.notes, completed_at = NULL,
         skipped_reason = EXCLUDED.skipped_reason, skipped_at = now(), updated_at = now()
       RETURNING skipped_at::text`,
      [body.date, body.type, body.notes ?? '', skippedReason]
    );
    return json({ ok: true, completedAt: null, skippedReason, skippedAt: result.rows[0].skipped_at });
  }

  const durationMinutes = body.durationMinutes === null || body.durationMinutes === undefined ? null : Number(body.durationMinutes);
  const distanceKm = body.distanceKm === null || body.distanceKm === undefined ? null : Number(body.distanceKm);
  const rpe = body.rpe === null || body.rpe === undefined ? null : Number(body.rpe);
  if ((durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) ||
      (distanceKm !== null && (!Number.isFinite(distanceKm) || distanceKm <= 0)) ||
      (rpe !== null && (!Number.isInteger(rpe) || rpe < 1 || rpe > 4))) {
    return json({ error: 'Dettagli attività non validi' }, { status: 400 });
  }

  const result = await query<{ completed_at: string }>(
    `INSERT INTO activity_logs (activity_date, activity_type, duration_minutes, distance_km, rpe, sprint_completed, notes, completed_at, skipped_reason, skipped_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), NULL, NULL, now())
     ON CONFLICT (activity_date, activity_type) DO UPDATE SET
       duration_minutes = EXCLUDED.duration_minutes, distance_km = EXCLUDED.distance_km,
       rpe = EXCLUDED.rpe, sprint_completed = EXCLUDED.sprint_completed,
       notes = EXCLUDED.notes, completed_at = now(), skipped_reason = NULL, skipped_at = NULL, updated_at = now()
     RETURNING completed_at::text`,
    [body.date, body.type, durationMinutes, distanceKm, rpe, Boolean(body.sprintCompleted), body.notes ?? '']
  );

  return json({ ok: true, completedAt: result.rows[0].completed_at, skippedReason: null, skippedAt: null });
}

export async function DELETE({ request }) {
  const body = await request.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '') || !['run', 'wing_chun'].includes(body.type)) {
    return json({ error: 'Attività non valida' }, { status: 400 });
  }
  await query('DELETE FROM activity_logs WHERE activity_date = $1 AND activity_type = $2', [body.date, body.type]);
  return json({ ok: true });
}
