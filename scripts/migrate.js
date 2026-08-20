import 'dotenv/config';
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL non impostata.');
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const dir = resolve('migrations');
  const files = (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (done.rowCount) continue;
    await client.query('BEGIN');
    try {
      await client.query(await readFile(resolve(dir, name), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applicata ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.end();
}
