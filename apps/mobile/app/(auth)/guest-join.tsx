import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/modules/auth';
import { View, Text, FormInput } from '@/components/ui/primitives';
import { GhostButton, PrimaryButton } from '@/components/ui';
import { gradients } from '@/constants/theme';

export default function GuestJoinScreen() {
  const [name, setName] = useState('');
  const { loginAsGuest, isLoading, error, clearError } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
      {/* Ambient gradient */}
      <LinearGradient
        colors={gradients.orangeAmbient.colors}
        locations={gradients.orangeAmbient.locations}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-between">
          {/* Back Button */}
          <GhostButton
            onPress={() => router.back()}
            className="self-start -ml-2 mt-2"
            size="sm"
          >
            Back
          </GhostButton>

          {/* Header */}
          <View className="items-center mt-5">
            <Text className="text-5xl font-bold text-dutch-orange">dutch</Text>
            <Text className={`text-base mt-2 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              Join as a guest
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1 justify-center">
            <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              What's your name?
            </Text>
            <Text className={`text-base mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              This is how others will see you in the group
            </Text>

            <FormInput
              className="mb-2"
              hasError={!!error}
              placeholder="Enter your name"
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

            {error && (
              <Text className="text-dutch-red text-sm mb-4">{error}</Text>
            )}

            <PrimaryButton
              onPress={handleJoinAsGuest}
              disabled={!isValidName(name) || isLoading}
              isLoading={isLoading}
              className="mt-2"
            >
              Join Group
            </PrimaryButton>
          </View>

          {/* Footer */}
          <Text className={`text-center text-xs leading-5 pb-4 ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>
            Your identity is tied to this device. You can claim your account
            later to sync across devices.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
