import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface Guard {
  id: string;
  name: string;
  staffId: string;
  society: { id: string; name: string };
}

interface GuardState {
  guard: Guard | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (guard: Guard, token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useGuardStore = create<GuardState>((set) => ({
  guard: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (guard, token) => {
    await SecureStore.setItemAsync('guardAccessToken', token);
    await SecureStore.setItemAsync('guardData', JSON.stringify(guard));
    set({ guard, accessToken: token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('guardAccessToken');
    await SecureStore.deleteItemAsync('guardData');
    set({ guard: null, accessToken: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('guardAccessToken');
      const guardData = await SecureStore.getItemAsync('guardData');
      if (token && guardData) {
        set({
          guard: JSON.parse(guardData) as Guard,
          accessToken: token,
          isAuthenticated: true,
        });
      }
    } catch {
      // Corrupted storage — ignore
    } finally {
      set({ isLoading: false });
    }
  },
}));
