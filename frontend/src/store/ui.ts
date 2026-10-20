import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '@/lib/utils';

export interface Toast { id: string; title: string; description?: string; tone: 'success' | 'error' | 'info' | 'warning' }

interface UIState {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  recentSearches: string[];
  addSearch: (q: string) => void;
  clearSearches: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      toasts: [],
      toast: (t) => {
        const id = uid('T');
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
      },
      dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
      recentSearches: [],
      addSearch: (q) => set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((r) => r !== q)].slice(0, 6) })),
      clearSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'ivanta-ui',
      version: 1,
      partialize: (s) => ({ recentSearches: s.recentSearches, toasts: [], dismiss: s.dismiss, toast: s.toast, addSearch: s.addSearch, clearSearches: s.clearSearches }) as UIState,
    },
  ),
);
