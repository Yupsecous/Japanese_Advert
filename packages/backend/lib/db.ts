// Lazy PostgreSQL pool + Drizzle instance. Lazy so importing this module
// never connects (or throws on a missing DATABASE_URL) until the first
// query — keeps routes that don't touch the DB (health, the proxy routes
// when using Bearer auth) working even if the DB is momentarily down.

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

let pool: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    // Without this listener, an error on an IDLE pooled connection (DB restart,
    // network blip, server closing the socket) is emitted as an 'error' event
    // with no handler — which Node turns into an uncaughtException that kills
    // the process (and, under the crash-restart loop, a flap). Swallow + log.
    pool.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[db] idle client error (handled):', err);
    });
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}
