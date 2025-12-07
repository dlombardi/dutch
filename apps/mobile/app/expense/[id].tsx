import { useCallback } from "react";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "@/modules/auth";
import { LoadingSpinner, PrimaryButton } from "@/components/ui";
import { View, Text, Pressable } from "@/components/ui/primitives";
import {
  formatAmount,
  getCurrencySymbol,
  getUserDisplayName,
} from "@/lib/utils/formatters";
import { colors } from "@/constants/theme";

// React Query hooks
import { useExpense, useDeleteExpense } from "@/modules/expenses";
import { useGroup, useGroupMembers } from "@/modules/groups";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = isDark ? colors.dark : colors.light;

  // React Query hooks - automatic caching and deduplication
  const {
    data: expense,
    isLoading: isLoadingExpense,
    error: expenseError,
    refetch: refetchExpense,
  } = useExpense(id);

  // Fetch group and members once we have the expense
  const { data: group } = useGroup(expense?.groupId);
  const { data: members = [] } = useGroupMembers(expense?.groupId);

  // Delete mutation
  const deleteExpenseMutation = useDeleteExpense();

  const handleEdit = useCallback(() => {
    if (id) {
      router.push(`/expense/${id}/edit`);
    }
  }, [id, router]);

  const handleDelete = useCallback(() => {
    if (!id || !expense) return;

    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete "${expense.description}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteExpenseMutation.mutate(
              { id, groupId: expense.groupId },
              {
                onSuccess: () => {
                  router.back();
                },
                onError: () => {
                  Alert.alert("Error", "Failed to delete expense");
                },
              },
            );
          },
        },
      ],
    );
  }, [id, expense, deleteExpenseMutation, router]);

  const getDisplayName = useCallback(
    (userId: string) => {
      return getUserDisplayName(userId, user?.id);
    },
    [user?.id],
  );

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const handleRetry = useCallback(() => {
    refetchExpense();
  }, [refetchExpense]);

  if (isLoadingExpense && !expense) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
      >
        <Stack.Screen options={{ title: "Expense" }} />
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  if (expenseError || !expense) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
      >
        <Stack.Screen options={{ title: "Expense" }} />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-5xl mb-4">😕</Text>
          <Text
            className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}
          >
            Unable to load expense
          </Text>
          <Text
            className={`text-base text-center mb-6 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
          >
            {expenseError?.message || "Expense not found"}
          </Text>
          <PrimaryButton onPress={handleRetry}>Try Again</PrimaryButton>
        </View>
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
          title: "Expense Details",
          headerStyle: { backgroundColor: themeColors.bgElevated },
          headerTintColor: themeColors.textPrimary,
          headerRight: () => (
            <Pressable onPress={handleEdit} className="active:opacity-70">
              <Text className="text-dutch-orange text-base">Edit</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1">
        {/* Amount Header */}
        <View
          className={`items-center py-8 px-4 ${isDark ? "bg-dark-card" : "bg-light-border"}`}
        >
          <Text
            className={`text-5xl font-semibold ${isDark ? "text-white" : "text-black"}`}
          >
            {getCurrencySymbol(expense.currency)}
            {formatAmount(expense.amount, expense.currency)}
          </Text>
          <Text
            className={`text-lg mt-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
          >
            {expense.description}
          </Text>
        </View>

        {/* Details Section */}
        <View
          className={`px-4 py-4 border-b-8 ${isDark ? "border-dark-border" : "border-light-border"}`}
        >
          <View
            className={`flex-row justify-between py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Paid by
            </Text>
            <Text
              className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}
            >
              {getDisplayName(expense.paidById)}
            </Text>
          </View>

          <View
            className={`flex-row justify-between py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Date
            </Text>
            <Text
              className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}
            >
              {formatDate(expense.date)}
            </Text>
          </View>

          <View
            className={`flex-row justify-between py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Split
            </Text>
            <Text
              className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}
            >
              {expense.splitType === "equal"
                ? "Split equally"
                : expense.splitType}
            </Text>
          </View>

          {group && (
            <View
              className={`flex-row justify-between py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
            >
              <Text
                className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
              >
                Group
              </Text>
              <Text
                className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}
              >
                {group.emoji} {group.name}
              </Text>
            </View>
          )}
        </View>

        {/* Split Breakdown Section */}
        <View
          className={`px-4 py-4 border-b-8 ${isDark ? "border-dark-border" : "border-light-border"}`}
        >
          <Text
            className={`text-sm font-semibold uppercase mb-3 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
          >
            Split breakdown
          </Text>
          {members.length > 0 ? (
            members.map((member) => {
              const perPerson = expense.amount / Math.max(members.length, 1);
              return (
                <View
                  key={member.userId}
                  className={`flex-row items-center justify-between py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-full bg-dutch-orange justify-center items-center mr-3">
                      <Text className="text-white text-sm font-semibold">
                        {member.userId.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      className={`text-base ${isDark ? "text-white" : "text-black"}`}
                    >
                      {getDisplayName(member.userId)}
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}
                  >
                    {getCurrencySymbol(expense.currency)}
                    {formatAmount(perPerson, expense.currency)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text
              className={`text-sm italic ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
            >
              No members to split with
            </Text>
          )}
        </View>

        {/* Metadata Section */}
        <View
          className={`px-4 py-4 border-b-8 ${isDark ? "border-dark-border" : "border-light-border"}`}
        >
          <Text
            className={`text-sm font-semibold uppercase mb-3 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
          >
            Details
          </Text>
          <View className="flex-row justify-between py-2">
            <Text
              className={`text-sm ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
            >
              Created by
            </Text>
            <Text
              className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              {getDisplayName(expense.createdById)}
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text
              className={`text-sm ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
            >
              Created on
            </Text>
            <Text
              className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              {formatDate(expense.createdAt)} at {formatTime(expense.createdAt)}
            </Text>
          </View>
          {expense.updatedAt !== expense.createdAt && (
            <View className="flex-row justify-between py-2">
              <Text
                className={`text-sm ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
              >
                Last updated
              </Text>
              <Text
                className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
              >
                {formatDate(expense.updatedAt)} at{" "}
                {formatTime(expense.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete button */}
      <View
        className={`p-4 border-t ${isDark ? "border-dark-border" : "border-light-border"}`}
      >
        <Pressable
          className="py-3 items-center active:opacity-70"
          onPress={handleDelete}
          disabled={deleteExpenseMutation.isPending}
        >
          {deleteExpenseMutation.isPending ? (
            <ActivityIndicator size="small" color={themeColors.red} />
          ) : (
            <Text className="text-dutch-red text-base font-semibold">
              Delete Expense
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
