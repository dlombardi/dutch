import { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../stores/authStore';
import { type Currency, getDefaultCurrency, searchCurrencies } from '@evn/shared';
import { VALIDATION } from '@evn/shared';
import { colors } from '../constants/theme';

// React Query hooks
import { useCreateGroup } from '../hooks/mutations';

const POPULAR_EMOJIS = ['🏖️', '✈️', '🏠', '🍕', '🎉', '🚗', '⚽', '🎬', '🛒', '💼'];

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👥');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(getDefaultCurrency());
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  // React Query mutation
  const createGroupMutation = useCreateGroup();

  // Derived state
  const isCreating = createGroupMutation.isPending;
  const createError = createGroupMutation.error?.message ?? null;

  const filteredCurrencies = useMemo(() => {
    return searchCurrencies(currencySearch);
  }, [currencySearch]);

  const isValidName = (value: string) => {
    return value.trim().length >= VALIDATION.MIN_GROUP_NAME_LENGTH;
  };

  const handleCreateGroup = () => {
    if (!isValidName(name) || !user) {
      return;
    }

    createGroupMutation.mutate(
      {
        name: name.trim(),
        createdById: user.id,
        emoji: selectedEmoji,
        defaultCurrency: selectedCurrency.code,
      },
      {
        onSuccess: (group) => {
          router.replace(`/group/${group.id}`);
        },
      }
    );
  };

  const handleSelectCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
    setCurrencyModalVisible(false);
    setCurrencySearch('');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className={`flex-row justify-between items-center p-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-dutch-orange text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            New Group
          </Text>
          <TouchableOpacity
            onPress={handleCreateGroup}
            disabled={!isValidName(name) || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  isValidName(name) ? 'text-dutch-orange' : isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'
                }`}
              >
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Emoji Section */}
          <View className="items-center mb-6">
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-dark-card' : 'bg-light-border'}`}>
              <Text className="text-5xl">{selectedEmoji}</Text>
            </View>
            <Text className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              Tap to select emoji
            </Text>
          </View>

          {/* Emoji Picker */}
          <View className="flex-row flex-wrap justify-center mb-8">
            {POPULAR_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                className={`w-12 h-12 justify-center items-center rounded-lg m-1 ${
                  selectedEmoji === emoji
                    ? 'bg-dutch-orange/20'
                    : ''
                }`}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text className="text-3xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Group Name Input */}
          <View className="mb-6">
            <Text className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              Group Name
            </Text>
            <TextInput
              className={`border rounded-2xl p-4 text-base ${
                isDark
                  ? 'bg-dark-card border-dark-border text-white'
                  : 'bg-light-card border-light-border text-black'
              } ${createError ? 'border-dutch-red' : ''}`}
              placeholder="e.g., Trip to Paris"
              placeholderTextColor={themeColors.textTertiary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (createError) createGroupMutation.reset();
              }}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isCreating}
              autoFocus
            />
            {createError && (
              <Text className="text-dutch-red text-sm mt-2">{createError}</Text>
            )}
          </View>

          {/* Currency Selector */}
          <View className="mb-6">
            <Text className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              Default Currency
            </Text>
            <TouchableOpacity
              className={`flex-row items-center justify-between border rounded-2xl p-4 ${
                isDark ? 'bg-dark-card border-dark-border' : 'bg-light-card border-light-border'
              }`}
              onPress={() => setCurrencyModalVisible(true)}
              disabled={isCreating}
            >
              <View className="flex-row items-center gap-3">
                <Text className={`text-2xl font-semibold w-10 text-center ${isDark ? 'text-white' : 'text-black'}`}>
                  {selectedCurrency.symbol}
                </Text>
                <View>
                  <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    {selectedCurrency.code}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                    {selectedCurrency.name}
                  </Text>
                </View>
              </View>
              <Text className={`text-2xl ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>›</Text>
            </TouchableOpacity>
            <Text className={`text-xs mt-2 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
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
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center p-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
              <Text className="text-dutch-orange text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              Select Currency
            </Text>
            <View className="w-12" />
          </View>

          {/* Search */}
          <View className={`p-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <TextInput
              className={`rounded-xl p-3 text-base ${
                isDark ? 'bg-dark-card text-white' : 'bg-light-border text-black'
              }`}
              placeholder="Search currencies..."
              placeholderTextColor={themeColors.textTertiary}
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
              <TouchableOpacity
                className={`flex-row items-center p-4 border-b ${
                  isDark ? 'border-dark-border' : 'border-light-border'
                } ${selectedCurrency.code === item.code ? (isDark ? 'bg-dutch-orange/10' : 'bg-dutch-orange/5') : ''}`}
                onPress={() => handleSelectCurrency(item)}
              >
                <Text className={`text-xl font-semibold w-12 text-center ${isDark ? 'text-white' : 'text-black'}`}>
                  {item.symbol}
                </Text>
                <View className="flex-1 ml-2">
                  <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    {item.code}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                    {item.name}
                  </Text>
                </View>
                {selectedCurrency.code === item.code && (
                  <Text className="text-xl text-dutch-orange font-semibold">✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Text className={`text-base ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
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
