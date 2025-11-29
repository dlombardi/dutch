import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ExpensesService } from '../expenses/expenses.service';
import { SettlementsService } from '../settlements/settlements.service';

export interface Balance {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export interface BalancesResult {
  balances: Balance[];
  memberBalances: Record<string, number>;
}

@Injectable()
export class BalancesService {
  constructor(
    private readonly groupsService: GroupsService,
    @Inject(forwardRef(() => ExpensesService))
    private readonly expensesService: ExpensesService,
    @Inject(forwardRef(() => SettlementsService))
    private readonly settlementsService: SettlementsService,
  ) {}

  getGroupBalances(groupId: string): BalancesResult {
    // Verify group exists
    const { group } = this.groupsService.getGroupById(groupId);

    // Get all expenses for the group
    const { expenses } = this.expensesService.getExpensesByGroupId(groupId);

    // Get all settlements for the group
    const { settlements } = this.settlementsService.getSettlementsByGroupId(groupId);

    // Step 1: Calculate net balance for each person
    // Positive = owed money, Negative = owes money
    const netBalances: Map<string, number> = new Map();

    // Process expenses
    for (const expense of expenses) {
      const { paidById, splitAmounts } = expense;

      // The payer is owed the total amount minus their share
      for (const [userId, amountOwed] of Object.entries(splitAmounts)) {
        if (userId !== paidById) {
          // userId owes money (decrease their balance)
          netBalances.set(
            userId,
            (netBalances.get(userId) || 0) - amountOwed,
          );
          // paidById is owed money (increase their balance)
          netBalances.set(
            paidById,
            (netBalances.get(paidById) || 0) + amountOwed,
          );
        }
      }
    }

    // Process settlements (settlements reduce debt)
    for (const settlement of settlements) {
      const { fromUserId, toUserId, amount } = settlement;
      // fromUserId paid toUserId, so fromUserId's balance increases (less debt)
      netBalances.set(
        fromUserId,
        (netBalances.get(fromUserId) || 0) + amount,
      );
      // toUserId received payment, so their balance decreases (owed less)
      netBalances.set(
        toUserId,
        (netBalances.get(toUserId) || 0) - amount,
      );
    }

    // Step 2: Simplify debts using greedy algorithm
    // Separate into debtors (negative balance) and creditors (positive balance)
    const debtors: Array<{ userId: string; amount: number }> = [];
    const creditors: Array<{ userId: string; amount: number }> = [];

    for (const [userId, balance] of netBalances.entries()) {
      const roundedBalance = Math.round(balance * 100) / 100;
      if (roundedBalance < 0) {
        debtors.push({ userId, amount: Math.abs(roundedBalance) });
      } else if (roundedBalance > 0) {
        creditors.push({ userId, amount: roundedBalance });
      }
    }

    // Sort by amount (largest first) for more efficient simplification
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Create simplified transactions
    const simplifiedBalances: Balance[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];

      // The payment amount is the minimum of what debtor owes and what creditor is owed
      const paymentAmount = Math.min(debtor.amount, creditor.amount);

      if (paymentAmount > 0.005) {
        // Only add if more than half a cent
        simplifiedBalances.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(paymentAmount * 100) / 100,
          currency: group.defaultCurrency,
        });
      }

      // Update remaining amounts
      debtor.amount -= paymentAmount;
      creditor.amount -= paymentAmount;

      // Move to next debtor/creditor if their balance is settled
      if (debtor.amount < 0.005) {
        debtorIndex++;
      }
      if (creditor.amount < 0.005) {
        creditorIndex++;
      }
    }

    // Build memberBalances from net balances
    const memberBalances: Record<string, number> = {};
    for (const [userId, balance] of netBalances.entries()) {
      const roundedBalance = Math.round(balance * 100) / 100;
      if (roundedBalance !== 0) {
        memberBalances[userId] = roundedBalance;
      }
    }

    return { balances: simplifiedBalances, memberBalances };
  }
}
