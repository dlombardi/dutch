import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "@/modules/auth";
import { api } from "@/lib/api-client";
import { colors } from "@/constants/theme";
import {
  View,
  Text,
  Pressable,
  SearchInput,
  TextInput,
} from "@/components/ui/primitives";

// React Query hooks
import { useGroup, useGroupMembers } from "@/modules/groups";
import { useCreateExpense } from "@/modules/expenses";

// Common currencies with their symbols
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "$", name: "Hong Kong Dollar" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
];

export default function AddExpenseScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = isDark ? colors.dark : colors.light;

  // React Query hooks
  const { data: group } = useGroup(groupId);
  const { data: members = [] } = useGroupMembers(groupId);

  // Create expense mutation
  const createExpenseMutation = useCreateExpense();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidById, setPaidById] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateAutoFetched, setRateAutoFetched] = useState(false);
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
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
        setExchangeRate("");
        setRateAutoFetched(false);
        return;
      }

      setIsFetchingRate(true);
      try {
        const result = await api.getExchangeRate(
          currency,
          group.defaultCurrency,
        );
        setExchangeRate(result.rate.toString());
        setRateAutoFetched(true);
      } catch (err) {
        console.warn("Failed to fetch exchange rate:", err);
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
        c.symbol.includes(search),
    );
  }, [currencySearch]);

  // Get current currency info
  const currentCurrency = useMemo(() => {
    const code = currency || group?.defaultCurrency || "USD";
    return (
      CURRENCIES.find((c) => c.code === code) || {
        code,
        symbol: code,
        name: code,
      }
    );
  }, [currency, group?.defaultCurrency]);

  // Check if exchange rate is needed (different currency from group default)
  const needsExchangeRate = useMemo(() => {
    return (
      currency && group?.defaultCurrency && currency !== group.defaultCurrency
    );
  }, [currency, group?.defaultCurrency]);

  // Get group's default currency info
  const groupCurrency = useMemo(() => {
    const code = group?.defaultCurrency || "USD";
    return (
      CURRENCIES.find((c) => c.code === code) || {
        code,
        symbol: code,
        name: code,
      }
    );
  }, [group?.defaultCurrency]);

  // Calculate per-person amount for preview
  const getPerPersonAmount = useCallback(() => {
    const numericAmount = parseFloat(amount);
    if (
      isNaN(numericAmount) ||
      numericAmount <= 0 ||
      splitParticipants.length === 0
    ) {
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
        splitParticipants:
          splitParticipants.length > 0 ? splitParticipants : undefined,
        exchangeRate: numericExchangeRate,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [
    groupId,
    user,
    paidById,
    amount,
    description,
    currency,
    exchangeRate,
    needsExchangeRate,
    createExpenseMutation,
    router,
    splitParticipants,
  ]);

  const handleSelectCurrency = useCallback((code: string) => {
    setCurrency(code);
    setShowCurrencyPicker(false);
    setCurrencySearch("");
  }, []);

  const handleSelectPayer = useCallback((memberId: string) => {
    setPaidById(memberId);
    setShowPayerPicker(false);
  }, []);

  const getPayerDisplayName = useCallback(
    (payerId: string | null) => {
      if (!payerId) return "Select payer";
      if (payerId === user?.id) return "You";
      const member = members.find((m) => m.userId === payerId);
      if (member) {
        return member.userId === user?.id
          ? "You"
          : `User ${member.userId.slice(0, 8)}...`;
      }
      return "Unknown";
    },
    [user, members],
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const isValid =
    amount.trim() !== "" &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    description.trim() !== "" &&
    (!needsExchangeRate ||
      (exchangeRate.trim() !== "" &&
        !isNaN(parseFloat(exchangeRate)) &&
        parseFloat(exchangeRate) > 0));

  const isCreating = createExpenseMutation.isPending;

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: "Add Expense",
          headerStyle: { backgroundColor: themeColors.bgElevated },
          headerTintColor: themeColors.textPrimary,
          headerLeft: () => (
            <Pressable onPress={handleCancel} className="active:opacity-70">
              <Text className="text-dutch-orange text-base">Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              disabled={!isValid || isCreating}
              className="active:opacity-70"
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={themeColors.orange} />
              ) : (
                <Text
                  className={`text-base font-semibold ${isValid ? "text-dutch-orange" : isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
                >
                  Save
                </Text>
              )}
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1">
          {createExpenseMutation.error && (
            <View
              className={`mx-4 mt-4 p-3 rounded-lg ${isDark ? "bg-dutch-red/15" : "bg-dutch-red/10"}`}
            >
              <Text className="text-dutch-red text-sm">
                {createExpenseMutation.error.message ||
                  "Failed to create expense"}
              </Text>
            </View>
          )}

          {/* Amount Input with Currency Selector */}
          <View className="flex-row items-center justify-center py-10 px-4">
            <Pressable
              className={`items-center mr-2 p-2 rounded-lg active:opacity-70 ${isDark ? "bg-dark-card" : "bg-light-border"}`}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text
                className={`text-3xl ${isDark ? "text-white" : "text-black"}`}
              >
                {currentCurrency.symbol}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
              >
                {currentCurrency.code}
              </Text>
            </Pressable>
            <TextInput
              className="text-6xl font-extralight min-w-[100px] text-center"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Description Input */}
          <View
            className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Description
            </Text>
            <TextInput
              className="text-base py-2"
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
            />
          </View>

          {/* Exchange Rate Input - shown when currency differs from group default */}
          {needsExchangeRate && (
            <View
              className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                >
                  Exchange Rate (1 {currentCurrency.code} = ?{" "}
                  {groupCurrency.code})
                </Text>
                {isFetchingRate && (
                  <ActivityIndicator size="small" color={themeColors.orange} />
                )}
              </View>
              <View className="flex-row items-center mt-2">
                <TextInput
                  className="flex-1 text-base py-2"
                  value={exchangeRate}
                  onChangeText={(text) => {
                    setExchangeRate(text);
                    setRateAutoFetched(false);
                  }}
                  placeholder={
                    isFetchingRate ? "Fetching rate..." : "Enter exchange rate"
                  }
                  keyboardType="decimal-pad"
                  editable={!isFetchingRate}
                />
                {rateAutoFetched && (
                  <View className="bg-dutch-green px-2 py-1 rounded ml-2">
                    <Text className="text-white text-xs font-semibold">
                      Auto
                    </Text>
                  </View>
                )}
              </View>
              {parseFloat(amount) > 0 && parseFloat(exchangeRate) > 0 && (
                <View
                  className={`mt-2 py-2 px-3 rounded-lg ${isDark ? "bg-dutch-orange/15" : "bg-dutch-orange/10"}`}
                >
                  <Text className="text-dutch-orange text-sm font-medium">
                    {currentCurrency.symbol}
                    {parseFloat(amount).toFixed(2)} {currentCurrency.code} ={" "}
                    {groupCurrency.symbol}
                    {(parseFloat(amount) * parseFloat(exchangeRate)).toFixed(
                      2,
                    )}{" "}
                    {groupCurrency.code}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Paid By Selector */}
          <View
            className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Paid by
            </Text>
            <Pressable
              className="flex-row items-center justify-between py-2 active:opacity-70"
              onPress={() => setShowPayerPicker(true)}
            >
              <Text
                className={`text-base ${isDark ? "text-white" : "text-black"}`}
              >
                {getPayerDisplayName(paidById)}
              </Text>
              <Text
                className={`text-xl ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
              >
                ›
              </Text>
            </Pressable>
          </View>

          {/* Split Participants Selector */}
          <View
            className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Split equally among
            </Text>
            <Pressable
              className="flex-row items-center justify-between py-2 active:opacity-70"
              onPress={() => setShowSplitPicker(true)}
            >
              <Text
                className={`text-base ${isDark ? "text-white" : "text-black"}`}
              >
                {splitParticipants.length === members.length
                  ? "All members"
                  : `${splitParticipants.length} ${splitParticipants.length === 1 ? "person" : "people"}`}
              </Text>
              <Text
                className={`text-xl ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
              >
                ›
              </Text>
            </Pressable>
            {parseFloat(amount) > 0 && splitParticipants.length > 0 && (
              <View
                className={`mt-2 py-2 px-3 rounded-lg ${isDark ? "bg-dark-card" : "bg-light-border"}`}
              >
                <Text
                  className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                >
                  {currentCurrency.symbol}
                  {getPerPersonAmount().toFixed(2)} per person
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Expense Button */}
        <View
          className={`p-4 border-t ${isDark ? "border-dark-border bg-dark-bg" : "border-light-border bg-light-bg"}`}
        >
          <Pressable
            className={`py-4 rounded-xl items-center active:opacity-90 ${
              isValid && !isCreating
                ? "bg-dutch-orange"
                : isDark
                  ? "bg-dark-card"
                  : "bg-light-border"
            }`}
            onPress={handleSave}
            disabled={!isValid || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className={`text-lg font-semibold ${isValid ? "text-white" : isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
              >
                Add Expense
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Payer Picker Modal */}
      <Modal
        visible={showPayerPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPayerPicker(false)}
      >
        <SafeAreaView
          className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
        >
          <View
            className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}
            >
              Who paid?
            </Text>
            <Pressable
              onPress={() => setShowPayerPicker(false)}
              className="active:opacity-70"
            >
              <Text className="text-dutch-orange text-base font-semibold">
                Done
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row items-center p-4 border-b active:opacity-70 ${isDark ? "border-dark-border" : "border-light-border"}`}
                onPress={() => handleSelectPayer(item.userId)}
              >
                <View className="w-10 h-10 rounded-full bg-dutch-orange justify-center items-center mr-3">
                  <Text className="text-white text-sm font-semibold">
                    {item.userId.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text
                  className={`flex-1 text-base ${isDark ? "text-white" : "text-black"}`}
                >
                  {item.userId === user?.id
                    ? "You"
                    : `User ${item.userId.slice(0, 8)}...`}
                </Text>
                {paidById === item.userId && (
                  <Text className="text-lg text-dutch-orange font-semibold">
                    ✓
                  </Text>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text
                  className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                >
                  No members found
                </Text>
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
        <SafeAreaView
          className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
        >
          <View
            className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}
            >
              Split with
            </Text>
            <Pressable
              onPress={() => setShowSplitPicker(false)}
              className="active:opacity-70"
            >
              <Text className="text-dutch-orange text-base font-semibold">
                Done
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => {
              const isParticipant = splitParticipants.includes(item.userId);
              return (
                <Pressable
                  className={`flex-row items-center p-4 border-b active:opacity-70 ${isDark ? "border-dark-border" : "border-light-border"}`}
                  onPress={() => toggleParticipant(item.userId)}
                >
                  <View
                    className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
                      isParticipant
                        ? "bg-dutch-orange"
                        : isDark
                          ? "bg-dark-card"
                          : "bg-light-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isParticipant
                          ? "text-white"
                          : isDark
                            ? "text-dark-text-tertiary"
                            : "text-light-text-tertiary"
                      }`}
                    >
                      {item.userId.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-base ${
                      isParticipant
                        ? isDark
                          ? "text-white"
                          : "text-black"
                        : isDark
                          ? "text-dark-text-tertiary"
                          : "text-light-text-tertiary"
                    }`}
                  >
                    {item.userId === user?.id
                      ? "You"
                      : `User ${item.userId.slice(0, 8)}...`}
                  </Text>
                  {isParticipant && (
                    <Text className="text-lg text-dutch-orange font-semibold">
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text
                  className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                >
                  No members found
                </Text>
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
          setCurrencySearch("");
        }}
      >
        <SafeAreaView
          className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
        >
          <View
            className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Text
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}
            >
              Select Currency
            </Text>
            <Pressable
              onPress={() => {
                setShowCurrencyPicker(false);
                setCurrencySearch("");
              }}
              className="active:opacity-70"
            >
              <Text className="text-dutch-orange text-base font-semibold">
                Done
              </Text>
            </Pressable>
          </View>
          <View
            className={`px-4 py-3 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <SearchInput
              placeholder="Search currencies..."
              value={currencySearch}
              onChangeText={setCurrencySearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row items-center justify-between p-4 border-b active:opacity-70 ${
                  isDark ? "border-dark-border" : "border-light-border"
                } ${currency === item.code ? (isDark ? "bg-dutch-orange/10" : "bg-dutch-orange/5") : ""}`}
                onPress={() => handleSelectCurrency(item.code)}
              >
                <View className="flex-row items-center">
                  <Text
                    className={`text-2xl w-10 text-center mr-3 ${isDark ? "text-white" : "text-black"}`}
                  >
                    {item.symbol}
                  </Text>
                  <View>
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}
                    >
                      {item.code}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                    >
                      {item.name}
                    </Text>
                  </View>
                </View>
                {currency === item.code && (
                  <Text className="text-lg text-dutch-orange font-semibold">
                    ✓
                  </Text>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text
                  className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                >
                  No currencies found
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
