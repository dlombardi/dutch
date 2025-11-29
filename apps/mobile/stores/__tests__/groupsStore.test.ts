import { useGroupsStore } from '../groupsStore';
import { api } from '../../lib/api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock the API module
jest.mock('../../lib/api', () => ({
  api: {
    createGroup: jest.fn(),
    getGroup: jest.fn(),
    getGroupByInviteCode: jest.fn(),
    joinGroup: jest.fn(),
    getGroupMembers: jest.fn(),
    getGroupBalances: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('groupsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGroupsStore.setState({
      groups: [],
      currentGroup: null,
      previewGroup: null,
      currentGroupMembers: [],
      currentGroupBalances: null,
      loadingStates: {
        fetchGroup: false,
        fetchMembers: false,
        fetchBalances: false,
        createGroup: false,
        joinGroup: false,
        fetchByInviteCode: false,
      },
      errors: {
        fetchGroup: null,
        fetchMembers: null,
        fetchBalances: null,
        createGroup: null,
        joinGroup: null,
        fetchByInviteCode: null,
      },
    });
    jest.clearAllMocks();
  });

  describe('fetchGroupByInviteCode', () => {
    it('should fetch group preview by invite code', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        emoji: '🎉',
        inviteCode: 'ABC123',
        defaultCurrency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockApi.getGroupByInviteCode.mockResolvedValueOnce({ group: mockGroup });

      const result = await useGroupsStore.getState().fetchGroupByInviteCode('ABC123');

      expect(mockApi.getGroupByInviteCode).toHaveBeenCalledWith('ABC123');
      expect(result).toEqual(mockGroup);
      expect(useGroupsStore.getState().previewGroup).toEqual(mockGroup);
    });

    it('should set error when invite code is invalid', async () => {
      mockApi.getGroupByInviteCode.mockRejectedValueOnce(new Error('Invalid invite code'));

      const result = await useGroupsStore.getState().fetchGroupByInviteCode('INVALID');

      expect(result).toBeNull();
      expect(useGroupsStore.getState().errors.fetchByInviteCode).toBe('Invalid invite code');
    });
  });

  describe('joinGroup', () => {
    it('should join group by invite code and add to groups list', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        emoji: '🎉',
        inviteCode: 'ABC123',
        defaultCurrency: 'USD',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockApi.joinGroup.mockResolvedValueOnce({ group: mockGroup });

      const result = await useGroupsStore.getState().joinGroup('ABC123', 'user-456');

      expect(mockApi.joinGroup).toHaveBeenCalledWith('ABC123', 'user-456');
      expect(result).toEqual(mockGroup);
      expect(useGroupsStore.getState().groups).toContainEqual(mockGroup);
      expect(useGroupsStore.getState().currentGroup).toEqual(mockGroup);
    });

    it('should set error when join fails', async () => {
      mockApi.joinGroup.mockRejectedValueOnce(new Error('Failed to join group'));

      const result = await useGroupsStore.getState().joinGroup('ABC123', 'user-456');

      expect(result).toBeNull();
      expect(useGroupsStore.getState().errors.joinGroup).toBe('Failed to join group');
    });

    it('should not duplicate group if already in list', async () => {
      const existingGroup = {
        id: 'group-123',
        name: 'Test Group',
        emoji: '🎉',
        inviteCode: 'ABC123',
        defaultCurrency: 'USD',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Pre-populate with existing group
      useGroupsStore.setState({ groups: [existingGroup] });

      mockApi.joinGroup.mockResolvedValueOnce({ group: existingGroup });

      await useGroupsStore.getState().joinGroup('ABC123', 'user-456');

      // Should still only have one group
      expect(useGroupsStore.getState().groups).toHaveLength(1);
    });
  });

  describe('clearGroups', () => {
    it('should clear all groups and reset state', () => {
      // Set up some state
      useGroupsStore.setState({
        groups: [{ id: 'g1', name: 'Group 1', emoji: '🎉', inviteCode: 'ABC', defaultCurrency: 'USD', createdById: 'u1', createdAt: '', updatedAt: '' }],
        currentGroup: { id: 'g1', name: 'Group 1', emoji: '🎉', inviteCode: 'ABC', defaultCurrency: 'USD', createdById: 'u1', createdAt: '', updatedAt: '' },
        previewGroup: { id: 'g2', name: 'Group 2', emoji: '🎊', inviteCode: 'DEF', defaultCurrency: 'EUR', createdById: 'u1', createdAt: '', updatedAt: '' },
      });

      useGroupsStore.getState().clearGroups();

      expect(useGroupsStore.getState().groups).toEqual([]);
      expect(useGroupsStore.getState().currentGroup).toBeNull();
      expect(useGroupsStore.getState().previewGroup).toBeNull();
    });
  });
});
