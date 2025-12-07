import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/modules/auth';
import { useGroupByInviteCode, useJoinGroup } from '@/modules/groups';
import { View, Text, Pressable } from '@/components/ui/primitives';
import { colors } from '@/constants/theme';

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const user = useAuthStore((state) => state.user);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  // React Query hooks
  const {
    data: previewGroup,
    isLoading: isLoadingPreview,
    error: previewError,
  } = useGroupByInviteCode(searchCode || undefined);

  const joinGroupMutation = useJoinGroup();

  const isLoading = isLoadingPreview || joinGroupMutation.isPending;
  const error = previewError?.message || (joinGroupMutation.error?.message);

  const handleLookup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    const code = inviteCode.trim().toUpperCase();
    setSearchCode(code);
  };

  const handleJoin = async () => {
    if (!previewGroup || !user) return;

    joinGroupMutation.mutate(
      {
        inviteCode: previewGroup.inviteCode,
        userId: user.id,
      },
      {
        onSuccess: (group) => {
          Alert.alert('Success', `You've joined ${group.name}!`, [
            {
              text: 'OK',
              onPress: () => router.replace(`/group/${group.id}`),
            },
          ]);
        },
        onError: (err) => {
          Alert.alert('Error', err.message || 'Failed to join group');
        },
      }
    );
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric characters, max 6 characters
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    setInviteCode(cleaned);

    // Clear preview when code changes
    if (searchCode) {
      setSearchCode('');
    }
  };

  const handleReset = () => {
    setSearchCode('');
    setInviteCode('');
  };

  const isButtonDisabled = inviteCode.length < 6 || isLoading;

  return (
    <KeyboardAvoidingView
      className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Join Group',
          headerBackTitle: 'Back',
        }}
      />

      <View className="flex-1 p-6 items-center">
        <Text className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-black'}`}>
          Enter Invite Code
        </Text>
        <Text className={`text-base text-center mb-8 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          Ask a group member for the 6-character invite code
        </Text>

        <RNTextInput
          className={`w-full max-w-[200px] text-center rounded-xl mb-4 ${isDark ? 'bg-dark-card border-dutch-orange' : 'bg-light-card border-dutch-orange'}`}
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            letterSpacing: 8,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderWidth: 2,
            color: isDark ? themeColors.textPrimary : '#000000',
          }}
          value={inviteCode}
          onChangeText={handleCodeChange}
          placeholder="ABC123"
          placeholderTextColor={themeColors.textTertiary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          keyboardType="default"
          returnKeyType="search"
          onSubmitEditing={handleLookup}
          testID="invite-code-input"
        />

        {error && (
          <Text className="text-dutch-red text-sm mb-4 text-center">{error}</Text>
        )}

        {!previewGroup && (
          <Pressable
            className={`py-3.5 px-8 rounded-lg min-w-[160px] items-center ${isButtonDisabled ? (isDark ? 'bg-dark-border' : 'bg-light-border') : 'bg-dutch-orange'} active:opacity-90`}
            onPress={handleLookup}
            disabled={isButtonDisabled}
            testID="lookup-button"
          >
            {isLoadingPreview ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className={`text-base font-semibold ${isButtonDisabled ? (isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary') : 'text-white'}`}>
                Look Up Group
              </Text>
            )}
          </Pressable>
        )}

        {previewGroup && (
          <View className={`w-full rounded-xl p-6 items-center mt-4 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}>
            <Text className="text-5xl mb-3">{previewGroup.emoji}</Text>
            <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
              {previewGroup.name}
            </Text>
            <Text className={`text-sm mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              Currency: {previewGroup.defaultCurrency}
            </Text>

            <Pressable
              className={`py-3.5 px-12 rounded-lg min-w-[160px] items-center mb-3 ${joinGroupMutation.isPending ? (isDark ? 'bg-dark-border' : 'bg-light-border') : 'bg-dutch-green'} active:opacity-90`}
              onPress={handleJoin}
              disabled={joinGroupMutation.isPending}
              testID="join-button"
            >
              {joinGroupMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-base font-semibold text-white">Join Group</Text>
              )}
            </Pressable>

            <Pressable className="py-2 active:opacity-70" onPress={handleReset}>
              <Text className="text-dutch-orange text-sm">Try Different Code</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
