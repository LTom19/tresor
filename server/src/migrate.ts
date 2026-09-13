import { readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`SELECT pg_advisory_lock(hashtext('tresor-migrations'))`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationDir = join(__dirname, '../migrations');
    const files = readdirSync(migrationDir)
      .filter((file) => /^\d+.*\.sql$/.test(file))
      .sort();

    for (const filename of files) {
      const alreadyApplied = await client.query(
        `SELECT 1 FROM schema_migrations WHERE filename = $1`,
        [filename],
      );
      if (alreadyApplied.rowCount) continue;

      const sql = readFileSync(join(migrationDir, filename), 'utf-8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [filename]);
        await client.query('COMMIT');
        console.log(`Migration ${filename} appliquée avec succès.`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await client.query(`SELECT pg_advisory_unlock(hashtext('tresor-migrations'))`).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erreur migration:', err);
  process.exit(1);
});
