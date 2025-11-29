import { Injectable, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';

export interface MagicLinkData {
  id: string;
  email: string;
  token: string;
  used: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface UserData {
  id: string;
  email?: string;
  name: string;
  type: 'guest' | 'claimed' | 'full';
  authProvider: 'magic_link' | 'google' | 'apple' | 'guest';
  deviceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  // In-memory storage for now (will be replaced with TypeORM later)
  private magicLinks: Map<string, MagicLinkData> = new Map();
  private users: Map<string, UserData> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  private usersByDeviceId: Map<string, string> = new Map();

  requestMagicLink(email: string): { message: string } {
    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    const tokenId = randomBytes(16).toString('hex');

    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store the magic link
    const magicLinkData: MagicLinkData = {
      id: tokenId,
      email: email.toLowerCase(),
      token,
      used: false,
      createdAt: new Date(),
      expiresAt,
    };

    this.magicLinks.set(token, magicLinkData);

    // In production, send email here
    // For development, log the magic link
    const magicLinkUrl = `evn://auth/verify?token=${token}`;
    console.log(`[Auth] Magic link for ${email}: ${magicLinkUrl}`);
    console.log(`[Auth] Token: ${token}`);

    return {
      message: 'Magic link sent to your email',
    };
  }

  verifyMagicLink(token: string): { user: UserData; accessToken: string } {
    const magicLink = this.magicLinks.get(token);

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
    magicLink.used = true;
    this.magicLinks.set(token, magicLink);

    // Find or create user
    let user: UserData;
    const existingUserId = this.usersByEmail.get(magicLink.email);

    if (existingUserId) {
      user = this.users.get(existingUserId)!;
    } else {
      // Create new user
      const userId = randomBytes(16).toString('hex');
      user = {
        id: userId,
        email: magicLink.email,
        name: magicLink.email.split('@')[0], // Default name from email
        type: 'full',
        authProvider: 'magic_link',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userId, user);
      this.usersByEmail.set(magicLink.email, userId);
    }

    // Generate access token (simplified for now)
    const accessToken = randomBytes(32).toString('hex');

    return { user, accessToken };
  }

  createGuestUser(
    name: string,
    deviceId: string,
  ): { user: UserData; accessToken: string } {
    // Check if device already has a guest user
    const existingUserId = this.usersByDeviceId.get(deviceId);

    let user: UserData;

    if (existingUserId) {
      // Update existing user's name
      user = this.users.get(existingUserId)!;
      user.name = name;
      user.updatedAt = new Date();
      this.users.set(existingUserId, user);
    } else {
      // Create new guest user
      const userId = randomBytes(16).toString('hex');
      user = {
        id: userId,
        name,
        type: 'guest',
        authProvider: 'guest',
        deviceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userId, user);
      this.usersByDeviceId.set(deviceId, userId);
    }

    // Generate access token
    const accessToken = randomBytes(32).toString('hex');

    return { user, accessToken };
  }

  // Helper method to get magic link info (for testing)
  getMagicLinkByToken(token: string): MagicLinkData | undefined {
    return this.magicLinks.get(token);
  }

  // Helper method to find token by email (for testing)
  findTokenByEmail(email: string): string | undefined {
    for (const [token, data] of this.magicLinks.entries()) {
      if (data.email === email && !data.used) {
        return token;
      }
    }
    return undefined;
  }

  // Helper method to find any token by email including used ones (for testing)
  findAnyTokenByEmail(email: string): string | undefined {
    for (const [token, data] of this.magicLinks.entries()) {
      if (data.email === email) {
        return token;
      }
    }
    return undefined;
  }
}
