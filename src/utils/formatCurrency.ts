/**
 * Formats a number as FCFA currency (e.g., "123 456 FCFA")
 */
export const formatFCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount)) + ' FCFA';
};

/**
 * Formats a number as FCFA with decimals (e.g., "123 456,78 FCFA")
 */
export const formatFCFADecimal = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' FCFA';
};

/**
 * Compact FCFA formatting for tight UIs (mobile KPIs).
 * e.g., 64 702 332 → "64,7 M FCFA", 1 200 000 000 → "1,2 Md FCFA"
 */
export const formatFCFACompact = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace('.', ',') + ' Md FCFA';
  }
  if (abs >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.', ',') + ' M FCFA';
  }
  if (abs >= 1_000) {
    return Math.round(amount / 1_000) + ' k FCFA';
  }
  return formatFCFA(amount);
};
