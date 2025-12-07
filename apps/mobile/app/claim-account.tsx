import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/modules/auth';
import { View, Text, FormInput } from '@/components/ui/primitives';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { gradients } from '@/constants/theme';

export default function ClaimAccountScreen() {
  const [email, setEmail] = useState('');
  const {
    claimAccount,
    isLoading,
    error,
    clearError,
    claimEmailSent,
    claimEmail,
    resetClaimState,
    user,
  } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Reset claim state when the screen mounts
  useEffect(() => {
    resetClaimState();
  }, [resetClaimState]);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleClaimAccount = async () => {
    if (!isValidEmail(email)) {
      return;
    }

    await claimAccount(email);
  };

  // Show success state when email is sent
  if (claimEmailSent && claimEmail) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}
      >
        <Stack.Screen
          options={{
            title: 'Verify Email',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
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

        <View className="flex-1 px-6 justify-center items-center">
          <Text className="text-6xl mb-6">📧</Text>
          <Text
            className={`text-2xl font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-black'}`}
          >
            Check your email
          </Text>
          <Text
            className={`text-base text-center mb-2 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}
          >
            We've sent a verification link to
          </Text>
          <Text className="text-base font-semibold text-dutch-orange mb-8">
            {claimEmail}
          </Text>
          <Text
            className={`text-sm text-center ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}
          >
            Click the link in the email to complete claiming your account. Your
            existing data will be preserved.
          </Text>

          <View className="w-full mt-8">
            <SecondaryButton
              onPress={() => {
                resetClaimState();
                router.back();
              }}
            >
              Done
            </SecondaryButton>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
      <Stack.Screen
        options={{
          title: 'Claim Account',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
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
        <View className="flex-1 px-6 justify-center">
          <Text
            className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}
          >
            Add your email
          </Text>
          <Text
            className={`text-base mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}
          >
            Claim your account to access it on any device and keep your data
            safe
          </Text>

          <View
            className={`rounded-2xl p-4 mb-6 ${isDark ? 'bg-dark-card' : 'bg-light-card'}`}
          >
            <Text
              className={`text-sm mb-1 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}
            >
              Current account
            </Text>
            <Text
              className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}
            >
              {user?.name || 'Guest'}
            </Text>
            <Text
              className={`text-sm ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}
            >
              Guest account • All your data will be preserved
            </Text>
          </View>

          <FormInput
            className="mb-2"
            hasError={!!error}
            placeholder="your@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isLoading}
            testID="claim-email-input"
          />

          {error && (
            <Text className="text-dutch-red text-sm mb-4" testID="claim-error">
              {error}
            </Text>
          )}

          <PrimaryButton
            onPress={handleClaimAccount}
            disabled={!isValidEmail(email) || isLoading}
            isLoading={isLoading}
            className="mt-2"
            testID="claim-submit-button"
          >
            Send Verification Email
          </PrimaryButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
