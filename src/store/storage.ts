import type {
  AnnualSubscription,
  AppState,
  MonthlySubscription,
} from '../types';
import { defaultDuration, todayISO } from '../utils/subscription';

const STORAGE_KEY = 'tresor-finance-v2';

export const defaultState: AppState = {
  compteCourant: 0,
  livretEconomies: 0,
  livretPoche: 0,
  monthlySubscriptions: [],
  annualSubscriptions: [],
  incomes: [],
  operations: [],
  processedAutoEvents: [],
  settings: {
    alertDaysBefore: 3,
  },
};

/** Migre un abonnement mensuel depuis l'ancien format */
function migrateMonthly(sub: Partial<MonthlySubscription> & { id: string; name: string; amount: number; dayOfMonth: number }): MonthlySubscription {
  return {
    id: sub.id,
    name: sub.name,
    amount: sub.amount,
    dayOfMonth: sub.dayOfMonth,
    startDate: sub.startDate ?? todayISO(),
    duration: sub.duration ?? { ...defaultDuration },
    createdAt: sub.createdAt ?? todayISO(),
  };
}

/** Migre un abonnement annuel depuis l'ancien format */
function migrateAnnual(sub: Partial<AnnualSubscription> & { id: string; name: string; amount: number; date: string }): AnnualSubscription {
  return {
    id: sub.id,
    name: sub.name,
    amount: sub.amount,
    date: sub.date,
    startDate: sub.startDate ?? sub.date,
    duration: sub.duration ?? { ...defaultDuration },
    createdAt: sub.createdAt ?? todayISO(),
  };
}

/** Charge l'état depuis localStorage (avec migration v1 → v2) */
export function loadState(): AppState {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) {
      const parsed = JSON.parse(v2) as Partial<AppState>;
      return normalizeState(parsed);
    }

    // Migration depuis v1
    const v1 = localStorage.getItem('tresor-finance-v1');
    if (v1) {
      const parsed = JSON.parse(v1) as Partial<AppState>;
      const migrated = normalizeState(parsed);
      saveState(migrated);
      return migrated;
    }

    return { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function normalizeState(parsed: Partial<AppState>): AppState {
  return {
    ...defaultState,
    ...parsed,
    monthlySubscriptions: (parsed.monthlySubscriptions ?? []).map(migrateMonthly),
    annualSubscriptions: (parsed.annualSubscriptions ?? []).map(migrateAnnual),
    incomes: (parsed.incomes ?? []).map((i) => ({
      ...i,
      startDate: i.startDate ?? todayISO(),
      createdAt: i.createdAt ?? todayISO(),
    })),
    processedAutoEvents: parsed.processedAutoEvents ?? [],
    settings: { ...defaultState.settings, ...parsed.settings },
  };
}

/** Persiste l'état dans localStorage */
export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
