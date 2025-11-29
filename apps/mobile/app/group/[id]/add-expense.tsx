import { useState, useCallback, useEffect, useMemo } from 'react';
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

// Common currencies with their symbols
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'NZD', symbol: '$', name: 'New Zealand Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

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
  const [currency, setCurrency] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
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

  // Default currency to group's default
  useEffect(() => {
    if (currentGroup && !currency) {
      setCurrency(currentGroup.defaultCurrency);
    }
  }, [currentGroup, currency]);

  // Filter currencies based on search
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) {
      return CURRENCIES;
    }
    const search = currencySearch.toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search) ||
        c.symbol.includes(search)
    );
  }, [currencySearch]);

  // Get current currency info
  const currentCurrency = useMemo(() => {
    const code = currency || currentGroup?.defaultCurrency || 'USD';
    return CURRENCIES.find((c) => c.code === code) || { code, symbol: code, name: code };
  }, [currency, currentGroup?.defaultCurrency]);

  // Check if exchange rate is needed (different currency from group default)
  const needsExchangeRate = useMemo(() => {
    return currency && currentGroup?.defaultCurrency && currency !== currentGroup.defaultCurrency;
  }, [currency, currentGroup?.defaultCurrency]);

  // Get group's default currency info
  const groupCurrency = useMemo(() => {
    const code = currentGroup?.defaultCurrency || 'USD';
    return CURRENCIES.find((c) => c.code === code) || { code, symbol: code, name: code };
  }, [currentGroup?.defaultCurrency]);

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

    // If exchange rate is needed, validate it
    let numericExchangeRate: number | undefined;
    if (needsExchangeRate) {
      numericExchangeRate = parseFloat(exchangeRate);
      if (isNaN(numericExchangeRate) || numericExchangeRate <= 0) {
        return; // Exchange rate required for foreign currency
      }
    }

    const expense = await createExpense(
      groupId,
      numericAmount,
      description.trim(),
      paidById, // paidById - selected payer
      user.id, // createdById - current user created
      currency || undefined, // currency - selected or default
      undefined, // date - use default
      splitParticipants.length > 0 ? splitParticipants : undefined,
      numericExchangeRate
    );

    if (expense) {
      router.back();
    }
  }, [groupId, user, paidById, amount, description, currency, exchangeRate, needsExchangeRate, createExpense, router, splitParticipants]);

  const handleSelectCurrency = useCallback((code: string) => {
    setCurrency(code);
    setShowCurrencyPicker(false);
    setCurrencySearch('');
  }, []);

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
    description.trim() !== '' &&
    (!needsExchangeRate || (exchangeRate.trim() !== '' && !isNaN(parseFloat(exchangeRate)) && parseFloat(exchangeRate) > 0));

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

          {/* Amount Input with Currency Selector */}
          <View style={styles.amountContainer}>
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={styles.currencySymbol}>{currentCurrency.symbol}</Text>
              <Text style={styles.currencyCode}>{currentCurrency.code}</Text>
            </TouchableOpacity>
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

          {/* Exchange Rate Input - shown when currency differs from group default */}
          {needsExchangeRate && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Exchange Rate (1 {currentCurrency.code} = ? {groupCurrency.code})
              </Text>
              <TextInput
                style={styles.input}
                value={exchangeRate}
                onChangeText={setExchangeRate}
                placeholder="Enter exchange rate"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              {parseFloat(amount) > 0 && parseFloat(exchangeRate) > 0 && (
                <View style={styles.conversionPreview}>
                  <Text style={styles.conversionText}>
                    {currentCurrency.symbol}{parseFloat(amount).toFixed(2)} {currentCurrency.code} = {groupCurrency.symbol}{(parseFloat(amount) * parseFloat(exchangeRate)).toFixed(2)} {groupCurrency.code}
                  </Text>
                </View>
              )}
            </View>
          )}

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
                  {currentCurrency.symbol}
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

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCurrencyPicker(false);
          setCurrencySearch('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity
              onPress={() => {
                setShowCurrencyPicker(false);
                setCurrencySearch('');
              }}
            >
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={currencySearch}
              onChangeText={setCurrencySearch}
              placeholder="Search currencies..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.currencyOption}
                onPress={() => handleSelectCurrency(item.code)}
              >
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyOptionSymbol}>{item.symbol}</Text>
                  <View style={styles.currencyTextContainer}>
                    <Text style={styles.currencyOptionCode}>{item.code}</Text>
                    <Text style={styles.currencyOptionName}>{item.name}</Text>
                  </View>
                </View>
                {currency === item.code && (
                  <Text style={styles.currencyOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyMembersList}>
                <Text style={styles.emptyMembersText}>No currencies found</Text>
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
  currencyButton: {
    alignItems: 'center',
    marginRight: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '400',
    color: '#1a1a1a',
  },
  currencyCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  conversionPreview: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
  },
  conversionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyOptionSymbol: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
    color: '#1a1a1a',
    marginRight: 12,
  },
  currencyTextContainer: {
    flexDirection: 'column',
  },
  currencyOptionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  currencyOptionName: {
    fontSize: 14,
    color: '#666',
  },
  currencyOptionCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
});
