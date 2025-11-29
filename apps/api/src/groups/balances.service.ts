import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ExpensesService, ExpenseData } from '../expenses/expenses.service';

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
  ) {}

  getGroupBalances(groupId: string): BalancesResult {
    // Verify group exists
    const { group } = this.groupsService.getGroupById(groupId);

    // Get all expenses for the group
    const { expenses } = this.expensesService.getExpensesByGroupId(groupId);

    // Calculate what each person owes each other person
    // Key: "from->to", Value: amount from owes to
    const pairwiseDebts: Map<string, number> = new Map();

    for (const expense of expenses) {
      const { paidById, splitAmounts } = expense;

      // For each person in the split (except the payer), they owe the payer
      for (const [userId, amountOwed] of Object.entries(splitAmounts)) {
        if (userId !== paidById) {
          const key = `${userId}->${paidById}`;
          const reverseKey = `${paidById}->${userId}`;

          // Check if there's already a reverse debt
          const existingReverse = pairwiseDebts.get(reverseKey) || 0;

          if (existingReverse > 0) {
            // Net out the debts
            if (amountOwed > existingReverse) {
              pairwiseDebts.delete(reverseKey);
              pairwiseDebts.set(key, amountOwed - existingReverse);
            } else if (amountOwed < existingReverse) {
              pairwiseDebts.set(reverseKey, existingReverse - amountOwed);
            } else {
              // They cancel out
              pairwiseDebts.delete(reverseKey);
            }
          } else {
            // Add to existing debt or create new
            const existing = pairwiseDebts.get(key) || 0;
            pairwiseDebts.set(key, existing + amountOwed);
          }
        }
      }
    }

    // Convert to balances array
    const balances: Balance[] = [];
    for (const [key, amount] of pairwiseDebts.entries()) {
      if (amount > 0) {
        const [from, to] = key.split('->');
        balances.push({
          from,
          to,
          amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
          currency: group.defaultCurrency,
        });
      }
    }

    // Calculate net balance for each member
    const memberBalances: Record<string, number> = {};
    for (const balance of balances) {
      // "from" owes money (negative)
      memberBalances[balance.from] =
        (memberBalances[balance.from] || 0) - balance.amount;
      // "to" is owed money (positive)
      memberBalances[balance.to] =
        (memberBalances[balance.to] || 0) + balance.amount;
    }

    // Round member balances
    for (const userId of Object.keys(memberBalances)) {
      memberBalances[userId] = Math.round(memberBalances[userId] * 100) / 100;
      // Remove zero balances
      if (memberBalances[userId] === 0) {
        delete memberBalances[userId];
      }
    }

    return { balances, memberBalances };
  }
}
