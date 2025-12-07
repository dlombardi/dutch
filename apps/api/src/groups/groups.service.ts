import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupsRepository } from '../db/repositories';
import type { Group, GroupMember } from '../db/schema';

// Legacy interface for API compatibility
export interface GroupData {
  id: string;
  name: string;
  emoji: string;
  createdById: string;
  inviteCode: string;
  defaultCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMembership {
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

// Helper to convert database Group to GroupData
function toGroupData(group: Group): GroupData {
  return {
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    createdById: group.createdById,
    inviteCode: group.inviteCode,
    defaultCurrency: group.defaultCurrency,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

// Helper to convert database GroupMember to GroupMembership
function toGroupMembership(member: GroupMember): GroupMembership {
  return {
    groupId: member.groupId,
    userId: member.userId,
    role: member.role === 'owner' ? 'admin' : 'member',
    joinedAt: member.joinedAt,
  };
}

@Injectable()
export class GroupsService {
  constructor(private readonly groupsRepo: GroupsRepository) {}

  async createGroup(
    name: string,
    createdById: string,
    emoji?: string,
    defaultCurrency?: string,
  ): Promise<{ group: GroupData }> {
    const inviteCode = await this.generateUniqueInviteCode();

    const group = await this.groupsRepo.create({
      name,
      emoji: emoji || '👥',
      createdById,
      inviteCode,
      defaultCurrency: defaultCurrency || 'USD',
    });

    // Add creator as owner member
    await this.groupsRepo.addMember({
      groupId: group.id,
      userId: createdById,
      role: 'owner',
    });

    return { group: toGroupData(group) };
  }

  async getGroupById(id: string): Promise<{ group: GroupData }> {
    const group = await this.groupsRepo.findById(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return { group: toGroupData(group) };
  }

  async updateGroup(
    id: string,
    name?: string,
    emoji?: string,
    defaultCurrency?: string,
  ): Promise<{ group: GroupData }> {
    const existing = await this.groupsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    const updates: Partial<{ name: string; emoji: string; defaultCurrency: string }> = {};
    if (name !== undefined) updates.name = name;
    if (emoji !== undefined) updates.emoji = emoji;
    if (defaultCurrency !== undefined) updates.defaultCurrency = defaultCurrency;

    const group = await this.groupsRepo.update(id, updates);
    return { group: toGroupData(group) };
  }

  async getGroupByInviteCode(
    inviteCode: string,
  ): Promise<{ group: GroupData }> {
    const group = await this.groupsRepo.findByInviteCode(inviteCode);
    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }
    return { group: toGroupData(group) };
  }

  async joinGroup(
    inviteCode: string,
    userId: string,
  ): Promise<{
    group: GroupData;
    membership: GroupMembership;
    isNewMember: boolean;
  }> {
    const { group } = await this.getGroupByInviteCode(inviteCode);

    // Check if user is already a member
    const existingMember = await this.groupsRepo.findMember(group.id, userId);

    if (existingMember) {
      return {
        group,
        membership: toGroupMembership(existingMember),
        isNewMember: false,
      };
    }

    // Add new member
    const member = await this.groupsRepo.addMember({
      groupId: group.id,
      userId,
      role: 'member',
    });

    return {
      group,
      membership: toGroupMembership(member),
      isNewMember: true,
    };
  }

  async getGroupMembers(groupId: string): Promise<GroupMembership[]> {
    const members = await this.groupsRepo.getMembers(groupId);
    return members.map(toGroupMembership);
  }

  async getGroupMembersById(id: string): Promise<{
    members: Omit<GroupMembership, 'groupId'>[];
  }> {
    // First verify the group exists
    const group = await this.groupsRepo.findById(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const memberships = await this.groupsRepo.getMembers(id);
    const members = memberships.map(({ userId, role, joinedAt }) => ({
      userId,
      role: role === 'owner' ? ('admin' as const) : ('member' as const),
      joinedAt,
    }));

    return { members };
  }

  private async generateUniqueInviteCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars (0, O, 1, I)
    let code: string;
    let exists: boolean;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      exists = await this.groupsRepo.inviteCodeExists(code);
    } while (exists);
    return code;
  }
}
