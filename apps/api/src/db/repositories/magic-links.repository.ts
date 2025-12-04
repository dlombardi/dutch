import { Injectable } from '@nestjs/common';
import { eq, and, gt, lt } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { magicLinks, MagicLink, NewMagicLink } from '../schema';

@Injectable()
export class MagicLinksRepository extends BaseRepository {
  async create(data: NewMagicLink): Promise<MagicLink> {
    const [magicLink] = await this.db
      .insert(magicLinks)
      .values(data)
      .returning();
    return magicLink;
  }

  async findByToken(token: string): Promise<MagicLink | undefined> {
    const [magicLink] = await this.db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.token, token));
    return magicLink;
  }

  async findUnusedByEmail(email: string): Promise<MagicLink | undefined> {
    const [magicLink] = await this.db
      .select()
      .from(magicLinks)
      .where(
        and(
          eq(magicLinks.email, email.toLowerCase()),
          eq(magicLinks.used, false),
          gt(magicLinks.expiresAt, new Date()),
        ),
      );
    return magicLink;
  }

  async findAnyByEmail(email: string): Promise<MagicLink | undefined> {
    const [magicLink] = await this.db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.email, email.toLowerCase()));
    return magicLink;
  }

  async markAsUsed(token: string): Promise<MagicLink> {
    const [magicLink] = await this.db
      .update(magicLinks)
      .set({ used: true })
      .where(eq(magicLinks.token, token))
      .returning();
    return magicLink;
  }

  async deleteExpired(): Promise<void> {
    await this.db
      .delete(magicLinks)
      .where(lt(magicLinks.expiresAt, new Date()));
  }
}
