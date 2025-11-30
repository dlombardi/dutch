import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../stores/authStore';
import { PrimaryButton, SecondaryButton } from '../../components';
import { colors, gradients } from '../../constants/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const { requestMagicLink, isLoading, error, clearError } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSendMagicLink = async () => {
    if (!isValidEmail(email)) {
      return;
    }

    const success = await requestMagicLink(email);
    if (success) {
      router.push('/(auth)/magic-link-sent');
    }
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
          {/* Header */}
          <View className="items-center mt-10">
            <Text className="text-5xl font-bold text-dutch-orange">dutch</Text>
            <Text className={`text-base mt-2 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              Split expenses, not friendships
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1 justify-center">
            <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              Sign in with email
            </Text>
            <Text className={`text-base mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              We'll send you a magic link to sign in instantly
            </Text>

            <TextInput
              className={`border rounded-2xl p-4 text-base mb-2 ${
                isDark
                  ? 'bg-dark-card border-dark-border text-white'
                  : 'bg-light-card border-light-border text-black'
              } ${error ? 'border-dutch-red' : ''}`}
              placeholder="your@email.com"
              placeholderTextColor={themeColors.textTertiary}
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
            />

            {error && (
              <Text className="text-dutch-red text-sm mb-4">{error}</Text>
            )}

            <PrimaryButton
              onPress={handleSendMagicLink}
              disabled={!isValidEmail(email) || isLoading}
              isLoading={isLoading}
              className="mt-2"
            >
              Send Magic Link
            </PrimaryButton>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className={`flex-1 h-px ${isDark ? 'bg-dark-border' : 'bg-light-border'}`} />
              <Text className={`px-4 ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>
                or
              </Text>
              <View className={`flex-1 h-px ${isDark ? 'bg-dark-border' : 'bg-light-border'}`} />
            </View>

            <SecondaryButton onPress={() => router.push('/(auth)/guest-join')}>
              Continue as guest
            </SecondaryButton>
          </View>

          {/* Footer */}
          <Text className={`text-center text-xs leading-5 pb-4 ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
