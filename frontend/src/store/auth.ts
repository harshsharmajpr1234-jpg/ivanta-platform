import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminProfile, User } from '@/types';
import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';

interface AuthState {
  user: User | null;
  admin: AdminProfile | null;
  setUser: (u: User | null) => void;
  setAdmin: (a: AdminProfile | null) => void;
  patchUser: (u: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
  logoutUser: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      admin: null,
      setUser: (user) => set({ user }),
      setAdmin: (admin) => set({ admin }),
      patchUser: (u) => set((s) => ({ user: s.user ? { ...s.user, ...u } : s.user })),
      refreshUser: async () => {
        try { set({ user: await api.get<User>(API.auth.me) }); } catch { set({ user: null }); }
      },
      refreshAdmin: async () => {
        try { set({ admin: await api.get<AdminProfile>(API.admin.me) }); } catch { set({ admin: null }); }
      },
      logoutUser: async () => { try { await api.post(API.auth.logout); } catch { /* ignore */ } set({ user: null }); },
      logoutAdmin: async () => { try { await api.post(API.admin.logout); } catch { /* ignore */ } set({ admin: null }); },
    }),
    { name: 'ivanta-auth', version: 2, partialize: (s) => ({ user: s.user, admin: s.admin }) },
  ),
);
