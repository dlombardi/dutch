/**
 * Groups module types
 * Types shared across the groups module
 */

export interface Group {
  id: string;
  name: string;
  emoji: string;
  createdById: string;
  inviteCode: string;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'admin' | 'member';

export interface GroupMember {
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface GroupBalance {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export interface GroupBalancesData {
  balances: GroupBalance[];
  memberBalances: Record<string, number>;
}

export interface CreateGroupInput {
  name: string;
  createdById: string;
  emoji?: string;
  defaultCurrency?: string;
}

export interface JoinGroupInput {
  inviteCode: string;
  userId: string;
}

// API Response types
export interface GroupApiResponse {
  group: Group;
}

export interface GroupMembersApiResponse {
  members: GroupMember[];
}

export interface GroupBalancesApiResponse {
  balances: GroupBalance[];
  memberBalances: Record<string, number>;
}

export interface JoinGroupApiResponse {
  group: Group;
  membership: {
    userId: string;
    role: MemberRole;
    joinedAt: string;
  };
}

// Store types
export interface GroupsState {
  groups: Group[];
}

export interface GroupsActions {
  addGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  clearGroups: () => void;
}

export type GroupsStore = GroupsState & GroupsActions;

// Type aliases for backwards compatibility
export type Balance = GroupBalance;
export type BalancesData = GroupBalancesData;
