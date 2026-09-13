import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';

const chains = new Map<string, Promise<unknown>>();

/**
 * Sérialise les opérations par utilisateur dans ce processus et dans PostgreSQL.
 * Le verrou PostgreSQL protège aussi contre deux instances Node simultanées.
 */
export async function withUserLock<T>(
  userId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const prev = chains.get(userId) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(async () => {
    const client = await pool.connect();
    try {
      await client.query(`SELECT pg_advisory_lock(hashtext($1))`, [userId]);
      return await fn(client);
    } finally {
      await client.query(`SELECT pg_advisory_unlock(hashtext($1))`, [userId])
        .catch((err) => console.error('Libération verrou utilisateur:', err));
      client.release();
    }
  });

  const settled = run.then(() => undefined, () => undefined);
  chains.set(userId, settled);
  void settled.finally(() => {
    if (chains.get(userId) === settled) chains.delete(userId);
  });
  return run;
}
