import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGroupsStore } from '../stores/groupsStore';
import { useAuthStore } from '../stores/authStore';

const POPULAR_EMOJIS = ['🏖️', '✈️', '🏠', '🍕', '🎉', '🚗', '⚽', '🎬', '🛒', '💼'];

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👥');
  const { createGroup, isLoading, error, clearError } = useGroupsStore();
  const { user } = useAuthStore();

  const isValidName = (value: string) => {
    return value.trim().length >= 1;
  };

  const handleCreateGroup = async () => {
    if (!isValidName(name) || !user) {
      return;
    }

    const group = await createGroup(name.trim(), user.id, selectedEmoji);
    if (group) {
      router.replace(`/group/${group.id}`);
    }
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
            disabled={!isValidName(name) || isLoading}
          >
            {isLoading ? (
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
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="e.g., Trip to Paris"
              placeholderTextColor="#999"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) clearError();
              }}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
              autoFocus
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
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
});
