import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '../../types/common';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
  setAuth: (payload: { accessToken: string; refreshToken: string; user: CurrentUser }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, user: null })
    }),
    { name: 'smallbiz-auth' }
  )
);
