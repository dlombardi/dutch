import { useColorScheme } from "nativewind";
import { View } from "../primitives";
import type { IconContainerProps } from "./icon-container.types";
import { colorClasses, iconContainerVariants } from "./icon-container.styles";

/**
 * Icon container with colored background and border.
 * Used for category icons, avatars, and similar elements.
 */
export function IconContainer({
  children,
  size = "md",
  color = "orange",
  className = "",
  style,
  ...props
}: IconContainerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = isDark ? colorClasses.dark : colorClasses.light;

  return (
    <View
      className={`${iconContainerVariants({ size })} ${colors[color]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
