import type {
  TextProps as RNTextProps,
  ViewProps as RNViewProps,
  PressableProps as RNPressableProps,
  TextInputProps as RNTextInputProps,
  ScrollViewProps as RNScrollViewProps,
} from 'react-native';

/**
 * Base props that extend React Native props with NativeWind className support.
 * The className prop is typed as string for NativeWind compatibility.
 */
export interface StyledTextProps extends Omit<RNTextProps, 'style'> {
  className?: string;
  style?: RNTextProps['style'];
}

export interface StyledViewProps extends Omit<RNViewProps, 'style'> {
  className?: string;
  style?: RNViewProps['style'];
}

export interface StyledPressableProps extends Omit<RNPressableProps, 'style'> {
  className?: string;
  style?: RNPressableProps['style'];
}

export interface StyledTextInputProps extends Omit<RNTextInputProps, 'style'> {
  className?: string;
  style?: RNTextInputProps['style'];
}

export interface StyledScrollViewProps extends Omit<RNScrollViewProps, 'style' | 'contentContainerStyle'> {
  className?: string;
  contentContainerClassName?: string;
  style?: RNScrollViewProps['style'];
  contentContainerStyle?: RNScrollViewProps['contentContainerStyle'];
}
