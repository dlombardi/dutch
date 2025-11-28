// Expense splitting and debt simplification calculations

import type { ExpenseSplit, Balance, SimplifiedDebt } from '../types';

/**
 * Calculate equal split amounts for an expense
 * Handles rounding to ensure total adds up correctly
 */
export function calculateEqualSplit(
  totalAmount: number,
  participantIds: string[],
): Array<{ userId: string; amount: number }> {
  const numParticipants = participantIds.length;
  if (numParticipants === 0) return [];

  const baseAmount = Math.floor((totalAmount * 100) / numParticipants) / 100;
  const remainder = Math.round((totalAmount - baseAmount * numParticipants) * 100);

  return participantIds.map((userId, index) => ({
    userId,
    // Add 1 cent to first `remainder` participants to account for rounding
    amount: index < remainder ? baseAmount + 0.01 : baseAmount,
  }));
}

/**
 * Calculate split amounts based on shares
 */
export function calculateSharesSplit(
  totalAmount: number,
  participants: Array<{ userId: string; shares: number }>,
): Array<{ userId: string; amount: number }> {
  const totalShares = participants.reduce((sum, p) => sum + p.shares, 0);
  if (totalShares === 0) return [];

  let allocated = 0;
  const splits = participants.map((participant, index) => {
    const isLast = index === participants.length - 1;
    const rawAmount = (participant.shares / totalShares) * totalAmount;
    const amount = isLast
      ? Math.round((totalAmount - allocated) * 100) / 100
      : Math.round(rawAmount * 100) / 100;
    allocated += amount;
    return { userId: participant.userId, amount };
  });

  return splits;
}

/**
 * Calculate split amounts based on percentages
 */
export function calculatePercentageSplit(
  totalAmount: number,
  participants: Array<{ userId: string; percentage: number }>,
): Array<{ userId: string; amount: number }> {
  let allocated = 0;
  const splits = participants.map((participant, index) => {
    const isLast = index === participants.length - 1;
    const rawAmount = (participant.percentage / 100) * totalAmount;
    const amount = isLast
      ? Math.round((totalAmount - allocated) * 100) / 100
      : Math.round(rawAmount * 100) / 100;
    allocated += amount;
    return { userId: participant.userId, amount };
  });

  return splits;
}

/**
 * Calculate balances for each user in a group
 * Positive = owed money, Negative = owes money
 */
export function calculateBalances(
  expenses: Array<{
    amount: number;
    currency: string;
    paidById: string;
    splits: ExpenseSplit[];
  }>,
  settlements: Array<{
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
  }>,
  userNames: Record<string, string>,
  defaultCurrency: string,
): Balance[] {
  const balanceMap: Record<string, number> = {};

  // Initialize balances for all users
  Object.keys(userNames).forEach((userId) => {
    balanceMap[userId] = 0;
  });

  // Process expenses
  expenses.forEach((expense) => {
    // Person who paid gets credit for the full amount
    balanceMap[expense.paidById] =
      (balanceMap[expense.paidById] || 0) + expense.amount;

    // Each split reduces that person's balance
    expense.splits.forEach((split) => {
      balanceMap[split.userId] =
        (balanceMap[split.userId] || 0) - split.amount;
    });
  });

  // Process settlements
  settlements.forEach((settlement) => {
    // From user paid money (reduces their debt/increases balance)
    balanceMap[settlement.fromUserId] =
      (balanceMap[settlement.fromUserId] || 0) + settlement.amount;
    // To user received money (reduces what they're owed)
    balanceMap[settlement.toUserId] =
      (balanceMap[settlement.toUserId] || 0) - settlement.amount;
  });

  return Object.entries(balanceMap).map(([userId, amount]) => ({
    userId,
    userName: userNames[userId] || 'Unknown',
    amount: Math.round(amount * 100) / 100,
    currency: defaultCurrency,
  }));
}

/**
 * Simplify debts to minimize number of transactions
 * Uses a greedy algorithm to match creditors with debtors
 */
export function simplifyDebts(
  balances: Balance[],
  userNames: Record<string, string>,
): SimplifiedDebt[] {
  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors: Array<{ userId: string; amount: number }> = [];
  const debtors: Array<{ userId: string; amount: number }> = [];

  balances.forEach((balance) => {
    if (balance.amount > 0.01) {
      creditors.push({ userId: balance.userId, amount: balance.amount });
    } else if (balance.amount < -0.01) {
      debtors.push({ userId: balance.userId, amount: -balance.amount });
    }
  });

  // Sort by amount descending for optimal matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const simplifiedDebts: SimplifiedDebt[] = [];
  const currency = balances[0]?.currency || 'USD';

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.01) {
      simplifiedDebts.push({
        fromUserId: debtor.userId,
        fromUserName: userNames[debtor.userId] || 'Unknown',
        toUserId: creditor.userId,
        toUserName: userNames[creditor.userId] || 'Unknown',
        amount: Math.round(amount * 100) / 100,
        currency,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) creditorIndex++;
    if (debtor.amount < 0.01) debtorIndex++;
  }

  return simplifiedDebts;
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    JPY: '\u00A5',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '\u00A5',
    INR: '\u20B9',
    MXN: 'MX$',
    BRL: 'R$',
    KRW: '\u20A9',
    SGD: 'S$',
    HKD: 'HK$',
    NOK: 'kr',
    SEK: 'kr',
    DKK: 'kr',
    NZD: 'NZ$',
    ZAR: 'R',
    THB: '\u0E3F',
  };
  return symbols[currency] || currency;
}
