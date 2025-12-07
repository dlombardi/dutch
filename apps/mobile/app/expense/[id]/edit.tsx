import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "@/modules/auth";
import { LoadingSpinner } from "@/components/ui";
import { View, Text, Pressable, TextInput } from "@/components/ui/primitives";
import { colors } from "@/constants/theme";

// React Query hooks
import { useExpense, useUpdateExpense } from "@/modules/expenses";
import { useGroup, useGroupMembers } from "@/modules/groups";

export default function EditExpenseScreen() {
  const { id: expenseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = isDark ? colors.dark : colors.light;

  // React Query hooks - automatic caching and deduplication
  const { data: expense, isLoading: isFetchingExpense } = useExpense(expenseId);

  // Fetch group and members once we have the expense
  const { data: group } = useGroup(expense?.groupId);
  const { data: members = [] } = useGroupMembers(expense?.groupId);

  // Update mutation
  const updateExpenseMutation = useUpdateExpense();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidById, setPaidById] = useState<string | null>(null);
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form with expense data when it loads
  useEffect(() => {
    if (expense && !initialized) {
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setPaidById(expense.paidById);
      setInitialized(true);
    }
  }, [expense, initialized]);

  const handleSave = useCallback(() => {
    if (!expenseId || !paidById) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    updateExpenseMutation.mutate(
      {
        id: expenseId,
        updates: {
          amount: numericAmount,
          description: description.trim(),
          paidById,
        },
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [expenseId, paidById, amount, description, updateExpenseMutation, router]);

  const handleSelectPayer = useCallback((memberId: string) => {
    setPaidById(memberId);
    setShowPayerPicker(false);
  }, []);

  const getPayerDisplayName = useCallback(
    (payerId: string | null) => {
      if (!payerId) return "Select payer";
      if (payerId === user?.id) return "You";
      const member = members.find((m) => m.userId === payerId);
      if (member) {
        return member.userId === user?.id
          ? "You"
          : `User ${member.userId.slice(0, 8)}...`;
      }
      return "Unknown";
    },
    [user, members],
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Derived state
  const isUpdating = updateExpenseMutation.isPending;
  const updateError = updateExpenseMutation.error?.message ?? null;

  const isValid =
    amount.trim() !== "" &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    description.trim() !== "";

  // Get currency symbol
  const getCurrencySymbol = () => {
    const currency = group?.defaultCurrency || "USD";
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      default:
        return currency;
    }
  };

  if (!expense && isFetchingExpense) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
      >
        <Stack.Screen options={{ title: "Edit Expense" }} />
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: "Edit Expense",
          headerStyle: { backgroundColor: themeColors.bgElevated },
          headerTintColor: themeColors.textPrimary,
          headerLeft: () => (
            <Pressable onPress={handleCancel} className="active:opacity-70">
              <Text className="text-dutch-orange text-base">Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              disabled={!isValid || isUpdating}
              className="active:opacity-70"
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={themeColors.orange} />
              ) : (
                <Text
                  className={`text-base font-semibold ${isValid ? "text-dutch-orange" : isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
                >
                  Save
                </Text>
              )}
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1">
          {updateError && (
            <View
              className={`mx-4 mt-4 p-3 rounded-lg ${isDark ? "bg-dutch-red/15" : "bg-dutch-red/10"}`}
            >
              <Text className="text-dutch-red text-sm">{updateError}</Text>
            </View>
          )}

          {/* Amount Input */}
          <View className="flex-row items-center justify-center py-10 px-4">
            <Text
              className={`text-5xl font-light mr-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              {getCurrencySymbol()}
            </Text>
            <TextInput
              className="text-6xl font-extralight min-w-[100px] text-center"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Description Input */}
          <View
            className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Description
            </Text>
            <TextInput
              className="text-base py-2"
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
            />
          </View>

          {/* Paid By Selector */}
          <View
            className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Paid by
            </Text>
            <Pressable
              className="flex-row items-center justify-between py-2 active:opacity-70"
              onPress={() => setShowPayerPicker(true)}
            >
              <Text
                className={`text-base ${isDark ? "text-white" : "text-black"}`}
              >
                {getPayerDisplayName(paidById)}
              </Text>
              <Text
                className={`text-xl ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
              >
                ›
              </Text>
            </Pressable>
          </View>

          {/* Split (simplified - always equal) */}
          <View
            className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Split
            </Text>
            <View className="py-2">
              <Text
                className={`text-base ${isDark ? "text-white" : "text-black"}`}
              >
                Split equally among all members
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payer Picker Modal */}
      <Modal
        visible={showPayerPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPayerPicker(false)}
      >
        <SafeAreaView
          className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
        >
          <View
            className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}
            >
              Who paid?
            </Text>
            <Pressable
              onPress={() => setShowPayerPicker(false)}
              className="active:opacity-70"
            >
              <Text className="text-dutch-orange text-base font-semibold">
                Done
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row items-center p-4 border-b active:opacity-70 ${isDark ? "border-dark-border" : "border-light-border"}`}
                onPress={() => handleSelectPayer(item.userId)}
              >
                <View className="w-10 h-10 rounded-full bg-dutch-orange justify-center items-center mr-3">
                  <Text className="text-white text-sm font-semibold">
                    {item.userId.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text
                  className={`flex-1 text-base ${isDark ? "text-white" : "text-black"}`}
                >
                  {item.userId === user?.id
                    ? "You"
                    : `User ${item.userId.slice(0, 8)}...`}
                </Text>
                {paidById === item.userId && (
                  <Text className="text-lg text-dutch-orange font-semibold">
                    ✓
                  </Text>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text
                  className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                >
                  No members found
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
