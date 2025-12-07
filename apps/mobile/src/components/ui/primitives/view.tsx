import { View as RNView } from "react-native";
import { useColorScheme } from "nativewind";
import type { StyledViewProps } from "./types";

/**
 * Styled View component with NativeWind className support.
 *
 * Common utility patterns:
 * - Container: flex-1 bg-dark-bg / bg-light-bg
 * - Card: rounded-2xl p-4 bg-dark-card / bg-light-card
 * - Row: flex-row items-center
 * - Center: items-center justify-center
 * - Divider: h-px bg-dark-border / bg-light-border
 */
export function View({ className = "", ...props }: StyledViewProps) {
  return <RNView className={className} {...props} />;
}

/**
 * Screen container preset - full screen with theme background
 */
export function Screen({ className = "", ...props }: StyledViewProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <RNView
      className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"} ${className}`}
      {...props}
    />
  );
}

/**
 * Card preset - elevated container with rounded corners
 */
export function Card({ className = "", ...props }: StyledViewProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <RNView
      className={`rounded-2xl p-4 ${isDark ? "bg-dark-card" : "bg-light-card"} ${className}`}
      {...props}
    />
  );
}

/**
 * Row preset - horizontal flex layout
 */
export function Row({ className = "", ...props }: StyledViewProps) {
  return <RNView className={`flex-row items-center ${className}`} {...props} />;
}

/**
 * Center preset - centered content container
 */
export function Center({ className = "", ...props }: StyledViewProps) {
  return (
    <RNView className={`items-center justify-center ${className}`} {...props} />
  );
}

/**
 * Divider preset - horizontal separator line
 */
export function Divider({ className = "", ...props }: StyledViewProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <RNView
      className={`h-px ${isDark ? "bg-dark-border" : "bg-light-border"} ${className}`}
      {...props}
    />
  );
}
