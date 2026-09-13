import { useState } from 'react';
import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useFinance } from '../../store/FinanceContext';
import type { AnnualSubscription, Income, MonthlySubscription } from '../../types';
import {
  getCalendarEventsForMonth,
  groupEventsByDay,
} from '../../utils/calculations';
import { formatEuro } from '../../utils/format';
import { formatDuration, isSubscriptionActive, parseLocalDate } from '../../utils/subscription';
import { Button } from '../ui/Button';
import {
  AnnualSubscriptionModal,
  IncomeModal,
  MonthlySubscriptionModal,
} from './SubscriptionModals';

type EditTarget =
  | { type: 'monthly'; data: MonthlySubscription }
  | { type: 'annual'; data: AnnualSubscription }
  | { type: 'income'; data: Income };

export function CalendarTab() {
  const {
    state,
    addMonthlySubscription,
    updateMonthlySubscription,
    removeMonthlySubscription,
    addAnnualSubscription,
    updateAnnualSubscription,
    removeAnnualSubscription,
    addIncome,
    updateIncome,
    removeIncome,
  } = useFinance();

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [addModal, setAddModal] = useState<'monthly' | 'annual' | 'income' | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const events = getCalendarEventsForMonth(state, currentMonth);
  const byDay = groupEventsByDay(events);
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstWeekday = (getDay(startOfMonth(currentMonth)) + 6) % 7;

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dayEvents = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  const eventStyle = (kind: 'monthly' | 'annual' | 'income') => {
    if (kind === 'monthly') return 'bg-slate/15 text-slate';
    if (kind === 'annual') return 'bg-gold/20 text-ink';
    return 'bg-sage/20 text-sage';
  };

  const dotStyle = (kind: 'monthly' | 'annual' | 'income') => {
    if (kind === 'monthly') return 'bg-slate';
    if (kind === 'annual') return 'bg-gold';
    return 'bg-sage';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate uppercase tracking-widest mb-1">
            Abonnements & revenus
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setAddModal('monthly')}>
            + Mensuel
          </Button>
          <Button variant="secondary" onClick={() => setAddModal('annual')}>
            + Annuel
          </Button>
          <Button onClick={() => setAddModal('income')}>+ Revenu</Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="w-10 h-10 rounded-xl bg-paper-warm hover:bg-paper-deep transition-colors font-medium"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          className="text-sm font-medium text-copper hover:underline"
        >
          Aujourd'hui
        </button>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="w-10 h-10 rounded-xl bg-paper-warm hover:bg-paper-deep transition-colors font-medium"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>

      <div className="rounded-3xl border border-paper-deep bg-paper-warm/50 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-paper-deep">
          {weekDays.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-semibold text-ink-muted uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[88px] border-b border-r border-paper-deep/50 bg-paper/30" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvts = byDay.get(day) ?? [];
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();

            return (
              <motion.button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                whileHover={{ backgroundColor: 'rgba(245, 240, 232, 0.8)' }}
                className={[
                  'min-h-[88px] p-1.5 border-b border-r border-paper-deep/50 text-left transition-colors',
                  isToday ? 'bg-copper/8' : '',
                  selectedDay === day ? 'ring-2 ring-inset ring-copper/40' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium',
                    isToday ? 'bg-copper text-white' : 'text-ink',
                  ].join(' ')}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvts.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium ${eventStyle(e.kind)}`}
                      title={`${e.name} — ${formatEuro(e.amount)}`}
                    >
                      {e.kind === 'income' ? '+' : ''}{e.name}
                    </div>
                  ))}
                  {dayEvts.length > 2 && (
                    <p className="text-[10px] text-ink-muted px-1">+{dayEvts.length - 2}</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-slate/20" /> Mensuel
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-gold/30" /> Annuel
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-sage/30" /> Revenu
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {selectedDay !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-paper-deep bg-paper p-5"
          >
            <h3 className="font-display text-lg font-semibold mb-3">
              {selectedDay} {format(currentMonth, 'MMMM', { locale: fr })}
            </h3>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun événement ce jour.</p>
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span>
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${dotStyle(e.kind)}`} />
                      {e.name}
                    </span>
                    <span className={`font-semibold ${e.kind === 'income' ? 'text-sage' : ''}`}>
                      {e.kind === 'income' ? '+' : '−'}{formatEuro(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        <SubscriptionLists
          monthly={state.monthlySubscriptions.filter((s) =>
            isSubscriptionActive(s.startDate, s.duration),
          )}
          annual={state.annualSubscriptions.filter((s) =>
            isSubscriptionActive(s.startDate, s.duration),
          )}
          incomes={state.incomes}
          onEdit={(target) => setEditTarget(target)}
          onRemoveMonthly={removeMonthlySubscription}
          onRemoveAnnual={removeAnnualSubscription}
          onRemoveIncome={removeIncome}
        />
      </div>

      {addModal === 'monthly' && (
        <MonthlySubscriptionModal
          open
          onClose={() => setAddModal(null)}
          onSave={addMonthlySubscription}
        />
      )}
      {addModal === 'annual' && (
        <AnnualSubscriptionModal
          open
          onClose={() => setAddModal(null)}
          onSave={addAnnualSubscription}
        />
      )}
      {addModal === 'income' && (
        <IncomeModal open onClose={() => setAddModal(null)} onSave={addIncome} />
      )}

      {editTarget?.type === 'monthly' && (
        <MonthlySubscriptionModal
          key={editTarget.data.id}
          open
          initial={editTarget.data}
          onClose={() => setEditTarget(null)}
          onSave={(data) => {
            updateMonthlySubscription(editTarget.data.id, data);
            setEditTarget(null);
          }}
        />
      )}
      {editTarget?.type === 'annual' && (
        <AnnualSubscriptionModal
          key={editTarget.data.id}
          open
          initial={editTarget.data}
          onClose={() => setEditTarget(null)}
          onSave={(data) => {
            updateAnnualSubscription(editTarget.data.id, data);
            setEditTarget(null);
          }}
        />
      )}
      {editTarget?.type === 'income' && (
        <IncomeModal
          key={editTarget.data.id}
          open
          initial={editTarget.data}
          onClose={() => setEditTarget(null)}
          onSave={(data) => {
            updateIncome(editTarget.data.id, data);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}

function SubscriptionLists({
  monthly,
  annual,
  incomes,
  onEdit,
  onRemoveMonthly,
  onRemoveAnnual,
  onRemoveIncome,
}: {
  monthly: MonthlySubscription[];
  annual: AnnualSubscription[];
  incomes: Income[];
  onEdit: (target: EditTarget) => void;
  onRemoveMonthly: (id: string) => void;
  onRemoveAnnual: (id: string) => void;
  onRemoveIncome: (id: string) => void;
}) {
  const empty = monthly.length === 0 && annual.length === 0 && incomes.length === 0;

  return (
    <div className="rounded-2xl border border-paper-deep bg-paper p-5 space-y-3">
      <h3 className="font-display text-lg font-semibold">Vos abonnements & revenus</h3>

      {empty ? (
        <p className="text-sm text-ink-muted">Aucun élément enregistré.</p>
      ) : (
        <>
          {incomes.map((s) => (
            <SubscriptionRow
              key={s.id}
              name={s.name}
              detail={`Le ${s.dayOfMonth} de chaque mois`}
              amount={s.amount}
              badge="Revenu"
              badgeClass="bg-sage/20 text-sage"
              positive
              onEdit={() => onEdit({ type: 'income', data: s })}
              onRemove={() => onRemoveIncome(s.id)}
            />
          ))}
          {monthly.map((s) => (
            <SubscriptionRow
              key={s.id}
              name={s.name}
              detail={`Le ${s.dayOfMonth} · ${formatDuration(s.duration)}`}
              amount={s.amount}
              badge="Mensuel"
              badgeClass="bg-slate/15 text-slate"
              onEdit={() => onEdit({ type: 'monthly', data: s })}
              onRemove={() => onRemoveMonthly(s.id)}
            />
          ))}
          {annual.map((s) => (
            <SubscriptionRow
              key={s.id}
              name={s.name}
              detail={`${format(parseLocalDate(s.date), 'd MMMM', { locale: fr })} chaque année · ${formatDuration(s.duration)}`}
              amount={s.amount}
              badge="Annuel"
              badgeClass="bg-gold/20 text-ink"
              onEdit={() => onEdit({ type: 'annual', data: s })}
              onRemove={() => onRemoveAnnual(s.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SubscriptionRow({
  name,
  detail,
  amount,
  badge,
  badgeClass,
  positive,
  onEdit,
  onRemove,
}: {
  name: string;
  detail: string;
  amount: number;
  badge: string;
  badgeClass: string;
  positive?: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-paper-deep/60 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{name}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${badgeClass}`}>
            {badge}
          </span>
        </div>
        <p className="text-xs text-ink-muted">{detail}</p>
      </div>
      <p className={`text-sm font-semibold shrink-0 ${positive ? 'text-sage' : ''}`}>
        {positive ? '+' : ''}{formatEuro(amount)}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="text-ink-muted hover:text-copper text-xs shrink-0 px-1.5 py-1 rounded hover:bg-paper-warm"
        aria-label={`Modifier ${name}`}
      >
        ✎
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="text-ink-muted hover:text-wine text-sm shrink-0"
        aria-label={`Supprimer ${name}`}
      >
        ✕
      </button>
    </div>
  );
}
