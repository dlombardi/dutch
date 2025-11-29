import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpensesStore } from '../../stores/expensesStore';
import { useGroupsStore } from '../../stores/groupsStore';
import { useAuthStore } from '../../stores/authStore';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentExpense, fetchExpense, isLoading, error } = useExpensesStore();
  const { currentGroup, currentGroupMembers, fetchGroup, fetchGroupMembers } =
    useGroupsStore();

  const handleEdit = useCallback(() => {
    if (id) {
      router.push(`/expense/${id}/edit`);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchExpense(id);
    }
  }, [id, fetchExpense]);

  useEffect(() => {
    if (currentExpense?.groupId) {
      fetchGroup(currentExpense.groupId);
      fetchGroupMembers(currentExpense.groupId);
    }
  }, [currentExpense?.groupId, fetchGroup, fetchGroupMembers]);

  const getCurrencySymbol = useCallback((currency: string) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'JPY':
        return '¥';
      default:
        return currency;
    }
  }, []);

  const getPayerDisplayName = useCallback(
    (payerId: string) => {
      if (payerId === user?.id) return 'You';
      const member = currentGroupMembers.find((m) => m.userId === payerId);
      if (member) {
        return `User ${member.userId.slice(0, 8)}...`;
      }
      return 'Unknown';
    },
    [user, currentGroupMembers]
  );

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

  if (isLoading && !currentExpense) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Expense' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentExpense) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Expense' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Expense not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const expense = currentExpense;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Expense Details',
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Amount Header */}
        <View style={styles.amountHeader}>
          <Text style={styles.amount}>
            {getCurrencySymbol(expense.currency)}
            {expense.amount.toFixed(2)}
          </Text>
          <Text style={styles.description}>{expense.description}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid by</Text>
            <Text style={styles.detailValue}>
              {getPayerDisplayName(expense.paidById)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Split</Text>
            <Text style={styles.detailValue}>
              {expense.splitType === 'equal'
                ? 'Split equally'
                : expense.splitType}
            </Text>
          </View>

          {currentGroup && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Group</Text>
              <Text style={styles.detailValue}>
                {currentGroup.emoji} {currentGroup.name}
              </Text>
            </View>
          )}
        </View>

        {/* Split Breakdown Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split breakdown</Text>
          {currentGroupMembers.length > 0 ? (
            currentGroupMembers.map((member) => {
              const perPerson =
                expense.amount / Math.max(currentGroupMembers.length, 1);
              return (
                <View key={member.userId} style={styles.splitRow}>
                  <View style={styles.splitMember}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.userId.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.splitMemberName}>
                      {member.userId === user?.id
                        ? 'You'
                        : `User ${member.userId.slice(0, 8)}...`}
                    </Text>
                  </View>
                  <Text style={styles.splitAmount}>
                    {getCurrencySymbol(expense.currency)}
                    {perPerson.toFixed(2)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noMembersText}>No members to split with</Text>
          )}
        </View>

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created by</Text>
            <Text style={styles.metaValue}>
              {expense.createdById === user?.id
                ? 'You'
                : `User ${expense.createdById.slice(0, 8)}...`}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created on</Text>
            <Text style={styles.metaValue}>
              {formatDate(expense.createdAt)} at {formatTime(expense.createdAt)}
            </Text>
          </View>
          {expense.updatedAt !== expense.createdAt && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Last updated</Text>
              <Text style={styles.metaValue}>
                {formatDate(expense.updatedAt)} at{' '}
                {formatTime(expense.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Expense</Text>
        </TouchableOpacity>
      </View>
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
  editButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  amountHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
  },
  amount: {
    fontSize: 48,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  description: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  splitMember: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  splitMemberName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  noMembersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#999',
  },
  metaValue: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deleteButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
