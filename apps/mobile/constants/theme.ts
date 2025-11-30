/**
 * Dutch Design System Tokens
 *
 * Centralized design system for the Dutch mobile app.
 * These values mirror tailwind.config.js for consistency.
 */

export const colors = {
  dark: {
    bg: '#0A0A0B',
    bgElevated: '#141416',
    bgCard: '#1C1C1F',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    border: '#2C2C2E',
    glassBorder: 'rgba(255,255,255,0.08)',
    orange: '#FF6B00',
    orangeGlow: 'rgba(255,107,0,0.4)',
    green: '#30D158',
    red: '#FF453A',
    blue: '#0A84FF',
  },
  light: {
    bg: '#F2F2F7',
    bgElevated: '#FFFFFF',
    bgCard: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#6E6E73',
    textTertiary: '#AEAEB2',
    border: '#E5E5EA',
    glassBorder: 'rgba(0,0,0,0.06)',
    orange: '#FF6B00',
    orangeGlow: 'rgba(255,107,0,0.4)',
    green: '#34C759',
    red: '#FF3B30',
    blue: '#007AFF',
  },
} as const;

export const glassStyle = {
  dark: {
    backgroundColor: 'rgba(28,28,31,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  light: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
} as const;

export const glassStyleSubtle = {
  dark: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  light: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
} as const;

// Shadow styles for React Native (can't be done with Tailwind)
export const shadows = {
  orangeGlow: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Gradient colors for LinearGradient (typed for expo-linear-gradient)
export const gradients = {
  orangeAmbient: {
    colors: ['rgba(255,107,0,0.1)', 'transparent'] as [string, string],
    locations: [0, 0.5] as [number, number],
  },
  greenAmbient: {
    colors: ['rgba(48,209,88,0.08)', 'transparent'] as [string, string],
    locations: [0, 0.5] as [number, number],
  },
  redAmbient: {
    colors: ['rgba(255,69,58,0.08)', 'transparent'] as [string, string],
    locations: [0, 0.5] as [number, number],
  },
} as const;

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = typeof colors.dark | typeof colors.light;
