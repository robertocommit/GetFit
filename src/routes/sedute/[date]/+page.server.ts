import { loadAppData } from '$lib/server/loadApp';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) error(404, 'Seduta non valida');
  return { ...(await loadAppData()), workoutDate: params.date };
};
