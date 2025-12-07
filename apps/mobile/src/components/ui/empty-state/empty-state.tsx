import { useColorScheme } from 'nativewind';
import { View, Text } from '../primitives';
import { PrimaryButton } from '../button';
import type { EmptyStateProps } from './empty-state.types';

/**
 * Empty state component for displaying when there's no content.
 * Used for empty lists, initial states, and placeholder content.
 */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = '📋',
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="w-16 h-16 rounded-2xl items-center justify-center bg-dutch-orange/10 border border-dutch-orange/20 mb-4">
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text
        className={`text-lg font-semibold text-center mb-2 ${
          isDark ? 'text-white' : 'text-black'
        }`}
      >
        {title}
      </Text>
      {message && (
        <Text
          className={`text-sm text-center leading-5 ${
            isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'
          }`}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-4">
          <PrimaryButton
            onPress={onAction}
            size="md"
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            {actionLabel}
          </PrimaryButton>
        </View>
      )}
    </View>
  );
}
