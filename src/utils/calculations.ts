import {
  addDays,
  differenceInCalendarDays,
  getDate,
  getDaysInMonth,
  getMonth,
  setDate,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import type {
  AnnualSubscription,
  AppState,
  CalendarEvent,
  Income,
  InsufficientBalanceAlert,
  MonthlySubscription,
  UpcomingPaymentAlert,
} from '../types';
import { isSubscriptionActive, getMonthlySubscriptionTotalCost, parseLocalDate } from './subscription';

/** Total Placement (Épargne + Livret A) */
export function getLivretTotal(state: AppState): number {
  return state.livretEconomies + state.livretPoche;
}

/** Total mensuel des abonnements récurrents actifs */
export function getMonthlyChargesTotal(
  subscriptions: MonthlySubscription[],
  reference: Date = new Date(),
): number {
  return subscriptions
    .filter((s) => isSubscriptionActive(s.startDate, s.duration, reference))
    .reduce((sum, s) => sum + s.amount, 0);
}

/** Estimation annuelle : 12× mensuels actifs + somme des annuels actifs */
export function getAnnualEstimate(
  monthly: MonthlySubscription[],
  annual: AnnualSubscription[],
  reference: Date = new Date(),
): number {
  const monthlyActive = monthly.filter((s) =>
    isSubscriptionActive(s.startDate, s.duration, reference),
  );
  const annualActive = annual.filter((s) =>
    isSubscriptionActive(s.startDate, s.duration, reference),
  );
  const monthlyPeriodCost = monthlyActive.reduce(
    (sum, s) => sum + getMonthlySubscriptionTotalCost(s.amount, s.duration).total,
    0,
  );
  return monthlyPeriodCost + annualActive.reduce((s, a) => s + a.amount, 0);
}

/** Date effective d'un abonnement mensuel pour un mois donné */
export function getMonthlyOccurrenceDate(dayOfMonth: number, reference: Date): Date {
  const daysInMonth = getDaysInMonth(reference);
  const day = Math.min(dayOfMonth, daysInMonth);
  return setDate(startOfMonth(reference), day);
}

/** Date effective d'un abonnement annuel pour un mois/année affichés */
export function getAnnualOccurrenceDate(sub: AnnualSubscription, month: Date): Date | null {
  const original = parseLocalDate(sub.date);
  const targetMonth = getMonth(month);
  if (getMonth(original) !== targetMonth) return null;

  const day = Math.min(getDate(original), getDaysInMonth(month));
  return setDate(startOfMonth(month), day);
}

/** Revenus du mois (salaire, etc.) */
export function getMonthIncomes(
  incomes: Income[],
  reference: Date = new Date(),
): CalendarEvent[] {
  return incomes
    .filter((inc) => {
      const occurrence = getMonthlyOccurrenceDate(inc.dayOfMonth, reference);
      return occurrence >= parseLocalDate(inc.startDate)
        && occurrence >= parseLocalDate(inc.createdAt);
    })
    .map((inc) => ({
      id: `i-${inc.id}-${reference.getFullYear()}-${reference.getMonth()}`,
      name: inc.name,
      amount: inc.amount,
      date: getMonthlyOccurrenceDate(inc.dayOfMonth, reference),
      kind: 'income' as const,
      subscriptionId: inc.id,
    }));
}

/** Tous les événements du mois (prélèvements + revenus) triés par date */
export function getCurrentMonthEvents(
  state: AppState,
  reference: Date = new Date(),
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const sub of state.monthlySubscriptions) {
    const occurrence = getMonthlyOccurrenceDate(sub.dayOfMonth, reference);
    if (!isSubscriptionActive(sub.startDate, sub.duration, occurrence)) continue;
    events.push({
      id: `m-${sub.id}-${reference.getFullYear()}-${reference.getMonth()}`,
      name: sub.name,
      amount: sub.amount,
      date: occurrence,
      kind: 'monthly',
      subscriptionId: sub.id,
    });
  }

  for (const sub of state.annualSubscriptions) {
    const occurrence = getAnnualOccurrenceDate(sub, reference);
    if (!occurrence) continue;
    if (!isSubscriptionActive(sub.startDate, sub.duration, occurrence)) continue;
    events.push({
      id: `a-${sub.id}-${reference.getFullYear()}`,
      name: sub.name,
      amount: sub.amount,
      date: occurrence,
      kind: 'annual',
      subscriptionId: sub.id,
    });
  }

  events.push(...getMonthIncomes(state.incomes, reference));

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Alias : prélèvements uniquement (sans revenus) */
export function getCurrentMonthPayments(
  state: AppState,
  reference: Date = new Date(),
): CalendarEvent[] {
  return getCurrentMonthEvents(state, reference).filter((e) => e.kind !== 'income');
}

/**
 * Prélèvements et revenus restants du mois (date >= aujourd'hui,
 * hors ceux déjà débités/crédités automatiquement).
 */
export function getRemainingMonthEvents(
  state: AppState,
  reference: Date = new Date(),
): CalendarEvent[] {
  const today = startOfDay(reference);
  const processed = new Set(state.processedAutoEvents ?? []);
  return getCurrentMonthEvents(state, reference).filter(
    (e) => e.date >= today && !processed.has(e.id),
  );
}

export function getRemainingMonthPayments(
  state: AppState,
  reference: Date = new Date(),
): CalendarEvent[] {
  return getRemainingMonthEvents(state, reference).filter((e) => e.kind !== 'income');
}

/** Solde prévisionnel du Compte Courant en fin de mois */
export function getProjectedEndOfMonthBalance(
  state: AppState,
  reference: Date = new Date(),
): number {
  const events = getRemainingMonthEvents(state, reference);
  let balance = state.compteCourant;
  for (const event of events) {
    if (event.kind === 'income') {
      balance += event.amount;
    } else {
      balance -= event.amount;
    }
  }
  return balance;
}

/** Prélèvements à venir dans les N prochains jours (alerte préventive) */
export function getUpcomingPaymentAlerts(
  state: AppState,
  reference: Date = new Date(),
): UpcomingPaymentAlert[] {
  const alerts: UpcomingPaymentAlert[] = [];
  const today = startOfDay(reference);
  const horizon = addDays(today, state.settings.alertDaysBefore);
  const processed = new Set(state.processedAutoEvents ?? []);

  for (const sub of state.monthlySubscriptions) {
    for (const monthOffset of [0, 1]) {
      const monthRef = new Date(reference.getFullYear(), reference.getMonth() + monthOffset, 1);
      const occurrence = getMonthlyOccurrenceDate(sub.dayOfMonth, monthRef);
      const eventId = `m-${sub.id}-${monthRef.getFullYear()}-${monthRef.getMonth()}`;
      if (!isSubscriptionActive(sub.startDate, sub.duration, occurrence)) continue;
      if (processed.has(eventId)) continue;
      if (occurrence >= today && occurrence <= horizon) {
        alerts.push({
          subscriptionName: sub.name,
          amount: sub.amount,
          date: occurrence,
          daysUntil: differenceInCalendarDays(occurrence, today),
          kind: 'monthly',
        });
      }
    }
  }

  for (const sub of state.annualSubscriptions) {
    for (const yearOffset of [0, 1]) {
      const year = reference.getFullYear() + yearOffset;
      const monthRef = new Date(year, getMonth(parseLocalDate(sub.date)), 1);
      const occurrence = getAnnualOccurrenceDate(sub, monthRef);
      const eventId = `a-${sub.id}-${year}`;
      if (!occurrence) continue;
      if (!isSubscriptionActive(sub.startDate, sub.duration, occurrence)) continue;
      if (processed.has(eventId)) continue;
      if (occurrence >= today && occurrence <= horizon) {
        alerts.push({
          subscriptionName: sub.name,
          amount: sub.amount,
          date: occurrence,
          daysUntil: differenceInCalendarDays(occurrence, today),
          kind: 'annual',
        });
      }
    }
  }

  return alerts.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Simule les événements restants du mois et détecte les prélèvements
 * qui dépasseraient le solde disponible.
 */
export function getInsufficientBalanceAlerts(
  state: AppState,
  reference: Date = new Date(),
): InsufficientBalanceAlert[] {
  const events = getRemainingMonthEvents(state, reference);

  let balance = state.compteCourant;
  const alerts: InsufficientBalanceAlert[] = [];

  for (const event of events) {
    if (event.kind === 'income') {
      balance += event.amount;
      continue;
    }
    if (balance < event.amount) {
      alerts.push({
        subscriptionName: event.name,
        amount: event.amount,
        date: event.date,
        missing: event.amount - balance,
      });
    }
    balance -= event.amount;
  }

  return alerts;
}

/** Événements visibles sur le calendrier pour un mois donné */
export function getCalendarEventsForMonth(
  state: AppState,
  month: Date,
): CalendarEvent[] {
  return getCurrentMonthEvents(state, month);
}

/** Regroupe les événements par jour du mois (clé = numéro du jour) */
export function groupEventsByDay(events: CalendarEvent[]): Map<number, CalendarEvent[]> {
  const map = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const day = getDate(event.date);
    const list = map.get(day) ?? [];
    list.push(event);
    map.set(day, list);
  }
  return map;
}

/** Estimation annuelle des revenus : 12× revenus mensuels actifs */
export function getAnnualIncomeEstimate(
  incomes: Income[],
  reference: Date = new Date(),
): number {
  return getMonthlyIncomeTotal(incomes, reference) * 12;
}

/** Revenus mensuels totaux */
export function getMonthlyIncomeTotal(
  incomes: Income[],
  reference: Date = new Date(),
): number {
  return getMonthIncomes(incomes, reference).reduce((sum, income) => sum + income.amount, 0);
}
