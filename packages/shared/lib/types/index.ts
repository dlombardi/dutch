// Shared TypeScript types for Evn

export type UserType = 'guest' | 'claimed' | 'full';

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'shopping'
  | 'other';

export type SettlementMethod =
  | 'cash'
  | 'venmo'
  | 'paypal'
  | 'zelle'
  | 'bank_transfer'
  | 'other';

export interface User {
  id: string;
  email?: string;
  name: string;
  type: UserType;
  photoUrl?: string;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  defaultCurrency: string;
  inviteCode: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  user?: User;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  shares?: number;
  percentage?: number;
  user?: User;
}

export interface Expense {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  description: string;
  category: ExpenseCategory;
  paidById: string;
  splitType: SplitType;
  date: string;
  notes?: string;
  photoUrl?: string;
  createdById: string;
  exchangeRate?: number;
  createdAt: string;
  updatedAt: string;
  paidBy?: User;
  createdBy?: User;
  splits?: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  method: SettlementMethod;
  notes?: string;
  settledAt: string;
  fromUser?: User;
  toUser?: User;
}

export interface Balance {
  userId: string;
  userName: string;
  amount: number;
  currency: string;
}

export interface SimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  currency: string;
}

export interface CreateExpenseDto {
  groupId: string;
  amount: number;
  currency: string;
  description: string;
  category: ExpenseCategory;
  paidById: string;
  splitType: SplitType;
  date: string;
  notes?: string;
  splits: Array<{
    userId: string;
    amount?: number;
    shares?: number;
    percentage?: number;
  }>;
}

export interface CreateGroupDto {
  name: string;
  emoji: string;
  defaultCurrency: string;
}

export interface CreateSettlementDto {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  method: SettlementMethod;
  notes?: string;
}
