import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';

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

@Injectable()
export class GroupsService {
  // In-memory storage for now (will be replaced with TypeORM later)
  private groups: Map<string, GroupData> = new Map();
  private inviteCodes: Set<string> = new Set();
  private inviteCodeToGroupId: Map<string, string> = new Map(); // O(1) lookup by invite code
  private memberships: Map<string, GroupMembership[]> = new Map(); // groupId -> memberships

  createGroup(
    name: string,
    createdById: string,
    emoji?: string,
    defaultCurrency?: string,
  ): { group: GroupData } {
    const groupId = randomBytes(16).toString('hex');
    const inviteCode = this.generateUniqueInviteCode();

    const group: GroupData = {
      id: groupId,
      name,
      emoji: emoji || '👥',
      createdById,
      inviteCode,
      defaultCurrency: defaultCurrency || 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.groups.set(groupId, group);
    this.inviteCodes.add(inviteCode);
    this.inviteCodeToGroupId.set(inviteCode, groupId);

    // Add creator as admin member
    const creatorMembership: GroupMembership = {
      groupId,
      userId: createdById,
      role: 'admin',
      joinedAt: new Date(),
    };
    this.memberships.set(groupId, [creatorMembership]);

    return { group };
  }

  getGroupById(id: string): { group: GroupData } {
    const group = this.groups.get(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return { group };
  }

  getGroupByInviteCode(inviteCode: string): { group: GroupData } {
    const groupId = this.inviteCodeToGroupId.get(inviteCode);
    if (!groupId) {
      throw new NotFoundException('Invalid invite code');
    }
    const group = this.groups.get(groupId);
    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }
    return { group };
  }

  joinGroup(
    inviteCode: string,
    userId: string,
  ): { group: GroupData; membership: GroupMembership; isNewMember: boolean } {
    const { group } = this.getGroupByInviteCode(inviteCode);

    // Check if user is already a member
    const existingMemberships = this.memberships.get(group.id) || [];
    const existingMembership = existingMemberships.find(
      (m) => m.userId === userId,
    );

    if (existingMembership) {
      return { group, membership: existingMembership, isNewMember: false };
    }

    // Add new member
    const membership: GroupMembership = {
      groupId: group.id,
      userId,
      role: 'member',
      joinedAt: new Date(),
    };

    existingMemberships.push(membership);
    this.memberships.set(group.id, existingMemberships);

    return { group, membership, isNewMember: true };
  }

  getGroupMembers(groupId: string): GroupMembership[] {
    return this.memberships.get(groupId) || [];
  }

  getGroupMembersById(id: string): {
    members: Omit<GroupMembership, 'groupId'>[];
  } {
    // First verify the group exists
    const group = this.groups.get(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const memberships = this.memberships.get(id) || [];
    const members = memberships.map(({ userId, role, joinedAt }) => ({
      userId,
      role,
      joinedAt,
    }));

    return { members };
  }

  private generateUniqueInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars (0, O, 1, I)
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.inviteCodes.has(code));
    return code;
  }
}
