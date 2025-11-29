import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGroupsStore } from '../../stores/groupsStore';
import { useAuthStore } from '../../stores/authStore';

export default function JoinGroupScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  const { previewGroup, isLoading, error, fetchGroupByInviteCode, joinGroup } =
    useGroupsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (code) {
      fetchGroupByInviteCode(code);
    }
  }, [code, fetchGroupByInviteCode]);

  const handleJoin = useCallback(async () => {
    if (!code || !user) return;

    const group = await joinGroup(code, user.id);
    if (group) {
      router.replace(`/group/${group.id}`);
    }
  }, [code, user, joinGroup, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading && !previewGroup) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading group info...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>❌</Text>
        <Text style={styles.errorTitle}>Invalid Invite</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handleCancel}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!previewGroup) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>No group found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{previewGroup.emoji}</Text>
      <Text style={styles.title}>{previewGroup.name}</Text>
      <Text style={styles.subtitle}>You've been invited to join this group</Text>

      <View style={styles.details}>
        <Text style={styles.detailLabel}>Default Currency</Text>
        <Text style={styles.detailValue}>{previewGroup.defaultCurrency}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleJoin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Join Group
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  details: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
});
