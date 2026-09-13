import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { isApiMode } from './api/client';
import { AccountsTab } from './components/accounts/AccountsTab';
import { AuthPage } from './components/auth/AuthPage';
import { CalendarTab } from './components/calendar/CalendarTab';
import { LegalDocumentView, LegalFooterLinks, useLegalPage } from './components/legal/LegalPages';
import { AlertBanner } from './components/layout/AlertBanner';
import { Navigation } from './components/layout/Navigation';
import { SummaryTab } from './components/summary/SummaryTab';
import { AuthProvider, useAuth } from './store/AuthContext';
import { FinanceProvider, useFinanceState } from './store/FinanceProvider';
import type { TabId } from './types';
import {
  getInsufficientBalanceAlerts,
  getUpcomingPaymentAlerts,
} from './utils/calculations';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('comptes');
  const state = useFinanceState();
  const { user, logout } = useAuth();

  const upcoming = useMemo(() => getUpcomingPaymentAlerts(state), [state]);
  const insufficient = useMemo(
    () => getInsufficientBalanceAlerts(state),
    [state],
  );
  const alertCount = upcoming.length + insufficient.length;

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-copper/8 blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-80 h-80 rounded-full bg-sage/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gold/6 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              Trésor
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {user ? user.email : 'Gestion financière personnelle'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Navigation active={activeTab} onChange={setActiveTab} alertCount={alertCount} />
            {user && (
              <button
                type="button"
                onClick={logout}
                className="text-xs text-ink-muted hover:text-wine transition-colors"
              >
                Déconnexion
              </button>
            )}
          </div>
        </header>

        <AlertBanner upcoming={upcoming} insufficient={insufficient} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'comptes' && <AccountsTab />}
            {activeTab === 'calendrier' && <CalendarTab />}
            {activeTab === 'recap' && <SummaryTab />}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-12 pt-6 border-t border-paper-deep/60">
          <LegalFooterLinks />
        </footer>
      </div>
    </div>
  );
}

function AppWithAuth() {
  const { user } = useAuth();
  if (!user) return <AuthPage />;
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default function App() {
  const legalPage = useLegalPage();

  if (legalPage) {
    return <LegalDocumentView pageId={legalPage} />;
  }

  if (isApiMode()) {
    return (
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    );
  }
  return (
    <FinanceProvider>
      <AppShell />
    </FinanceProvider>
  );
}

/** Mode local sans authentification */
function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('comptes');
  const state = useFinanceState();

  const upcoming = useMemo(() => getUpcomingPaymentAlerts(state), [state]);
  const insufficient = useMemo(
    () => getInsufficientBalanceAlerts(state),
    [state],
  );
  const alertCount = upcoming.length + insufficient.length;

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-copper/8 blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-80 h-80 rounded-full bg-sage/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gold/6 blur-3xl" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Trésor</h1>
            <p className="text-sm text-ink-muted mt-0.5">Gestion financière personnelle</p>
          </div>
          <Navigation active={activeTab} onChange={setActiveTab} alertCount={alertCount} />
        </header>
        <AlertBanner upcoming={upcoming} insufficient={insufficient} />
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {activeTab === 'comptes' && <AccountsTab />}
            {activeTab === 'calendrier' && <CalendarTab />}
            {activeTab === 'recap' && <SummaryTab />}
          </motion.div>
        </AnimatePresence>
        <footer className="mt-12 pt-6 border-t border-paper-deep/60">
          <LegalFooterLinks />
        </footer>
      </div>
    </div>
  );
}
