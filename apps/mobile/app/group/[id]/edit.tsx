import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  type Currency,
  getCurrency,
  searchCurrencies,
} from "@evn/shared";
import { VALIDATION } from "@evn/shared";
import {
  View,
  Text,
  Pressable,
  FormInput,
  SearchInput,
} from "@/components/ui/primitives";
import { useGroup, useUpdateGroup } from "@/modules/groups";

const POPULAR_EMOJIS = [
  "👥",
  "🏖️",
  "✈️",
  "🏠",
  "🍕",
  "🎉",
  "🚗",
  "⚽",
  "🎬",
  "🛒",
  "💼",
];

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Fetch existing group data
  const { data: group, isLoading: isLoadingGroup } = useGroup(id);

  // Form state
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("👥");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // React Query mutation
  const updateGroupMutation = useUpdateGroup();

  // Derived state
  const isUpdating = updateGroupMutation.isPending;
  const updateError = updateGroupMutation.error?.message ?? null;

  // Initialize form with existing data
  useEffect(() => {
    if (group) {
      setName(group.name);
      setSelectedEmoji(group.emoji);
      const currency = getCurrency(group.defaultCurrency);
      if (currency) {
        setSelectedCurrency(currency);
      }
    }
  }, [group]);

  // Track changes
  useEffect(() => {
    if (group && selectedCurrency) {
      const nameChanged = name.trim() !== group.name;
      const emojiChanged = selectedEmoji !== group.emoji;
      const currencyChanged = selectedCurrency.code !== group.defaultCurrency;
      setHasChanges(nameChanged || emojiChanged || currencyChanged);
    }
  }, [name, selectedEmoji, selectedCurrency, group]);

  const filteredCurrencies = useMemo(() => {
    return searchCurrencies(currencySearch);
  }, [currencySearch]);

  const isValidName = (value: string) => {
    return value.trim().length >= VALIDATION.MIN_GROUP_NAME_LENGTH;
  };

  const handleUpdateGroup = () => {
    if (!isValidName(name) || !id || !selectedCurrency) {
      return;
    }

    const updates: { name?: string; emoji?: string; defaultCurrency?: string } = {};

    if (name.trim() !== group?.name) {
      updates.name = name.trim();
    }
    if (selectedEmoji !== group?.emoji) {
      updates.emoji = selectedEmoji;
    }
    if (selectedCurrency.code !== group?.defaultCurrency) {
      updates.defaultCurrency = selectedCurrency.code;
    }

    if (Object.keys(updates).length === 0) {
      router.back();
      return;
    }

    updateGroupMutation.mutate(
      { groupId: id, updates },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  };

  const handleSelectCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
    setCurrencyModalVisible(false);
    setCurrencySearch("");
  };

  if (isLoadingGroup || !selectedCurrency) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className={`flex-row justify-between items-center p-4 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
        >
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-70"
          >
            <Text className="text-dutch-orange text-base">Cancel</Text>
          </Pressable>
          <Text
            className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}
          >
            Edit Group
          </Text>
          <Pressable
            onPress={handleUpdateGroup}
            disabled={!isValidName(name) || isUpdating || !hasChanges}
            className="active:opacity-70"
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  isValidName(name) && hasChanges
                    ? "text-dutch-orange"
                    : isDark
                      ? "text-dark-text-tertiary"
                      : "text-light-text-tertiary"
                }`}
              >
                Save
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Emoji Section */}
          <View className="items-center mb-6">
            <View
              className={`w-24 h-24 rounded-full items-center justify-center mb-2 ${isDark ? "bg-dark-card" : "bg-light-border"}`}
            >
              <Text className="text-5xl">{selectedEmoji}</Text>
            </View>
            <Text
              className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              Tap to select emoji
            </Text>
          </View>

          {/* Emoji Picker */}
          <View className="flex-row flex-wrap justify-center mb-8">
            {POPULAR_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                className={`w-12 h-12 justify-center items-center rounded-lg m-1 active:scale-95 ${
                  selectedEmoji === emoji ? "bg-dutch-orange/20" : ""
                }`}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text className="text-3xl">{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Group Name Input */}
          <View className="mb-6">
            <Text
              className={`text-base font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}
            >
              Group Name
            </Text>
            <FormInput
              hasError={!!updateError}
              placeholder="e.g., Trip to Paris"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (updateError) updateGroupMutation.reset();
              }}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isUpdating}
            />
            {updateError && (
              <Text className="text-dutch-red text-sm mt-2">{updateError}</Text>
            )}
          </View>

          {/* Currency Selector */}
          <View className="mb-6">
            <Text
              className={`text-base font-semibold mb-2 ${isDark ? "text-white" : "text-black"}`}
            >
              Default Currency
            </Text>
            <Pressable
              className={`flex-row items-center justify-between border rounded-2xl p-4 active:opacity-70 ${
                isDark
                  ? "bg-dark-card border-dark-border"
                  : "bg-light-card border-light-border"
              }`}
              onPress={() => setCurrencyModalVisible(true)}
              disabled={isUpdating}
            >
              <View className="flex-row items-center gap-3">
                <Text
                  className={`text-2xl font-semibold w-10 text-center ${isDark ? "text-white" : "text-black"}`}
                >
                  {selectedCurrency.symbol}
                </Text>
                <View>
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}
                  >
                    {selectedCurrency.code}
                  </Text>
                  <Text
                    className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
                  >
                    {selectedCurrency.name}
                  </Text>
                </View>
              </View>
              <Text
                className={`text-2xl ${isDark ? "text-dark-text-tertiary" : "text-light-text-tertiary"}`}
              >
                ›
              </Text>
            </Pressable>
            <Text
              className={`text-xs mt-2 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
            >
              New expenses will default to this currency
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency Modal */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <SafeAreaView
          className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
        >
          {/* Modal Header */}
          <View
            className={`flex-row justify-between items-center p-4 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <Pressable
              onPress={() => setCurrencyModalVisible(false)}
              className="active:opacity-70"
            >
              <Text className="text-dutch-orange text-base">Cancel</Text>
            </Pressable>
            <Text
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}
            >
              Select Currency
            </Text>
            <View className="w-12" />
          </View>

          {/* Search */}
          <View
            className={`p-4 border-b ${isDark ? "border-dark-border" : "border-light-border"}`}
          >
            <SearchInput
              placeholder="Search currencies..."
              value={currencySearch}
              onChangeText={setCurrencySearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Currency List */}
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row items-center p-4 border-b active:opacity-70 ${
                  isDark ? "border-dark-border" : "border-light-border"
                } ${selectedCurrency.code === item.code ? (isDark ? "bg-dutch-orange/10" : "bg-dutch-orange/5") : ""}`}
                onPress={() => handleSelectCurrency(item)}
              >
                <Text
                  className={`text-xl font-semibold w-12 text-center ${isDark ? "text-white" : "text-black"}`}
                >
                  {item.symbol}
                </Text>
                <View className="flex-1 ml-2">
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
                {selectedCurrency.code === item.code && (
                  <Text className="text-xl text-dutch-orange font-semibold">
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
