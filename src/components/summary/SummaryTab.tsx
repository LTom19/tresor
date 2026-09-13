import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useFinance } from '../../store/FinanceContext';
import type { MonthlySubscription } from '../../types';
import {
  getAnnualEstimate,
  getAnnualIncomeEstimate,
  getInsufficientBalanceAlerts,
  getMonthlyChargesTotal,
  getMonthlyIncomeTotal,
  getProjectedEndOfMonthBalance,
  getRemainingMonthEvents,
  getUpcomingPaymentAlerts,
} from '../../utils/calculations';
import { formatEuro } from '../../utils/format';
import { getMonthlySubscriptionTotalCost, isSubscriptionActive, parseLocalDate } from '../../utils/subscription';
import { Input } from '../ui/Input';

export function SummaryTab() {
  const { state, setAlertDaysBefore } = useFinance();

  const monthlyTotal = getMonthlyChargesTotal(state.monthlySubscriptions);
  const annualChargesEstimate = getAnnualEstimate(
    state.monthlySubscriptions,
    state.annualSubscriptions,
  );
  const annualIncomeEstimate = getAnnualIncomeEstimate(state.incomes);
  const remainingEvents = getRemainingMonthEvents(state);
  const remainingPayments = remainingEvents.filter((e) => e.kind !== 'income');
  const projectedBalance = getProjectedEndOfMonthBalance(state);
  const remainingChargesTotal = remainingPayments.reduce((s, p) => s + p.amount, 0);
  const upcoming = getUpcomingPaymentAlerts(state);
  const insufficient = getInsufficientBalanceAlerts(state);
  const isDeficit = projectedBalance < 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-copper uppercase tracking-widest mb-1">
          Vue d'ensemble
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
          Récapitulatif
        </h2>
      </div>

      {isDeficit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-wine bg-wine/10 p-5 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl text-wine shrink-0">⚠</span>
            <div>
              <p className="font-display text-xl font-semibold text-wine">
                Solde insuffisant prévu
              </p>
              <p className="text-sm text-ink-muted mt-1">
                Après tous les prélèvements et revenus restants ce mois-ci, votre Compte Courant
                afficherait un solde de{' '}
                <span className="font-bold text-wine text-base">
                  {formatEuro(projectedBalance)}
                </span>
                {' '}(déficit de {formatEuro(Math.abs(projectedBalance))}).
              </p>
              {insufficient.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {insufficient.map((a, i) => (
                    <li key={i} className="text-sm text-wine/90">
                      {a.subscriptionName} ({format(a.date, 'd MMM', { locale: fr })}) — manque{' '}
                      {formatEuro(a.missing)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Charges mensuelles"
          value={formatEuro(monthlyTotal)}
          sub="Abonnements récurrents"
          delay={0}
        />
        <StatCard
          label="Revenus mensuels"
          value={formatEuro(getMonthlyIncomeTotal(state.incomes))}
          sub="Salaire et autres"
          positive
          delay={0.05}
        />
        <StatCard
          label="Prélèvements restants"
          value={formatEuro(remainingChargesTotal)}
          sub={`${remainingPayments.length} prélèvement(s) à venir`}
          delay={0.1}
        />
        <StatCard
          label="Solde prévisionnel"
          value={formatEuro(projectedBalance)}
          sub="Fin du mois en cours"
          highlight={isDeficit}
          delay={0.15}
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={[
          'rounded-3xl border p-6 sm:p-8',
          isDeficit
            ? 'border-wine/30 bg-wine/5'
            : 'border-paper-deep bg-paper-warm/60',
        ].join(' ')}
      >
        <h3 className="font-display text-xl font-semibold mb-4">
          Prévision du Compte Courant
        </h3>
        <div className="space-y-3">
          <ForecastRow label="Solde actuel" value={state.compteCourant} />
          {remainingEvents.map((e) => (
            <ForecastRow
              key={e.id}
              label={`${e.name} (${format(e.date, 'd MMM', { locale: fr })})`}
              value={e.kind === 'income' ? e.amount : -e.amount}
              muted
              income={e.kind === 'income'}
            />
          ))}
          <div className={`border-t pt-3 ${isDeficit ? 'border-wine/30' : 'border-paper-deep'}`}>
            <ForecastRow
              label="Solde estimé en fin de mois"
              value={projectedBalance}
              bold
              negative={isDeficit}
            />
            {isDeficit && (
              <p className="text-right text-sm font-bold text-wine mt-1">
                Déficit : −{formatEuro(Math.abs(projectedBalance))}
              </p>
            )}
          </div>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-2 gap-6">
        <MonthlySubscriptionSection
          subscriptions={state.monthlySubscriptions.filter((s) =>
            isSubscriptionActive(s.startDate, s.duration),
          )}
        />
        <SubscriptionSection
          title="Abonnements annuels"
          empty="Aucun abonnement annuel."
          items={state.annualSubscriptions
            .filter((s) => isSubscriptionActive(s.startDate, s.duration))
            .map((s) => ({
              id: s.id,
              name: s.name,
              date: `${format(parseLocalDate(s.date), 'd MMMM', { locale: fr })} (chaque année)`,
              amount: s.amount,
            }))}
        />
      </div>

      {state.incomes.length > 0 && (
        <SubscriptionSection
          title="Revenus mensuels"
          empty=""
          items={state.incomes.map((s) => ({
            id: s.id,
            name: s.name,
            date: `Le ${s.dayOfMonth} de chaque mois`,
            amount: s.amount,
            positive: true,
          }))}
          showTotal
        />
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-3xl border border-paper-deep bg-paper p-6"
      >
        <h3 className="font-display text-xl font-semibold mb-4">Estimation annuelle</h3>
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
              Charges
            </p>
            <p className="text-2xl font-display font-semibold text-ink">
              {formatEuro(annualChargesEstimate)}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              12× charges mensuelles + abonnements annuels actifs
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
              Revenus
            </p>
            <p className="text-2xl font-display font-semibold text-sage">
              {formatEuro(annualIncomeEstimate)}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              12× revenus mensuels actifs
            </p>
          </div>
        </div>

        <h3 className="font-display text-xl font-semibold mb-4">Alertes</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            label="Délai d'alerte préventive (jours)"
            type="number"
            min={1}
            max={30}
            value={state.settings.alertDaysBefore}
            onChange={(e) =>
              setAlertDaysBefore(parseInt(e.target.value, 10) || 3)
            }
            hint="Notification avant chaque prélèvement"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">État des alertes</p>
            <AlertStatus
              label="Prélèvements imminents"
              count={upcoming.length}
              ok={upcoming.length === 0}
            />
            <AlertStatus
              label="Solde insuffisant prévu"
              count={insufficient.length}
              ok={insufficient.length === 0}
              danger
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
  positive,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  positive?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={[
        'rounded-2xl p-5 border',
        highlight
          ? 'bg-wine/12 border-wine/40 ring-1 ring-wine/20'
          : positive
            ? 'bg-sage/8 border-sage/25'
            : 'bg-paper border-paper-deep',
      ].join(' ')}
    >
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
        {label}
      </p>
      <p
        className={[
          'font-display text-2xl font-semibold',
          highlight ? 'text-wine' : positive ? 'text-sage' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </p>
      <p className="text-xs text-ink-muted mt-1">{sub}</p>
    </motion.div>
  );
}

function ForecastRow({
  label,
  value,
  muted,
  bold,
  negative,
  income,
}: {
  label: string;
  value: number;
  muted?: boolean;
  bold?: boolean;
  negative?: boolean;
  income?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={muted ? 'text-ink-muted' : bold ? 'font-semibold text-ink' : 'text-ink'}>
        {label}
      </span>
      <span
        className={[
          'font-semibold shrink-0',
          negative ? 'text-wine' : income ? 'text-sage' : muted ? 'text-copper' : 'text-ink',
          bold ? 'text-base' : '',
        ].join(' ')}
      >
        {value < 0 ? '−' : income ? '+' : ''}
        {formatEuro(Math.abs(value))}
      </span>
    </div>
  );
}

/** Section abonnements mensuels avec coût total au clic (selon durée) */
function MonthlySubscriptionSection({
  subscriptions,
}: {
  subscriptions: MonthlySubscription[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-paper-deep bg-paper p-5">
      <h3 className="font-display text-lg font-semibold mb-1">Abonnements mensuels</h3>
      <p className="text-xs text-ink-muted mb-4">Cliquez sur un abonnement pour voir le coût total sur sa durée</p>

      {subscriptions.length === 0 ? (
        <p className="text-sm text-ink-muted">Aucun abonnement mensuel.</p>
      ) : (
        <ul className="space-y-1">
          {subscriptions.map((item) => {
            const expanded = expandedId === item.id;
            const { total, label } = getMonthlySubscriptionTotalCost(item.amount, item.duration);

            return (
              <li key={item.id} className="border-b border-paper-deep/50 last:border-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-paper-warm/60 rounded-lg px-1 -mx-1 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-ink-muted">Le {item.dayOfMonth} de chaque mois</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold">{formatEuro(item.amount)}/mois</p>
                    <span className="text-ink-muted text-xs">{expanded ? '▲' : '▼'}</span>
                  </div>
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-3 px-1 flex items-center justify-between bg-copper/5 rounded-lg py-2 px-3 mb-2">
                        <span className="text-xs font-medium text-ink-muted">{label}</span>
                        <span className="text-sm font-bold text-copper">
                          {formatEuro(total)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
          <li className="flex justify-between pt-3 font-semibold text-sm">
            <span>Total mensuel</span>
            <span>{formatEuro(getMonthlyChargesTotal(subscriptions))}</span>
          </li>
        </ul>
      )}
    </div>
  );
}

function SubscriptionSection({
  title,
  empty,
  items,
  showTotal,
}: {
  title: string;
  empty: string;
  items: { id: string; name: string; date: string; amount: number; positive?: boolean }[];
  showTotal?: boolean;
}) {
  if (items.length === 0 && empty) {
    return (
      <div className="rounded-2xl border border-paper-deep bg-paper p-5">
        <h3 className="font-display text-lg font-semibold mb-4">{title}</h3>
        <p className="text-sm text-ink-muted">{empty}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-paper-deep bg-paper p-5">
      <h3 className="font-display text-lg font-semibold mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 py-2 border-b border-paper-deep/50 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-ink-muted">{item.date}</p>
            </div>
            <p className={`text-sm font-semibold shrink-0 ${item.positive ? 'text-sage' : ''}`}>
              {item.positive ? '+' : ''}{formatEuro(item.amount)}
            </p>
          </li>
        ))}
        {showTotal && (
          <li className="flex justify-between pt-2 font-semibold text-sm">
            <span>Total</span>
            <span className="text-sage">
              +{formatEuro(items.reduce((s, i) => s + i.amount, 0))}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

function AlertStatus({
  label,
  count,
  ok,
  danger,
}: {
  label: string;
  count: number;
  ok: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center justify-between px-4 py-3 rounded-xl text-sm',
        ok
          ? 'bg-sage/10 text-sage'
          : danger
            ? 'bg-wine/10 text-wine'
            : 'bg-gold/10 text-ink',
      ].join(' ')}
    >
      <span>{label}</span>
      <span className="font-semibold">
        {ok ? 'RAS' : `${count} alerte(s)`}
      </span>
    </div>
  );
}
