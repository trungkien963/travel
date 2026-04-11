

interface AppState {
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  user: any | null
  setUser: (user: any) => void
}

import { create } from 'zustand'

export const useAppStore = create<AppState>()((set) => ({
  hasHydrated: true,
  setHasHydrated: (state) => set({ hasHydrated: state }),
  user: null,
  setUser: (user) => set({ user }),
}))
