import { Alert, Share } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/modules/auth';
import { useSyncStore } from '@/store/sync-store';
import { queryKeys } from '@/lib/query-client';
import type { Balance } from '@/modules/groups';
import { useGroupData } from '@/modules/groups';
import { BalancesTab, ExpensesTab, MembersTab, SettleModal } from '@/components/group';
import { View, Text, Pressable } from '@/components/ui/primitives';
import { LoadingSpinner, PrimaryButton } from '@/components/ui';
import { formatBalance } from '@/lib/utils/formatters';
import { colors, gradients, shadows } from '@/constants/theme';

// React Query hooks
import { useGroupExpenses } from '@/modules/expenses';
import { useCreateSettlement } from '@/modules/settlements';

type Tab = 'expenses' | 'balances' | 'members';

const WEB_URL = 'https://evn.app';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  // React Query hooks
  const {
    group,
    members,
    balances,
    isLoading: isLoadingGroup,
    error: groupError,
    refetchAll,
  } = useGroupData(id);

  const { data: expenses = [], isLoading: isLoadingExpenses } = useGroupExpenses(id);

  // Mutation for creating settlements
  const createSettlementMutation = useCreateSettlement();

  // Real-time sync handlers
  const {
    joinGroup: joinSyncGroup,
    leaveGroup: leaveSyncGroup,
    onExpenseCreated,
    onExpenseUpdated,
    onExpenseDeleted,
    onSettlementCreated,
    connectionStatus,
  } = useSyncStore();

  // Subscribe to real-time updates when connected
  useEffect(() => {
    if (!id || connectionStatus !== 'connected') return;

    joinSyncGroup(id);

    const unsubExpenseCreated = onExpenseCreated((data) => {
      if (data.expense.groupId === id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byGroup(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(id) });
      }
    });

    const unsubExpenseUpdated = onExpenseUpdated((data) => {
      if (data.expense.groupId === id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byGroup(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(id) });
      }
    });

    const unsubExpenseDeleted = onExpenseDeleted((data) => {
      if (data.groupId === id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byGroup(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(id) });
      }
    });

    const unsubSettlementCreated = onSettlementCreated((data) => {
      if (data.settlement.groupId === id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.settlements.byGroup(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(id) });
      }
    });

    return () => {
      leaveSyncGroup(id);
      unsubExpenseCreated();
      unsubExpenseUpdated();
      unsubExpenseDeleted();
      unsubSettlementCreated();
    };
  }, [id, connectionStatus, queryClient, joinSyncGroup, leaveSyncGroup, onExpenseCreated, onExpenseUpdated, onExpenseDeleted, onSettlementCreated]);

  // Callbacks
  const getUserBalance = useCallback(() => {
    if (!user || !balances) return 0;
    return balances.memberBalances[user.id] || 0;
  }, [user, balances]);

  const getBalanceText = useCallback((balance: number) => {
    if (balance > 0) return 'you are owed';
    if (balance < 0) return 'you owe';
    return 'All settled up!';
  }, []);

  const getDisplayName = useCallback((userId: string) => {
    if (userId === user?.id) return 'You';
    return `User ${userId.slice(0, 8)}...`;
  }, [user?.id]);

  const handleAddExpense = useCallback(() => {
    if (id) router.push(`/group/${id}/add-expense`);
  }, [id, router]);

  const handleExpensePress = useCallback((expenseId: string) => {
    router.push(`/expense/${expenseId}`);
  }, [router]);

  const handleShareInvite = useCallback(async () => {
    if (!group) return;
    const inviteLink = `${WEB_URL}/join/${group.inviteCode}`;
    const message = `Join my group "${group.name}" on Dutch!\n\n${inviteLink}`;
    try {
      await Share.share({ message, title: `Join ${group.name} on Dutch` });
    } catch (err) {
      if (err instanceof Error && err.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to open share sheet');
      }
    }
  }, [group]);

  const handleSettleUp = useCallback((balance: Balance) => {
    setSelectedBalance(balance);
    setSettleAmount(balance.amount.toFixed(2));
    setSettleModalVisible(true);
  }, []);

  const handleConfirmSettlement = useCallback(async () => {
    if (!selectedBalance || !user || !id) return;

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    createSettlementMutation.mutate(
      {
        groupId: id,
        fromUserId: selectedBalance.from,
        toUserId: selectedBalance.to,
        amount,
        createdById: user.id,
        currency: selectedBalance.currency,
        method: 'cash',
      },
      {
        onSuccess: () => {
          setSettleModalVisible(false);
          setSelectedBalance(null);
          setSettleAmount('');
          Alert.alert('Success', 'Settlement recorded!');
        },
        onError: () => {
          Alert.alert('Error', 'Failed to record settlement');
        },
      }
    );
  }, [selectedBalance, user, id, settleAmount, createSettlementMutation]);

  const handleCloseModal = useCallback(() => {
    setSettleModalVisible(false);
  }, []);

  // Loading state
  if (isLoadingGroup && !group) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  // Error state
  if (groupError || !group) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
        <Stack.Screen options={{ title: 'Group' }} />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-5xl mb-4">😕</Text>
          <Text className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            Unable to load group
          </Text>
          <Text className={`text-base text-center mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            {groupError?.message || 'Group not found'}
          </Text>
          <PrimaryButton onPress={refetchAll}>
            Try Again
          </PrimaryButton>
        </View>
      </SafeAreaView>
    );
  }

  const userBalance = getUserBalance();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`} edges={['bottom']}>
      {/* Ambient gradient based on balance */}
      <LinearGradient
        colors={
          userBalance > 0
            ? gradients.greenAmbient.colors
            : userBalance < 0
              ? gradients.redAmbient.colors
              : gradients.orangeAmbient.colors
        }
        locations={gradients.orangeAmbient.locations}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        pointerEvents="none"
      />

      <Stack.Screen
        options={{
          title: `${group.emoji} ${group.name}`,
          headerStyle: {
            backgroundColor: themeColors.bgElevated,
          },
          headerTintColor: themeColors.textPrimary,
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <Pressable onPress={handleShareInvite} className="px-2 active:opacity-70">
                <Text className="text-dutch-orange text-base">Invite</Text>
              </Pressable>
              <Pressable className="active:opacity-70">
                <Text className="text-dutch-orange text-base">Settings</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Balance Summary */}
      <View className={`items-center py-6 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        <Text className={`text-sm mb-1 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          Your balance
        </Text>
        <Text
          className={`text-4xl font-bold ${
            userBalance > 0
              ? 'text-dutch-green'
              : userBalance < 0
                ? 'text-dutch-red'
                : isDark
                  ? 'text-white'
                  : 'text-black'
          }`}
        >
          {formatBalance(userBalance, group.defaultCurrency)}
        </Text>
        <Text
          className={`text-sm mt-1 ${
            userBalance > 0
              ? 'text-dutch-green'
              : userBalance < 0
                ? 'text-dutch-red'
                : isDark
                  ? 'text-dark-text-secondary'
                  : 'text-light-text-secondary'
          }`}
        >
          {getBalanceText(userBalance)}
        </Text>
      </View>

      {/* Tabs */}
      <View className={`flex-row border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        {(['expenses', 'balances', 'members'] as const).map((tab) => (
          <Pressable
            key={tab}
            className={`flex-1 py-3 items-center active:opacity-70 ${
              activeTab === tab
                ? 'border-b-2 border-dutch-orange'
                : ''
            }`}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className={`text-sm ${
                activeTab === tab
                  ? 'text-dutch-orange font-semibold'
                  : isDark
                    ? 'text-dark-text-secondary'
                    : 'text-light-text-secondary'
              }`}
            >
              {tab === 'members' ? `Members (${members.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            isLoading={isLoadingExpenses}
            onExpensePress={handleExpensePress}
          />
        )}
        {activeTab === 'balances' && (
          <BalancesTab
            balances={balances}
            getDisplayName={getDisplayName}
            onSettleUp={handleSettleUp}
          />
        )}
        {activeTab === 'members' && (
          <MembersTab members={members} createdById={group.createdById} />
        )}
      </View>

      {/* Add Expense FAB */}
      <Pressable
        className="absolute bottom-6 right-6 bg-dutch-orange px-5 py-3.5 rounded-3xl active:scale-95"
        style={shadows.orangeGlow}
        onPress={handleAddExpense}
      >
        <Text className="text-white text-base font-semibold">+ Add Expense</Text>
      </Pressable>

      {/* Settle Up Modal */}
      <SettleModal
        visible={settleModalVisible}
        selectedBalance={selectedBalance}
        settleAmount={settleAmount}
        isPending={createSettlementMutation.isPending}
        getDisplayName={getDisplayName}
        onAmountChange={setSettleAmount}
        onConfirm={handleConfirmSettlement}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}
