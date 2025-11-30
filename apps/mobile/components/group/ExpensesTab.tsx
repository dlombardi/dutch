import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LoadingSpinner } from '../LoadingSpinner';
import { getCurrencySymbol, formatAmount } from '../../lib/formatters';
import { colors, spacing, fontSize, fontWeight } from '../../lib/theme';
import type { Expense } from '../../stores/expensesStore';

interface ExpensesTabProps {
  expenses: Expense[];
  isLoading: boolean;
  onExpensePress: (expenseId: string) => void;
}

export function ExpensesTab({ expenses, isLoading, onExpensePress }: ExpensesTabProps) {
  if (isLoading && expenses.length === 0) {
    return <LoadingSpinner size="small" />;
  }

  if (expenses.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>💸</Text>
        <Text style={styles.emptyTitle}>No expenses yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first expense to start tracking
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {expenses.map((expense) => (
        <TouchableOpacity
          key={expense.id}
          style={styles.expenseItem}
          onPress={() => onExpensePress(expense.id)}
        >
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDescription}>{expense.description}</Text>
            <Text style={styles.expenseDate}>
              {new Date(expense.date).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.expenseAmount}>
            {getCurrencySymbol(expense.currency)}
            {formatAmount(expense.amount, expense.currency)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyEmoji: {
    fontSize: fontSize['5xl'],
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  expenseDate: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  expenseAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
});
