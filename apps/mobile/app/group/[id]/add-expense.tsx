import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { colors } from '../../../constants/theme';

// React Query hooks
import { useGroup, useGroupMembers } from '../../../hooks/queries';
import { useCreateExpense } from '../../../hooks/mutations';

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
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  // React Query hooks
  const { data: group } = useGroup(groupId);
  const { data: members = [] } = useGroupMembers(groupId);

  // Create expense mutation
  const createExpenseMutation = useCreateExpense();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidById, setPaidById] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateAutoFetched, setRateAutoFetched] = useState(false);
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [splitParticipants, setSplitParticipants] = useState<string[]>([]);

  // Set default payer to current user
  useEffect(() => {
    if (user && !paidById) {
      setPaidById(user.id);
    }
  }, [user, paidById]);

  // Default all group members as split participants
  useEffect(() => {
    if (members.length > 0 && splitParticipants.length === 0) {
      setSplitParticipants(members.map((m) => m.userId));
    }
  }, [members, splitParticipants.length]);

  // Default currency to group's default
  useEffect(() => {
    if (group && !currency) {
      setCurrency(group.defaultCurrency);
    }
  }, [group, currency]);

  // Auto-fetch exchange rate when foreign currency is selected
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!currency || !group?.defaultCurrency) return;
      if (currency === group.defaultCurrency) {
        setExchangeRate('');
        setRateAutoFetched(false);
        return;
      }

      setIsFetchingRate(true);
      try {
        const result = await api.getExchangeRate(currency, group.defaultCurrency);
        setExchangeRate(result.rate.toString());
        setRateAutoFetched(true);
      } catch (err) {
        console.warn('Failed to fetch exchange rate:', err);
        setRateAutoFetched(false);
      } finally {
        setIsFetchingRate(false);
      }
    };

    fetchExchangeRate();
  }, [currency, group?.defaultCurrency]);

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
    const code = currency || group?.defaultCurrency || 'USD';
    return CURRENCIES.find((c) => c.code === code) || { code, symbol: code, name: code };
  }, [currency, group?.defaultCurrency]);

  // Check if exchange rate is needed (different currency from group default)
  const needsExchangeRate = useMemo(() => {
    return currency && group?.defaultCurrency && currency !== group.defaultCurrency;
  }, [currency, group?.defaultCurrency]);

  // Get group's default currency info
  const groupCurrency = useMemo(() => {
    const code = group?.defaultCurrency || 'USD';
    return CURRENCIES.find((c) => c.code === code) || { code, symbol: code, name: code };
  }, [group?.defaultCurrency]);

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

    let numericExchangeRate: number | undefined;
    if (needsExchangeRate) {
      numericExchangeRate = parseFloat(exchangeRate);
      if (isNaN(numericExchangeRate) || numericExchangeRate <= 0) {
        return;
      }
    }

    createExpenseMutation.mutate(
      {
        groupId,
        amount: numericAmount,
        description: description.trim(),
        paidById,
        createdById: user.id,
        currency: currency || undefined,
        splitParticipants: splitParticipants.length > 0 ? splitParticipants : undefined,
        exchangeRate: numericExchangeRate,
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  }, [groupId, user, paidById, amount, description, currency, exchangeRate, needsExchangeRate, createExpenseMutation, router, splitParticipants]);

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
      const member = members.find((m) => m.userId === payerId);
      if (member) {
        return member.userId === user?.id ? 'You' : `User ${member.userId.slice(0, 8)}...`;
      }
      return 'Unknown';
    },
    [user, members]
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

  const isCreating = createExpenseMutation.isPending;

  // Create dynamic styles
  const styles = useMemo(() => createStyles(isDark, themeColors), [isDark, themeColors]);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Add Expense',
          headerStyle: { backgroundColor: themeColors.bgElevated },
          headerTintColor: themeColors.textPrimary,
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Text className="text-dutch-orange text-base">Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isValid || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={themeColors.orange} />
              ) : (
                <Text
                  className={`text-base font-semibold ${isValid ? 'text-dutch-orange' : isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}
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
          {createExpenseMutation.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {createExpenseMutation.error.message || 'Failed to create expense'}
              </Text>
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
              placeholderTextColor={themeColors.textTertiary}
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
              placeholderTextColor={themeColors.textTertiary}
            />
          </View>

          {/* Exchange Rate Input - shown when currency differs from group default */}
          {needsExchangeRate && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Exchange Rate (1 {currentCurrency.code} = ? {groupCurrency.code})
                </Text>
                {isFetchingRate && (
                  <ActivityIndicator size="small" color={themeColors.orange} style={styles.rateLoader} />
                )}
              </View>
              <View style={styles.rateInputRow}>
                <TextInput
                  style={[styles.input, styles.rateInput]}
                  value={exchangeRate}
                  onChangeText={(text) => {
                    setExchangeRate(text);
                    setRateAutoFetched(false);
                  }}
                  placeholder={isFetchingRate ? "Fetching rate..." : "Enter exchange rate"}
                  placeholderTextColor={themeColors.textTertiary}
                  keyboardType="decimal-pad"
                  editable={!isFetchingRate}
                />
                {rateAutoFetched && (
                  <View style={styles.autoFetchBadge}>
                    <Text style={styles.autoFetchText}>Auto</Text>
                  </View>
                )}
              </View>
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
                {splitParticipants.length === members.length
                  ? 'All members'
                  : `${splitParticipants.length} ${splitParticipants.length === 1 ? 'person' : 'people'}`}
              </Text>
              <Text style={styles.pickerChevron}>›</Text>
            </TouchableOpacity>
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

        {/* Add Expense Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.addButton,
              (!isValid || isCreating) && styles.addButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isValid || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Expense</Text>
            )}
          </TouchableOpacity>
        </View>
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
            data={members}
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
              placeholderTextColor={themeColors.textTertiary}
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

// Create dynamic styles based on theme
const createStyles = (isDark: boolean, themeColors: typeof colors.dark | typeof colors.light) => ({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: isDark ? 'rgba(255,69,58,0.15)' : '#FFE5E5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: themeColors.red,
    fontSize: 14,
  },
  amountContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  currencyButton: {
    alignItems: 'center' as const,
    marginRight: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: isDark ? themeColors.bgCard : '#f0f0f0',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '400' as const,
    color: themeColors.textPrimary,
  },
  currencyCode: {
    fontSize: 12,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  amountInput: {
    fontSize: 64,
    fontWeight: '200' as const,
    color: themeColors.textPrimary,
    minWidth: 100,
    textAlign: 'center' as const,
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  label: {
    fontSize: 14,
    color: themeColors.textSecondary,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: themeColors.textPrimary,
    paddingVertical: 8,
  },
  perPersonPreview: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: isDark ? themeColors.bgCard : '#f8f8f8',
    borderRadius: 8,
  },
  perPersonText: {
    fontSize: 14,
    color: themeColors.textSecondary,
  },
  conversionPreview: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: isDark ? 'rgba(255,107,0,0.15)' : '#FFF5EB',
    borderRadius: 8,
  },
  conversionText: {
    fontSize: 14,
    color: themeColors.orange,
    fontWeight: '500' as const,
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  rateLoader: {
    marginLeft: 8,
  },
  rateInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rateInput: {
    flex: 1,
  },
  autoFetchBadge: {
    backgroundColor: themeColors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  autoFetchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  pickerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: themeColors.textPrimary,
  },
  pickerChevron: {
    fontSize: 20,
    color: themeColors.textTertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.bg,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: themeColors.textPrimary,
  },
  modalClose: {
    fontSize: 16,
    color: themeColors.orange,
    fontWeight: '600' as const,
  },
  memberOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  memberOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.orange,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  memberOptionAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  memberOptionName: {
    flex: 1,
    fontSize: 16,
    color: themeColors.textPrimary,
  },
  memberOptionCheck: {
    fontSize: 18,
    color: themeColors.orange,
    fontWeight: '600' as const,
  },
  emptyMembersList: {
    padding: 32,
    alignItems: 'center' as const,
  },
  emptyMembersText: {
    fontSize: 16,
    color: themeColors.textSecondary,
  },
  memberOptionAvatarInactive: {
    backgroundColor: isDark ? themeColors.bgCard : '#e0e0e0',
  },
  memberOptionAvatarTextInactive: {
    color: themeColors.textTertiary,
  },
  memberOptionNameInactive: {
    color: themeColors.textTertiary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  searchInput: {
    fontSize: 16,
    color: themeColors.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: isDark ? themeColors.bgCard : '#f5f5f5',
    borderRadius: 8,
  },
  currencyOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  currencyInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  currencyOptionSymbol: {
    fontSize: 24,
    width: 40,
    textAlign: 'center' as const,
    color: themeColors.textPrimary,
    marginRight: 12,
  },
  currencyTextContainer: {
    flexDirection: 'column' as const,
  },
  currencyOptionCode: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: themeColors.textPrimary,
  },
  currencyOptionName: {
    fontSize: 14,
    color: themeColors.textSecondary,
  },
  currencyOptionCheck: {
    fontSize: 18,
    color: themeColors.orange,
    fontWeight: '600' as const,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    backgroundColor: themeColors.bg,
  },
  addButton: {
    backgroundColor: themeColors.orange,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  addButtonDisabled: {
    backgroundColor: isDark ? themeColors.bgCard : '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
