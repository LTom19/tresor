/**
 * Comptes de placement.
 * Les clés historiques sont conservées pour ne pas casser les soldes déjà en base :
 * economies = Épargne, poche = Livret A.
 */
export type LivretSubAccount = 'economies' | 'poche';

/** Durée d'un abonnement */
export type SubscriptionDuration =
  | { type: 'indefinite' }
  | { type: 'months'; value: number }
  | { type: 'years'; value: number };

/** Abonnement mensuel récurrent */
export interface MonthlySubscription {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  /** Date de début (ISO YYYY-MM-DD) */
  startDate: string;
  duration: SubscriptionDuration;
  /** Date d'ajout dans l'app (ISO YYYY-MM-DD) — pas de débit rétroactif avant cette date */
  createdAt: string;
}

/** Abonnement annuel à date fixe (jour/mois, se répète chaque année) */
export interface AnnualSubscription {
  id: string;
  name: string;
  amount: number;
  /** Date ISO (YYYY-MM-DD) — seul le jour et le mois comptent */
  date: string;
  /** Date de début de validité (ISO YYYY-MM-DD) */
  startDate: string;
  duration: SubscriptionDuration;
  /** Date d'ajout dans l'app (ISO YYYY-MM-DD) */
  createdAt: string;
}

/** Revenu mensuel (ex. salaire) */
export interface Income {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  /** Date de début (ISO YYYY-MM-DD) */
  startDate: string;
  /** Date d'ajout dans l'app (ISO YYYY-MM-DD) */
  createdAt: string;
}

/** Types d'opération pour l'historique */
export type OperationType =
  | 'set_balance'
  | 'add'
  | 'withdraw'
  | 'transfer';

export interface Operation {
  id: string;
  timestamp: string;
  type: OperationType;
  /** Libellé lisible (ex. « Compte Courant », « Épargne ») */
  label: string;
  amount: number;
  /** Détails complémentaires (ex. transfert vers…) */
  details?: string;
  /** Motif optionnel pour ajouts/retraits */
  motif?: string;
}

export interface AppSettings {
  /** Nombre de jours avant un prélèvement pour l'alerte préventive */
  alertDaysBefore: number;
}

export interface AppState {
  compteCourant: number;
  livretEconomies: number;
  livretPoche: number;
  monthlySubscriptions: MonthlySubscription[];
  annualSubscriptions: AnnualSubscription[];
  incomes: Income[];
  operations: Operation[];
  /** IDs des événements calendrier déjà traités automatiquement */
  processedAutoEvents: string[];
  settings: AppSettings;
}

export type TabId = 'comptes' | 'calendrier' | 'recap';

/** Événement affiché sur le calendrier */
export interface CalendarEvent {
  id: string;
  name: string;
  amount: number;
  date: Date;
  kind: 'monthly' | 'annual' | 'income';
  subscriptionId: string;
}

/** Alerte de solde insuffisant */
export interface InsufficientBalanceAlert {
  subscriptionName: string;
  amount: number;
  date: Date;
  missing: number;
}

/** Alerte préventive avant prélèvement */
export interface UpcomingPaymentAlert {
  subscriptionName: string;
  amount: number;
  date: Date;
  daysUntil: number;
  kind: 'monthly' | 'annual';
}
