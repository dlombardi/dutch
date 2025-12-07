/**
 * Theme Design Tokens
 *
 * Centralized design system for the Evn mobile app.
 * These values mirror tailwind.config.js for consistency.
 * Use these for StyleSheet.create() or programmatic styling.
 *
 * For className-based styling, use Tailwind classes directly.
 */

// Color palette
export const colors = {
  // Primary brand color (iOS blue)
  primary: {
    DEFAULT: "#007AFF",
    50: "#E5F2FF",
    100: "#CCE5FF",
    200: "#99CBFF",
    300: "#66B0FF",
    400: "#3396FF",
    500: "#007AFF",
    600: "#0062CC",
    700: "#004A99",
    800: "#003166",
    900: "#001933",
  },

  // Semantic colors
  success: {
    DEFAULT: "#4CAF50",
    50: "#E8F5E9",
    100: "#C8E6C9",
    200: "#A5D6A7",
    300: "#81C784",
    400: "#66BB6A",
    500: "#4CAF50",
    600: "#43A047",
    700: "#388E3C",
    800: "#2E7D32",
    900: "#1B5E20",
  },

  error: {
    DEFAULT: "#FF5252",
    50: "#FFEBEE",
    100: "#FFCDD2",
    200: "#EF9A9A",
    300: "#E57373",
    400: "#EF5350",
    500: "#FF5252",
    600: "#E53935",
    700: "#D32F2F",
    800: "#C62828",
    900: "#B71C1C",
  },

  warning: {
    DEFAULT: "#F59E0B",
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  info: {
    DEFAULT: "#3B82F6",
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Neutral grays
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },

  // Background colors
  background: {
    DEFAULT: "#FFFFFF",
    secondary: "#F5F5F5",
    tertiary: "#FAFAFA",
  },

  // Border colors
  border: {
    DEFAULT: "#E5E5E5",
    light: "#F0F0F0",
    dark: "#D4D4D4",
  },

  // Text colors
  text: {
    DEFAULT: "#1A1A1A",
    primary: "#1A1A1A",
    secondary: "#666666",
    muted: "#A3A3A3",
    inverse: "#FFFFFF",
  },

  // Legacy aliases for backwards compatibility
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

// Spacing scale (in pixels)
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
} as const;

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

// Line heights
export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "3xl": 36,
  "4xl": 40,
  "5xl": 48,
} as const;

// Font weights
export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

// Shadows for React Native
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// Animation durations (in ms)
export const duration = {
  fast: 150,
  DEFAULT: 200,
  slow: 300,
  slower: 500,
} as const;

// Z-index scale
export const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  modal: 100,
  toast: 110,
} as const;

// Theme object for easy access
export const theme = {
  colors,
  spacing,
  fontSize,
  lineHeight,
  fontWeight,
  borderRadius,
  shadows,
  duration,
  zIndex,
} as const;

export default theme;
