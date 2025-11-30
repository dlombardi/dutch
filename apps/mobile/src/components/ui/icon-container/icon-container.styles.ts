import { cva, type VariantProps } from 'class-variance-authority';

export const iconContainerVariants = cva(
  'items-center justify-center border',
  {
    variants: {
      size: {
        sm: 'w-8 h-8 rounded-lg',
        md: 'w-12 h-12 rounded-xl',
        lg: 'w-16 h-16 rounded-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type IconContainerStyleVariants = VariantProps<typeof iconContainerVariants>;

// Color classes are applied separately based on dark/light mode
export const colorClasses = {
  light: {
    orange: 'bg-dutch-orange/10 border-dutch-orange/20',
    green: 'bg-dutch-green-light/10 border-dutch-green-light/20',
    red: 'bg-dutch-red-light/10 border-dutch-red-light/20',
    blue: 'bg-dutch-blue-light/10 border-dutch-blue-light/20',
    gray: 'bg-light-card border-light-border',
  },
  dark: {
    orange: 'bg-dutch-orange/10 border-dutch-orange/20',
    green: 'bg-dutch-green/10 border-dutch-green/20',
    red: 'bg-dutch-red/10 border-dutch-red/20',
    blue: 'bg-dutch-blue/10 border-dutch-blue/20',
    gray: 'bg-dark-card border-dark-border',
  },
} as const;
