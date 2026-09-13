import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { InsufficientBalanceAlert, UpcomingPaymentAlert } from '../../types';
import { formatEuro } from '../../utils/format';

interface AlertBannerProps {
  upcoming: UpcomingPaymentAlert[];
  insufficient: InsufficientBalanceAlert[];
}

export function AlertBanner({ upcoming, insufficient }: AlertBannerProps) {
  const hasAlerts = upcoming.length > 0 || insufficient.length > 0;
  if (!hasAlerts) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-2 mb-6"
      >
        {insufficient.length > 0 && (
          <div className="flex gap-3 p-4 rounded-2xl bg-wine/10 border border-wine/25">
            <span className="text-wine text-lg shrink-0">⚠</span>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-semibold text-wine">
                Solde insuffisant prévu
              </p>
              <ul className="space-y-1">
                {insufficient.map((a, i) => (
                  <li key={i} className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">{a.subscriptionName}</span>
                    {' '}({format(a.date, 'd MMM', { locale: fr })}) —{' '}
                    {formatEuro(a.amount)} · manque {formatEuro(a.missing)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="flex gap-3 p-4 rounded-2xl bg-gold/10 border border-gold/30">
            <span className="text-gold text-lg shrink-0">◷</span>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-semibold text-ink">
                Prélèvements à venir
              </p>
              <ul className="space-y-1">
                {upcoming.slice(0, 4).map((a, i) => (
                  <li key={i} className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">{a.subscriptionName}</span>
                    {' '}— {formatEuro(a.amount)} ·{' '}
                    {a.daysUntil === 0
                      ? "aujourd'hui"
                      : a.daysUntil === 1
                        ? 'demain'
                        : `dans ${a.daysUntil} jours`}
                  </li>
                ))}
                {upcoming.length > 4 && (
                  <li className="text-xs text-ink-muted">
                    +{upcoming.length - 4} autre(s)…
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
