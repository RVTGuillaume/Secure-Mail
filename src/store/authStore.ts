import { create } from 'zustand'
import { UserResponse } from '@/types'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserResponse) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // ← true pour bloquer le rendu avant hydratation

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sm_access_token')
      localStorage.removeItem('sm_refresh_token')
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (isLoading) => set({ isLoading }),
}))