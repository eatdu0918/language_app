import { create } from 'zustand'
import type { UserProfile } from '@language-app/shared'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  setAuth: (user: UserProfile, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    set({ user, accessToken: token })
  },
  logout: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null })
  },
}))
