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

@Injectable()
export class GroupsService {
  // In-memory storage for now (will be replaced with TypeORM later)
  private groups: Map<string, GroupData> = new Map();
  private inviteCodes: Set<string> = new Set();

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

    return { group };
  }

  getGroupById(id: string): { group: GroupData } {
    const group = this.groups.get(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return { group };
  }

  getGroupByInviteCode(inviteCode: string): { group: GroupData } | null {
    for (const group of this.groups.values()) {
      if (group.inviteCode === inviteCode) {
        return { group };
      }
    }
    return null;
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
