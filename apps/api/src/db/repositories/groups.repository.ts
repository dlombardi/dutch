import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import {
  groups,
  Group,
  NewGroup,
  groupMembers,
  GroupMember,
  NewGroupMember,
  users,
} from '../schema';

@Injectable()
export class GroupsRepository extends BaseRepository {
  async create(data: NewGroup): Promise<Group> {
    const [group] = await this.db.insert(groups).values(data).returning();
    return group;
  }

  async findById(id: string): Promise<Group | undefined> {
    const [group] = await this.db
      .select()
      .from(groups)
      .where(eq(groups.id, id));
    return group;
  }

  async findByInviteCode(inviteCode: string): Promise<Group | undefined> {
    const [group] = await this.db
      .select()
      .from(groups)
      .where(eq(groups.inviteCode, inviteCode.toUpperCase()));
    return group;
  }

  async update(id: string, data: Partial<NewGroup>): Promise<Group> {
    const [group] = await this.db
      .update(groups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async inviteCodeExists(code: string): Promise<boolean> {
    const [existing] = await this.db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.inviteCode, code.toUpperCase()));
    return !!existing;
  }

  // Group Members
  async addMember(data: NewGroupMember): Promise<GroupMember> {
    const [member] = await this.db
      .insert(groupMembers)
      .values(data)
      .returning();
    return member;
  }

  async findMember(
    groupId: string,
    userId: string,
  ): Promise<GroupMember | undefined> {
    const [member] = await this.db
      .select()
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
      );
    return member;
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    return this.db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
  }

  async getMembersWithUsers(
    groupId: string,
  ): Promise<Array<{ member: GroupMember; user: typeof users.$inferSelect }>> {
    const results = await this.db
      .select({
        member: groupMembers,
        user: users,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));
    return results;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const memberships = await this.db
      .select({ group: groups })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId));
    return memberships.map((m) => m.group);
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.db
      .delete(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
      );
  }
}
