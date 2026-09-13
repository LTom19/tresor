import { addMonths, startOfDay, startOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, CalendarEvent, Operation } from '../types';
import {
  getAnnualOccurrenceDate,
  getMonthlyOccurrenceDate,
} from './calculations';
import { isSubscriptionActive, parseLocalDate, todayISO } from './subscription';

export type AutoEvent = CalendarEvent & { id: string };

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

/**
 * Tous les prélèvements/revenus dus jusqu'à aujourd'hui, non encore traités.
 * Chaque événement a un id stable (ex. m-{subId}-2026-6) pour éviter les doublons.
 */
export function getPendingAutoEvents(state: AppState, upTo: Date = new Date()): AutoEvent[] {
  const todayStart = startOfDay(upTo);
  const processed = new Set(state.processedAutoEvents ?? []);
  const events: AutoEvent[] = [];

  for (const sub of state.monthlySubscriptions) {
    const addedAt = parseLocalDate(sub.createdAt ?? todayISO());
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
        events.push({
          id,
          name: sub.name,
          amount: sub.amount,
          date: occurrence,
          kind: 'monthly',
          subscriptionId: sub.id,
        });
      }

      monthRef = addMonths(monthRef, 1);
    }
  }

  for (const sub of state.annualSubscriptions) {
    const addedAt = parseLocalDate(sub.createdAt ?? todayISO());
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
        events.push({
          id,
          name: sub.name,
          amount: sub.amount,
          date: occurrence,
          kind: 'annual',
          subscriptionId: sub.id,
        });
      }
    }
  }

  for (const inc of state.incomes) {
    const addedAt = parseLocalDate(inc.createdAt ?? inc.startDate ?? todayISO());
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
        events.push({
          id,
          name: inc.name,
          amount: inc.amount,
          date: occurrence,
          kind: 'income',
          subscriptionId: inc.id,
        });
      }

      monthRef = addMonths(monthRef, 1);
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** @deprecated alias — préférez getPendingAutoEvents */
export function getDueTodayEvents(state: AppState, today: Date = new Date()): CalendarEvent[] {
  return getPendingAutoEvents(state, today).filter((e) =>
    startOfDay(e.date).getTime() === startOfDay(today).getTime(),
  );
}

/** Applique les auto-paiements en attente (rattrapage + jour même), sans doublon. */
export function applyDueAutoPayments(
  state: AppState,
  upTo: Date = new Date(),
): AppState {
  const pending = getPendingAutoEvents(state, upTo);
  if (pending.length === 0) return state;

  let compteCourant = state.compteCourant;
  const newOps: Operation[] = [];
  const newlyProcessed: string[] = [];

  for (const event of pending) {
    const ts = timestampForOccurrence(event.date);

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
    processedAutoEvents: [...(state.processedAutoEvents ?? []), ...newlyProcessed],
    operations: [...newOps.reverse(), ...state.operations].slice(0, 500),
  };
}
