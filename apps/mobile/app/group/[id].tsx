import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useGroupsStore, GroupMember, Balance } from '../../stores/groupsStore';
import { useAuthStore } from '../../stores/authStore';
import { useExpensesStore, Expense } from '../../stores/expensesStore';

type Tab = 'expenses' | 'balances' | 'members';

const APP_URL_SCHEME = 'evn://';
const WEB_URL = 'https://evn.app'; // Production web URL

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const { user } = useAuthStore();
  const {
    currentGroup,
    currentGroupMembers,
    currentGroupBalances,
    fetchGroup,
    fetchGroupMembers,
    fetchGroupBalances,
    isLoading,
    error,
  } = useGroupsStore();
  const {
    expenses,
    fetchGroupExpenses,
    isLoading: expensesLoading,
  } = useExpensesStore();

  useEffect(() => {
    if (id) {
      fetchGroup(id);
      fetchGroupMembers(id);
      fetchGroupExpenses(id);
      fetchGroupBalances(id);
    }
  }, [id, fetchGroup, fetchGroupMembers, fetchGroupExpenses, fetchGroupBalances]);

  // Get user's balance from memberBalances
  const getUserBalance = useCallback(() => {
    if (!user || !currentGroupBalances) return 0;
    return currentGroupBalances.memberBalances[user.id] || 0;
  }, [user, currentGroupBalances]);

  const getBalanceText = useCallback((balance: number) => {
    if (balance > 0) return 'you are owed';
    if (balance < 0) return 'you owe';
    return 'All settled up!';
  }, []);

  const getCurrencySymbol = useCallback((currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return currency;
    }
  }, []);

  const getUserDisplayName = useCallback((userId: string) => {
    if (userId === user?.id) return 'You';
    return `User ${userId.slice(0, 8)}...`;
  }, [user]);

  const handleAddExpense = useCallback(() => {
    if (id) {
      router.push(`/group/${id}/add-expense`);
    }
  }, [id, router]);

  const handleExpensePress = useCallback(
    (expenseId: string) => {
      router.push(`/expense/${expenseId}`);
    },
    [router]
  );

  const handleShareInvite = useCallback(async () => {
    if (!currentGroup) return;

    const inviteLink = `${WEB_URL}/join/${currentGroup.inviteCode}`;
    const message = `Join my group "${currentGroup.name}" on Evn!\n\n${inviteLink}`;

    try {
      await Share.share({
        message,
        title: `Join ${currentGroup.name} on Evn`,
      });
    } catch (err) {
      if (err instanceof Error && err.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to open share sheet');
      }
    }
  }, [currentGroup]);

  if (isLoading && !currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Group not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const group = currentGroup;

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
          getUserBalance() > 0 && styles.balancePositive,
          getUserBalance() < 0 && styles.balanceNegative,
        ]}>
          {getUserBalance() < 0 ? '-' : ''}{getCurrencySymbol(group.defaultCurrency)}{Math.abs(getUserBalance()).toFixed(2)}
        </Text>
        <Text style={[
          styles.balanceHint,
          getUserBalance() > 0 && styles.balanceHintPositive,
          getUserBalance() < 0 && styles.balanceHintNegative,
        ]}>
          {getBalanceText(getUserBalance())}
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
            Members ({currentGroupMembers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'expenses' && (
          <ScrollView style={styles.expensesList}>
            {expensesLoading && expenses.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💸</Text>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first expense to start tracking
                </Text>
              </View>
            ) : (
              expenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseItem}
                  onPress={() => handleExpensePress(expense.id)}
                >
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription}>
                      {expense.description}
                    </Text>
                    <Text style={styles.expenseDate}>
                      {new Date(expense.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {expense.currency === 'USD'
                      ? '$'
                      : expense.currency === 'EUR'
                        ? '€'
                        : expense.currency}
                    {expense.amount.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
        {activeTab === 'balances' && (
          <ScrollView style={styles.balancesList}>
            {!currentGroupBalances || currentGroupBalances.balances.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>All settled up!</Text>
                <Text style={styles.emptySubtitle}>
                  No outstanding balances in this group
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.balancesHeader}>Who pays whom</Text>
                {currentGroupBalances.balances.map((balance, index) => (
                  <View key={`${balance.from}-${balance.to}-${index}`} style={styles.balanceItem}>
                    <View style={styles.balanceParties}>
                      <View style={styles.balanceAvatar}>
                        <Text style={styles.balanceAvatarText}>
                          {balance.from.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.balanceDetails}>
                        <Text style={styles.balanceFrom}>
                          {getUserDisplayName(balance.from)}
                        </Text>
                        <Text style={styles.balanceArrow}>owes</Text>
                        <Text style={styles.balanceTo}>
                          {getUserDisplayName(balance.to)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.balanceItemAmount}>
                      {getCurrencySymbol(balance.currency)}{balance.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
        {activeTab === 'members' && (
          <ScrollView style={styles.membersList}>
            {currentGroupMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyTitle}>No members yet</Text>
                <Text style={styles.emptySubtitle}>
                  Invite friends to join this group
                </Text>
              </View>
            ) : (
              currentGroupMembers.map((member, index) => (
                <View key={member.userId} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.userId.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.userId}
                      {member.userId === group.createdById && ' (Creator)'}
                    </Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'admin' ? 'Admin' : 'Member'} · Joined{' '}
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {member.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Add Expense FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
        <Text style={styles.fabText}>+ Add Expense</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerInviteButton: {
    marginRight: 8,
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  balanceSummary: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f8f8',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  balanceHint: {
    fontSize: 14,
    color: '#4CAF50',
  },
  balancePositive: {
    color: '#4CAF50',
  },
  balanceNegative: {
    color: '#FF5722',
  },
  balanceHintPositive: {
    color: '#4CAF50',
  },
  balanceHintNegative: {
    color: '#FF5722',
  },
  balancesList: {
    flex: 1,
  },
  balancesHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    padding: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  balanceParties: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  balanceFrom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  balanceArrow: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 6,
  },
  balanceTo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  balanceItemAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF5722',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  expensesList: {
    flex: 1,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
