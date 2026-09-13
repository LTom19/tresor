import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  AnnualSubscription,
  AppState,
  Income,
  LivretSubAccount,
  MonthlySubscription,
  Operation,
} from '../types';
import { livretSubLabel } from '../utils/format';
import { applyDueAutoPayments } from '../utils/autoPayments';
import { todayISO } from '../utils/subscription';
import { loadState, saveState } from './storage';

export interface FinanceContextValue {
  state: AppState;
  setBalance: (target: 'courant', amount: number) => void;
  addMoney: (target: 'courant', amount: number, motif?: string) => void;
  withdrawMoney: (
    target: 'courant',
    amount: number,
    motif?: string,
  ) => boolean | Promise<boolean>;
  transferCourantLivret: (
    direction: 'to_livret' | 'to_courant',
    sub: LivretSubAccount,
    amount: number,
  ) => boolean | Promise<boolean>;
  addMonthlySubscription: (data: Omit<MonthlySubscription, 'id' | 'createdAt'>) => void;
  updateMonthlySubscription: (id: string, data: Omit<MonthlySubscription, 'id' | 'createdAt'>) => void;
  removeMonthlySubscription: (id: string) => void;
  addAnnualSubscription: (data: Omit<AnnualSubscription, 'id' | 'createdAt'>) => void;
  updateAnnualSubscription: (id: string, data: Omit<AnnualSubscription, 'id' | 'createdAt'>) => void;
  removeAnnualSubscription: (id: string) => void;
  addIncome: (data: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, data: Omit<Income, 'id' | 'createdAt'>) => void;
  removeIncome: (id: string) => void;
  setAlertDaysBefore: (days: number) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export { FinanceContext };

function pushOperation(
  ops: Operation[],
  op: Omit<Operation, 'id' | 'timestamp'>,
): Operation[] {
  return [
    {
      ...op,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    },
    ...ops,
  ].slice(0, 500);
}

function getLivretField(sub: LivretSubAccount): 'livretEconomies' | 'livretPoche' {
  return sub === 'economies' ? 'livretEconomies' : 'livretPoche';
}

export function LocalFinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => applyDueAutoPayments(loadState()));

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Prélèvements / revenus automatiques à l'ouverture, au retour sur l'onglet, et chaque minute
  useEffect(() => {
    const run = () => {
      setState((prev) => {
        const next = applyDueAutoPayments(prev);
        return next === prev ? prev : next;
      });
    };

    run();

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(run, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  const setBalance = useCallback(
    (target: 'courant', amount: number) => {
      if (target !== 'courant') return;
      setState((prev) => ({
        ...prev,
        compteCourant: amount,
        operations: pushOperation(prev.operations, {
          type: 'set_balance',
          label: 'Compte Courant',
          amount,
          details: 'Définition du solde',
        }),
      }));
    },
    [],
  );

  const addMoney = useCallback(
    (target: 'courant', amount: number, motif?: string) => {
      if (target !== 'courant' || amount <= 0) return;
      setState((prev) => ({
        ...prev,
        compteCourant: prev.compteCourant + amount,
        operations: pushOperation(prev.operations, {
          type: 'add',
          label: 'Compte Courant',
          amount,
          motif: motif?.trim() || undefined,
        }),
      }));
    },
    [],
  );

  const withdrawMoney = useCallback(
    (target: 'courant', amount: number, motif?: string): boolean => {
      if (target !== 'courant' || amount <= 0) return false;

      let success = false;
      setState((prev) => {
        if (prev.compteCourant < amount) return prev;
        success = true;
        return {
          ...prev,
          compteCourant: prev.compteCourant - amount,
          operations: pushOperation(prev.operations, {
            type: 'withdraw',
            label: 'Compte Courant',
            amount,
            motif: motif?.trim() || undefined,
          }),
        };
      });
      return success;
    },
    [],
  );

  const transferCourantLivret = useCallback(
    (
      direction: 'to_livret' | 'to_courant',
      sub: LivretSubAccount,
      amount: number,
    ): boolean => {
      if (amount <= 0) return false;

      let success = false;
      setState((prev) => {
        const field = getLivretField(sub);
        const subLabel = livretSubLabel(sub);

        if (direction === 'to_livret') {
          if (prev.compteCourant < amount) return prev;
          success = true;
          return {
            ...prev,
            compteCourant: prev.compteCourant - amount,
            [field]: prev[field] + amount,
            operations: pushOperation(prev.operations, {
              type: 'transfer',
              label: 'Compte Courant → ' + subLabel,
              amount,
              details: `Vers ${subLabel}`,
            }),
          };
        }

        if (prev[field] < amount) return prev;
        success = true;
        return {
          ...prev,
          compteCourant: prev.compteCourant + amount,
          [field]: prev[field] - amount,
          operations: pushOperation(prev.operations, {
            type: 'transfer',
            label: subLabel + ' → Compte Courant',
            amount,
            details: `Depuis ${subLabel}`,
          }),
        };
      });
      return success;
    },
    [],
  );

  const addMonthlySubscription = useCallback(
    (data: Omit<MonthlySubscription, 'id' | 'createdAt'>) => {
      setState((prev) =>
        applyDueAutoPayments({
          ...prev,
          monthlySubscriptions: [
            ...prev.monthlySubscriptions,
            { ...data, id: uuidv4(), createdAt: todayISO() },
          ],
        }),
      );
    },
    [],
  );

  const updateMonthlySubscription = useCallback(
    (id: string, data: Omit<MonthlySubscription, 'id' | 'createdAt'>) => {
      setState((prev) => ({
        ...prev,
        monthlySubscriptions: prev.monthlySubscriptions.map((s) =>
          s.id === id ? { ...data, id, createdAt: todayISO() } : s,
        ),
      }));
    },
    [],
  );

  const removeMonthlySubscription = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      monthlySubscriptions: prev.monthlySubscriptions.filter((s) => s.id !== id),
    }));
  }, []);

  const addAnnualSubscription = useCallback(
    (data: Omit<AnnualSubscription, 'id' | 'createdAt'>) => {
      setState((prev) =>
        applyDueAutoPayments({
          ...prev,
          annualSubscriptions: [
            ...prev.annualSubscriptions,
            { ...data, id: uuidv4(), createdAt: todayISO() },
          ],
        }),
      );
    },
    [],
  );

  const updateAnnualSubscription = useCallback(
    (id: string, data: Omit<AnnualSubscription, 'id' | 'createdAt'>) => {
      setState((prev) => ({
        ...prev,
        annualSubscriptions: prev.annualSubscriptions.map((s) =>
          s.id === id ? { ...data, id, createdAt: todayISO() } : s,
        ),
      }));
    },
    [],
  );

  const removeAnnualSubscription = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      annualSubscriptions: prev.annualSubscriptions.filter((s) => s.id !== id),
    }));
  }, []);

  const addIncome = useCallback((data: Omit<Income, 'id' | 'createdAt'>) => {
    setState((prev) =>
      applyDueAutoPayments({
        ...prev,
        incomes: [...prev.incomes, { ...data, id: uuidv4(), createdAt: todayISO() }],
      }),
    );
  }, []);

  const updateIncome = useCallback((id: string, data: Omit<Income, 'id' | 'createdAt'>) => {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) =>
        i.id === id ? { ...data, id, createdAt: todayISO() } : i,
      ),
    }));
  }, []);

  const removeIncome = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((i) => i.id !== id),
    }));
  }, []);

  const setAlertDaysBefore = useCallback((days: number) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, alertDaysBefore: Math.max(1, days) },
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      setBalance,
      addMoney,
      withdrawMoney,
      transferCourantLivret,
      addMonthlySubscription,
      updateMonthlySubscription,
      removeMonthlySubscription,
      addAnnualSubscription,
      updateAnnualSubscription,
      removeAnnualSubscription,
      addIncome,
      updateIncome,
      removeIncome,
      setAlertDaysBefore,
    }),
    [
      state,
      setBalance,
      addMoney,
      withdrawMoney,
      transferCourantLivret,
      addMonthlySubscription,
      updateMonthlySubscription,
      removeMonthlySubscription,
      addAnnualSubscription,
      updateAnnualSubscription,
      removeAnnualSubscription,
      addIncome,
      updateIncome,
      removeIncome,
      setAlertDaysBefore,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

export function useFinanceState(): AppState {
  return useFinance().state;
}
