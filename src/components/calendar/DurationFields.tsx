import type { SubscriptionDuration } from '../../types';

interface DurationFieldsProps {
  durationType: 'indefinite' | 'months' | 'years';
  durationValue: string;
  onTypeChange: (type: 'indefinite' | 'months' | 'years') => void;
  onValueChange: (value: string) => void;
}

/** Sélecteur de durée pour les abonnements */
export function DurationFields({
  durationType,
  durationValue,
  onTypeChange,
  onValueChange,
}: DurationFieldsProps) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink">Durée</span>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['indefinite', 'Indéfinie'],
            ['months', 'Mois'],
            ['years', 'Années'],
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
            className={[
              'px-2 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all',
              durationType === type
                ? 'bg-slate/15 border-slate text-slate'
                : 'bg-paper-warm border-paper-deep text-ink-muted hover:border-slate/40',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
      {durationType !== 'indefinite' && (
        <input
          type="number"
          min={1}
          value={durationValue}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={durationType === 'months' ? 'Nombre de mois' : "Nombre d'années"}
          className="w-full px-4 py-2.5 rounded-xl bg-paper-warm border border-paper-deep text-ink focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
        />
      )}
    </div>
  );
}

export function initDurationFields(duration?: SubscriptionDuration): {
  durationType: 'indefinite' | 'months' | 'years';
  durationValue: string;
} {
  if (!duration || duration.type === 'indefinite') {
    return { durationType: 'indefinite', durationValue: '12' };
  }
  return {
    durationType: duration.type,
    durationValue: String(duration.value),
  };
}
