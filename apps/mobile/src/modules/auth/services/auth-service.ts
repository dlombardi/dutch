/**
 * Auth service
 * Handles all authentication-related API calls
 */

import { api } from '@/lib/api-client';
import type { GuestUserResponse, MagicLinkVerifyResponse } from '../types';

/**
 * Request a magic link to be sent to the user's email
 */
export async function requestMagicLink(email: string): Promise<{ message: string }> {
  return api.requestMagicLink(email);
}

/**
 * Verify a magic link token and get user data
 */
export async function verifyMagicLink(token: string): Promise<MagicLinkVerifyResponse> {
  return api.verifyMagicLink(token);
}

/**
 * Create a new guest user
 */
export async function createGuestUser(
  name: string,
  deviceId: string
): Promise<GuestUserResponse> {
  return api.createGuestUser(name, deviceId);
}

export const authService = {
  requestMagicLink,
  verifyMagicLink,
  createGuestUser,
};
