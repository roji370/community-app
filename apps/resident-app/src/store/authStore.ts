import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthUser {
  id: string;
  phone: string;
  name: string;
  status: string;
  role: string;
  unitId: string | null;
  societyId: string | null;
  unit?: {
    identifier: string;
    society: { name: string };
  } | null;
}

interface AuthState {
  // State
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarding: boolean;
  user: AuthUser | null;
  accessToken: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string | null;
    user: AuthUser | null;
    isNewUser: boolean;
  }) => Promise<void>;
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  isOnboarding: false,
  user: null,
  accessToken: null,

  setLoading: (loading) => set({ isLoading: loading }),

  setAuth: async ({ accessToken, refreshToken, user, isNewUser }) => {
    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync('refreshToken', refreshToken);
    }

    set({
      isAuthenticated: !isNewUser,
      isOnboarding: isNewUser,
      accessToken,
      user,
      isLoading: false,
    });
  },

  setUser: (user) => set({ user, isAuthenticated: true, isOnboarding: false }),

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({
      isAuthenticated: false,
      isOnboarding: false,
      user: null,
      accessToken: null,
      isLoading: false,
    });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Try to fetch profile with stored token
      const { getProfile } = await import('../services/auth');
      const user = await getProfile();

      if (user.isOnboarding) {
        set({ isOnboarding: true, accessToken: token, isLoading: false });
      } else {
        set({
          isAuthenticated: true,
          user,
          accessToken: token,
          isLoading: false,
        });
      }
    } catch {
      // Token expired or invalid — clear and go to login
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ isLoading: false });
    }
  },
}));
