import {
  TextInput as RNTextInput,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { useColorScheme } from "nativewind";
import { colors } from "@/constants/theme";

interface StyledTextInputProps extends TextInputProps {
  className?: string;
  hasError?: boolean;
}

// Base text style to ensure consistent font rendering
const baseTextStyle: TextStyle = {
  fontFamily: "System",
  letterSpacing: 0,
};

/**
 * Styled TextInput component with NativeWind className support.
 * Automatically applies theme-aware placeholder color and text color.
 *
 * Common patterns:
 * - Form input: border rounded-2xl p-4 text-base
 * - Search: rounded-xl p-3
 * - Large input: text-4xl font-semibold text-center
 */
export function TextInput({
  className = "",
  placeholderTextColor,
  style,
  ...props
}: StyledTextInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <RNTextInput
      className={`${isDark ? "text-white" : "text-black"} ${className}`}
      placeholderTextColor={placeholderTextColor ?? themeColors.textTertiary}
      style={[baseTextStyle, style]}
      {...props}
    />
  );
}

/**
 * Form input preset - styled input for forms with border and padding
 */
export function FormInput({
  className = "",
  hasError = false,
  placeholderTextColor,
  style,
  ...props
}: StyledTextInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <RNTextInput
      className={`border rounded-2xl p-4 ${hasError ? "border-dutch-red" : isDark ? "border-dark-border" : "border-light-border"} ${isDark ? "bg-dark-card" : "bg-light-card"} ${className}`}
      placeholderTextColor={placeholderTextColor ?? themeColors.textTertiary}
      style={[
        baseTextStyle,
        {
          fontSize: 16,
          color: isDark ? themeColors.textPrimary : "#000000",
        },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * Search input preset - compact search field with rounded corners
 */
export function SearchInput({
  className = "",
  placeholderTextColor,
  style,
  ...props
}: StyledTextInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <RNTextInput
      className={`rounded-xl p-3 ${isDark ? "bg-dark-card" : "bg-light-border"} ${className}`}
      placeholderTextColor={placeholderTextColor ?? themeColors.textTertiary}
      style={[
        baseTextStyle,
        {
          fontSize: 16,
          color: isDark ? themeColors.textPrimary : "#000000",
        },
        style,
      ]}
      {...props}
    />
  );
}
