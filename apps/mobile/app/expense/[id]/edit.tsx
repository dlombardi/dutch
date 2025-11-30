import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';

// React Query hooks
import { useExpense, useGroup, useGroupMembers } from '../../../hooks/queries';
import { useUpdateExpense } from '../../../hooks/mutations';

export default function EditExpenseScreen() {
  const { id: expenseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  // React Query hooks - automatic caching and deduplication
  const {
    data: expense,
    isLoading: isFetchingExpense,
  } = useExpense(expenseId);

  // Fetch group and members once we have the expense
  const { data: group } = useGroup(expense?.groupId);
  const { data: members = [] } = useGroupMembers(expense?.groupId);

  // Update mutation
  const updateExpenseMutation = useUpdateExpense();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
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
      }
    );
  }, [expenseId, paidById, amount, description, updateExpenseMutation, router]);

  const handleSelectPayer = useCallback((memberId: string) => {
    setPaidById(memberId);
    setShowPayerPicker(false);
  }, []);

  const getPayerDisplayName = useCallback(
    (payerId: string | null) => {
      if (!payerId) return 'Select payer';
      if (payerId === user?.id) return 'You';
      const member = members.find((m) => m.userId === payerId);
      if (member) {
        return member.userId === user?.id
          ? 'You'
          : `User ${member.userId.slice(0, 8)}...`;
      }
      return 'Unknown';
    },
    [user, members]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Derived state
  const isUpdating = updateExpenseMutation.isPending;
  const updateError = updateExpenseMutation.error?.message ?? null;

  const isValid =
    amount.trim() !== '' &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    description.trim() !== '';

  if (!expense && isFetchingExpense) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Expense' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Edit Expense',
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isValid || isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text
                  style={[
                    styles.saveButton,
                    !isValid && styles.saveButtonDisabled,
                  ]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          {updateError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{updateError}</Text>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>
              {group?.defaultCurrency === 'USD'
                ? '$'
                : group?.defaultCurrency === 'EUR'
                  ? '€'
                  : group?.defaultCurrency || '$'}
            </Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor="#999"
            />
          </View>

          {/* Paid By Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid by</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPayerPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {getPayerDisplayName(paidById)}
              </Text>
              <Text style={styles.pickerChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Split (simplified - always equal) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Split</Text>
            <View style={styles.staticValue}>
              <Text style={styles.staticValueText}>
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Who paid?</Text>
            <TouchableOpacity onPress={() => setShowPayerPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberOption}
                onPress={() => handleSelectPayer(item.userId)}
              >
                <View style={styles.memberOptionAvatar}>
                  <Text style={styles.memberOptionAvatarText}>
                    {item.userId.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberOptionName}>
                  {item.userId === user?.id
                    ? 'You'
                    : `User ${item.userId.slice(0, 8)}...`}
                </Text>
                {paidById === item.userId && (
                  <Text style={styles.memberOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyMembersList}>
                <Text style={styles.emptyMembersText}>No members found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#ccc',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '300',
    color: '#666',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 64,
    fontWeight: '200',
    color: '#1a1a1a',
    minWidth: 100,
    textAlign: 'center',
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 8,
  },
  staticValue: {
    paddingVertical: 8,
  },
  staticValueText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerChevron: {
    fontSize: 20,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberOptionAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  memberOptionName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  memberOptionCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyMembersList: {
    padding: 32,
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 16,
    color: '#666',
  },
});
