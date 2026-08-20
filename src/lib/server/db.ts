import { env } from '$env/dynamic/private';
import pg from 'pg';

const connectionString = env.DATABASE_URL;

export const pool = new pg.Pool({
  connectionString,
  ssl: !connectionString || connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10
});

export async function query<T extends pg.QueryResultRow>(text: string, values: unknown[] = []) {
  return pool.query<T>(text, values);
}
