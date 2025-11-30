import {
  formatAmount,
  formatAmountWithSymbol,
  formatBalance,
  getUserDisplayName,
} from '../formatters';

describe('formatters', () => {
  describe('formatAmount', () => {
    it('formats USD with 2 decimal places', () => {
      expect(formatAmount(10, 'USD')).toBe('10.00');
      expect(formatAmount(10.5, 'USD')).toBe('10.50');
      expect(formatAmount(10.559, 'USD')).toBe('10.56'); // rounds up
    });

    it('formats JPY with 0 decimal places', () => {
      expect(formatAmount(1000, 'JPY')).toBe('1000');
      expect(formatAmount(1000.5, 'JPY')).toBe('1001'); // rounds
    });

    it('formats EUR with 2 decimal places', () => {
      expect(formatAmount(25.99, 'EUR')).toBe('25.99');
    });

    it('defaults to 2 decimal places for unknown currency', () => {
      expect(formatAmount(10.5, 'XXX')).toBe('10.50');
    });
  });

  describe('formatAmountWithSymbol', () => {
    it('prefixes USD amounts with $', () => {
      expect(formatAmountWithSymbol(10, 'USD')).toBe('$10.00');
    });

    it('prefixes EUR amounts with euro symbol', () => {
      expect(formatAmountWithSymbol(25.99, 'EUR')).toBe('\u20ac25.99');
    });

    it('prefixes GBP amounts with pound symbol', () => {
      expect(formatAmountWithSymbol(15, 'GBP')).toBe('\u00a315.00');
    });

    it('prefixes JPY amounts with yen symbol', () => {
      expect(formatAmountWithSymbol(1000, 'JPY')).toBe('\u00a51000');
    });
  });

  describe('formatBalance', () => {
    it('formats positive balance without sign', () => {
      expect(formatBalance(50.25, 'USD')).toBe('$50.25');
    });

    it('formats negative balance with minus sign before symbol', () => {
      expect(formatBalance(-50.25, 'USD')).toBe('-$50.25');
    });

    it('formats zero balance', () => {
      expect(formatBalance(0, 'USD')).toBe('$0.00');
    });

    it('handles negative zero', () => {
      expect(formatBalance(-0, 'USD')).toBe('$0.00');
    });
  });

  describe('getUserDisplayName', () => {
    it('returns "You" when userId matches currentUserId', () => {
      expect(getUserDisplayName('user-123', 'user-123')).toBe('You');
    });

    it('returns memberName when provided and userId is not current user', () => {
      expect(getUserDisplayName('user-456', 'user-123', 'John Doe')).toBe('John Doe');
    });

    it('returns truncated userId when no memberName and not current user', () => {
      expect(getUserDisplayName('user-456-abc-def', 'user-123')).toBe('User user-456...');
    });

    it('returns truncated userId when memberName is null', () => {
      expect(getUserDisplayName('user-456-abc-def', 'user-123', null)).toBe('User user-456...');
    });

    it('returns truncated userId when currentUserId is undefined', () => {
      expect(getUserDisplayName('user-456-abc-def', undefined)).toBe('User user-456...');
    });

    it('returns "You" even when memberName is provided if userId matches', () => {
      expect(getUserDisplayName('user-123', 'user-123', 'John Doe')).toBe('You');
    });
  });
});
