import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { GroupsService } from '../groups/groups.service';

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

@Injectable()
export class SettlementsService {
  // In-memory storage for now (will be replaced with TypeORM later)
  private settlements: Map<string, SettlementData> = new Map();
  private groupSettlements: Map<string, string[]> = new Map(); // groupId -> settlementIds

  constructor(private readonly groupsService: GroupsService) {}

  createSettlement(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    createdById: string,
    currency?: string,
    method?: string,
  ): { settlement: SettlementData } {
    // Verify group exists and get default currency
    const { group } = this.groupsService.getGroupById(groupId);

    const settlementId = randomBytes(16).toString('hex');
    const now = new Date();

    const settlement: SettlementData = {
      id: settlementId,
      groupId,
      fromUserId,
      toUserId,
      amount,
      currency: currency || group.defaultCurrency,
      method: method || 'cash',
      createdById,
      createdAt: now,
    };

    this.settlements.set(settlementId, settlement);

    // Track settlement in group's settlement list
    const groupSettlementIds = this.groupSettlements.get(groupId) || [];
    groupSettlementIds.push(settlementId);
    this.groupSettlements.set(groupId, groupSettlementIds);

    return { settlement };
  }

  getSettlementsByGroupId(groupId: string): { settlements: SettlementData[] } {
    // Verify group exists
    this.groupsService.getGroupById(groupId);

    const settlementIds = this.groupSettlements.get(groupId) || [];
    const settlements = settlementIds
      .map((id) => this.settlements.get(id))
      .filter(
        (settlement): settlement is SettlementData => settlement !== undefined,
      );

    return { settlements };
  }
}
