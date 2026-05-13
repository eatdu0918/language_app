import { create } from 'zustand'
import { api } from '../lib/api-client'
import type { UserProfile } from '@language-app/shared'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  initialized: boolean
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  initialized: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, accessToken, refreshToken })
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken, refreshToken })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null })
  },

  initialize: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ initialized: true })
      return
    }
    try {
      const user = await api.get<UserProfile>('/users/me')
      set({ user, accessToken: token, initialized: true })
    } catch {
      localStorage.removeItem('accessToken')
      set({ user: null, accessToken: null, initialized: true })
    }
  },
}))
