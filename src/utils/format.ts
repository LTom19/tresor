/** Formate un montant en euros (locale fr-FR) */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Parse une saisie utilisateur en nombre (accepte virgule ou point) */
export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (normalized === '') return null;
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0 || num > 1_000_000_000) return null;
  return Math.round(num * 100) / 100;
}

/** Libellé d'un compte de placement */
export function livretSubLabel(sub: 'economies' | 'poche'): string {
  return sub === 'economies' ? 'Épargne' : 'Livret A';
}
