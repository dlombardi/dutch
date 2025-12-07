import { Text as RNText } from "react-native";
import { useColorScheme } from "nativewind";
import type { StyledTextProps } from "./types";

/**
 * Styled Text component with NativeWind className support.
 *
 * Variants for common text styles:
 * - Heading: text-2xl font-bold (text-white / text-black)
 * - Subheading: text-lg font-semibold
 * - Body: text-base (default)
 * - Caption: text-sm text-dark-text-secondary / text-light-text-secondary
 * - Label: text-xs font-semibold uppercase tracking-wider
 */
export function Text({ className = "", ...props }: StyledTextProps) {
  return <RNText className={className} {...props} />;
}

/**
 * Heading text preset - large bold text
 */
export function Heading({ className = "", ...props }: StyledTextProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <RNText
      className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"} ${className}`}
      {...props}
    />
  );
}

/**
 * Body text preset - standard readable text
 */
export function Body({ className = "", ...props }: StyledTextProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <RNText
      className={`text-base ${isDark ? "text-white" : "text-black"} ${className}`}
      {...props}
    />
  );
}

/**
 * Caption text preset - smaller secondary text
 */
export function Caption({ className = "", ...props }: StyledTextProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <RNText
      className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"} ${className}`}
      {...props}
    />
  );
}

/**
 * Label text preset - uppercase small text for sections
 */
export function Label({ className = "", ...props }: StyledTextProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <RNText
      className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"} ${className}`}
      {...props}
    />
  );
}
