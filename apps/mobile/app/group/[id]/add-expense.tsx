import { useState, useCallback } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpensesStore } from '../../../stores/expensesStore';
import { useGroupsStore } from '../../../stores/groupsStore';
import { useAuthStore } from '../../../stores/authStore';

export default function AddExpenseScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { createExpense, isLoading, error } = useExpensesStore();
  const { currentGroup } = useGroupsStore();
  const { user } = useAuthStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = useCallback(async () => {
    if (!groupId || !user) return;

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
      user.id, // paidById - current user paid
      user.id // createdById - current user created
    );

    if (expense) {
      router.back();
    }
  }, [groupId, user, amount, description, createExpense, router]);

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

          {/* Paid By (simplified - always current user) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid by</Text>
            <View style={styles.staticValue}>
              <Text style={styles.staticValueText}>You</Text>
            </View>
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
  staticValue: {
    paddingVertical: 8,
  },
  staticValueText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
});
