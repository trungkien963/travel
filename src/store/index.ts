import { create } from 'zustand'
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware'
import { storage } from '../lib/supabase'

const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value)
  },
  getItem: (name) => {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem: (name) => {
    return storage.delete(name)
  },
}

interface AppState {
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  user: any | null
  setUser: (user: any) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'travel-app-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
