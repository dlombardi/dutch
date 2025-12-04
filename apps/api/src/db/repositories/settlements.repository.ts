import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { settlements, Settlement, NewSettlement } from '../schema';

@Injectable()
export class SettlementsRepository extends BaseRepository {
  async create(data: NewSettlement): Promise<Settlement> {
    const [settlement] = await this.db
      .insert(settlements)
      .values(data)
      .returning();
    return settlement;
  }

  async findById(id: string): Promise<Settlement | undefined> {
    const [settlement] = await this.db
      .select()
      .from(settlements)
      .where(eq(settlements.id, id));
    return settlement;
  }

  async findByGroupId(groupId: string): Promise<Settlement[]> {
    return this.db
      .select()
      .from(settlements)
      .where(eq(settlements.groupId, groupId));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(settlements).where(eq(settlements.id, id));
  }
}
