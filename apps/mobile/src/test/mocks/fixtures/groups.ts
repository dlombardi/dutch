import type { Group, GroupMember, GroupBalance } from '@/modules/groups/types';

export const mockGroup: Group = {
  id: 'group-1',
  name: 'Trip to Paris',
  emoji: '🗼',
  createdById: 'user-1',
  inviteCode: 'ABC123',
  defaultCurrency: 'USD',
  createdAt: '2025-11-01T00:00:00Z',
  updatedAt: '2025-11-01T00:00:00Z',
};

export const mockGroupWithMembers: Group = {
  id: 'group-2',
  name: 'Roommates',
  emoji: '🏠',
  createdById: 'user-2',
  inviteCode: 'XYZ789',
  defaultCurrency: 'EUR',
  createdAt: '2025-10-15T00:00:00Z',
  updatedAt: '2025-10-15T00:00:00Z',
};

export const mockGroups: Group[] = [mockGroup, mockGroupWithMembers];

export const mockGroupMember: GroupMember = {
  userId: 'user-1',
  role: 'admin',
  joinedAt: '2025-11-01T00:00:00Z',
};

export const mockGroupMembers: GroupMember[] = [
  mockGroupMember,
  {
    userId: 'user-2',
    role: 'member',
    joinedAt: '2025-11-02T00:00:00Z',
  },
  {
    userId: 'user-3',
    role: 'member',
    joinedAt: '2025-11-03T00:00:00Z',
  },
];

export const mockGroupBalance: GroupBalance = {
  from: 'user-2',
  to: 'user-1',
  amount: 42.75,
  currency: 'USD',
};

export const mockGroupBalances: GroupBalance[] = [
  mockGroupBalance,
  {
    from: 'user-3',
    to: 'user-1',
    amount: 15.25,
    currency: 'USD',
  },
];

export const mockMemberBalances: Record<string, number> = {
  'user-1': 58.0,
  'user-2': -42.75,
  'user-3': -15.25,
};
