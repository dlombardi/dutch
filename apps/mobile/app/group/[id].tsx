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
import { useGroupsStore, GroupMember } from '../../stores/groupsStore';
import { useExpensesStore, Expense } from '../../stores/expensesStore';

type Tab = 'expenses' | 'balances' | 'members';

const APP_URL_SCHEME = 'evn://';
const WEB_URL = 'https://evn.app'; // Production web URL

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const {
    currentGroup,
    currentGroupMembers,
    fetchGroup,
    fetchGroupMembers,
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
    }
  }, [id, fetchGroup, fetchGroupMembers, fetchGroupExpenses]);

  const handleAddExpense = useCallback(() => {
    if (id) {
      router.push(`/group/${id}/add-expense`);
    }
  }, [id, router]);

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
        <Text style={styles.balanceAmount}>
          {group.defaultCurrency === 'USD' ? '$' : group.defaultCurrency === 'EUR' ? '€' : group.defaultCurrency}0.00
        </Text>
        <Text style={styles.balanceHint}>All settled up!</Text>
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
                <View key={expense.id} style={styles.expenseItem}>
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
                </View>
              ))
            )}
          </ScrollView>
        )}
        {activeTab === 'balances' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>All settled up!</Text>
            <Text style={styles.emptySubtitle}>
              No outstanding balances in this group
            </Text>
          </View>
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
