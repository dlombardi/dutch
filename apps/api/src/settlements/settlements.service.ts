import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SyncGateway } from '../sync/sync.gateway';
import { SettlementsRepository, GroupsRepository } from '../db/repositories';
import type { Settlement } from '../db/schema';

// Legacy interface for API compatibility
export interface SettlementData {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  method: string;
  createdById: string;
  createdAt: Date;
}

// Helper to convert database settlement to SettlementData
function toSettlementData(settlement: Settlement): SettlementData {
  return {
    id: settlement.id,
    groupId: settlement.groupId,
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    amount: Number(settlement.amount),
    currency: settlement.currency,
    method: settlement.method,
    createdById: settlement.createdById,
    createdAt: settlement.settledAt,
  };
}

@Injectable()
export class SettlementsService {
  constructor(
    private readonly groupsRepo: GroupsRepository,
    private readonly settlementsRepo: SettlementsRepository,
    @Optional() private readonly syncGateway?: SyncGateway,
  ) {}

  private async getGroupOrThrow(groupId: string) {
    const group = await this.groupsRepo.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async createSettlement(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    createdById: string,
    currency?: string,
    method?: string,
  ): Promise<{ settlement: SettlementData }> {
    // Verify group exists and get default currency
    const group = await this.getGroupOrThrow(groupId);

    const dbSettlement = await this.settlementsRepo.create({
      groupId,
      fromUserId,
      toUserId,
      amount: String(amount),
      currency: currency || group.defaultCurrency,
      method: (method || 'cash') as
        | 'cash'
        | 'venmo'
        | 'paypal'
        | 'zelle'
        | 'bank_transfer'
        | 'other',
      createdById,
    });

    const settlement = toSettlementData(dbSettlement);

    // Broadcast settlement:created event to group members
    if (this.syncGateway) {
      this.syncGateway.broadcastToGroup(groupId, 'settlement:created', {
        settlement,
      });
    }

    return { settlement };
  }

  async getSettlementsByGroupId(
    groupId: string,
  ): Promise<{ settlements: SettlementData[] }> {
    // Verify group exists
    await this.getGroupOrThrow(groupId);

    const dbSettlements = await this.settlementsRepo.findByGroupId(groupId);
    const settlements = dbSettlements.map(toSettlementData);

    return { settlements };
  }
}
