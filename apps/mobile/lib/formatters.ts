import { getCurrency, getCurrencySymbol as getSymbol } from '@evn/shared';

/**
 * Re-export getCurrencySymbol from shared for convenience
 */
export { getCurrencySymbol } from '@evn/shared';

/**
 * Format an amount with the appropriate decimal places for the currency.
 * Uses the currency's decimalPlaces property (e.g., JPY has 0, USD has 2).
 */
export function formatAmount(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  const decimalPlaces = currency?.decimalPlaces ?? 2;
  return amount.toFixed(decimalPlaces);
}

/**
 * Format an amount with currency symbol prefix.
 * Example: formatAmountWithSymbol(10.5, 'USD') => "$10.50"
 */
export function formatAmountWithSymbol(amount: number, currencyCode: string): string {
  const symbol = getSymbol(currencyCode);
  const formatted = formatAmount(amount, currencyCode);
  return `${symbol}${formatted}`;
}

/**
 * Format a balance with sign indicator.
 * Positive amounts show as "$10.50", negative as "-$10.50"
 */
export function formatBalance(amount: number, currencyCode: string): string {
  const symbol = getSymbol(currencyCode);
  const formatted = formatAmount(Math.abs(amount), currencyCode);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

/**
 * Get display name for a user, showing "You" for current user
 */
export function getUserDisplayName(
  userId: string,
  currentUserId: string | undefined,
  memberName?: string | null
): string {
  if (userId === currentUserId) return 'You';
  if (memberName) return memberName;
  return `User ${userId.slice(0, 8)}...`;
}
