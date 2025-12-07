import { Pressable as RNPressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import type { StyledPressableProps } from './types';

/**
 * Styled Pressable component with NativeWind className support.
 *
 * Usage patterns:
 * - Button: rounded-xl py-3 px-4 bg-dutch-orange active:opacity-90
 * - List item: p-4 border-b border-dark-border active:opacity-70
 * - Icon button: w-10 h-10 rounded-full items-center justify-center
 */
export function Pressable({ className = '', ...props }: StyledPressableProps) {
  return <RNPressable className={className} {...props} />;
}

/**
 * List row preset - tappable list item with border
 */
export function ListRow({ className = '', ...props }: StyledPressableProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <RNPressable
      className={`flex-row items-center p-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'} active:opacity-70 ${className}`}
      {...props}
    />
  );
}

/**
 * Icon button preset - circular tappable icon container
 */
export function IconButton({ className = '', ...props }: StyledPressableProps) {
  return (
    <RNPressable
      className={`w-10 h-10 rounded-full items-center justify-center active:opacity-70 ${className}`}
      {...props}
    />
  );
}
