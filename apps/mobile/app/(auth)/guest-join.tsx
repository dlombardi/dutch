import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function GuestJoinScreen() {
  const [name, setName] = useState('');
  const { loginAsGuest, isLoading, error, clearError } = useAuthStore();

  const isValidName = (value: string) => {
    return value.trim().length >= 1;
  };

  const handleJoinAsGuest = async () => {
    if (!isValidName(name)) {
      return;
    }

    await loginAsGuest(name.trim());
    // The auth state change will trigger navigation via _layout.tsx
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>evn</Text>
            <Text style={styles.tagline}>Join as a guest</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>
              This is how others will see you in the group
            </Text>

            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter your name"
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

            <TouchableOpacity
              style={[
                styles.button,
                (!isValidName(name) || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleJoinAsGuest}
              disabled={!isValidName(name) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Join Group</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Your identity is tied to this device. You can claim your account
            later to sync across devices.
          </Text>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
  },
});
