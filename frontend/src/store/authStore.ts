import { create } from 'zustand';
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

interface AuthState {
  user: any | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setAccessToken: (token: string | null) => void;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: true,

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: !!token }),

  // Called when app starts: Access token is received through refresh token in cookie
  checkAuthStatus: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/auth/refresh');
      const { accessToken, data } = response.data;

      set({
        user: data.user,
        accessToken,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false });
      window.location.href = '/sign-in';
    }
  },
}));

export default useAuthStore;
