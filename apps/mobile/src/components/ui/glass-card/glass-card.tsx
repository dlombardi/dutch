import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { glassStyle, glassStyleSubtle } from '@/constants/theme';
import type { GlassCardProps } from './glass-card.types';

/**
 * Glass Card component with blur effect.
 * Uses expo-blur's BlurView on iOS for true glassmorphism.
 * Falls back to semi-transparent backgrounds on Android.
 */
export function GlassCard({
  children,
  className = '',
  intensity = 'default',
  style,
  ...props
}: GlassCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const glassStyles =
    intensity === 'default'
      ? isDark
        ? glassStyle.dark
        : glassStyle.light
      : isDark
        ? glassStyleSubtle.dark
        : glassStyleSubtle.light;

  const blurIntensity = intensity === 'default' ? 40 : 20;

  // Use BlurView on iOS for native blur effect
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={blurIntensity}
        tint={isDark ? 'dark' : 'light'}
        className={`overflow-hidden rounded-2xl ${className}`}
        style={[
          {
            borderWidth: glassStyles.borderWidth,
            borderColor: glassStyles.borderColor,
          },
          style,
        ]}
        {...props}
      >
        <View
          className={`p-4 ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}
        >
          {children}
        </View>
      </BlurView>
    );
  }

  // Fallback for Android - semi-transparent background
  return (
    <View
      className={`overflow-hidden rounded-2xl p-4 ${className}`}
      style={[glassStyles, style]}
      {...props}
    >
      {children}
    </View>
  );
}
