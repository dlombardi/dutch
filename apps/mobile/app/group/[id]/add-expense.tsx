import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpensesStore } from '../../../stores/expensesStore';
import { useGroupsStore, GroupMember } from '../../../stores/groupsStore';
import { useAuthStore } from '../../../stores/authStore';

export default function AddExpenseScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { createExpense, isLoading, error } = useExpensesStore();
  const { currentGroup, currentGroupMembers, fetchGroupMembers } =
    useGroupsStore();
  const { user } = useAuthStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidById, setPaidById] = useState<string | null>(null);
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [splitParticipants, setSplitParticipants] = useState<string[]>([]);

  // Fetch group members and set default payer
  useEffect(() => {
    if (groupId) {
      fetchGroupMembers(groupId);
    }
  }, [groupId, fetchGroupMembers]);

  // Set default payer to current user
  useEffect(() => {
    if (user && !paidById) {
      setPaidById(user.id);
    }
  }, [user, paidById]);

  // Default all group members as split participants
  useEffect(() => {
    if (currentGroupMembers.length > 0 && splitParticipants.length === 0) {
      setSplitParticipants(currentGroupMembers.map((m) => m.userId));
    }
  }, [currentGroupMembers, splitParticipants.length]);

  // Calculate per-person amount for preview
  const getPerPersonAmount = useCallback(() => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || splitParticipants.length === 0) {
      return 0;
    }
    return numericAmount / splitParticipants.length;
  }, [amount, splitParticipants]);

  const toggleParticipant = useCallback((userId: string) => {
    setSplitParticipants((prev) => {
      if (prev.includes(userId)) {
        // Don't allow removing the last participant
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!groupId || !user || !paidById) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    const expense = await createExpense(
      groupId,
      numericAmount,
      description.trim(),
      paidById, // paidById - selected payer
      user.id, // createdById - current user created
      undefined, // currency - use default
      undefined, // date - use default
      splitParticipants.length > 0 ? splitParticipants : undefined
    );

    if (expense) {
      router.back();
    }
  }, [groupId, user, paidById, amount, description, createExpense, router]);

  const handleSelectPayer = useCallback((memberId: string) => {
    setPaidById(memberId);
    setShowPayerPicker(false);
  }, []);

  const getPayerDisplayName = useCallback(
    (payerId: string | null) => {
      if (!payerId) return 'Select payer';
      if (payerId === user?.id) return 'You';
      // For now, show the userId; in the future this could show actual user names
      const member = currentGroupMembers.find((m) => m.userId === payerId);
      if (member) {
        return member.userId === user?.id ? 'You' : `User ${member.userId.slice(0, 8)}...`;
      }
      return 'Unknown';
    },
    [user, currentGroupMembers]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const isValid =
    amount.trim() !== '' &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    description.trim() !== '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Add Expense',
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
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
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>
              {currentGroup?.defaultCurrency === 'USD'
                ? '$'
                : currentGroup?.defaultCurrency === 'EUR'
                  ? '€'
                  : currentGroup?.defaultCurrency || '$'}
            </Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
              autoFocus
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

          {/* Split Participants Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Split equally among</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSplitPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {splitParticipants.length === currentGroupMembers.length
                  ? 'All members'
                  : `${splitParticipants.length} ${splitParticipants.length === 1 ? 'person' : 'people'}`}
              </Text>
              <Text style={styles.pickerChevron}>›</Text>
            </TouchableOpacity>
            {/* Per-person amount preview */}
            {parseFloat(amount) > 0 && splitParticipants.length > 0 && (
              <View style={styles.perPersonPreview}>
                <Text style={styles.perPersonText}>
                  {currentGroup?.defaultCurrency === 'USD'
                    ? '$'
                    : currentGroup?.defaultCurrency === 'EUR'
                      ? '€'
                      : currentGroup?.defaultCurrency || '$'}
                  {getPerPersonAmount().toFixed(2)} per person
                </Text>
              </View>
            )}
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
            data={currentGroupMembers}
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
                  {item.userId === user?.id ? 'You' : `User ${item.userId.slice(0, 8)}...`}
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

      {/* Split Participants Picker Modal */}
      <Modal
        visible={showSplitPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSplitPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Split with</Text>
            <TouchableOpacity onPress={() => setShowSplitPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={currentGroupMembers}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberOption}
                onPress={() => toggleParticipant(item.userId)}
              >
                <View
                  style={[
                    styles.memberOptionAvatar,
                    !splitParticipants.includes(item.userId) &&
                      styles.memberOptionAvatarInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.memberOptionAvatarText,
                      !splitParticipants.includes(item.userId) &&
                        styles.memberOptionAvatarTextInactive,
                    ]}
                  >
                    {item.userId.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.memberOptionName,
                    !splitParticipants.includes(item.userId) &&
                      styles.memberOptionNameInactive,
                  ]}
                >
                  {item.userId === user?.id
                    ? 'You'
                    : `User ${item.userId.slice(0, 8)}...`}
                </Text>
                {splitParticipants.includes(item.userId) && (
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
  perPersonPreview: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  perPersonText: {
    fontSize: 14,
    color: '#666',
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
  memberOptionAvatarInactive: {
    backgroundColor: '#e0e0e0',
  },
  memberOptionAvatarTextInactive: {
    color: '#999',
  },
  memberOptionNameInactive: {
    color: '#999',
  },
});
