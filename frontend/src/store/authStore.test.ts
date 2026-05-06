import { vi, describe, test, expect, beforeEach, afterAll } from 'vitest';
import useAuthStore, { api } from './authStore';

// 1. Mock an Axios instance
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('authStore', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    // 2. Mock the location object using stubGlobal (href can be manipulated safely without error)
    vi.stubGlobal('location', {
      href: '',
      assign: vi.fn(),
      replace: vi.fn(),
    });

    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      loading: true,
    });
    vi.clearAllMocks();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    // 3. Release all global mocking (including location) at once
    vi.unstubAllGlobals();
  });

  test('Initial state must be set correctly', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(true);
  });

  test('When executing setAccessToken, the token and authentication status should be updated.', () => {
    const mockToken = 'test-access-token';
    useAuthStore.getState().setAccessToken(mockToken);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe(mockToken);
    expect(state.isAuthenticated).toBe(true);
  });

  describe('checkAuthStatus', () => {
    test('If the authentication check is successful, the token and user information must be saved.', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        data: { user: { _id: '1', username: 'tester' } },
      };
      
      (api.get as any).mockResolvedValueOnce({ data: mockResponse });

      await useAuthStore.getState().checkAuthStatus();

      const state = useAuthStore.getState();
      expect(api.get).toHaveBeenCalledWith('/auth/refresh');
      expect(state.accessToken).toBe('new-access-token');
      expect(state.user).toEqual(mockResponse.data.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    test('When an authentication check fails, the state must be reset.', async () => {
      (api.get as any).mockRejectedValueOnce(new Error('Expired Refresh Token'));

      await useAuthStore.getState().checkAuthStatus();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('logout', () => {
    test('Upon logout, the state is reset and redirected to /sign-in.', async () => {
      (api.post as any).mockResolvedValueOnce({});

      await useAuthStore.getState().logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      
      // Thanks to stubGlobal, you can safely check window.location.href
      expect(window.location.href).toBe('/sign-in');
    });
  });
});