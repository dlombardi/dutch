import {
  isBalance,
  isBalancesData,
  isExpense,
  isGroup,
  isGroupMember,
  validateBalancesData,
  validateExpense,
  validateExpenses,
  validateGroup,
  validateGroupMembers,
} from '../validators';

describe('validators', () => {
  describe('isExpense', () => {
    const validExpense = {
      id: 'exp-1',
      groupId: 'grp-1',
      amount: 100,
      currency: 'USD',
      description: 'Dinner',
      paidById: 'user-1',
      splitType: 'equal',
      splitParticipants: ['user-1', 'user-2'],
      date: '2024-01-01',
      createdById: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('returns true for valid expense', () => {
      expect(isExpense(validExpense)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isExpense(null)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isExpense('string')).toBe(false);
      expect(isExpense(123)).toBe(false);
      expect(isExpense(undefined)).toBe(false);
    });

    it('returns false when missing required fields', () => {
      const { id, ...withoutId } = validExpense;
      expect(isExpense(withoutId)).toBe(false);
    });

    it('returns false when amount is not a number', () => {
      expect(isExpense({ ...validExpense, amount: '100' })).toBe(false);
    });

    it('returns false when splitParticipants is not an array', () => {
      expect(isExpense({ ...validExpense, splitParticipants: 'not-array' })).toBe(false);
    });
  });

  describe('validateExpenses', () => {
    const validExpense = {
      id: 'exp-1',
      groupId: 'grp-1',
      amount: 100,
      currency: 'USD',
      description: 'Dinner',
      paidById: 'user-1',
      splitType: 'equal',
      splitParticipants: ['user-1', 'user-2'],
      date: '2024-01-01',
      createdById: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('returns array of valid expenses', () => {
      const result = validateExpenses([validExpense]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(validExpense);
    });

    it('filters out invalid expenses', () => {
      const invalid = { id: 'bad' };
      const result = validateExpenses([validExpense, invalid]);
      expect(result).toHaveLength(1);
    });

    it('returns empty array for non-array input', () => {
      expect(validateExpenses('not-array')).toEqual([]);
      expect(validateExpenses(null)).toEqual([]);
      expect(validateExpenses(undefined)).toEqual([]);
    });
  });

  describe('validateExpense', () => {
    const validExpense = {
      id: 'exp-1',
      groupId: 'grp-1',
      amount: 100,
      currency: 'USD',
      description: 'Dinner',
      paidById: 'user-1',
      splitType: 'equal',
      splitParticipants: ['user-1', 'user-2'],
      date: '2024-01-01',
      createdById: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('returns expense when valid', () => {
      expect(validateExpense(validExpense)).toEqual(validExpense);
    });

    it('throws error for invalid expense', () => {
      expect(() => validateExpense({ id: 'bad' })).toThrow('Invalid expense data');
    });
  });

  describe('isGroup', () => {
    const validGroup = {
      id: 'grp-1',
      name: 'Test Group',
      emoji: '🎉',
      defaultCurrency: 'USD',
      inviteCode: 'ABC123',
      createdById: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
    };

    it('returns true for valid group', () => {
      expect(isGroup(validGroup)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isGroup(null)).toBe(false);
    });

    it('returns false when missing required fields', () => {
      const { name, ...withoutName } = validGroup;
      expect(isGroup(withoutName)).toBe(false);
    });
  });

  describe('validateGroup', () => {
    const validGroup = {
      id: 'grp-1',
      name: 'Test Group',
      emoji: '🎉',
      defaultCurrency: 'USD',
      inviteCode: 'ABC123',
      createdById: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
    };

    it('returns group when valid', () => {
      expect(validateGroup(validGroup)).toEqual(validGroup);
    });

    it('throws error for invalid group', () => {
      expect(() => validateGroup({ id: 'bad' })).toThrow('Invalid group data');
    });
  });

  describe('isGroupMember', () => {
    const validMember = {
      userId: 'user-1',
      role: 'admin',
      joinedAt: '2024-01-01T00:00:00Z',
    };

    it('returns true for valid member', () => {
      expect(isGroupMember(validMember)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isGroupMember(null)).toBe(false);
    });

    it('returns false when missing role', () => {
      expect(isGroupMember({ userId: 'user-1', joinedAt: '2024-01-01' })).toBe(false);
    });
  });

  describe('validateGroupMembers', () => {
    const validMember = {
      userId: 'user-1',
      role: 'admin',
      joinedAt: '2024-01-01T00:00:00Z',
    };

    it('returns array of valid members', () => {
      const result = validateGroupMembers([validMember]);
      expect(result).toHaveLength(1);
    });

    it('filters out invalid members', () => {
      const invalid = { userId: 'bad' };
      const result = validateGroupMembers([validMember, invalid]);
      expect(result).toHaveLength(1);
    });

    it('returns empty array for non-array input', () => {
      expect(validateGroupMembers('not-array')).toEqual([]);
    });
  });

  describe('isBalance', () => {
    const validBalance = {
      from: 'user-1',
      to: 'user-2',
      amount: 50,
      currency: 'USD',
    };

    it('returns true for valid balance', () => {
      expect(isBalance(validBalance)).toBe(true);
    });

    it('returns false when amount is NaN', () => {
      expect(isBalance({ ...validBalance, amount: NaN })).toBe(false);
    });

    it('returns false when missing currency', () => {
      const { currency, ...withoutCurrency } = validBalance;
      expect(isBalance(withoutCurrency)).toBe(false);
    });
  });

  describe('isBalancesData', () => {
    const validBalancesData = {
      balances: [
        { from: 'user-1', to: 'user-2', amount: 50, currency: 'USD' },
      ],
      memberBalances: {
        'user-1': -50,
        'user-2': 50,
      },
    };

    it('returns true for valid balances data', () => {
      expect(isBalancesData(validBalancesData)).toBe(true);
    });

    it('returns true for empty balances', () => {
      expect(isBalancesData({ balances: [], memberBalances: {} })).toBe(true);
    });

    it('returns false when balances is not array', () => {
      expect(isBalancesData({ balances: {}, memberBalances: {} })).toBe(false);
    });

    it('returns false when memberBalances is not an object (string)', () => {
      expect(isBalancesData({ balances: [], memberBalances: 'not-object' })).toBe(false);
    });

    it('returns false when memberBalances has non-number value', () => {
      expect(isBalancesData({
        balances: [],
        memberBalances: { 'user-1': 'not-a-number' },
      })).toBe(false);
    });

    it('returns false when balances array contains invalid balance', () => {
      expect(isBalancesData({
        balances: [{ from: 'user-1' }], // missing to, amount, currency
        memberBalances: {},
      })).toBe(false);
    });
  });

  describe('validateBalancesData', () => {
    const validBalancesData = {
      balances: [],
      memberBalances: {},
    };

    it('returns balances data when valid', () => {
      expect(validateBalancesData(validBalancesData)).toEqual(validBalancesData);
    });

    it('throws error for invalid balances data', () => {
      expect(() => validateBalancesData({ balances: 'bad' })).toThrow('Invalid balances data');
    });
  });
});
