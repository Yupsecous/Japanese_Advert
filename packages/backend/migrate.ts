// Minimal forward-only SQL migration runner. Applies every *.sql file in
// db/migrations/ (sorted by filename) that hasn't been applied yet, each in
// its own transaction, and records it in the _migrations table.
//
// Run with:  node --import tsx packages/backend/migrate.ts
// (loads .env.local for DATABASE_URL, same as server.ts)

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { getPool } from './lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function main(): Promise<void> {
  const dir = path.join(__dirname, 'db', 'migrations');
  const pool = getPool();

  await pool.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let applied = 0;
  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
    if (rows.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`= skip   ${file} (already applied)`);
      continue;
    }
    const sqlText = readFileSync(path.join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sqlText);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      // eslint-disable-next-line no-console
      console.log(`+ apply  ${file}`);
      applied++;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      client.release();
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\nDone. ${applied} migration(s) applied, ${files.length - applied} already present.`);
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
