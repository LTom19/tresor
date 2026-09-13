import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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

interface HistoryPanelProps {
  operations: Operation[];
  open: boolean;
  onClose: () => void;
}

export function HistoryPanel({ operations, open, onClose }: HistoryPanelProps) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-paper border-l border-paper-deep shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-paper-deep">
        <h2 className="font-display text-xl font-semibold">Historique</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-paper-warm transition-colors"
          aria-label="Fermer l'historique"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {operations.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-12">
            Aucune opération enregistrée.
          </p>
        ) : (
          operations.map((op, i) => (
            <motion.div
              key={op.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="p-3 rounded-xl bg-paper-warm/60 border border-paper-deep/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${typeColors[op.type]}`}>
                    {typeLabels[op.type]}
                  </p>
                  <p className="text-sm font-medium text-ink truncate">{op.label}</p>
                  {op.motif && (
                    <p className="text-xs text-ink-muted mt-0.5 italic">« {op.motif} »</p>
                  )}
                  {op.details && (
                    <p className="text-xs text-ink-muted mt-0.5">{op.details}</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-ink shrink-0">
                  {formatEuro(op.amount)}
                </p>
              </div>
              <p className="text-[11px] text-ink-muted mt-2">
                {format(new Date(op.timestamp), "d MMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
