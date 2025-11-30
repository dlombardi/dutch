import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ErrorBoundaryProps, useRouter } from 'expo-router';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../lib/theme';
import { logger } from '../lib/logger';

export default function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error for debugging and error tracking
    logger.captureException(error, {
      source: 'ErrorBoundary',
      route: 'unknown', // Could be enhanced with route info
    });
  }, [error]);

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>!</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          We encountered an unexpected error. Please try again.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
            accessibilityRole="button"
            accessibilityLabel="Go back to home screen"
          >
            <Text style={styles.secondaryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <ScrollView style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error Details (Dev Only)</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
            {error.stack && (
              <Text style={styles.errorStack}>{error.stack}</Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  emoji: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    color: colors.error.DEFAULT,
    marginBottom: spacing[4],
    width: 80,
    height: 80,
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.full,
    textAlign: 'center',
    lineHeight: 80,
    overflow: 'hidden',
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[8],
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: spacing[3.5],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing[3.5],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.neutral[700],
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  errorDetails: {
    marginTop: spacing[8],
    padding: spacing[4],
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    width: '100%',
    maxHeight: 200,
  },
  errorTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.error[800],
    marginBottom: spacing[2],
  },
  errorMessage: {
    fontSize: fontSize.xs,
    color: colors.error[700],
    fontFamily: 'monospace',
    marginBottom: spacing[2],
  },
  errorStack: {
    fontSize: 10,
    color: colors.error[900],
    fontFamily: 'monospace',
  },
});
