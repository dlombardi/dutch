import { ActivityIndicator, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import { View, Text, Pressable } from "../primitives";
import { glassStyle, shadows } from "@/constants/theme";
import type { ButtonProps } from "./button.types";
import { buttonVariants, textVariants } from "./button.styles";

/**
 * Primary button with orange glow effect.
 * Use for primary actions like "Create", "Save", "Submit".
 */
export function PrimaryButton({
  children,
  size = "lg",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`bg-dutch-orange rounded-2xl ${buttonVariants({ size })} active:scale-[0.98] ${isDisabled ? "opacity-50" : ""} ${className}`}
      style={[shadows.orangeGlow, style]}
      disabled={isDisabled}
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
    </Pressable>
  );
}

/**
 * Secondary button with glass effect.
 * Use for secondary actions that complement primary actions.
 */
export function SecondaryButton({
  children,
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const glassStyles = isDark ? glassStyle.dark : glassStyle.light;
  const isDisabled = disabled || isLoading;

  // Use BlurView on iOS for native glass effect
  if (Platform.OS === "ios") {
    return (
      <Pressable
        className={`rounded-xl overflow-hidden ${isDisabled ? "opacity-50" : ""} active:opacity-80 ${className}`}
        disabled={isDisabled}
        style={style}
        {...props}
      >
        <BlurView
          intensity={20}
          tint={isDark ? "dark" : "light"}
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
      </Pressable>
    );
  }

  // Fallback for Android - semi-transparent background
  return (
    <Pressable
      className={`rounded-xl ${buttonVariants({ size })} ${isDisabled ? "opacity-50" : ""} active:opacity-80 ${className}`}
      style={[glassStyles, { borderRadius: 12 }, style]}
      disabled={isDisabled}
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
    </Pressable>
  );
}

/**
 * Ghost button (text only, no background).
 * Use for tertiary actions or navigation.
 */
export function GhostButton({
  children,
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`rounded-xl ${buttonVariants({ size })} ${isDisabled ? "opacity-50" : ""} active:opacity-60 ${className}`}
      style={style}
      disabled={isDisabled}
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
    </Pressable>
  );
}

/**
 * Danger button (red, for destructive actions).
 * Use for delete, remove, or other destructive operations.
 */
export function DangerButton({
  children,
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`rounded-xl border ${isDark ? "border-dutch-red" : "border-dutch-red-light"} ${buttonVariants({ size })} ${isDisabled ? "opacity-50" : ""} active:opacity-80 ${className}`}
      style={style}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isDark ? "#FF453A" : "#FF3B30"} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text
            className={`${isDark ? "text-dutch-red" : "text-dutch-red-light"} ${textVariants({ size })}`}
          >
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
}

/**
 * Success button (green, for confirmations).
 * Use for confirm, settle, complete actions.
 */
export function SuccessButton({
  children,
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`bg-dutch-green rounded-xl ${buttonVariants({ size })} ${isDisabled ? "opacity-50" : ""} active:opacity-90 ${className}`}
      style={style}
      disabled={isDisabled}
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
    </Pressable>
  );
}
