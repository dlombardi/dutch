import { useColorScheme } from 'nativewind';
import { View, Text } from '@/components/ui/primitives';

export default function ActivityScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-20 h-20 rounded-3xl items-center justify-center bg-dutch-orange/10 border border-dutch-orange/20 mb-4">
          <Text className="text-5xl">📋</Text>
        </View>
        <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          No activity yet
        </Text>
        <Text className={`text-base text-center ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          Your expense and settlement activity will appear here
        </Text>
      </View>
    </View>
  );
}
