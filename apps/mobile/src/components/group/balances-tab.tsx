import { ScrollView } from "react-native";
import { useColorScheme } from "nativewind";
import { View, Text, Pressable } from "@/components/ui/primitives";
import { formatAmount, getCurrencySymbol } from "@/lib/utils/formatters";
import type { Balance, BalancesData } from "@/modules/groups";

interface BalancesTabProps {
  balances: BalancesData | undefined;
  getDisplayName: (userId: string) => string;
  onSettleUp: (balance: Balance) => void;
}

export function BalancesTab({
  balances,
  getDisplayName,
  onSettleUp,
}: BalancesTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!balances || balances.balances.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <View className="w-16 h-16 rounded-2xl items-center justify-center bg-dutch-green/10 border border-dutch-green/20 mb-4">
          <Text className="text-3xl">✨</Text>
        </View>
        <Text
          className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}
        >
          All settled up!
        </Text>
        <Text
          className={`text-sm text-center ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
        >
          No outstanding balances in this group
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <Text
        className={`text-xs font-semibold uppercase tracking-wider p-4 pb-2 ${
          isDark ? "text-dark-text-secondary" : "text-light-text-secondary"
        }`}
      >
        Who pays whom
      </Text>
      {balances.balances.map((balance, index) => (
        <View
          key={`${balance.from}-${balance.to}-${index}`}
          className={`flex-row justify-between items-center p-4 border-b ${
            isDark ? "border-dark-border" : "border-light-border"
          }`}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-dutch-orange items-center justify-center mr-3">
              <Text className="text-white text-sm font-semibold">
                {balance.from.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="flex-row items-center flex-wrap flex-1">
              <Text
                className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
              >
                {getDisplayName(balance.from)}
              </Text>
              <Text
                className={`text-sm mx-1 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
              >
                owes
              </Text>
              <Text
                className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
              >
                {getDisplayName(balance.to)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text
              className={`text-base font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}
            >
              {getCurrencySymbol(balance.currency)}
              {formatAmount(balance.amount, balance.currency)}
            </Text>
            <Pressable
              className="bg-dutch-green px-3 py-1.5 rounded active:opacity-80"
              onPress={() => onSettleUp(balance)}
            >
              <Text className="text-white text-xs font-semibold">Settle</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
