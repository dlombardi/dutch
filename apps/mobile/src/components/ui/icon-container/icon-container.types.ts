import type { ViewProps } from "react-native";

export type IconSize = "sm" | "md" | "lg";
export type IconColor = "orange" | "green" | "red" | "blue" | "gray";

export interface IconContainerProps extends ViewProps {
  children: React.ReactNode;
  size?: IconSize;
  color?: IconColor;
  className?: string;
}
