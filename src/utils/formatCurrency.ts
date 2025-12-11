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
