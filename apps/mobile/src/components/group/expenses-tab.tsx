import { ScrollView } from "react-native";
import { useColorScheme } from "nativewind";
import { View, Text, Pressable } from "@/components/ui/primitives";
import { LoadingSpinner } from "@/components/ui";
import { formatAmount, getCurrencySymbol } from "@/lib/utils/formatters";
import type { Expense } from "@/modules/expenses";

interface ExpensesTabProps {
  expenses: Expense[];
  isLoading: boolean;
  onExpensePress: (expenseId: string) => void;
}

export function ExpensesTab({
  expenses,
  isLoading,
  onExpensePress,
}: ExpensesTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (isLoading && expenses.length === 0) {
    return <LoadingSpinner size="small" />;
  }

  if (expenses.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <View className="w-16 h-16 rounded-2xl items-center justify-center bg-dutch-orange/10 border border-dutch-orange/20 mb-4">
          <Text className="text-3xl">💸</Text>
        </View>
        <Text
          className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}
        >
          No expenses yet
        </Text>
        <Text
          className={`text-sm text-center ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
        >
          Add your first expense to start tracking
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      {expenses.map((expense) => (
        <Pressable
          key={expense.id}
          className={`flex-row justify-between items-center p-4 border-b active:opacity-70 ${
            isDark ? "border-dark-border" : "border-light-border"
          }`}
          onPress={() => onExpensePress(expense.id)}
        >
          <View className="flex-1">
            <Text
              className={`text-base mb-1 ${isDark ? "text-white" : "text-black"}`}
            >
              {expense.description}
            </Text>
            <Text
              className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              {new Date(expense.date).toLocaleDateString()}
            </Text>
          </View>
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}
          >
            {getCurrencySymbol(expense.currency)}
            {formatAmount(expense.amount, expense.currency)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
