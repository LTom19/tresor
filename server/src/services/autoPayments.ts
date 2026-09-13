import { addMonths, addYears, startOfDay, startOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, AnnualSubscription, Income, MonthlySubscription, Operation } from '../types.js';

export type AutoEvent = {
  id: string;
  name: string;
  amount: number;
  kind: 'monthly' | 'annual' | 'income';
  occurrence: Date;
};

function parseLocalDate(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return startOfDay(new Date(y, m - 1, day));
}

function parseDuration(type: string, value: number | null) {
  if (type === 'months' && value) return { type: 'months' as const, value };
  if (type === 'years' && value) return { type: 'years' as const, value };
  return { type: 'indefinite' as const };
}

function isSubscriptionActive(
  startDate: string,
  duration: MonthlySubscription['duration'],
  ref: Date,
): boolean {
  const start = parseLocalDate(startDate);
  const r = startOfDay(ref);
  if (r < start) return false;
  if (duration.type === 'indefinite') return true;
  if (duration.type === 'months') return r < addMonths(start, duration.value);
  return r < addYears(start, duration.value);
}

function getMonthlyOccurrenceDate(dayOfMonth: number, reference: Date): Date {
  const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
  const day = Math.min(dayOfMonth, daysInMonth);
  return startOfDay(new Date(reference.getFullYear(), reference.getMonth(), day));
}

function getAnnualOccurrenceDate(sub: AnnualSubscription, month: Date): Date | null {
  const original = parseLocalDate(sub.date);
  if (original.getMonth() !== month.getMonth()) return null;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const day = Math.min(original.getDate(), daysInMonth);
  return startOfDay(new Date(month.getFullYear(), month.getMonth(), day));
}

function timestampForOccurrence(occurrence: Date): string {
  return new Date(
    occurrence.getFullYear(),
    occurrence.getMonth(),
    occurrence.getDate(),
    12,
    0,
    0,
    0,
  ).toISOString();
}

/** Tous les prélèvements/revenus dus jusqu'à `upTo`, non encore traités (rattrapage inclus). */
export function getPendingAutoEvents(state: AppState, upTo: Date = new Date()): AutoEvent[] {
  const todayStart = startOfDay(upTo);
  const processed = new Set(state.processedAutoEvents ?? []);
  const events: AutoEvent[] = [];

  for (const sub of state.monthlySubscriptions) {
    const addedAt = parseLocalDate(sub.createdAt);
    let monthRef = startOfMonth(addedAt);

    while (monthRef <= todayStart) {
      const occurrence = getMonthlyOccurrenceDate(sub.dayOfMonth, monthRef);
      const id = `m-${sub.id}-${monthRef.getFullYear()}-${monthRef.getMonth()}`;

      if (
        occurrence <= todayStart &&
        occurrence >= addedAt &&
        isSubscriptionActive(sub.startDate, sub.duration, occurrence) &&
        !processed.has(id)
      ) {
        events.push({ id, name: sub.name, amount: sub.amount, kind: 'monthly', occurrence });
      }

      monthRef = addMonths(monthRef, 1);
    }
  }

  for (const sub of state.annualSubscriptions) {
    const addedAt = parseLocalDate(sub.createdAt);
    const chargeMonth = parseLocalDate(sub.date).getMonth();

    for (let year = addedAt.getFullYear(); year <= todayStart.getFullYear(); year++) {
      const monthRef = new Date(year, chargeMonth, 1);
      const occurrence = getAnnualOccurrenceDate(sub, monthRef);
      const id = `a-${sub.id}-${year}`;

      if (
        occurrence &&
        occurrence <= todayStart &&
        occurrence >= addedAt &&
        isSubscriptionActive(sub.startDate, sub.duration, occurrence) &&
        !processed.has(id)
      ) {
        events.push({ id, name: sub.name, amount: sub.amount, kind: 'annual', occurrence });
      }
    }
  }

  for (const inc of state.incomes) {
    const addedAt = parseLocalDate(inc.createdAt);
    const incomeStart = parseLocalDate(inc.startDate);
    const scanFrom = addedAt > incomeStart ? addedAt : incomeStart;
    let monthRef = startOfMonth(scanFrom);

    while (monthRef <= todayStart) {
      const occurrence = getMonthlyOccurrenceDate(inc.dayOfMonth, monthRef);
      const id = `i-${inc.id}-${monthRef.getFullYear()}-${monthRef.getMonth()}`;

      if (
        occurrence <= todayStart &&
        occurrence >= addedAt &&
        occurrence >= incomeStart &&
        !processed.has(id)
      ) {
        events.push({ id, name: inc.name, amount: inc.amount, kind: 'income', occurrence });
      }

      monthRef = addMonths(monthRef, 1);
    }
  }

  return events.sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime());
}

/** Applique les auto-paiements en attente (aujourd'hui + rattrapage), sans doublon. */
export function applyAutoPayments(state: AppState, upTo: Date = new Date()): AppState {
  const pending = getPendingAutoEvents(state, upTo);
  if (pending.length === 0) return state;

  let compteCourant = state.compteCourant;
  const newOps: Operation[] = [];
  const newlyProcessed: string[] = [];

  for (const event of pending) {
    const ts = timestampForOccurrence(event.occurrence);

    if (event.kind === 'income') {
      compteCourant = Math.round((compteCourant + event.amount) * 100) / 100;
      newOps.push({
        id: uuidv4(),
        timestamp: ts,
        type: 'add',
        label: 'Compte Courant',
        amount: event.amount,
        motif: `Revenu automatique — ${event.name}`,
        details: 'Crédit automatique à la date prévue',
      });
    } else {
      compteCourant = Math.round((compteCourant - event.amount) * 100) / 100;
      newOps.push({
        id: uuidv4(),
        timestamp: ts,
        type: 'withdraw',
        label: 'Compte Courant',
        amount: event.amount,
        motif: `Prélèvement automatique — ${event.name}`,
        details: 'Débit automatique à la date prévue',
      });
    }
    newlyProcessed.push(event.id);
  }

  return {
    ...state,
    compteCourant,
    processedAutoEvents: [...state.processedAutoEvents, ...newlyProcessed],
    operations: [...newOps.reverse(), ...state.operations].slice(0, 500),
  };
}

export { parseDuration, parseLocalDate, isSubscriptionActive };
