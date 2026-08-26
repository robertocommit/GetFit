import { loadAppData } from '$lib/server/loadApp';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = loadAppData;
