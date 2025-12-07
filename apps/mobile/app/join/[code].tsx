import { useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/modules/auth';
import { LoadingSpinner } from '@/components/ui';
import { View, Text, Pressable } from '@/components/ui/primitives';

// React Query hooks
import { useGroupByInviteCode, useJoinGroup } from '@/modules/groups';

export default function JoinGroupScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // React Query hooks - automatic caching and fetching
  const {
    data: previewGroup,
    isLoading: isFetchingGroup,
    error: fetchError,
  } = useGroupByInviteCode(code);

  // Join mutation
  const joinGroupMutation = useJoinGroup();

  const handleJoin = useCallback(() => {
    if (!code || !user) return;

    joinGroupMutation.mutate(
      { inviteCode: code, userId: user.id },
      {
        onSuccess: (group) => {
          router.replace(`/group/${group.id}`);
        },
      }
    );
  }, [code, user, joinGroupMutation, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Derived state
  const isJoining = joinGroupMutation.isPending;
  const joinError = joinGroupMutation.error?.message ?? null;
  const displayError = fetchError?.message ?? joinError;

  if (isFetchingGroup && !previewGroup) {
    return <LoadingSpinner fullScreen message="Loading group info..." />;
  }

  if (displayError) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
        <Text className="text-6xl mb-4">❌</Text>
        <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Invalid Invite
        </Text>
        <Text className={`text-base text-center mb-8 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          {displayError}
        </Text>
        <Pressable
          className={`rounded-xl p-4 items-center justify-center w-full ${isDark ? 'bg-dark-card' : 'bg-light-border'} active:opacity-70`}
          onPress={handleCancel}
        >
          <Text className={`text-lg font-semibold ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!previewGroup) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
        <Text className={`text-base ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          No group found
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
      <Text className="text-6xl mb-4">{previewGroup.emoji}</Text>
      <Text className={`text-3xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-black'}`}>
        {previewGroup.name}
      </Text>
      <Text className={`text-base text-center mb-8 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
        You've been invited to join this group
      </Text>

      <View className={`rounded-xl p-4 w-full mb-8 ${isDark ? 'bg-dark-card' : 'bg-light-border'}`}>
        <Text className={`text-sm mb-1 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          Default Currency
        </Text>
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {previewGroup.defaultCurrency}
        </Text>
      </View>

      <View className="w-full gap-3">
        <Pressable
          className="rounded-xl p-4 items-center justify-center bg-dutch-orange active:opacity-90"
          onPress={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-semibold text-white">
              Join Group
            </Text>
          )}
        </Pressable>

        <Pressable
          className={`rounded-xl p-4 items-center justify-center ${isDark ? 'bg-dark-card' : 'bg-light-border'} active:opacity-70`}
          onPress={handleCancel}
          disabled={isJoining}
        >
          <Text className={`text-lg font-semibold ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
