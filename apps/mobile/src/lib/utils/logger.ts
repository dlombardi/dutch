/**
 * Logger abstraction for error tracking and debugging
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface ErrorWithStack extends Error {
  stack?: string;
}

class Logger {
  private isDev = __DEV__;

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, context ?? "");
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, context ?? "");
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, context ?? "");
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error ?? "", context ?? "");
      if (error instanceof Error && error.stack) {
        console.error("[ERROR] Stack trace:", error.stack);
      }
    }
  }

  captureException(error: Error, context?: LogContext): void {
    if (this.isDev) {
      console.error("[EXCEPTION]", error.message, context ?? "");
      if ((error as ErrorWithStack).stack) {
        console.error("[EXCEPTION] Stack:", (error as ErrorWithStack).stack);
      }
    }
  }

  setUser(user: { id: string; email?: string; name?: string } | null): void {
    if (this.isDev && user) {
      console.log("[LOGGER] User context set:", {
        id: user.id,
        name: user.name,
      });
    }
  }

  addBreadcrumb(message: string, category: string, data?: LogContext): void {
    if (this.isDev) {
      console.log(`[BREADCRUMB] ${category}: ${message}`, data ?? "");
    }
  }

  setTag(key: string, value: string): void {
    if (this.isDev) {
      console.log(`[TAG] ${key}: ${value}`);
    }
  }

  setExtra(key: string, value: unknown): void {
    if (this.isDev) {
      console.log(`[EXTRA] ${key}:`, value);
    }
  }
}

export const logger = new Logger();
export { Logger };
