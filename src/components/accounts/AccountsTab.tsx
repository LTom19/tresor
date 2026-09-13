import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useFinance } from '../../store/FinanceContext';
import { getLivretTotal } from '../../utils/calculations';
import { formatEuro, livretSubLabel } from '../../utils/format';
import type { LivretSubAccount } from '../../types';
import { Button } from '../ui/Button';
import { HistoryPanel } from './HistoryPanel';
import { OperationModal, type OperationKind } from './OperationModal';
import { TransactionList } from './TransactionList';

interface ModalState {
  kind: OperationKind;
  destination?: LivretSubAccount;
}

export function AccountsTab() {
  const {
    state,
    setBalance,
    addMoney,
    withdrawMoney,
    transferCourantLivret,
  } = useFinance();

  const [modal, setModal] = useState<ModalState | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState('');

  const placementTotal = getLivretTotal(state);

  const handleConfirm = async (amount: number, motif?: string) => {
    if (!modal) return;
    setError('');
    let ok = true;

    switch (modal.kind) {
      case 'set_balance':
        setBalance('courant', amount);
        break;
      case 'add':
        addMoney('courant', amount, motif);
        break;
      case 'withdraw':
        ok = await Promise.resolve(withdrawMoney('courant', amount, motif));
        if (!ok) setError('Solde insuffisant.');
        break;
      case 'transfer_courant_livret':
        ok = await Promise.resolve(
          transferCourantLivret('to_livret', modal.destination!, amount),
        );
        if (!ok) setError('Solde insuffisant sur le Compte Courant.');
        break;
      case 'transfer_livret_courant':
        ok = await Promise.resolve(
          transferCourantLivret('to_courant', modal.destination!, amount),
        );
        if (!ok) {
          setError(`Solde insuffisant sur ${livretSubLabel(modal.destination!)}.`);
        }
        break;
    }

    if (ok) setModal(null);
  };

  const openModal = (kind: OperationKind, destination?: LivretSubAccount) => {
    setError('');
    setModal({ kind, destination });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-copper uppercase tracking-widest mb-1">
            Vos comptes
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
            Trésorerie
          </h2>
        </div>
        <Button variant="ghost" onClick={() => setHistoryOpen(true)}>
          Historique complet →
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        <motion.div
          layout
          className="lg:col-span-5 relative overflow-hidden rounded-3xl bg-ink text-paper p-6 sm:p-8 min-h-[280px] flex flex-col"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-copper/20 blur-2xl" />
          <div className="relative flex-1">
            <p className="text-paper/60 text-sm font-medium mb-2">Compte Courant</p>
            <p className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              {formatEuro(state.compteCourant)}
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2 mt-6">
            <ActionChip onClick={() => openModal('set_balance')}>Définir</ActionChip>
            <ActionChip onClick={() => openModal('add')}>+ Ajouter</ActionChip>
            <ActionChip onClick={() => openModal('withdraw')}>− Retirer</ActionChip>
            <ActionChip onClick={() => openModal('transfer_courant_livret', 'poche')}>
              → Livret A
            </ActionChip>
            <ActionChip onClick={() => openModal('transfer_courant_livret', 'economies')}>
              → Épargne
            </ActionChip>
          </div>
        </motion.div>

        <motion.div
          layout
          className="lg:col-span-7 rounded-3xl bg-paper-warm border border-paper-deep p-6 sm:p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-6">
            <p className="text-sage text-sm font-medium mb-1">Placement</p>
            <p className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              {formatEuro(placementTotal)}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <SubAccountCard
              title="Livret A"
              subtitle="Réserve disponible"
              amount={state.livretPoche}
              accent="copper"
              onTransferToCourant={() => openModal('transfer_livret_courant', 'poche')}
            />
            <SubAccountCard
              title="Épargne"
              subtitle="Réserve stable"
              amount={state.livretEconomies}
              accent="sage"
              onTransferToCourant={() => openModal('transfer_livret_courant', 'economies')}
            />
          </div>
        </motion.div>
      </div>

      <TransactionList operations={state.operations} />

      {modal && (
        <OperationModal
          open={!!modal}
          onClose={() => setModal(null)}
          kind={modal.kind}
          destination={modal.destination}
          onConfirm={handleConfirm}
          error={error}
        />
      )}

      <HistoryPanel
        operations={state.operations}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {historyOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px]"
          onClick={() => setHistoryOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
}

function ActionChip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg bg-paper/10 hover:bg-paper/20 text-sm font-medium text-paper transition-colors border border-paper/10"
    >
      {children}
    </button>
  );
}

function SubAccountCard({
  title,
  subtitle,
  amount,
  accent,
  onTransferToCourant,
}: {
  title: string;
  subtitle: string;
  amount: number;
  accent: 'sage' | 'copper';
  onTransferToCourant: () => void;
}) {
  const accentColor = accent === 'sage' ? 'text-sage' : 'text-copper';

  return (
    <div className="rounded-2xl bg-paper p-4 border border-paper-deep/80 hover:border-paper-deep transition-colors">
      <p className={`text-xs font-semibold uppercase tracking-wide ${accentColor}`}>
        {title}
      </p>
      <p className="text-xs text-ink-muted mb-2">{subtitle}</p>
      <p className="font-display text-2xl font-semibold text-ink mb-3">
        {formatEuro(amount)}
      </p>
      <button
        type="button"
        onClick={onTransferToCourant}
        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-paper-warm hover:bg-paper-deep text-ink-muted hover:text-ink transition-colors"
      >
        → Compte Courant
      </button>
    </div>
  );
}
