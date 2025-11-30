import type { ViewProps } from 'react-native';

export type GlassIntensity = 'default' | 'subtle';

export interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  intensity?: GlassIntensity;
}
