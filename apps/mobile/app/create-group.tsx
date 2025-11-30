import { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { type Currency, getDefaultCurrency, searchCurrencies } from '@evn/shared';
import { VALIDATION } from '@evn/shared';

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Group</Text>
          <TouchableOpacity
            onPress={handleCreateGroup}
            disabled={!isValidName(name) || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text
                style={[
                  styles.createText,
                  !isValidName(name) && styles.createTextDisabled,
                ]}
              >
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.emojiSection}>
            <TouchableOpacity style={styles.emojiPreview}>
              <Text style={styles.emojiPreviewText}>{selectedEmoji}</Text>
            </TouchableOpacity>
            <Text style={styles.emojiHint}>Tap to select emoji</Text>
          </View>

          <View style={styles.emojiPicker}>
            {POPULAR_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  selectedEmoji === emoji && styles.emojiOptionSelected,
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiOptionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={[styles.input, createError ? styles.inputError : null]}
              placeholder="e.g., Trip to Paris"
              placeholderTextColor="#999"
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
            {createError && <Text style={styles.errorText}>{createError}</Text>}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Default Currency</Text>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={() => setCurrencyModalVisible(true)}
              disabled={isCreating}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
                <View>
                  <Text style={styles.currencyCode}>{selectedCurrency.code}</Text>
                  <Text style={styles.currencyName}>{selectedCurrency.name}</Text>
                </View>
              </View>
              <Text style={styles.currencyChevron}>›</Text>
            </TouchableOpacity>
            <Text style={styles.currencyHint}>
              New expenses will default to this currency
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search currencies..."
              placeholderTextColor="#999"
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
              <TouchableOpacity
                style={[
                  styles.currencyItem,
                  selectedCurrency.code === item.code && styles.currencyItemSelected,
                ]}
                onPress={() => handleSelectCurrency(item)}
              >
                <Text style={styles.currencyItemSymbol}>{item.symbol}</Text>
                <View style={styles.currencyItemInfo}>
                  <Text style={styles.currencyItemCode}>{item.code}</Text>
                  <Text style={styles.currencyItemName}>{item.name}</Text>
                </View>
                {selectedCurrency.code === item.code && (
                  <Text style={styles.currencyItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No currencies found</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createTextDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  emojiSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emojiPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emojiPreviewText: {
    fontSize: 48,
  },
  emojiHint: {
    color: '#666',
    fontSize: 14,
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emojiOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 4,
  },
  emojiOptionSelected: {
    backgroundColor: '#e0e0e0',
  },
  emojiOptionText: {
    fontSize: 28,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 8,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 14,
    color: '#666',
  },
  currencyChevron: {
    fontSize: 24,
    color: '#999',
  },
  currencyHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalHeaderSpacer: {
    width: 50,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currencyItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  currencyItemSymbol: {
    fontSize: 20,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  currencyItemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  currencyItemCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyItemName: {
    fontSize: 14,
    color: '#666',
  },
  currencyItemCheck: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptySearch: {
    padding: 32,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 16,
    color: '#666',
  },
});
