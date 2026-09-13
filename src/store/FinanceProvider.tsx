import { type ReactNode } from 'react';
import { isApiMode } from '../api/client';
import { ApiFinanceProvider } from './ApiFinanceProvider';
import { LocalFinanceProvider } from './FinanceContext';

export function FinanceProvider({ children }: { children: ReactNode }) {
  if (isApiMode()) return <ApiFinanceProvider>{children}</ApiFinanceProvider>;
  return <LocalFinanceProvider>{children}</LocalFinanceProvider>;
}

export { useFinance, useFinanceState } from './FinanceContext';
