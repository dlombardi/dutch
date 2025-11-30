import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { queryKeys } from '../../lib/queryClient';
import type { Balance } from '../../stores/groupsStore';
import { LoadingSpinner, ExpensesTab, BalancesTab, MembersTab, SettleModal } from '../../components';
import { formatBalance, getUserDisplayName } from '../../lib/formatters';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../../lib/theme';

// React Query hooks
import { useGroupData, useGroupExpenses } from '../../hooks/queries';
import { useCreateSettlement } from '../../hooks/mutations';

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
    return getUserDisplayName(userId, user?.id);
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
    const message = `Join my group "${group.name}" on Evn!\n\n${inviteLink}`;
    try {
      await Share.share({ message, title: `Join ${group.name} on Evn` });
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
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  // Error state
  if (groupError || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Group' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Unable to load group</Text>
          <Text style={styles.errorText}>{groupError?.message || 'Group not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetchAll}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const userBalance = getUserBalance();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: `${group.emoji} ${group.name}`,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleShareInvite} style={styles.headerInviteButton}>
                <Text style={styles.headerButton}>Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.headerButton}>Settings</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Balance Summary */}
      <View style={styles.balanceSummary}>
        <Text style={styles.balanceLabel}>Your balance</Text>
        <Text style={[
          styles.balanceAmount,
          userBalance > 0 && styles.balancePositive,
          userBalance < 0 && styles.balanceNegative,
        ]}>
          {formatBalance(userBalance, group.defaultCurrency)}
        </Text>
        <Text style={[
          styles.balanceHint,
          userBalance > 0 && styles.balanceHintPositive,
          userBalance < 0 && styles.balanceHintNegative,
        ]}>
          {getBalanceText(userBalance)}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balances' && styles.activeTab]}
          onPress={() => setActiveTab('balances')}
        >
          <Text style={[styles.tabText, activeTab === 'balances' && styles.activeTabText]}>
            Balances
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members ({members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
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
      <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
        <Text style={styles.fabText}>+ Add Expense</Text>
      </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  errorEmoji: {
    fontSize: fontSize['5xl'],
    marginBottom: spacing[4],
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  retryButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerInviteButton: {
    paddingHorizontal: spacing[2],
  },
  headerButton: {
    color: colors.primary.DEFAULT,
    fontSize: fontSize.base,
  },
  balanceSummary: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  balanceAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  balancePositive: {
    color: colors.success.DEFAULT,
  },
  balanceNegative: {
    color: colors.error.DEFAULT,
  },
  balanceHint: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  balanceHintPositive: {
    color: colors.success.DEFAULT,
  },
  balanceHintNegative: {
    color: colors.error.DEFAULT,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[6],
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3.5],
    borderRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  fabText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
