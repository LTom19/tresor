import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';
import type { AppState } from '../types.js';
import { applyAutoPayments, parseDuration } from './autoPayments.js';
import { withUserLock } from './userMutex.js';

export { applyAutoPayments } from './autoPayments.js';

/** Lit une colonne DATE PostgreSQL sans décalage UTC */
function pgDate(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function ensureUserAccounts(userId: string, client?: PoolClient) {
  await (client ?? pool).query(
    `INSERT INTO user_accounts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

export async function loadStateRaw(userId: string, client?: PoolClient): Promise<AppState> {
  const db = client ?? pool;
  await ensureUserAccounts(userId, client);

  const [acc, monthly, annual, incomes, ops, processed] = await Promise.all([
    db.query(`SELECT * FROM user_accounts WHERE user_id = $1`, [userId]),
    db.query(`SELECT * FROM monthly_subscriptions WHERE user_id = $1`, [userId]),
    db.query(`SELECT * FROM annual_subscriptions WHERE user_id = $1`, [userId]),
    db.query(`SELECT * FROM incomes WHERE user_id = $1`, [userId]),
    db.query(`SELECT * FROM operations WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 500`, [userId]),
    db.query(`SELECT event_id FROM processed_auto_events WHERE user_id = $1`, [userId]),
  ]);

  const a = acc.rows[0];
  if (!a) throw new Error('Compte utilisateur introuvable');
  const state: AppState = {
    compteCourant: Number(a.compte_courant),
    livretEconomies: Number(a.livret_economies),
    livretPoche: Number(a.livret_poche),
    settings: { alertDaysBefore: a.alert_days_before },
    monthlySubscriptions: monthly.rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      dayOfMonth: r.day_of_month,
      startDate: pgDate(r.start_date),
      duration: parseDuration(r.duration_type, r.duration_value),
      createdAt: pgDate(r.created_at),
    })),
    annualSubscriptions: annual.rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      date: pgDate(r.charge_date),
      startDate: pgDate(r.start_date),
      duration: parseDuration(r.duration_type, r.duration_value),
      createdAt: pgDate(r.created_at),
    })),
    incomes: incomes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      dayOfMonth: r.day_of_month,
      startDate: pgDate(r.start_date),
      createdAt: pgDate(r.created_at),
    })),
    operations: ops.rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp.toISOString(),
      type: r.type,
      label: r.label,
      amount: Number(r.amount),
      details: r.details ?? undefined,
      motif: r.motif ?? undefined,
    })),
    processedAutoEvents: processed.rows.map((r) => r.event_id),
  };

  return state;
}

export async function loadState(userId: string): Promise<AppState> {
  return withUserLock(userId, async (client) => {
    const state = await loadStateRaw(userId, client);
    const withAuto = applyAutoPayments(state);
    if (withAuto !== state) {
      await persistState(userId, withAuto, client);
    }
    return withAuto;
  });
}

export async function persistState(
  userId: string,
  state: AppState,
  existingClient?: PoolClient,
): Promise<void> {
  const client = existingClient ?? await pool.connect();
  const ownsClient = !existingClient;
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE user_accounts SET compte_courant=$2, livret_economies=$3, livret_poche=$4, alert_days_before=$5 WHERE user_id=$1`,
      [userId, state.compteCourant, state.livretEconomies, state.livretPoche, state.settings.alertDaysBefore],
    );

    await client.query(`DELETE FROM monthly_subscriptions WHERE user_id = $1`, [userId]);
    for (const s of state.monthlySubscriptions) {
      await client.query(
        `INSERT INTO monthly_subscriptions (id, user_id, name, amount, day_of_month, start_date, duration_type, duration_value, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [s.id, userId, s.name, s.amount, s.dayOfMonth, s.startDate, s.duration.type, s.duration.type === 'indefinite' ? null : s.duration.value, s.createdAt],
      );
    }

    await client.query(`DELETE FROM annual_subscriptions WHERE user_id = $1`, [userId]);
    for (const s of state.annualSubscriptions) {
      await client.query(
        `INSERT INTO annual_subscriptions (id, user_id, name, amount, charge_date, start_date, duration_type, duration_value, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [s.id, userId, s.name, s.amount, s.date, s.startDate, s.duration.type, s.duration.type === 'indefinite' ? null : s.duration.value, s.createdAt],
      );
    }

    await client.query(`DELETE FROM incomes WHERE user_id = $1`, [userId]);
    for (const i of state.incomes) {
      await client.query(
        `INSERT INTO incomes (id, user_id, name, amount, day_of_month, start_date, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [i.id, userId, i.name, i.amount, i.dayOfMonth, i.startDate, i.createdAt],
      );
    }

    await client.query(`DELETE FROM operations WHERE user_id = $1`, [userId]);
    for (const o of state.operations) {
      await client.query(
        `INSERT INTO operations (id, user_id, timestamp, type, label, amount, details, motif) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [o.id, userId, o.timestamp, o.type, o.label, o.amount, o.details ?? null, o.motif ?? null],
      );
    }

    await client.query(`DELETE FROM processed_auto_events WHERE user_id = $1`, [userId]);
    for (const eid of state.processedAutoEvents) {
      await client.query(`INSERT INTO processed_auto_events (user_id, event_id) VALUES ($1,$2)`, [userId, eid]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    if (ownsClient) client.release();
  }
}

// todayISO utilisé par actions.ts
export { todayISO };
