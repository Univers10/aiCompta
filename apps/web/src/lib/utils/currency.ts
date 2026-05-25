/**
 * Formate un montant en XOF (Franc CFA) avec séparateurs de milliers.
 * Sans décimales par défaut (le XOF n'a pas de subdivision).
 */
export function formatXOF(amount: string | number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? 0;
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n) + ' XOF';
}

export function formatCurrency(amount: string | number, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  if (currency === 'XOF') return formatXOF(n);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n);
}

export function formatNumber(amount: string | number, decimals = 2): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
