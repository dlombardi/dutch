import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LoadingSpinner } from '../LoadingSpinner';
import { getCurrencySymbol, formatAmount } from '../../lib/formatters';
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
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
