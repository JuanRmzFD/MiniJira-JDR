import { create } from 'zustand'
import type { User } from '@/shared/types'

interface SessionStore {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const sessionStore = create<SessionStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
