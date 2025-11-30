import { useGroupsStore } from '../groupsStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('groupsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGroupsStore.setState({
      groups: [],
    });
    jest.clearAllMocks();
  });

  describe('addGroup', () => {
    it('should add a group to the list', () => {
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

      useGroupsStore.getState().addGroup(mockGroup);

      expect(useGroupsStore.getState().groups).toContainEqual(mockGroup);
      expect(useGroupsStore.getState().groups).toHaveLength(1);
    });

    it('should not duplicate group if already in list', () => {
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

      // Try to add the same group again
      useGroupsStore.getState().addGroup(existingGroup);

      // Should still only have one group
      expect(useGroupsStore.getState().groups).toHaveLength(1);
    });
  });

  describe('removeGroup', () => {
    it('should remove a group from the list', () => {
      const group1 = {
        id: 'group-1',
        name: 'Group 1',
        emoji: '🎉',
        inviteCode: 'ABC',
        defaultCurrency: 'USD',
        createdById: 'u1',
        createdAt: '',
        updatedAt: '',
      };
      const group2 = {
        id: 'group-2',
        name: 'Group 2',
        emoji: '🎊',
        inviteCode: 'DEF',
        defaultCurrency: 'EUR',
        createdById: 'u1',
        createdAt: '',
        updatedAt: '',
      };

      useGroupsStore.setState({ groups: [group1, group2] });
      useGroupsStore.getState().removeGroup('group-1');

      expect(useGroupsStore.getState().groups).toHaveLength(1);
      expect(useGroupsStore.getState().groups[0].id).toBe('group-2');
    });
  });

  describe('updateGroup', () => {
    it('should update a group in the list', () => {
      const group = {
        id: 'group-123',
        name: 'Original Name',
        emoji: '🎉',
        inviteCode: 'ABC123',
        defaultCurrency: 'USD',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useGroupsStore.setState({ groups: [group] });
      useGroupsStore.getState().updateGroup('group-123', { name: 'Updated Name' });

      expect(useGroupsStore.getState().groups[0].name).toBe('Updated Name');
    });
  });

  describe('clearGroups', () => {
    it('should clear all groups', () => {
      useGroupsStore.setState({
        groups: [
          {
            id: 'g1',
            name: 'Group 1',
            emoji: '🎉',
            inviteCode: 'ABC',
            defaultCurrency: 'USD',
            createdById: 'u1',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      useGroupsStore.getState().clearGroups();

      expect(useGroupsStore.getState().groups).toEqual([]);
    });
  });
});
