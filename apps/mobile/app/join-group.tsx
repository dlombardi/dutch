import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useGroupsStore } from '../stores/groupsStore';
import { useAuthStore } from '../stores/authStore';

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const { fetchGroupByInviteCode, joinGroup, previewGroup, loadingStates, errors, clearError } =
    useGroupsStore();
  const user = useAuthStore((state) => state.user);

  const isLoading = loadingStates.fetchByInviteCode || loadingStates.joinGroup;
  const error = errors.fetchByInviteCode || errors.joinGroup;

  const handleLookup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    clearError('fetchByInviteCode');
    clearError('joinGroup');

    const code = inviteCode.trim().toUpperCase();
    const group = await fetchGroupByInviteCode(code);

    if (!group) {
      // Error is set in the store
      return;
    }
  };

  const handleJoin = async () => {
    if (!previewGroup || !user) return;

    clearError('joinGroup');

    const group = await joinGroup(previewGroup.inviteCode, user.id);

    if (group) {
      Alert.alert('Success', `You've joined ${group.name}!`, [
        {
          text: 'OK',
          onPress: () => router.replace(`/group/${group.id}`),
        },
      ]);
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric characters, max 6 characters
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    setInviteCode(cleaned);

    // Clear preview when code changes
    if (previewGroup) {
      useGroupsStore.setState({ previewGroup: null });
    }
    clearError('fetchByInviteCode');
    clearError('joinGroup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Join Group',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Enter Invite Code</Text>
        <Text style={styles.subtitle}>
          Ask a group member for the 6-character invite code
        </Text>

        <TextInput
          style={styles.codeInput}
          value={inviteCode}
          onChangeText={handleCodeChange}
          placeholder="ABC123"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          keyboardType="default"
          returnKeyType="search"
          onSubmitEditing={handleLookup}
          testID="invite-code-input"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!previewGroup && (
          <TouchableOpacity
            style={[
              styles.lookupButton,
              (inviteCode.length < 6 || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleLookup}
            disabled={inviteCode.length < 6 || isLoading}
            testID="lookup-button"
          >
            {loadingStates.fetchByInviteCode ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.lookupButtonText}>Look Up Group</Text>
            )}
          </TouchableOpacity>
        )}

        {previewGroup && (
          <View style={styles.previewCard}>
            <Text style={styles.previewEmoji}>{previewGroup.emoji}</Text>
            <Text style={styles.previewName}>{previewGroup.name}</Text>
            <Text style={styles.previewCurrency}>
              Currency: {previewGroup.defaultCurrency}
            </Text>

            <TouchableOpacity
              style={[styles.joinButton, loadingStates.joinGroup && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={loadingStates.joinGroup}
              testID="join-button"
            >
              {loadingStates.joinGroup ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.joinButtonText}>Join Group</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                useGroupsStore.setState({ previewGroup: null });
                setInviteCode('');
              }}
            >
              <Text style={styles.cancelButtonText}>Try Different Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  codeInput: {
    width: '100%',
    maxWidth: 200,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  lookupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  lookupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  previewEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  previewName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewCurrency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  joinButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
