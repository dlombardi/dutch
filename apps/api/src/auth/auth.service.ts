import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { UsersRepository, MagicLinksRepository } from '../db/repositories';
import type { User, MagicLink } from '../db/schema';
import type { JwtPayload } from './jwt.strategy';

// Legacy interface for API compatibility
export interface MagicLinkData {
  id: string;
  email: string;
  token: string;
  used: boolean;
  createdAt: Date;
  expiresAt: Date;
  claimForUserId?: string;
}

export interface UserData {
  id: string;
  email?: string;
  name: string;
  type: 'guest' | 'claimed' | 'full';
  authProvider: 'magic_link' | 'google' | 'apple' | 'guest';
  deviceId?: string;
  sessionCount: number;
  upgradePromptDismissedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to convert database user to UserData
function toUserData(user: User): UserData {
  return {
    id: user.id,
    email: user.email ?? undefined,
    name: user.name,
    type: user.type,
    authProvider: user.authProvider,
    deviceId: user.deviceId ?? undefined,
    sessionCount: user.sessionCount,
    upgradePromptDismissedAt: user.upgradePromptDismissedAt ?? undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Helper to convert database magic link to MagicLinkData
function toMagicLinkData(magicLink: MagicLink): MagicLinkData {
  return {
    id: magicLink.id,
    email: magicLink.email,
    token: magicLink.token,
    used: magicLink.used,
    createdAt: magicLink.createdAt,
    expiresAt: magicLink.expiresAt,
    claimForUserId: magicLink.claimForUserId ?? undefined,
  };
}

// Token expiration constants
const MAGIC_LINK_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly magicLinksRepo: MagicLinksRepository,
    private readonly jwtService: JwtService,
  ) {}

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? undefined,
      type: user.type,
    };
    return this.jwtService.sign(payload);
  }

  async requestMagicLink(email: string): Promise<{ message: string }> {
    // Generate a secure random token
    const token = randomBytes(32).toString('hex');

    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MS);

    // Store the magic link
    await this.magicLinksRepo.create({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });

    // In production, send email here
    // For development, log the magic link URL (NOT the raw token)
    if (process.env.NODE_ENV !== 'production') {
      const magicLinkUrl = `evn://auth/verify?token=${token}`;
      console.log(`[Auth] Magic link URL for ${email}: ${magicLinkUrl}`);
    }

    return {
      message: 'Magic link sent to your email',
    };
  }

  async verifyMagicLink(
    token: string,
  ): Promise<{ user: UserData; accessToken: string }> {
    const magicLink = await this.magicLinksRepo.findByToken(token);

    if (!magicLink) {
      throw new BadRequestException('Invalid magic link');
    }

    if (magicLink.used) {
      throw new BadRequestException('Magic link has already been used');
    }

    if (new Date() > magicLink.expiresAt) {
      throw new BadRequestException('Magic link has expired');
    }

    // Mark the link as used
    await this.magicLinksRepo.markAsUsed(token);

    let user: User;

    // Check if this is a claim link (upgrading a guest account)
    if (magicLink.claimForUserId) {
      // Get the guest user and upgrade them
      const guestUser = await this.usersRepo.findById(magicLink.claimForUserId);
      if (!guestUser) {
        throw new BadRequestException('Guest user no longer exists');
      }

      // Upgrade the guest to a claimed user
      user = await this.usersRepo.update(magicLink.claimForUserId, {
        email: magicLink.email,
        type: 'claimed',
        sessionCount: (guestUser.sessionCount || 0) + 1,
      });
    } else {
      // Normal login flow - find or create user
      const existingUser = await this.usersRepo.findByEmail(magicLink.email);

      if (existingUser) {
        user = await this.usersRepo.update(existingUser.id, {
          sessionCount: (existingUser.sessionCount || 0) + 1,
        });
      } else {
        // Create new user
        user = await this.usersRepo.create({
          email: magicLink.email,
          name: magicLink.email.split('@')[0], // Default name from email
          type: 'full',
          authProvider: 'magic_link',
          sessionCount: 1,
        });
      }
    }

    // Generate JWT access token
    const accessToken = this.generateAccessToken(user);

    return { user: toUserData(user), accessToken };
  }

  async createGuestUser(
    name: string,
    deviceId: string,
  ): Promise<{
    user: UserData;
    accessToken: string;
    showUpgradePrompt: boolean;
  }> {
    // Check if device already has a guest user
    const existingUser = await this.usersRepo.findByDeviceId(deviceId);

    let user: User;

    if (existingUser) {
      // Update existing user's name and increment session count
      user = await this.usersRepo.update(existingUser.id, {
        name,
        sessionCount: (existingUser.sessionCount || 1) + 1,
      });
    } else {
      // Create new guest user
      user = await this.usersRepo.create({
        name,
        type: 'guest',
        authProvider: 'guest',
        deviceId,
        sessionCount: 1,
      });
    }

    // Generate JWT access token
    const accessToken = this.generateAccessToken(user);

    // Determine whether to show upgrade prompt:
    // - Show if session count > 1 (not first session)
    // - Don't show if user has dismissed the prompt
    const showUpgradePrompt =
      user.sessionCount > 1 && !user.upgradePromptDismissedAt;

    return { user: toUserData(user), accessToken, showUpgradePrompt };
  }

  async dismissUpgradePrompt(
    deviceId: string,
  ): Promise<{ success: boolean } | null> {
    const user = await this.usersRepo.findByDeviceId(deviceId);
    if (!user) {
      return null;
    }

    await this.usersRepo.update(user.id, {
      upgradePromptDismissedAt: new Date(),
    });

    return { success: true };
  }

  async claimGuestAccount(
    deviceId: string,
    email: string,
  ): Promise<{ message: string } | { error: string; code: number }> {
    // Find the guest user by device ID
    const user = await this.usersRepo.findByDeviceId(deviceId);
    if (!user) {
      return { error: 'Guest user not found for this device', code: 404 };
    }

    // Check if email is already in use
    const normalizedEmail = email.toLowerCase();
    const existingUserWithEmail =
      await this.usersRepo.findByEmail(normalizedEmail);
    if (existingUserWithEmail) {
      return {
        error: 'This email is already associated with an account',
        code: 409,
      };
    }

    // Generate a magic link for verification
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MS);

    await this.magicLinksRepo.create({
      email: normalizedEmail,
      token,
      expiresAt,
      claimForUserId: user.id, // Mark this as a claim link
    });

    // In production, send email here
    if (process.env.NODE_ENV !== 'production') {
      const magicLinkUrl = `evn://auth/verify?token=${token}`;
      console.log(`[Auth] Claim link URL for ${email}: ${magicLinkUrl}`);
    }

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  // Helper method to get magic link info (for testing)
  async getMagicLinkByToken(token: string): Promise<MagicLinkData | undefined> {
    const magicLink = await this.magicLinksRepo.findByToken(token);
    return magicLink ? toMagicLinkData(magicLink) : undefined;
  }

  // Helper method to find token by email (for testing)
  async findTokenByEmail(email: string): Promise<string | undefined> {
    const magicLink = await this.magicLinksRepo.findUnusedByEmail(email);
    return magicLink?.token;
  }

  // Helper method to find any token by email including used ones (for testing)
  async findAnyTokenByEmail(email: string): Promise<string | undefined> {
    const magicLink = await this.magicLinksRepo.findAnyByEmail(email);
    return magicLink?.token;
  }
}
