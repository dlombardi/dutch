import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color = '#007AFF',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        {content}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
