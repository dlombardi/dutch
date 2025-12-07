import { ScrollView as RNScrollView } from "react-native";
import type { StyledScrollViewProps } from "./types";

/**
 * Styled ScrollView component with NativeWind className support.
 *
 * Usage patterns:
 * - Page content: flex-1 with contentContainerStyle padding
 * - Horizontal list: horizontal showsHorizontalScrollIndicator={false}
 */
export function ScrollView({
  className = "",
  contentContainerClassName = "",
  ...props
}: StyledScrollViewProps) {
  return (
    <RNScrollView
      className={className}
      contentContainerClassName={contentContainerClassName}
      {...props}
    />
  );
}
