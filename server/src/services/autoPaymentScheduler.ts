import { query } from '../db/pool.js';
import { applyAutoPayments } from './autoPayments.js';
import { loadStateRaw, persistState } from './stateService.js';
import { withUserLock } from './userMutex.js';

const INTERVAL_MS = Number(process.env.AUTO_PAYMENT_INTERVAL_MS ?? 15 * 60 * 1000);

let running = false;
let startupTimer: NodeJS.Timeout | undefined;
let intervalTimer: NodeJS.Timeout | undefined;

export async function processAllUsersAutoPayments(): Promise<void> {
  if (running) return;
  running = true;

  try {
    const { rows } = await query<{ user_id: string }>(`SELECT user_id FROM user_accounts`);
    for (const { user_id } of rows) {
      try {
        await withUserLock(user_id, async (client) => {
          const state = await loadStateRaw(user_id, client);
          const next = applyAutoPayments(state);
          if (next !== state) {
            await persistState(user_id, next, client);
          }
        });
      } catch (err) {
        console.error(`Auto-paiements échoués pour ${user_id}:`, err);
      }
    }
  } finally {
    running = false;
  }
}

export function startAutoPaymentScheduler(): void {
  const run = () => {
    void processAllUsersAutoPayments().catch((err) => {
      console.error('Scheduler auto-paiements:', err);
    });
  };

  startupTimer = setTimeout(run, 10_000);
  intervalTimer = setInterval(run, INTERVAL_MS);
  console.log(`Scheduler auto-paiements actif (toutes les ${Math.round(INTERVAL_MS / 60_000)} min)`);
}

export function stopAutoPaymentScheduler(): void {
  if (startupTimer) clearTimeout(startupTimer);
  if (intervalTimer) clearInterval(intervalTimer);
  startupTimer = undefined;
  intervalTimer = undefined;
}
