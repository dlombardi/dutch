import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { glassStyle, shadows } from '@/constants/theme';
import type { ButtonProps } from './button.types';
import { buttonVariants, textVariants } from './button.styles';

/**
 * Primary button with orange glow effect.
 */
export function PrimaryButton({
  children,
  size = 'lg',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  style,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={`bg-dutch-orange rounded-2xl ${buttonVariants({ size })} active:scale-[0.98] ${disabled || isLoading ? 'opacity-50' : ''} ${className}`}
      style={[shadows.orangeGlow, style]}
      disabled={disabled || isLoading}
      activeOpacity={0.9}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`text-white ${textVariants({ size })}`}>
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Secondary button with glass effect.
 */
export function SecondaryButton({
  children,
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassStyles = isDark ? glassStyle.dark : glassStyle.light;

  // Use BlurView on iOS
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity
        className={`rounded-xl overflow-hidden ${disabled || isLoading ? 'opacity-50' : ''} active:opacity-80 ${className}`}
        disabled={disabled || isLoading}
        style={style}
        activeOpacity={0.8}
        {...props}
      >
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          className={`items-center justify-center flex-row ${buttonVariants({ size })}`}
          style={{
            borderWidth: glassStyles.borderWidth,
            borderColor: glassStyles.borderColor,
            borderRadius: 12,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FF6B00" />
          ) : (
            <>
              {leftIcon && <View className="mr-2">{leftIcon}</View>}
              <Text className={`text-dutch-orange ${textVariants({ size })}`}>
                {children}
              </Text>
              {rightIcon && <View className="ml-2">{rightIcon}</View>}
            </>
          )}
        </BlurView>
      </TouchableOpacity>
    );
  }

  // Fallback for Android
  return (
    <TouchableOpacity
      className={`rounded-xl ${buttonVariants({ size })} ${disabled || isLoading ? 'opacity-50' : ''} active:opacity-80 ${className}`}
      style={[glassStyles, { borderRadius: 12 }, style]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#FF6B00" />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`text-dutch-orange ${textVariants({ size })}`}>
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Ghost button (text only, no background).
 */
export function GhostButton({
  children,
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  style,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={`rounded-xl ${buttonVariants({ size })} ${disabled || isLoading ? 'opacity-50' : ''} active:opacity-60 ${className}`}
      style={style}
      disabled={disabled || isLoading}
      activeOpacity={0.6}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#FF6B00" />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`text-dutch-orange ${textVariants({ size })}`}>
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Danger button (red, for destructive actions).
 */
export function DangerButton({
  children,
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      className={`rounded-xl border ${isDark ? 'border-dutch-red' : 'border-dutch-red-light'} ${buttonVariants({ size })} ${disabled || isLoading ? 'opacity-50' : ''} active:opacity-80 ${className}`}
      style={style}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isDark ? '#FF453A' : '#FF3B30'} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text
            className={`${isDark ? 'text-dutch-red' : 'text-dutch-red-light'} ${textVariants({ size })}`}
          >
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
