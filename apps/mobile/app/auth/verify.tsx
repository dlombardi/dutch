import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function VerifyMagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { verifyMagicLink, isLoading, error } = useAuthStore();
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token || verificationAttempted) return;

      setVerificationAttempted(true);
      const success = await verifyMagicLink(token);

      if (success) {
        // Navigate to the main app after successful verification
        router.replace('/(tabs)');
      }
    }

    verify();
  }, [token, verificationAttempted, verifyMagicLink]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Verifying your magic link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Verification Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text
            style={styles.linkText}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            Request a new magic link
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorIcon}>?</Text>
          <Text style={styles.errorTitle}>Invalid Link</Text>
          <Text style={styles.errorText}>
            This magic link appears to be invalid or incomplete.
          </Text>
          <Text
            style={styles.linkText}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            Go to sign in
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Completing sign in...</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 16,
    width: 80,
    height: 80,
    lineHeight: 80,
    textAlign: 'center',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ff3b30',
    overflow: 'hidden',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
