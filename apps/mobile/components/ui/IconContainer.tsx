import { View, type ViewProps } from 'react-native';
import { useColorScheme } from 'nativewind';

interface IconContainerProps extends ViewProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'green' | 'red' | 'blue' | 'gray';
  className?: string;
}

/**
 * Icon container with colored background and border.
 * Used for category icons and similar elements.
 */
export function IconContainer({
  children,
  size = 'md',
  color = 'orange',
  className = '',
  style,
  ...props
}: IconContainerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
  };

  const colorClasses = {
    orange: 'bg-dutch-orange/10 border-dutch-orange/20',
    green: isDark ? 'bg-dutch-green/10 border-dutch-green/20' : 'bg-dutch-green-light/10 border-dutch-green-light/20',
    red: isDark ? 'bg-dutch-red/10 border-dutch-red/20' : 'bg-dutch-red-light/10 border-dutch-red-light/20',
    blue: isDark ? 'bg-dutch-blue/10 border-dutch-blue/20' : 'bg-dutch-blue-light/10 border-dutch-blue-light/20',
    gray: isDark ? 'bg-dark-card border-dark-border' : 'bg-light-card border-light-border',
  };

  return (
    <View
      className={`items-center justify-center border ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
