import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { Operation } from '../../types';
import { formatEuro } from '../../utils/format';

const typeLabels: Record<Operation['type'], string> = {
  set_balance: 'Solde défini',
  add: 'Ajout',
  withdraw: 'Retrait',
  transfer: 'Transfert',
};

const typeColors: Record<Operation['type'], string> = {
  set_balance: 'text-slate',
  add: 'text-sage',
  withdraw: 'text-copper',
  transfer: 'text-sky',
};

/** Liste des transactions affichée sous les comptes */
export function TransactionList({ operations }: { operations: Operation[] }) {
  if (operations.length === 0) {
    return (
      <div className="rounded-2xl border border-paper-deep bg-paper-warm/40 p-8 text-center">
        <p className="text-sm text-ink-muted">Aucune transaction enregistrée.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-paper-deep bg-paper overflow-hidden">
      <div className="px-5 py-4 border-b border-paper-deep">
        <h3 className="font-display text-lg font-semibold">Transactions</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Historique des opérations sur vos comptes
        </p>
      </div>
      <ul className="divide-y divide-paper-deep/60 max-h-[420px] overflow-y-auto">
        {operations.map((op, i) => (
          <motion.li
            key={op.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className="px-5 py-3.5 hover:bg-paper-warm/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${typeColors[op.type]}`}
                  >
                    {typeLabels[op.type]}
                  </span>
                  <span className="text-sm font-medium text-ink">{op.label}</span>
                </div>
                {op.motif && (
                  <p className="text-sm text-ink-muted mt-0.5 italic">
                    « {op.motif} »
                  </p>
                )}
                {op.details && !op.motif && (
                  <p className="text-xs text-ink-muted mt-0.5">{op.details}</p>
                )}
                {op.details && op.motif && (
                  <p className="text-xs text-ink-muted mt-0.5">{op.details}</p>
                )}
                <p className="text-[11px] text-ink-muted/70 mt-1">
                  {format(new Date(op.timestamp), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <p
                className={[
                  'text-sm font-semibold shrink-0',
                  op.type === 'add' ? 'text-sage' : op.type === 'withdraw' ? 'text-copper' : 'text-ink',
                ].join(' ')}
              >
                {op.type === 'withdraw' ? '−' : op.type === 'add' ? '+' : ''}
                {formatEuro(op.amount)}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
