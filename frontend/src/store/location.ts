import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationSelection } from '@/types';

interface LocationState {
  selection: LocationSelection | null;
  recent: LocationSelection[];
  set: (sel: LocationSelection) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selection: null,
      recent: [],
      set: (sel) => set((s) => ({ selection: sel, recent: [sel, ...s.recent.filter((r) => r.label !== sel.label)].slice(0, 5) })),
      clear: () => set({ selection: null }),
    }),
    { name: "ivanta-location", version: 3 },
  ),
);
