import { v4 as uuidv4 } from 'uuid';
import type { AppState, LivretSubAccount } from '../types.js';
import { applyAutoPayments, loadStateRaw, persistState, todayISO } from './stateService.js';
import { withUserLock } from './userMutex.js';

function requireCourant(value: unknown): 'courant' {
  if (value !== 'courant') throw new Error('Données invalides');
  return value;
}

function requireLivret(value: unknown): LivretSubAccount {
  if (value !== 'economies' && value !== 'poche') throw new Error('Données invalides');
  return value;
}

function requireAmount(value: unknown, allowNegative = false): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || (!allowNegative && amount <= 0)) {
    throw new Error('Montant invalide');
  }
  return Math.round(amount * 100) / 100;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function livretSubLabel(sub: LivretSubAccount): string {
  return sub === 'economies' ? 'Épargne' : 'Livret A';
}

function getLivretField(sub: LivretSubAccount): 'livretEconomies' | 'livretPoche' {
  return sub === 'economies' ? 'livretEconomies' : 'livretPoche';
}

function pushOp(state: AppState, op: Omit<AppState['operations'][0], 'id' | 'timestamp'>): AppState {
  return {
    ...state,
    operations: [{ ...op, id: uuidv4(), timestamp: new Date().toISOString() }, ...state.operations].slice(0, 500),
  };
}

export async function dispatchAction(userId: string, type: string, payload: Record<string, unknown>): Promise<AppState> {
  return withUserLock(userId, async (client) => {
  let state = await loadStateRaw(userId, client);

  switch (type) {
    case 'setBalance': {
      requireCourant(payload.target);
      const amount = requireAmount(payload.amount, true);
      state = pushOp(state, { type: 'set_balance', label: 'Compte Courant', amount, details: 'Définition du solde' });
      state = { ...state, compteCourant: amount };
      break;
    }
    case 'addMoney': {
      requireCourant(payload.target);
      const amount = requireAmount(payload.amount);
      const motif = payload.motif as string | undefined;
      state = pushOp(state, { type: 'add', label: 'Compte Courant', amount, motif });
      state = { ...state, compteCourant: money(state.compteCourant + amount) };
      break;
    }
    case 'withdrawMoney': {
      requireCourant(payload.target);
      const amount = requireAmount(payload.amount);
      const motif = payload.motif as string | undefined;
      if (state.compteCourant < amount) throw new Error('Solde insuffisant');
      state = { ...state, compteCourant: money(state.compteCourant - amount) };
      state = pushOp(state, { type: 'withdraw', label: 'Compte Courant', amount, motif });
      break;
    }
    case 'transferCourantLivret': {
      const direction = payload.direction as 'to_livret' | 'to_courant';
      const sub = requireLivret(payload.sub);
      const amount = requireAmount(payload.amount);
      const field = getLivretField(sub);
      const subLabel = livretSubLabel(sub);
      if (direction === 'to_livret') {
        if (state.compteCourant < amount) throw new Error('Solde insuffisant');
        state = { ...state, compteCourant: money(state.compteCourant - amount), [field]: money(state[field] + amount) };
        state = pushOp(state, { type: 'transfer', label: `Compte Courant → ${subLabel}`, amount, details: `Vers ${subLabel}` });
      } else {
        if (state[field] < amount) throw new Error('Solde insuffisant');
        state = { ...state, compteCourant: money(state.compteCourant + amount), [field]: money(state[field] - amount) };
        state = pushOp(state, { type: 'transfer', label: `${subLabel} → Compte Courant`, amount, details: `Depuis ${subLabel}` });
      }
      break;
    }
    case 'addMonthlySubscription':
      state = {
        ...state,
        monthlySubscriptions: [...state.monthlySubscriptions, { ...(payload.data as object), id: uuidv4(), createdAt: todayISO() } as AppState['monthlySubscriptions'][0]],
      };
      break;
    case 'updateMonthlySubscription':
      if (!state.monthlySubscriptions.some((s) => s.id === payload.id)) throw new Error('Élément introuvable');
      state = {
        ...state,
        monthlySubscriptions: state.monthlySubscriptions.map((s) =>
          // Une nouvelle planification ne doit jamais rattraper une échéance antérieure à sa modification.
          s.id === payload.id ? { ...(payload.data as object), id: s.id, createdAt: todayISO() } as typeof s : s,
        ),
      };
      break;
    case 'removeMonthlySubscription':
      if (!state.monthlySubscriptions.some((s) => s.id === payload.id)) throw new Error('Élément introuvable');
      state = {
        ...state,
        monthlySubscriptions: state.monthlySubscriptions.filter((s) => s.id !== payload.id),
        processedAutoEvents: state.processedAutoEvents.filter((id) => !id.startsWith(`m-${payload.id}-`)),
      };
      break;
    case 'addAnnualSubscription':
      state = {
        ...state,
        annualSubscriptions: [...state.annualSubscriptions, { ...(payload.data as object), id: uuidv4(), createdAt: todayISO() } as AppState['annualSubscriptions'][0]],
      };
      break;
    case 'updateAnnualSubscription':
      if (!state.annualSubscriptions.some((s) => s.id === payload.id)) throw new Error('Élément introuvable');
      state = {
        ...state,
        annualSubscriptions: state.annualSubscriptions.map((s) =>
          s.id === payload.id ? { ...(payload.data as object), id: s.id, createdAt: todayISO() } as typeof s : s,
        ),
      };
      break;
    case 'removeAnnualSubscription':
      if (!state.annualSubscriptions.some((s) => s.id === payload.id)) throw new Error('Élément introuvable');
      state = {
        ...state,
        annualSubscriptions: state.annualSubscriptions.filter((s) => s.id !== payload.id),
        processedAutoEvents: state.processedAutoEvents.filter((id) => !id.startsWith(`a-${payload.id}-`)),
      };
      break;
    case 'addIncome':
      state = {
        ...state,
        incomes: [...state.incomes, { ...(payload.data as object), id: uuidv4(), createdAt: todayISO() } as AppState['incomes'][0]],
      };
      break;
    case 'updateIncome':
      if (!state.incomes.some((i) => i.id === payload.id)) throw new Error('Élément introuvable');
      state = {
        ...state,
        incomes: state.incomes.map((i) =>
          i.id === payload.id ? { ...(payload.data as object), id: i.id, createdAt: todayISO() } as typeof i : i,
        ),
      };
      break;
    case 'removeIncome':
      if (!state.incomes.some((i) => i.id === payload.id)) throw new Error('Élément introuvable');
      state = {
        ...state,
        incomes: state.incomes.filter((i) => i.id !== payload.id),
        processedAutoEvents: state.processedAutoEvents.filter((id) => !id.startsWith(`i-${payload.id}-`)),
      };
      break;
    case 'setAlertDaysBefore':
      state = { ...state, settings: { ...state.settings, alertDaysBefore: Number(payload.days) } };
      break;
    default:
      throw new Error(`Action inconnue: ${type}`);
  }

  state = applyAutoPayments(state);
  await persistState(userId, state, client);
  return state;
  });
}
