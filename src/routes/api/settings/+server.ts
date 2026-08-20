import { query } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function PUT({ request }) {
  const { startDate } = await request.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '')) return json({ error: 'Data non valida' }, { status: 400 });
  await query('UPDATE app_settings SET start_date = $1, updated_at = now() WHERE id = 1', [startDate]);
  return json({ ok: true });
}
