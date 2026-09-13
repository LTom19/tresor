import { addMonths, addYears, startOfDay } from 'date-fns';
import type { SubscriptionDuration } from '../types';

/** Durée par défaut : indéfinie */
export const defaultDuration: SubscriptionDuration = { type: 'indefinite' };

/** Date du jour au format ISO (YYYY-MM-DD), en heure locale */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse une date ISO en date locale (évite les décalages UTC) */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

/** Vérifie si un abonnement est actif à une date donnée */
export function isSubscriptionActive(
  startDate: string,
  duration: SubscriptionDuration,
  reference: Date = new Date(),
): boolean {
  const start = parseLocalDate(startDate);
  const ref = startOfDay(reference);

  if (ref < start) return false;

  if (duration.type === 'indefinite') return true;

  if (duration.type === 'months') {
    const end = addMonths(start, duration.value);
    return ref < end;
  }

  const end = addYears(start, duration.value);
  return ref < end;
}

/** Libellé lisible de la durée */
export function formatDuration(duration: SubscriptionDuration): string {
  if (duration.type === 'indefinite') return 'Indéfinie';
  if (duration.type === 'months') {
    return duration.value === 1 ? '1 mois' : `${duration.value} mois`;
  }
  return duration.value === 1 ? '1 an' : `${duration.value} ans`;
}

/** Parse la durée depuis le formulaire */
export function parseDuration(
  type: 'indefinite' | 'months' | 'years',
  value: string,
): SubscriptionDuration | null {
  if (type === 'indefinite') return { type: 'indefinite' };
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) return null;
  return type === 'months' ? { type: 'months', value: num } : { type: 'years', value: num };
}

/** Coût total d'un abonnement mensuel selon sa durée */
export function getMonthlySubscriptionTotalCost(
  amount: number,
  duration: SubscriptionDuration,
): { total: number; label: string } {
  if (duration.type === 'indefinite') {
    return { total: amount * 12, label: 'Coût annuel estimé' };
  }
  if (duration.type === 'months') {
    return {
      total: amount * duration.value,
      label: duration.value === 1 ? 'Coût total (1 mois)' : `Coût total (${duration.value} mois)`,
    };
  }
  const months = duration.value * 12;
  return {
    total: amount * months,
    label: duration.value === 1 ? 'Coût total (1 an)' : `Coût total (${duration.value} ans)`,
  };
}
