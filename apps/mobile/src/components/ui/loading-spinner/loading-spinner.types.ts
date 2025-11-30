export type SpinnerSize = 'small' | 'large';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  message?: string;
  fullScreen?: boolean;
}
