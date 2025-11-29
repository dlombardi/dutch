import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function MagicLinkSentScreen() {
  const { magicLinkEmail, resetMagicLinkState, requestMagicLink, isLoading } =
    useAuthStore();

  const handleResend = async () => {
    if (magicLinkEmail) {
      await requestMagicLink(magicLinkEmail);
    }
  };

  const handleBack = () => {
    resetMagicLinkState();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉️</Text>
        </View>

        <Text style={styles.title}>Check your email</Text>

        <Text style={styles.subtitle}>
          We sent a magic link to{'\n'}
          <Text style={styles.email}>{magicLinkEmail}</Text>
        </Text>

        <Text style={styles.instructions}>
          Click the link in the email to sign in. The link will expire in 15
          minutes.
        </Text>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={isLoading}
        >
          <Text style={styles.resendButtonText}>
            {isLoading ? 'Sending...' : "Didn't receive it? Send again"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Use different email</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  email: {
    fontWeight: '600',
    color: '#007AFF',
  },
  instructions: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  resendButton: {
    padding: 16,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
