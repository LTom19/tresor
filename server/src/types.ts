export type SubscriptionDuration =
  | { type: 'indefinite' }
  | { type: 'months'; value: number }
  | { type: 'years'; value: number };

export interface MonthlySubscription {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  startDate: string;
  duration: SubscriptionDuration;
  createdAt: string;
}

export interface AnnualSubscription {
  id: string;
  name: string;
  amount: number;
  date: string;
  startDate: string;
  duration: SubscriptionDuration;
  createdAt: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  startDate: string;
  createdAt: string;
}

export interface Operation {
  id: string;
  timestamp: string;
  type: 'set_balance' | 'add' | 'withdraw' | 'transfer';
  label: string;
  amount: number;
  details?: string;
  motif?: string;
}

export interface AppState {
  compteCourant: number;
  livretEconomies: number;
  livretPoche: number;
  monthlySubscriptions: MonthlySubscription[];
  annualSubscriptions: AnnualSubscription[];
  incomes: Income[];
  operations: Operation[];
  processedAutoEvents: string[];
  settings: { alertDaysBefore: number };
}

export interface AuthUser {
  id: string;
  email: string;
}

export type LivretSubAccount = 'economies' | 'poche';
