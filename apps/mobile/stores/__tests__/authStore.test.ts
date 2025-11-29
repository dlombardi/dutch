import { useAuthStore } from '../authStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock the API module
jest.mock('../../lib/api', () => ({
  api: {
    createGuestUser: jest.fn(),
    requestMagicLink: jest.fn(),
    verifyMagicLink: jest.fn(),
  },
  registerTokenGetter: jest.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      magicLinkSent: false,
      magicLinkEmail: null,
      error: null,
      _hasHydrated: true,
    });
  });

  describe('logout', () => {
    it('should clear user data when logged out', () => {
      // Setup: User is logged in
      useAuthStore.setState({
        user: {
          id: 'test-user-id',
          name: 'Test User',
          type: 'guest',
          createdAt: new Date().toISOString(),
        },
        accessToken: 'test-token',
        isAuthenticated: true,
      });

      // Verify initial state
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).not.toBeNull();
      expect(useAuthStore.getState().accessToken).toBe('test-token');

      // Act: Call logout
      useAuthStore.getState().logout();

      // Assert: User data is cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear magic link state on logout', () => {
      // Setup: User is logged in with magic link state
      useAuthStore.setState({
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          type: 'full',
          createdAt: new Date().toISOString(),
        },
        accessToken: 'test-token',
        isAuthenticated: true,
        magicLinkSent: true,
        magicLinkEmail: 'test@example.com',
      });

      // Act: Call logout
      useAuthStore.getState().logout();

      // Assert: Magic link state is cleared
      const state = useAuthStore.getState();
      expect(state.magicLinkSent).toBe(false);
      expect(state.magicLinkEmail).toBeNull();
    });

    it('should clear any existing error on logout', () => {
      // Setup: User is logged in with an error
      useAuthStore.setState({
        user: {
          id: 'test-user-id',
          name: 'Test User',
          type: 'guest',
          createdAt: new Date().toISOString(),
        },
        accessToken: 'test-token',
        isAuthenticated: true,
        error: 'Some previous error',
      });

      // Act: Call logout
      useAuthStore.getState().logout();

      // Assert: Error is cleared
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should handle logout when already logged out', () => {
      // Setup: User is already logged out
      useAuthStore.setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });

      // Act: Call logout (should not throw)
      expect(() => useAuthStore.getState().logout()).not.toThrow();

      // Assert: State remains unchanged
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear claimed user data on logout', () => {
      // Setup: Claimed user is logged in
      useAuthStore.setState({
        user: {
          id: 'claimed-user-id',
          name: 'Claimed User',
          email: 'claimed@example.com',
          type: 'claimed',
          createdAt: new Date().toISOString(),
        },
        accessToken: 'claimed-token',
        isAuthenticated: true,
      });

      // Act: Call logout
      useAuthStore.getState().logout();

      // Assert: All user data is cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set isAuthenticated to true when user is set', () => {
      useAuthStore.getState().setUser({
        id: 'new-user',
        name: 'New User',
        type: 'guest',
        createdAt: new Date().toISOString(),
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('New User');
    });

    it('should set isAuthenticated to false when user is null', () => {
      // First set a user
      useAuthStore.setState({
        user: { id: 'test', name: 'Test', type: 'guest', createdAt: '' },
        isAuthenticated: true,
      });

      // Then clear the user
      useAuthStore.getState().setUser(null);

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      useAuthStore.setState({ error: 'Test error' });
      expect(useAuthStore.getState().error).toBe('Test error');

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
