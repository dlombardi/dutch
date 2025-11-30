import { ActivityIndicator, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import type { LoadingSpinnerProps } from './loading-spinner.types';

/**
 * Loading spinner component with optional message.
 */
export function LoadingSpinner({
  size = 'large',
  color,
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const defaultColor = '#FF6B00'; // dutch-orange

  const content = (
    <>
      <ActivityIndicator
        size={size}
        color={color ?? defaultColor}
        testID="activity-indicator"
      />
      {message && (
        <Text
          className={`mt-3 text-sm text-center ${
            isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'
          }`}
        >
          {message}
        </Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View
        className={`flex-1 items-center justify-center ${
          isDark ? 'bg-dark-bg' : 'bg-light-bg'
        }`}
      >
        {content}
      </View>
    );
  }

  return (
    <View className="items-center justify-center p-4">
      {content}
    </View>
  );
}
