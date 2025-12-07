import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/modules/auth';
import { View, Text, Pressable } from '@/components/ui/primitives';

export default function MagicLinkSentScreen() {
  const { magicLinkEmail, resetMagicLinkState, requestMagicLink, isLoading } =
    useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
      <View className="flex-1 p-6 justify-center items-center">
        <View className={`w-24 h-24 rounded-full items-center justify-center mb-8 ${isDark ? 'bg-dutch-blue/20' : 'bg-dutch-blue/10'}`}>
          <Text className="text-5xl">✉️</Text>
        </View>

        <Text className={`text-2xl font-bold mb-4 text-center ${isDark ? 'text-white' : 'text-black'}`}>
          Check your email
        </Text>

        <Text className={`text-base text-center leading-6 mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          We sent a magic link to{'\n'}
          <Text className="font-semibold text-dutch-blue">{magicLinkEmail}</Text>
        </Text>

        <Text className={`text-sm text-center leading-5 mb-8 ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>
          Click the link in the email to sign in. The link will expire in 15 minutes.
        </Text>

        <Pressable
          className="p-4 active:opacity-70"
          onPress={handleResend}
          disabled={isLoading}
        >
          <Text className="text-dutch-blue text-base font-semibold">
            {isLoading ? 'Sending...' : "Didn't receive it? Send again"}
          </Text>
        </Pressable>

        <Pressable className="p-4 active:opacity-70" onPress={handleBack}>
          <Text className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            Use different email
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
