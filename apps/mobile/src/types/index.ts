/**
 * Global types
 * Types that are used across multiple modules
 */

// Re-export commonly used types from modules
export type { User, UserType } from '@/modules/auth/types';
export type { Expense, SplitType } from '@/modules/expenses/types';
export type { Group, GroupMember, GroupBalance } from '@/modules/groups/types';
export type { Settlement } from '@/modules/settlements/types';
