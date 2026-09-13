import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import type {
  AnnualSubscription,
  AppState,
  Income,
  LivretSubAccount,
  MonthlySubscription,
} from '../types';
import { FinanceContext, type FinanceContextValue } from './FinanceContext';
import { defaultState } from './storage';

export function ApiFinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const requestVersion = useRef(0);
  const mutationQueue = useRef<Promise<unknown>>(Promise.resolve());

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    const s = await api.getState();
    if (version === requestVersion.current) setState(s);
  }, []);

  useEffect(() => {
    const safeRefresh = () => {
      void refresh().catch((err) => console.error('Actualisation:', err));
    };
    void refresh().catch((err) => console.error('Chargement:', err)).finally(() => setReady(true));
    const interval = setInterval(safeRefresh, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') safeRefresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const runAction = useCallback(async (type: string, payload: Record<string, unknown> = {}) => {
    const task = mutationQueue.current.catch(() => undefined).then(async () => {
      const version = ++requestVersion.current;
      const s = await api.action(type, payload);
      if (version === requestVersion.current) setState(s);
      return s;
    });
    mutationQueue.current = task.then(() => undefined, () => undefined);
    return task;
  }, []);

  const runBackground = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    void runAction(type, payload).catch((err) => console.error(`Action ${type}:`, err));
  }, [runAction]);

  const setBalance = useCallback(
    (target: 'courant', amount: number) => {
      runBackground('setBalance', { target, amount });
    },
    [runBackground],
  );

  const addMoney = useCallback(
    (target: 'courant', amount: number, motif?: string) => {
      runBackground('addMoney', { target, amount, motif });
    },
    [runBackground],
  );

  const withdrawMoney = useCallback(
    async (target: 'courant', amount: number, motif?: string) => {
      try {
        await runAction('withdrawMoney', { target, amount, motif });
        return true;
      } catch {
        return false;
      }
    },
    [runAction],
  );

  const transferCourantLivret = useCallback(
    async (direction: 'to_livret' | 'to_courant', sub: LivretSubAccount, amount: number) => {
      try {
        await runAction('transferCourantLivret', { direction, sub, amount });
        return true;
      } catch {
        return false;
      }
    },
    [runAction],
  );

  const addMonthlySubscription = useCallback(
    (data: Omit<MonthlySubscription, 'id' | 'createdAt'>) => {
      runBackground('addMonthlySubscription', { data });
    },
    [runBackground],
  );

  const updateMonthlySubscription = useCallback(
    (id: string, data: Omit<MonthlySubscription, 'id' | 'createdAt'>) => {
      runBackground('updateMonthlySubscription', { id, data });
    },
    [runBackground],
  );

  const removeMonthlySubscription = useCallback(
    (id: string) => runBackground('removeMonthlySubscription', { id }),
    [runBackground],
  );

  const addAnnualSubscription = useCallback(
    (data: Omit<AnnualSubscription, 'id' | 'createdAt'>) => {
      runBackground('addAnnualSubscription', { data });
    },
    [runBackground],
  );

  const updateAnnualSubscription = useCallback(
    (id: string, data: Omit<AnnualSubscription, 'id' | 'createdAt'>) => {
      runBackground('updateAnnualSubscription', { id, data });
    },
    [runBackground],
  );

  const removeAnnualSubscription = useCallback(
    (id: string) => runBackground('removeAnnualSubscription', { id }),
    [runBackground],
  );

  const addIncome = useCallback(
    (data: Omit<Income, 'id' | 'createdAt'>) => runBackground('addIncome', { data }),
    [runBackground],
  );

  const updateIncome = useCallback(
    (id: string, data: Omit<Income, 'id' | 'createdAt'>) => {
      runBackground('updateIncome', { id, data });
    },
    [runBackground],
  );

  const removeIncome = useCallback(
    (id: string) => runBackground('removeIncome', { id }),
    [runBackground],
  );

  const setAlertDaysBefore = useCallback(
    (days: number) => runBackground('setAlertDaysBefore', { days }),
    [runBackground],
  );

  const value = useMemo<FinanceContextValue>(
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink-muted">Chargement…</p>
      </div>
    );
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useApiFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useApiFinance must be used within ApiFinanceProvider');
  return ctx;
}
