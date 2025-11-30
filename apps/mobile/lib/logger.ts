/**
 * Logger abstraction for error tracking and debugging
 *
 * In development: logs to console with formatted output
 * In production: can be connected to Sentry, Bugsnag, or other services
 *
 * Usage:
 *   import { logger } from '../lib/logger';
 *   logger.error('Something went wrong', error);
 *   logger.warn('Warning message');
 *   logger.info('Info message');
 *   logger.debug('Debug message');
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface ErrorWithStack extends Error {
  stack?: string;
}

class Logger {
  private isDev = __DEV__;

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, context ?? '');
    }
    // In production, debug logs are silently ignored
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, context ?? '');
    }
    // TODO: In production, send to error tracking service if needed
    // Sentry.addBreadcrumb({ message, level: 'info', data: context });
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, context ?? '');
    }
    // TODO: In production, send to error tracking service
    // Sentry.addBreadcrumb({ message, level: 'warning', data: context });
  }

  /**
   * Log an error with optional Error object
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error ?? '', context ?? '');
      if (error instanceof Error && error.stack) {
        console.error('[ERROR] Stack trace:', error.stack);
      }
    }

    // TODO: In production, send to error tracking service
    // if (error instanceof Error) {
    //   Sentry.captureException(error, { extra: { message, ...context } });
    // } else {
    //   Sentry.captureMessage(message, { level: 'error', extra: { error, ...context } });
    // }
  }

  /**
   * Capture an exception for error tracking
   * Use this for errors you want to track but not necessarily log immediately
   */
  captureException(error: Error, context?: LogContext): void {
    if (this.isDev) {
      console.error('[EXCEPTION]', error.message, context ?? '');
      if ((error as ErrorWithStack).stack) {
        console.error('[EXCEPTION] Stack:', (error as ErrorWithStack).stack);
      }
    }

    // TODO: In production, send to error tracking service
    // Sentry.captureException(error, { extra: context });
  }

  /**
   * Set user context for error tracking
   * Call this after authentication to associate errors with users
   */
  setUser(user: { id: string; email?: string; name?: string } | null): void {
    if (this.isDev && user) {
      console.log('[LOGGER] User context set:', { id: user.id, name: user.name });
    }

    // TODO: In production, set user context in error tracking service
    // if (user) {
    //   Sentry.setUser({ id: user.id, email: user.email, username: user.name });
    // } else {
    //   Sentry.setUser(null);
    // }
  }

  /**
   * Add a breadcrumb for error tracking
   * Breadcrumbs help trace user actions leading to an error
   */
  addBreadcrumb(
    message: string,
    category: string,
    data?: LogContext
  ): void {
    if (this.isDev) {
      console.log(`[BREADCRUMB] ${category}: ${message}`, data ?? '');
    }

    // TODO: In production, add breadcrumb to error tracking service
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   level: 'info',
    // });
  }

  /**
   * Set a tag for error tracking
   * Tags help filter and search errors
   */
  setTag(key: string, value: string): void {
    if (this.isDev) {
      console.log(`[TAG] ${key}: ${value}`);
    }

    // TODO: In production, set tag in error tracking service
    // Sentry.setTag(key, value);
  }

  /**
   * Set extra context data for the next error
   */
  setExtra(key: string, value: unknown): void {
    if (this.isDev) {
      console.log(`[EXTRA] ${key}:`, value);
    }

    // TODO: In production, set extra in error tracking service
    // Sentry.setExtra(key, value);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
