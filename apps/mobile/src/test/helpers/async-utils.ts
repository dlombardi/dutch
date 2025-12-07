import {
  waitFor as rtlWaitFor,
  type WaitForOptions,
} from "@testing-library/react-native";

/**
 * Wrapper for waitFor with default options suitable for async operations
 */
export async function waitForAsync<T>(
  callback: () => T | Promise<T>,
  options?: WaitForOptions,
): Promise<T> {
  return rtlWaitFor(callback, {
    timeout: 5000,
    interval: 100,
    ...options,
  });
}

/**
 * Wait for a specific amount of time (useful for animation delays)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}
